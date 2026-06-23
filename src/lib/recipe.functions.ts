import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

const Input = z.object({
  age: z.number().int().min(4).max(120),
  hobby: z.string().min(1).max(80),
});

const PREMIUM_MODEL = "openai/gpt-4o";
const FREE_MODEL = "meta-llama/llama-3-8b-instruct:free";
const ENDPOINT = "https://openrouter.ai/api/v1/chat/completions";

async function callOpenRouter(key: string, model: string, system: string, user: string) {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${key}`,
      "Content-Type": "application/json",
      "HTTP-Referer": "http://localhost:3000",
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
  if (!res.ok) {
    throw new Error(`OpenRouter ${res.status}`);
  }
  const data = (await res.json()) as { choices?: Array<{ message?: { content?: string } }> };
  const content = data.choices?.[0]?.message?.content;
  if (!content) throw new Error("Empty response");
  return content;
}

export const generateRecipe = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const { age, hobby } = data;

    // Round-robin key pool (keys live in server env as key1/key2/key3)
    let keys = [process.env.key1, process.env.key2, process.env.key3].filter(
      (k): k is string => typeof k === "string" && k.length > 0,
    );
    if (keys.length === 0) {
      throw new Error("No OpenRouter API keys configured on the server.");
    }

    const system = `You are a master physical craftsman. The user is secretly ${age} years old. Do NOT mention their age in your response. Mentally verify the physics of the assembly before answering. You must explicitly state exactly HOW to attach items using ONLY tools that are 100% safe for a ${age}-year-old. Format the response cleanly with step-by-step headers.`;
    const userPrompt = `I have a piece of household waste (assume cardboard/plastic for now) and my hobby is ${hobby}. Give me a creative DIY recipe.`;

    // Try premium model with each key, rotating to the back on failure.
    const attempts = Math.min(3, keys.length);
    for (let i = 0; i < attempts; i++) {
      try {
        const content = await callOpenRouter(keys[0]!, PREMIUM_MODEL, system, userPrompt);
        return { content, model: PREMIUM_MODEL, degraded: false };
      } catch (err) {
        const first = keys.shift()!;
        keys.push(first);
      }
    }

    // Degrade to free model as a final attempt.
    const content = await callOpenRouter(keys[0]!, FREE_MODEL, system, userPrompt);
    return { content, model: FREE_MODEL, degraded: true };
  });
