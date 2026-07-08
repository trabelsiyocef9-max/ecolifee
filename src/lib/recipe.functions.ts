import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";
import { getAgeInYears, getSafetyTier } from "@/lib/safety-tier";

// Each tag must be short and contain only letters/spaces/hyphens.
// Multiple tags arrive as a comma-separated string from the UI.
const HOBBY_TAG = /^[A-Za-z][A-Za-z \-]{0,29}$/;

const Input = z.object({
  hobby: z
    .string()
    .min(1)
    .max(200)
    .transform((s) => s.split(",").map((t) => t.trim()).filter(Boolean))
    .pipe(z.array(z.string().regex(HOBBY_TAG)).min(1).max(8))
    .transform((tags) => tags.join(", ")),
  tools: z
    .string()
    .max(300)
    .optional()
    .transform((s) => (s ?? "").split(",").map((t) => t.trim()).filter(Boolean))
    .pipe(z.array(z.string().regex(HOBBY_TAG)).max(12))
    .transform((tags) => tags.join(", ")),
  image: z.string().min(1).max(8_000_000).optional(),
  imageMime: z.string().regex(/^image\/(jpeg|jpg|png|webp|heic|heif)$/i).optional(),
  additionalInfo: z.string().max(300).optional(),
  language: z.string().max(20).optional(),
});

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Last-resort fallback only if Gemini itself is down (not for missing slugs/credits).
const FALLBACK_MODEL = "deepseek/deepseek-chat-v3-0324:free";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

async function callGemini(
  apiKey: string,
  system: string,
  user: string,
  image?: { data: string; mime: string },
): Promise<string> {
  const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
  const parts: Array<Record<string, unknown>> = [{ text: `${system}\n\n${user}` }];
  if (image) {
    parts.push({ inline_data: { mime_type: image.mime, data: image.data } });
  }
  const body = {
    contents: [{ parts }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 8192 },
  };

  console.log("[generateRecipe] POST Gemini, model:", GEMINI_MODEL);
  let res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (res.status === 429 || res.status === 503) {
    console.log("[generateRecipe] Gemini", res.status, "- retrying once after 5s");
    await new Promise((r) => setTimeout(r, 5000));
    res = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
  }

  console.log("[generateRecipe] Gemini status:", res.status);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    console.log("[generateRecipe] Gemini error body:", bodyText.slice(0, 500));
    throw new Error(`Gemini ${res.status}`);
  }

  const data = (await res.json()) as {
    candidates?: Array<{ content?: { parts?: Array<{ text?: string }> } }>;
  };
  const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!content) {
    console.log("[generateRecipe] Empty content from Gemini");
    throw new Error("Empty response from Gemini");
  }
  return content;
}

