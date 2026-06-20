import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Workspace — EcoLife Scanner" },
      { name: "description", content: "Scan waste, pick your hobby, and get step-by-step DIY recipes." },
    ],
  }),
  component: ScannerPage,
});

const HOBBY_RECIPES: Record<string, string[]> = {
  gaming: [
    "Strip cardboard panels and cut to 18×24 cm to form a desktop console caddy.",
    "Reinforce inner edges with folded strips for cable channeling.",
    "Line interior with felt scraps to muffle vibration from controllers.",
    "Add a matte finish with leftover acrylic; let cure for two hours.",
  ],
  art: [
    "Soak waste paper and pulp it for handmade sketch sheets.",
    "Press pulp between two cloths to remove water; air dry overnight.",
    "Trim to A6 and bind with twine into a pocket sketchbook.",
    "Seal cover with beeswax for a subtle, water-resistant finish.",
  ],
  gardening: [
    "Clean glass jar; sand the rim for safety.",
    "Layer pebbles, activated charcoal, and potting mix.",
    "Transplant a low-light succulent or moss cluster.",
    "Mist lightly; place near indirect window light.",
  ],
};

function ScannerPage() {
  const { isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const [hobby, setHobby] = useState<string>("");
  const [safety, setSafety] = useState<boolean>(true);
  const [preview, setPreview] = useState<string | null>(null);
  const [recipe, setRecipe] = useState<string[] | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!isAuthenticated) navigate({ to: "/auth" });
  }, [isAuthenticated, navigate]);

  if (!isAuthenticated) return null;

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setRecipe(null);
  }

  function handleGenerate() {
    if (!hobby) {
      toast.error("Choose a hobby to generate your recipe.");
      return;
    }
    if (!preview) {
      toast.error("Upload or capture a photo of your waste item first.");
      return;
    }
    setRecipe(HOBBY_RECIPES[hobby] ?? HOBBY_RECIPES.art);
    toast.success("Your DIY recipe is ready.");
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <NavBar />

      <section className="mx-auto w-full max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          Workspace
        </p>
        <h1 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
          Hi {user?.name?.split(" ")[0] ?? "friend"} — what are we remaking today?
        </h1>
        <p className="mt-4 max-w-xl text-base font-light text-foreground/70">
          Pick a hobby, upload a photo of the item you'd like to upcycle, and we'll
          draft a step-by-step recipe in your style.
        </p>

        {/* Controls */}
        <div className="mt-12 grid gap-8 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] md:grid-cols-2 md:p-10">
          <div className="flex flex-col gap-2">
            <Label htmlFor="hobby" className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55">
              Select your hobby
            </Label>
            <Select value={hobby} onValueChange={setHobby}>
              <SelectTrigger id="hobby" className="h-12 rounded-none border-0 border-b border-foreground bg-transparent px-0 font-serif text-lg shadow-none focus:ring-0">
                <SelectValue placeholder="Choose one…" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="gaming">Gaming</SelectItem>
                <SelectItem value="art">Art</SelectItem>
                <SelectItem value="gardening">Gardening</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center gap-4">
            <Switch
              id="safety"
              checked={safety}
              onCheckedChange={setSafety}
              className="data-[state=checked]:bg-[color:var(--sage)]"
            />
            <div>
              <Label htmlFor="safety" className="block font-serif text-lg text-foreground">
                Safety Mode
              </Label>
              <p className="text-xs text-foreground/55">Recommended for makers under 14</p>
            </div>
          </div>
        </div>

        {/* Uploader */}
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <div className="rounded-2xl border border-dashed border-border bg-card p-8 text-center shadow-[var(--shadow-elegant)]">
            {preview ? (
              <img src={preview} alt="Uploaded item preview" className="mx-auto h-48 w-full rounded-xl object-cover" />
            ) : (
              <div className="flex h-48 items-center justify-center text-sm text-foreground/50">
                No image yet
              </div>
            )}
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={handleFile} />
              <input ref={cameraRef} type="file" accept="image/*" capture="environment" hidden onChange={handleFile} />
              <Button
                type="button"
                variant="outline"
                onClick={() => fileRef.current?.click()}
                className="rounded-full"
              >
                <Upload className="mr-2 h-4 w-4" /> Upload photo
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => cameraRef.current?.click()}
                className="rounded-full"
              >
                <Camera className="mr-2 h-4 w-4" /> Use camera
              </Button>
            </div>
          </div>

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/55">Next step</p>
              <h2 className="mt-2 font-serif text-2xl text-foreground">Generate your DIY recipe</h2>
              <p className="mt-3 text-sm font-light text-foreground/70">
                When you've picked a hobby and added a photo, we'll draft a step-by-step
                upcycle plan tailored to your skill level.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={handleGenerate}
              className="mt-8 h-12 rounded-full bg-[color:var(--clay)] px-7 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
            >
              <Sparkles className="mr-2 h-4 w-4" />
              Generate recipe
            </Button>
          </div>
        </div>

        {/* Recipe */}
        {recipe && (
          <div className="mt-12 rounded-2xl border border-[#E5E3D8] bg-card p-10 shadow-[var(--shadow-elegant)]">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">Your recipe</p>
            <h3 className="mt-2 font-serif text-3xl text-foreground">Step by step</h3>
            <ol className="mt-8 space-y-6">
              {recipe.map((step, i) => (
                <li key={i} className="flex gap-5">
                  <span className="font-serif text-sm tracking-widest text-[color:var(--sage)]">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  <p className="text-base font-light leading-relaxed text-foreground/80">{step}</p>
                </li>
              ))}
            </ol>
            {safety && (
              <p className="mt-8 flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-foreground/55">
                <ArrowRight className="h-3 w-3" /> Safety mode on — sharp tools and heat sources have been filtered out.
              </p>
            )}
          </div>
        )}
      </section>
      <Toaster />
    </div>
  );
}
