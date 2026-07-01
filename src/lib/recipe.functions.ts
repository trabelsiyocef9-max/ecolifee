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
});

const GEMINI_MODEL = "gemini-2.5-flash";
const GEMINI_ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent`;

// Last-resort fallback only if Gemini itself is down (not for missing slugs/credits).
const FALLBACK_MODEL = "deepseek/deepseek-chat-v3-0324:free";
const OPENROUTER_ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

async function callGemini(apiKey: string, system: string, user: string): Promise<string> {
  const url = `${GEMINI_ENDPOINT}?key=${apiKey}`;
  const body = {
    contents: [{ parts: [{ text: `${system}\n\n${user}` }] }],
    generationConfig: { temperature: 0.7, maxOutputTokens: 2048 },
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
    const { age, hobby } = data;

    const geminiKey = process.env.GEMINI_API_KEY;
    if (!geminiKey) {
      throw new Error("No Gemini API key configured. Add GEMINI_API_KEY in project secrets.");
    }

    // System prompt openly uses the estimated age as a safety filter for tool
    // recommendations. It does NOT instruct the model to hide the age from its
    // own reasoning — that would undermine the safety gate, not protect privacy.
    // Privacy/UX goal (not surfacing an unreliable estimate on-screen) is handled
    // by simply never including `age` in the response payload below, not by
    // hiding it from the model.
    const system = `You are a creative upcycling and crafting assistant for an app that helps young people turn household trash into DIY craft projects.

The user is approximately ${age} years old (this is an estimate, used only to choose age-appropriate tools and techniques).

Apply these safety rules based on the age:
- Always choose techniques and tools appropriate for someone of this approximate age.
- For younger users (under 13), only recommend tools like scissors (round-tip), glue, tape, and hand-folding. Avoid any cutting tools, sharp blades, drills, or power tools.
- For early teens (13-15), basic supervised tools like a craft knife or low-temp glue gun may be mentioned, but always include a safety note to use them with adult supervision.
- For older teens and adults (16+), normal craft and household tools can be recommended with standard safety notes.

Write clean, step-by-step instructions for the craft project. Do not mention or restate the user's age in your response — just apply the safety filtering silently to your tool choices.`;

    const userPrompt = `I have this item to upcycle, and my hobbies are: ${hobby}. Give me a creative DIY upcycling project using this item.`;

    try {
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