import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Camera } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import { estimateAge } from "@/lib/age-check.functions";


export const Route = createFileRoute("/age-check")({
  head: () => ({
    meta: [
      { title: "Maker age — EcoLife" },
      { name: "description", content: "Tell EcoLife your age so we tailor DIY recipes safely." },
    ],
  }),
  component: AgeCheckPage,
});

type Phase = "camera" | "scanning" | "result";

function AgeCheckPage() {
  const callEstimateAge = useServerFn(estimateAge);
  const { isAuthenticated, user, loading, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("camera");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!loading && !isAuthenticated) navigate({ to: "/auth" });
  }, [isAuthenticated, loading, navigate]);

  useEffect(() => {
    let cancelled = false;
    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user" },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        if (videoRef.current) {
          videoRef.current.srcObject = stream;
          await videoRef.current.play().catch(() => {});
        }
      } catch {
        setError("We couldn't access your camera. Please grant permission and reload.");
      }
    }
    if (phase === "camera") start();
    return () => { cancelled = true; };
  }, [phase]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  async function handleSnap() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.92);
    setSnapshot(dataUrl);
    stopStream();
    setPhase("scanning");

    const base64 = dataUrl.replace(/^data:image\/[a-z]+;base64,/, "");

    try {
      const formData = new FormData();
      formData.append("api_key", FACE_API_KEY);
      formData.append("api_secret", FACE_API_SECRET);
      formData.append("image_base64", base64);
      formData.append("return_attributes", "age");

      const res = await fetch(FACE_API_URL, { method: "POST", body: formData });
      if (!res.ok) throw new Error(`Face++ responded ${res.status}`);
      const data = await res.json();
      const estimatedAge = data?.faces?.[0]?.attributes?.age?.value;
      if (typeof estimatedAge !== "number") throw new Error("No face detected");

      try { localStorage.setItem("userAge", String(estimatedAge)); } catch {}
      setAge(estimatedAge);
      await persistAndContinue(estimatedAge);
    } catch (err) {
      console.error("Face++ error:", err);
      const fallback = 14;
      try { localStorage.setItem("userAge", String(fallback)); } catch {}
      setAge(fallback);
      await persistAndContinue(fallback);
    }
  }

  async function persistAndContinue(value: number) {
    if (!user) {
      navigate({ to: "/scanner" });
      return;
    }
    setSaving(true);
    const { error: upsertErr } = await supabase
      .from("profiles")
      .upsert({ id: user.id, age: value }, { onConflict: "id" });
    setSaving(false);
    if (upsertErr) {
      toast.error("We couldn't save your profile. Please try again.");
      setPhase("camera");
      return;
    }
    await refreshProfile();
    toast.success("Profile ready — taking you to your workspace.");
    navigate({ to: "/scanner" });
  }


  useEffect(() => () => stopStream(), []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <NavBar />
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 md:py-24">
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          Step 02 — Maker profile
        </p>
        <h1 className="text-center font-serif text-4xl leading-tight text-foreground md:text-5xl">
          Set your maker age
        </h1>
        <p className="mt-4 max-w-sm text-center text-base font-light text-foreground/70">
          Take a quick selfie to set a starter age — you can fine-tune it on the next screen so every recipe matches what's safe for you to make.
        </p>
        <p className="mt-3 max-w-sm text-center text-xs italic text-foreground/50">
          Demo only: this is a placeholder estimate, not real age verification.
        </p>

        <div className="relative mt-12 h-72 w-72 overflow-hidden rounded-full border border-border bg-card shadow-[var(--shadow-elegant)]">
          {phase === "camera" && (
            <video ref={videoRef} playsInline muted className="h-full w-full object-cover" />
          )}
          {phase !== "camera" && snapshot && (
            <img src={snapshot} alt="Selfie" className="h-full w-full object-cover" />
          )}
          {phase === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--background)]/70 backdrop-blur-sm">
              <p className="px-6 text-center font-serif text-lg text-foreground">
                Analyzing facial structure…
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm" style={{ color: "#BF5E49" }}>{error}</p>
        )}

        <div className="mt-10 flex flex-col items-center gap-4">
          {phase === "camera" && (
            <Button
              type="button"
              size="lg"
              onClick={handleSnap}
              disabled={!!error}
              className="h-12 rounded-full bg-[color:var(--clay)] px-8 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
            >
              <Camera className="mr-2 h-4 w-4" />
              Take selfie
            </Button>
          )}

          {phase === "scanning" && saving && (
            <p className="text-center text-sm text-foreground/60">Saving your profile…</p>
          )}
        </div>
      </section>
      <Toaster />
    </div>
  );
}
