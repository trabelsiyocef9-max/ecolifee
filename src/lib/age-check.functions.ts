import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { z } from "zod";

const Input = z.object({
  // Base64-encoded JPEG (no data: prefix). Cap ~3MB encoded.
  imageBase64: z.string().min(100).max(4_500_000),
});

const FACE_API_URL = "https://api-us.faceplusplus.com/facepp/v3/detect";

export const estimateAge = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: unknown) => Input.parse(d))
  .handler(async ({ data }) => {
    const apiKey = process.env.FACE_API_KEY;
    const apiSecret = process.env.FACE_API_SECRET;
    if (!apiKey || !apiSecret) {
      throw new Error("Face++ credentials are not configured on the server.");
    }

    const form = new FormData();
    form.append("api_key", apiKey);
    form.append("api_secret", apiSecret);
    form.append("image_base64", data.imageBase64);
    form.append("return_attributes", "age");

    const res = await fetch(FACE_API_URL, { method: "POST", body: form });
    if (!res.ok) {
      throw new Error(`Face++ responded ${res.status}`);
    }
    const json = (await res.json()) as {
      faces?: Array<{ attributes?: { age?: { value?: number } } }>;
    };
    const age = json.faces?.[0]?.attributes?.age?.value;
    if (typeof age !== "number") {
      throw new Error("No face detected");
    }
    return { age };
  });
