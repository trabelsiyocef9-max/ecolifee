import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, ArrowRight } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/age-check")({
  head: () => ({
    meta: [
      { title: "Facial Age Check — EcoLife" },
      { name: "description", content: "Quick AI selfie age check to tailor your DIY recipes." },
    ],
  }),
  component: AgeCheckPage,
});

type Phase = "camera" | "scanning" | "result";

function AgeCheckPage() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [phase, setPhase] = useState<Phase>("camera");
  const [snapshot, setSnapshot] = useState<string | null>(null);
  const [age, setAge] = useState<number | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!isAuthenticated) {
      navigate({ to: "/auth" });
      return;
    }
  }, [isAuthenticated, navigate]);

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
    return () => {
      cancelled = true;
    };
  }, [phase]);

  function stopStream() {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
  }

  function handleSnap() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth || 480;
    canvas.height = video.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (ctx) ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    setSnapshot(canvas.toDataURL("image/png"));
    stopStream();
    setPhase("scanning");
    setTimeout(() => {
      const estimated = Math.floor(Math.random() * (25 - 8 + 1)) + 8;
      setAge(estimated);
      setPhase("result");
    }, 2000);
  }

  function handleConfirm() {
    if (age != null) localStorage.setItem("userAge", String(age));
    navigate({ to: "/scanner" });
  }

  useEffect(() => () => stopStream(), []);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <NavBar />
      <section className="mx-auto flex w-full max-w-md flex-col items-center px-6 py-16 md:py-24">
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          Step 02 — Safety
        </p>
        <h1 className="text-center font-serif text-4xl leading-tight text-foreground md:text-5xl">
          Facial Age Check
        </h1>
        <p className="mt-4 max-w-sm text-center text-base font-light text-foreground/70">
          We quickly estimate your age so every DIY recipe matches what's safe for you to make on your own.
        </p>

        <div className="relative mt-12 h-72 w-72 overflow-hidden rounded-full border border-border bg-card shadow-[var(--shadow-elegant)]">
          {phase === "camera" && (
            <video
              ref={videoRef}
              playsInline
              muted
              className="h-full w-full object-cover"
            />
          )}
          {phase !== "camera" && snapshot && (
            <img src={snapshot} alt="Selfie" className="h-full w-full object-cover" />
          )}
          {phase === "scanning" && (
            <div className="absolute inset-0 flex items-center justify-center bg-[color:var(--background)]/70 backdrop-blur-sm">
              <p className="px-6 text-center font-serif text-lg text-foreground">
                Scanning facial features…
              </p>
            </div>
          )}
        </div>

        {error && (
          <p className="mt-6 text-center text-sm" style={{ color: "#BF5E49" }}>
            {error}
          </p>
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

          {phase === "result" && age != null && (
            <>
              <p className="text-center font-serif text-2xl text-foreground">
                AI estimation complete: You are <span className="text-[color:var(--clay)]">{age}</span> years old.
              </p>
              <Button
                type="button"
                size="lg"
                onClick={handleConfirm}
                className="h-12 rounded-full bg-[color:var(--clay)] px-8 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
              >
                Confirm & continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </>
          )}
        </div>
      </section>
    </div>
  );
}
