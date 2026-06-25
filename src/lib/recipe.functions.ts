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
});


const PREMIUM_MODEL = "anthropic/claude-3.5-sonnet";
const FREE_MODEL = "meta-llama/llama-3-8b-instruct:free";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(key: string, model: string, system: string, user: string) {
  console.log("[generateRecipe] POST", ENDPOINT, "model:", model, "keyLen:", key.length);
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "https://ecolifee.lovable.app",
      "X-Title": "EcoLife",
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: "system", content: system },
        { role: "user", content: user },
      ],
    }),
  });
  console.log("[generateRecipe] OpenRouter status:", res.status);
  if (!res.ok) {
    const bodyText = await res.text().catch(() => "");
    console.log("[generateRecipe] OpenRouter error body:", bodyText.slice(0, 500));
    throw new Error(`OpenRouter ${res.status}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) {
    console.log("[generateRecipe] Empty content from OpenRouter");
    throw new Error("Empty response");
  }
  return content;
}

export const generateRecipe = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { age, hobby } = data;

    // API keys live ONLY in server env (Lovable Cloud secrets) — never shipped to the client.
    // Preferred: a single OPENROUTER_API_KEY. Legacy key1/key2/key3 are kept as round-robin fallbacks.
    let keys = [
      process.env.OPENROUTER_API_KEY,
      process.env.OPENROUTER_API_KEY_2,
      process.env.OPENROUTER_API_KEY_3,
      process.env.key1,
      process.env.key2,
      process.env.key3,
    ].filter((k): k is string => typeof k === "string" && k.length > 0);
    if (keys.length === 0) {
      throw new Error("No OpenRouter API key configured. Add OPENROUTER_API_KEY in project secrets.");
    }

    console.log("[generateRecipe] keys available:", keys.length);

    const system = `You are a master physical craftsman. The user is secretly ${age} years old. Do NOT mention their age in your response. Mentally verify the physics of the assembly before answering. You must explicitly state exactly HOW to attach items using ONLY tools that are 100% safe for a ${age}-year-old. Format the response cleanly with step-by-step headers.`;
    const userPrompt = `My hobbies are: ${hobby}. Give me a creative DIY recipe.`;

    // Try premium model with each key, rotating to the back on failure.
    const attempts = Math.min(3, keys.length);
    for (let i = 0; i < attempts; i++) {
      try {
        const content = await callOpenRouter(keys[0]!, PREMIUM_MODEL, system, userPrompt);
        return { content, model: PREMIUM_MODEL, degraded: false };
      } catch (err) {
        console.log("[generateRecipe] premium attempt", i + 1, "failed:", (err as Error).message);
        const first = keys.shift()!;
        keys.push(first);
      }
    }

    // Degrade to free model as a final attempt.
    console.log("[generateRecipe] degrading to free model");
    const content = await callOpenRouter(keys[0]!, FREE_MODEL, system, userPrompt);
    return { content, model: FREE_MODEL, degraded: true };
  });
