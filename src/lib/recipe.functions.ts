import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

// Each tag must be short and contain only letters/spaces/hyphens.
// Multiple tags arrive as a comma-separated string from the UI.
const HOBBY_TAG = /^[A-Za-z][A-Za-z \-]{0,29}$/;

const Input = z.object({
  age: z.number().int().min(4).max(120),
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
  .handler(async ({ data }) => {
    const { age, hobby, tools, image, imageMime, additionalInfo } = data;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("No Gemini API key configured. Add GEMINI_API_KEY in project secrets.");
    }

    let itemIdentification = "Unknown";
    let itemMaterial = "Unknown";
    let materialCertain = "NO";

    if (image && imageMime) {
      const identificationPrompt = `Look at this image carefully.

Identify:
1. What the item is (one sentence)
2. What material it is made of (be specific: glass, plastic, metal, cardboard, ceramic, fabric, wood, etc.)
3. If you are not 100% certain of the material, list ALL materials it could possibly be.

Respond in this exact format:
ITEM: [what the item is]
MATERIAL: [material or list of possible materials]
CERTAIN: [YES or NO - are you certain of the material?]`;

      try {
        const idResponse = await callGemini(
          geminiKey,
          "You are a careful visual material identification assistant.",
          identificationPrompt,
          { data: image, mime: imageMime },
        );
        const itemMatch = idResponse.match(/ITEM:\s*(.+)/i);
        const materialMatch = idResponse.match(/MATERIAL:\s*(.+)/i);
        const certainMatch = idResponse.match(/CERTAIN:\s*(YES|NO)/i);
        if (itemMatch) itemIdentification = itemMatch[1].trim();
        if (materialMatch) itemMaterial = materialMatch[1].trim();
        if (certainMatch) materialCertain = certainMatch[1].trim().toUpperCase();
      } catch (err) {
        console.log("[generateRecipe] Identification step failed:", (err as Error).message);
      }
    }

    console.log("[generateRecipe] Item identified:", itemIdentification, "| Material:", itemMaterial, "| Certain:", materialCertain);

    const system = `You are a highly experienced, realistic upcycling and crafting architect. Your role is to help young people turn household waste into safe, physically stable, and highly practical DIY projects. You are strictly forbidden from skipping intermediate physical steps or suggesting unrealistic assembly techniques (no "magic glue" assumptions).

IDENTIFIED ITEM: ${itemIdentification}
IDENTIFIED MATERIAL: ${itemMaterial}
MATERIAL CERTAINTY: ${materialCertain}

MATERIAL SAFETY RULE:
- If MATERIAL CERTAINTY is NO, or if the material list includes glass, ceramic, or any fragile material: treat the item as glass. NEVER suggest cutting, drilling, or applying heat directly to the item. Only use it intact.
- If material is confirmed plastic: cutting is allowed for 13+ with safety notes.
- If material is confirmed cardboard/paper: cutting and folding is free.
- If material is confirmed metal: no cutting unless user is 16+ with proper tools.
- Always state the identified material and certainty level in the item identification line of your response.

The user is approximately ${age} years old (used ONLY to enforce physical safety gates for tools and techniques):
- Under 13: Only recommend round-tip scissors, glue, tape, and hand-folding. Strictly avoid utility cutters, hot glue, blades, or power tools.
- 13-15: Basic supervised tools like a craft knife or low-temp glue gun are allowed, but you must include a safety note to use with adult supervision.
- 16+: Standard household tools allowed with standard safety notes.

${tools ? `IMPORTANT: The user has explicitly told you they own these tools: ${tools}. Prefer these tools in your steps whenever possible, and do not require tools the user has not mentioned unless strictly necessary (in that case, suggest a safe household alternative).` : "The user has not listed any specific tools they own — assume only basic household supplies."}

CRITICAL: This is a single-turn interaction with no follow-up possible. You must provide the complete, fully detailed, and functional recipe right now. Do not ask questions, do not leave options for the user to choose, and do not assume future steps. Decide on the absolute best single project and fully detail it.

Do not mention or restate the user's age in your response — just apply the safety filtering silently to your tool choices.

You must strictly adhere to the following output layout. Do not deviate from this layout under any circumstances, and do not add extra conversational filler:

[Name of New Product]

[Small Intro of the Product]

[Tools to be Used]

The Work:
Step 1: [Name of Step 1]
[Detailed description of step 1]

Step 2: [Name of Step 2]
[Detailed description of step 2]

(add more steps as needed)
CRITICAL FORMATTING RULE: You must use markdown syntax throughout your entire 
response. Specifically:
- The product name must be formatted as: ## [Product Name]
- "Tools to be Used" must be formatted as: ### Tools to be Used
- Each tool must be a markdown bullet point: - tool name
- "The Work" must be formatted as: ### The Work
- Every step title must be formatted as: #### Step N: [Step Name]
- Step descriptions are plain paragraph text beneath each step header.
- Never write step titles inline with their description on the same line.
- Never merge multiple steps into one paragraph.`;

    const userPrompt = `USER PROFILE
- Approximate age: ${age}
- Hobbies: ${hobby}
- Tools available: ${tools || "(none listed — assume basic household supplies)"}

${image
  ? `ITEM TO UPCYCLE: See the attached photo. First, identify what the item is in one short sentence. Then, design a realistic, physically stable DIY upcycling project that reuses THAT specific item.
  ${additionalInfo ? `ADDITIONAL DETAILS PROVIDED BY USER: ${additionalInfo}. Use this information to improve accuracy — especially for material identification and safety decisions.` : ""}

  Before writing, you must mentally simulate the physical construction. Ensure there are no skipped steps, impossible physical joins, or missing instructions.

  Generate the complete recipe now using only the exact output layout defined in the system prompt. Do not ask any questions or leave options.`
  : `ITEM TO UPCYCLE: (no photo attached) Design a realistic, generic project tied to the user's hobbies above.
  ${additionalInfo ? `ADDITIONAL DETAILS PROVIDED BY USER: ${additionalInfo}. Use this information to improve accuracy — especially for material identification and safety decisions.` : ""}

  Before writing, you must mentally simulate the physical construction. Ensure there are no skipped steps, impossible physical joins, or missing instructions.

  Generate the complete recipe now using only the exact output layout defined in the system prompt. Do not ask any questions or leave options.`
}`;

    console.log("[generateRecipe] Prompt inputs — age:", age, "| hobbies:", hobby, "| tools:", tools || "(none)", "| image:", image ? `${imageMime} ${Math.round((image.length * 3) / 4 / 1024)}KB` : "none");

    try {
      const content = await callGemini(
        geminiKey,
        system,
        userPrompt,
        image && imageMime ? { data: image, mime: imageMime } : undefined,
      );
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