async function callOpenRouterFallback(key: string, system: string, user: string): Promise<string> {
  console.log("[generateRecipe] POST OpenRouter fallback, model:", FALLBACK_MODEL);
  const res = await fetch(OPENROUTER_ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ecolifee.lovable.app",
      "X-Title": "EcoLife",
    },
    body: JSON.stringify({
      model: FALLBACK_MODEL,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  console.log("[generateRecipe] OpenRouter fallback status:", res.status);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    console.log("[generateRecipe] OpenRouter fallback error body:", bodyText.slice(0, 500));
    throw new Error(`OpenRouter fallback ${res.status}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response from OpenRouter fallback");
  return content;
}

export const generateRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data, context }) => {
    const { hobby, tools, image, imageMime, additionalInfo, language } = data;

    // Server-side age derivation from stored date of birth — client never sends age.
    const { data: profileRow, error: profileErr } = await context.supabase
      .from("profiles")
      .select("date_of_birth")
      .eq("id", context.userId)
      .maybeSingle();
    if (profileErr || !profileRow?.date_of_birth) {
      throw new Error("Complete your profile (date of birth) to generate recipes.");
    }
    const dob = new Date(profileRow.date_of_birth);
    const age = getAgeInYears(dob);
    const tier = getSafetyTier(dob);
    console.log("[generateRecipe] Derived age:", age, "| tier:", tier);

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("No Gemini API key configured. Add GEMINI_API_KEY in project secrets.");
    }

    // ── Step 1: Dedicated material identification (image sent ONLY here) ──────
    // The image is NOT sent again in Step 2. This forces the recipe generation
    // to rely entirely on the text description produced here, preventing Gemini
    // from re-examining the image and overriding the identified material.
    let itemIdentification = "Unknown item";
    let itemMaterial = "Unknown";
    let materialCertain = "NO";
    let safetyLevel = "FRAGILE"; // default to most restrictive

    if (image && imageMime) {
      // If the user provided additional info, inject it so identification is more accurate.
      const additionalHint = additionalInfo
        ? `\n\nThe user has also provided this hint about the item: "${additionalInfo}". Factor this into your identification.`
        : "";

      const identificationPrompt = `Look at this image very carefully and identify the physical object shown.

Your job is purely material identification — do not suggest any projects.

Answer these three questions:
1. What is the item? (one short sentence, e.g. "A peanut butter jar with a screw-top lid")
2. What material is it made of? Be specific: glass, plastic, metal, cardboard, ceramic, fabric, wood, etc.
   - If the item has multiple materials (e.g. glass jar with a metal lid), list ALL of them.
   - Look for visual cues: transparency, reflections, surface texture, label text, shape.
   - A jar that is transparent and shows light refraction is likely GLASS. A jar that is semi-opaque or has a matte finish is likely PLASTIC.
3. How certain are you of the material? YES only if you are 100% sure. NO if there is any doubt.
${additionalHint}

Respond in EXACTLY this format with no extra text:
ITEM: [one sentence description]
MATERIAL: [material(s)]
CERTAIN: [YES or NO]`;

      try {
        const idResponse = await callGemini(
          geminiKey,
          "You are a precise visual material identification assistant. Your only job is to identify what an item is and what it is made of. You are not designing projects.",
          identificationPrompt,
          { data: image, mime: imageMime }, // image used HERE only
        );

        const itemMatch = idResponse.match(/ITEM:\s*(.+)/i);
        const materialMatch = idResponse.match(/MATERIAL:\s*(.+)/i);
        const certainMatch = idResponse.match(/CERTAIN:\s*(YES|NO)/i);

        if (itemMatch) itemIdentification = itemMatch[1].trim();
        if (materialMatch) itemMaterial = materialMatch[1].trim();
        if (certainMatch) materialCertain = certainMatch[1].trim().toUpperCase();

        // Determine safety level from material
        const mat = itemMaterial.toLowerCase();
        const fragileKeywords = ["glass", "ceramic", "porcelain", "crystal"];
        const isFragile = fragileKeywords.some((k) => mat.includes(k));
        const isUncertain = materialCertain === "NO";

        if (isFragile || isUncertain) {
          safetyLevel = "FRAGILE"; // no cutting, no drilling, no heat
        } else if (mat.includes("plastic")) {
          safetyLevel = "PLASTIC";
        } else if (mat.includes("cardboard") || mat.includes("paper")) {
          safetyLevel = "PAPER";
        } else if (mat.includes("metal")) {
          safetyLevel = "METAL";
        } else {
          safetyLevel = "FRAGILE"; // unknown → safest assumption
        }

      } catch (err) {
        console.log("[generateRecipe] Identification step failed:", (err as Error).message);
        // Keep defaults: Unknown material, FRAGILE safety level
      }
    }

    console.log(
      "[generateRecipe] Identified — item:", itemIdentification,
      "| material:", itemMaterial,
      "| certain:", materialCertain,
      "| safetyLevel:", safetyLevel,
    );

    // ── Step 2: Recipe generation (NO image — text description only) ──────────
    // The image is intentionally excluded here. The model must rely solely on
    // the identification text from Step 1, preventing it from re-guessing material.
    const materialSafetyBlock = safetyLevel === "FRAGILE"
      ? `MATERIAL SAFETY: The item is made of ${itemMaterial} (certainty: ${materialCertain}).
STRICT RULE: Treat this item as FRAGILE. You are STRICTLY FORBIDDEN from suggesting cutting, drilling, scoring, heating, or applying any force to the item itself. The item must be used completely intact. Only decorate, fill, wrap, or display it.`
      : safetyLevel === "PLASTIC"
      ? `MATERIAL SAFETY: The item is confirmed plastic.
Cutting is allowed for users 13+ with appropriate safety notes. For users under 13, use scissors only.`
      : safetyLevel === "PAPER"
      ? `MATERIAL SAFETY: The item is confirmed cardboard or paper. Cutting, folding, and scoring are all allowed.`
      : safetyLevel === "METAL"
      ? `MATERIAL SAFETY: The item is confirmed metal. No cutting unless user is 16+ with proper tools. No drilling for users under 16.`
      : "";

    const system = `LANGUAGE: You must write your entire response in ${language ?? "English"}. This includes the product name, intro, tools list, and every step. Do not mix languages. If the language uses right-to-left script (Arabic), still use the same markdown formatting.

You are a highly experienced, realistic upcycling and crafting architect. Your role is to help young people turn household waste into safe, physically stable, and highly practical DIY projects. You are strictly forbidden from skipping intermediate physical steps or suggesting unrealistic assembly techniques.

## ITEM ALREADY IDENTIFIED (do not re-examine any image — no image is attached to this request):
- Item: ${itemIdentification}
- Material: ${itemMaterial}
- Material certainty: ${materialCertain}

## ${materialSafetyBlock}

## AGE-BASED TOOL SAFETY (user is approximately ${age} years old):
- Under 13: Only round-tip scissors, glue, tape, hand-folding. No cutters, blades, hot glue, or power tools.
- 13–15: Craft knife or low-temp glue gun allowed with a mandatory adult supervision note.
- 16+: Standard household tools allowed with standard safety notes.

## TOOLS:
${tools
  ? `The user owns these tools: ${tools}. Prefer these in every step. Only suggest unlisted tools if strictly necessary, and offer a safe household alternative.`
  : "The user has not listed specific tools — assume only basic household supplies."}

## OUTPUT RULES:
- This is a single-turn interaction. No follow-up is possible. Give the complete recipe now.
- Do not ask questions. Do not present options. Commit to one best project and detail it fully.
- Do not mention or restate the user's age.
- Use this exact markdown layout — do not deviate:

## [Product Name]

[2–3 sentence intro]

### Tools to be Used
- [tool 1]
- [tool 2]

### The Work

#### Step 1: [Step Name]
[Detailed description]

#### Step 2: [Step Name]
[Detailed description]

(continue steps as needed)`;

    const userPrompt = `USER PROFILE
- Hobbies: ${hobby}
- Tools available: ${tools || "(none listed — assume basic household supplies)"}
${additionalInfo ? `- Additional info from user: ${additionalInfo}` : ""}

ITEM TO UPCYCLE: ${itemIdentification} (material: ${itemMaterial})

Design a realistic, physically stable DIY upcycling project for this exact item.
Mentally simulate every physical construction step before writing.
Ensure no steps are skipped, no impossible joins exist, and no instructions are missing.
Generate the complete recipe now using the exact markdown layout defined above.`;

    console.log(
      "[generateRecipe] Prompt inputs — age:", age,
      "| hobbies:", hobby,
      "| tools:", tools || "(none)",
      "| image:", image ? `${imageMime} ${Math.round((image.length * 3) / 4 / 1024)}KB` : "none",
    );

    try {
      // NO image passed here — Step 2 is text-only, material locked in from Step 1
      const content = await callGemini(geminiKey, system, userPrompt);
      return { content, model: GEMINI_MODEL, degraded: false };
    } catch (err) {
      console.log("[generateRecipe] Gemini failed, trying OpenRouter fallback:", (err as Error).message);
    }

    // Last-resort fallback only if Gemini itself errored out.
    const fallbackKeys = [
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_API_KEY_2,
      process.env.OPENROUTER_API_KEY_3,
    ].filter((k): k is string => typeof k === "string" && k.length > 0);

    if (fallbackKeys.length === 0) {
      throw new Error("Gemini failed and no OpenRouter fallback key is configured.");
    }

    const content = await callOpenRouterFallback(fallbackKeys[0]!, system, userPrompt);
    return { content, model: FALLBACK_MODEL, degraded: true };
  });
