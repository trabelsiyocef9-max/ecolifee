import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useRef, useState } from "react";
import { Camera, Upload, Sparkles, Loader2, X, Check } from "lucide-react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { generateRecipe } from "@/lib/recipe.functions";
import ReactMarkdown from "react-markdown";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/scanner")({
  head: () => ({
    meta: [
      { title: "Workspace — EcoLife Scanner" },
      { name: "description", content: "Scan waste, pick your hobby, and get step-by-step DIY recipes." },
    ],
  }),
  component: ScannerPage,
});

type Tier = "kid" | "tween" | "teen" | "adult";

function tierForAge(age: number): Tier {
  if (age <= 10) return "kid";
  if (age <= 13) return "tween";
  if (age <= 17) return "teen";
  return "adult";
}

const HOBBY_RECIPES: Record<string, Record<Tier, string[]>> = {
  gaming: {
    kid: [
      "With a grown-up nearby, fold a cardboard panel into a controller stand using only your hands — no cutting tools needed.",
      "Decorate it with crayons, stickers, or washable markers.",
      "Tape soft fabric scraps inside with kid-safe paper tape to stop wobble.",
      "Set it on your desk and test it with a controller.",
    ],
    tween: [
      "Use safety scissors to trim a cardboard panel to roughly 18×24 cm for a console caddy.",
      "Fold inner edges by hand to make cable channels — no blades required.",
      "Glue felt scraps inside with non-toxic school glue to dampen vibration.",
      "Color the outside with markers or tempera paint and let dry one hour.",
    ],
    teen: [
      "Score and snap cardboard panels to 18×24 cm using a ruler and safety cutter on a cutting mat.",
      "Reinforce inner edges with folded strips for cable channeling.",
      "Line interior with felt scraps using craft glue to muffle vibration.",
      "Add a matte acrylic finish in a ventilated area; let cure for two hours.",
    ],
    adult: [
      "Cut cardboard panels to 18×24 cm with a sharp utility knife on a self-healing mat.",
      "Heat-set folded reinforcement strips with a low-temp glue gun for cable channels.",
      "Line the interior with felt using contact adhesive for vibration damping.",
      "Spray-finish with matte acrylic in a ventilated space; cure two hours.",
    ],
  },
  art: {
    kid: [
      "Tear waste paper into small pieces with your hands.",
      "Soak in a bowl of warm water for 10 minutes — ask an adult to help with the water.",
      "Press the soft pulp flat between two clean cloths and let it air dry overnight.",
      "Decorate the dry sheet with crayons or stickers.",
    ],
    tween: [
      "Tear waste paper and soak it; mash with a wooden spoon (no blender needed).",
      "Press the pulp between cloths to remove water; air dry overnight.",
      "Trim with safety scissors to A6 size.",
      "Bind pages together with twine — no needles required.",
    ],
    teen: [
      "Soak waste paper and pulp it in a blender for handmade sketch sheets (adult supervision the first time).",
      "Press pulp between two cloths to remove water; air dry overnight.",
      "Trim to A6 and bind with twine into a pocket sketchbook.",
      "Seal the cover with a thin coat of beeswax warmed in a bowl of hot water.",
    ],
    adult: [
      "Pulp waste paper in a blender; pour onto a deckle and screen.",
      "Couch sheets onto felt, press, and air-dry overnight.",
      "Trim to A6 and saddle-stitch with waxed thread and a bookbinding needle.",
      "Seal cover with melted beeswax over low heat for a water-resistant finish.",
    ],
  },
  gardening: {
    kid: [
      "Rinse a plastic bottle or jar with the lid still on — skip glass for now.",
      "Fill the bottom with small pebbles you've collected and rinsed.",
      "Add potting mix with a spoon.",
      "Plant a moss clump and mist with a spray bottle.",
    ],
    tween: [
      "Wash a sturdy jar; check the rim is smooth (no chips).",
      "Layer pebbles, a thin charcoal layer, and potting mix using a spoon.",
      "Transplant a small succulent with gloves on.",
      "Mist lightly and place in indirect light.",
    ],
    teen: [
      "Clean a glass jar; lightly sand the rim with fine sandpaper for safety.",
      "Layer pebbles, activated charcoal, and potting mix.",
      "Transplant a low-light succulent or moss cluster.",
      "Mist lightly; place near indirect window light.",
    ],
    adult: [
      "Clean and sterilise a glass jar; smooth the rim with 220-grit sandpaper.",
      "Layer drainage pebbles, activated charcoal, sphagnum moss, and a substrate mix.",
      "Transplant a low-light succulent or moss cluster; tamp gently.",
      "Mist lightly; site near bright indirect light and monitor humidity weekly.",
    ],
  },
};

function ScannerPage() {
  const { isAuthenticated, user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const callGenerate = useServerFn(generateRecipe);
  const [hobbies, setHobbies] = useState<string[]>([]);
  const [hobbyInput, setHobbyInput] = useState("");
  const [tools, setTools] = useState<string[]>([]);
  const [toolInput, setToolInput] = useState("");
  const [preview, setPreview] = useState<string | null>(null);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [additionalInfo, setAdditionalInfo] = useState("");
  const [recipe, setRecipe] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);
  const [age, setAge] = useState<number>(14);
  const [ageReady, setAgeReady] = useState(false);
  const [syncStatus, setSyncStatus] = useState<"idle" | "saving" | "saved">("idle");
  const [toolsSyncStatus, setToolsSyncStatus] = useState<"idle" | "saving" | "saved">("idle");
  const hydratedRef = useRef(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const cameraRef = useRef<HTMLInputElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);

  useEffect(() => {
    if (cameraOpen && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [cameraOpen, cameraStream]);

  useEffect(() => {
    if (loading) return;
    if (!isAuthenticated) {
      navigate({ to: "/auth" });
      return;
    }
    if (profile === null) return;
    if (profile.age == null) {
      navigate({ to: "/age-check" });
      return;
    }
    setAge(profile.age);
    setAgeReady(true);
  }, [isAuthenticated, loading, profile, navigate]);

  // Hydrate hobbies from user_metadata on load
  useEffect(() => {
    if (hydratedRef.current) return;
    if (!isAuthenticated) return;
    let cancelled = false;
    (async () => {
      const { data } = await supabase.auth.getUser();
      if (cancelled) return;
      const savedHobbies = data.user?.user_metadata?.hobbies;
      if (Array.isArray(savedHobbies)) {
        setHobbies(savedHobbies.filter((h): h is string => typeof h === "string"));
      }
      const savedTools = data.user?.user_metadata?.tools;
      if (Array.isArray(savedTools)) {
        setTools(savedTools.filter((t): t is string => typeof t === "string"));
      }
      hydratedRef.current = true;
    })();
    return () => {
      cancelled = true;
    };
  }, [isAuthenticated]);

  if (!isAuthenticated || !ageReady) return null;

  const displayName = (profile?.name || user?.user_metadata?.name || user?.email || "friend") as string;

  async function syncHobbies(next: string[]) {
    setSyncStatus("saving");
    try {
      const { error } = await supabase.auth.updateUser({ data: { hobbies: next } });
      if (error) throw error;
      setSyncStatus("saved");
    } catch (err) {
      console.error("Failed to sync hobbies", err);
      setSyncStatus("idle");
    }
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreview(url);
    setImageFile(file);
    setRecipe(null);
  }

  async function openCamera() {
    if (!navigator.mediaDevices?.getUserMedia) {
      cameraRef.current?.click();
      return;
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });
      setCameraStream(stream);
      setCameraOpen(true);
    } catch (err) {
      console.error("Camera access failed", err);
      toast.error("Couldn't open camera. Falling back to file picker.");
      cameraRef.current?.click();
    }
  }

  function closeCamera() {
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setCameraOpen(false);
  }

  function capturePhoto() {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    canvas.toBlob((blob) => {
      if (!blob) return;
      const file = new File([blob], `capture-${Date.now()}.jpg`, { type: "image/jpeg" });
      const url = URL.createObjectURL(file);
      setPreview(url);
      setImageFile(file);
      setRecipe(null);
      closeCamera();
    }, "image/jpeg", 0.92);
  }


  async function fileToBase64(file: File): Promise<{ data: string; mime: string }> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => {
        const result = reader.result as string;
        const [meta, data] = result.split(",");
        const mime = /data:(.*?);base64/.exec(meta)?.[1] || file.type || "image/jpeg";
        resolve({ data, mime });
      };
      reader.onerror = () => reject(reader.error);
      reader.readAsDataURL(file);
    });
  }

  function addHobby() {
    const value = hobbyInput.trim();
    if (!value) return;
    if (hobbies.some((h) => h.toLowerCase() === value.toLowerCase())) {
      setHobbyInput("");
      return;
    }
    const next = [...hobbies, value];
    setHobbies(next);
    setHobbyInput("");
    void syncHobbies(next);
  }

  function removeHobby(h: string) {
    const next = hobbies.filter((x) => x !== h);
    setHobbies(next);
    void syncHobbies(next);
  }

  async function syncTools(next: string[]) {
    setToolsSyncStatus("saving");
    try {
      const { error } = await supabase.auth.updateUser({ data: { tools: next } });
      if (error) throw error;
      setToolsSyncStatus("saved");
    } catch (err) {
      console.error("Failed to sync tools", err);
      setToolsSyncStatus("idle");
    }
  }

  function addTool() {
    const value = toolInput.trim();
    if (!value) return;
    if (tools.some((t) => t.toLowerCase() === value.toLowerCase())) {
      setToolInput("");
      return;
    }
    const next = [...tools, value];
    setTools(next);
    setToolInput("");
    void syncTools(next);
  }

  function removeTool(t: string) {
    const next = tools.filter((x) => x !== t);
    setTools(next);
    void syncTools(next);
  }

  async function handleGenerate() {
    if (hobbies.length === 0) {
      toast.error("Add at least one hobby first.");
      return;
    }
    if (!preview || !imageFile) {
      toast.error("Upload or capture a photo of your waste item first.");
      return;
    }
    const storedAge = Number(localStorage.getItem("userAge")) || age;
    const joined = hobbies.join(", ");
    setGenerating(true);
    setRecipe(null);
    try {
      const { data: imageData, mime: imageMime } = await fileToBase64(imageFile);
      const result = await callGenerate({
        data: {
          age: storedAge,
          hobby: joined,
          tools: tools.join(", "),
          image: imageData,
          imageMime,
          additionalInfo: additionalInfo.trim() || undefined,
        },
      });
      setRecipe(result.content);
      toast.success(result.degraded ? "Recipe ready (free model)." : "Your DIY recipe is ready.");
    } catch (err) {
      console.error(err);
      toast.error("Could not generate a recipe. Please try again.");
    } finally {
      setGenerating(false);
    }
  }

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <NavBar />

      <section className="mx-auto w-full max-w-5xl px-6 py-16 md:px-10 md:py-24">
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          Workspace
        </p>
        <h1 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
          Hi {displayName.split(" ")[0]} — what are we remaking today?
        </h1>
        <p className="mt-4 max-w-xl text-base font-light text-foreground/70">
          Add the hobbies that inspire you, upload a photo of the item you'd like to upcycle,
          and we'll draft a step-by-step recipe tuned to your skill level.
        </p>

        <div className="mt-12 grid gap-8 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] md:p-10">
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="hobby" className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55">
                Your hobbies
              </Label>
              {syncStatus !== "idle" && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-light tracking-wide"
                  style={{ color: "#dce1db" }}
                  aria-live="polite"
                >
                  {syncStatus === "saving" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving profile…
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      Saved to profile
                    </>
                  )}
                </span>
              )}
            </div>
            <Input
              id="hobby"
              value={hobbyInput}
              onChange={(e) => setHobbyInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addHobby();
                }
              }}
              placeholder="Type a hobby (e.g. Gaming, Art) and press Enter..."
              className="h-12 rounded-full border border-[#E5E3D8] bg-transparent px-5 font-sans text-base shadow-none focus-visible:ring-0 focus-visible:border-[color:var(--sage)]"
            />
            {hobbies.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {hobbies.map((h) => (
                  <span
                    key={h}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[#8FA89B]/20 px-3 py-1 text-sm text-[#1B261E]"
                  >
                    {h}
                    <button
                      type="button"
                      onClick={() => removeHobby(h)}
                      aria-label={`Remove ${h}`}
                      className="rounded-full p-0.5 transition hover:bg-[#1B261E]/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>

          <div className="flex flex-col gap-3 border-t border-[#E5E3D8] pt-8">
            <div className="flex items-center justify-between gap-3">
              <Label htmlFor="tool" className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55">
                Your tools
              </Label>
              {toolsSyncStatus !== "idle" && (
                <span
                  className="inline-flex items-center gap-1.5 text-[11px] font-light tracking-wide"
                  style={{ color: "#dce1db" }}
                  aria-live="polite"
                >
                  {toolsSyncStatus === "saving" ? (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin" />
                      Saving profile…
                    </>
                  ) : (
                    <>
                      <Check className="h-3 w-3" />
                      Saved to profile
                    </>
                  )}
                </span>
              )}
            </div>
            <Input
              id="tool"
              value={toolInput}
              onChange={(e) => setToolInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  addTool();
                }
              }}
              placeholder="Type a tool (e.g. Scissors, Glue gun) and press Enter..."
              className="h-12 rounded-full border border-[#E5E3D8] bg-transparent px-5 font-sans text-base shadow-none focus-visible:ring-0 focus-visible:border-[color:var(--sage)]"
            />
            {tools.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tools.map((t) => (
                  <span
                    key={t}
                    className="inline-flex items-center gap-1.5 rounded-full bg-[color:var(--clay)]/15 px-3 py-1 text-sm text-[#1B261E]"
                  >
                    {t}
                    <button
                      type="button"
                      onClick={() => removeTool(t)}
                      aria-label={`Remove ${t}`}
                      className="rounded-full p-0.5 transition hover:bg-[#1B261E]/10"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>

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
              <Button type="button" variant="outline" onClick={() => fileRef.current?.click()} className="rounded-full">
                <Upload className="mr-2 h-4 w-4" /> Upload photo
              </Button>
              <Button type="button" variant="outline" onClick={openCamera} className="rounded-full">
                <Camera className="mr-2 h-4 w-4" /> Use camera
              </Button>
            </div>
          </div>

          {cameraOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4">
              <div className="w-full max-w-2xl rounded-2xl bg-card p-4 shadow-[var(--shadow-elegant)]">
                <video ref={videoRef} autoPlay playsInline muted className="w-full rounded-xl bg-black" />
                <div className="mt-4 flex justify-center gap-3">
                  <Button type="button" variant="outline" onClick={closeCamera} className="rounded-full">
                    <X className="mr-2 h-4 w-4" /> Cancel
                  </Button>
                  <Button type="button" onClick={capturePhoto} className="rounded-full">
                    <Camera className="mr-2 h-4 w-4" /> Capture
                  </Button>
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-col justify-between rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
            <div>
              <p className="text-xs uppercase tracking-[0.18em] text-foreground/55">Next step</p>
              <h2 className="mt-2 font-serif text-2xl text-foreground">Generate your DIY recipe</h2>
              <p className="mt-3 text-sm font-light text-foreground/70">
                We'll draft a step-by-step upcycle plan you can confidently do on your own.
              </p>
            </div>
            <Button
              type="button"
              size="lg"
              onClick={handleGenerate}
              disabled={generating || hobbies.length === 0}
              className="mt-8 h-12 rounded-full bg-[color:var(--clay)] px-7 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  AI Architecting…
                </>
              ) : (
                <>
                  <Sparkles className="mr-2 h-4 w-4" />
                  Generate DIY Recipe
                </>
              )}
            </Button>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)]">
          <Label htmlFor="additionalInfo" className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55">
            Additional Details
          </Label>
          <p className="mt-1 text-sm font-light text-foreground/60">
            Help the AI understand your item better
          </p>
          <Input
            id="additionalInfo"
            value={additionalInfo}
            onChange={(e) => setAdditionalInfo(e.target.value.slice(0, 300))}
            placeholder={`Optional: describe the item further (e.g. "it's made of glass", "it's 30cm tall", "it has a broken handle")`}
            className="mt-3 h-12 rounded-full border border-[#E5E3D8] bg-transparent px-5 font-sans text-base shadow-none focus-visible:ring-0 focus-visible:border-[color:var(--sage)]"
          />
        </div>

        {generating && (
          <div className="mt-12 rounded-2xl border border-[#E5E3D8] bg-card/60 p-10 text-center shadow-[var(--shadow-elegant)] backdrop-blur-md">
            <Loader2 className="mx-auto h-6 w-6 animate-spin text-[color:var(--sage)]" />
            <p className="mt-4 font-serif text-lg text-foreground/80">AI Architecting your project…</p>
          </div>
        )}

        {recipe && !generating && (
          <div className="mt-12 rounded-2xl border border-[#E5E3D8] bg-card/70 p-10 shadow-[var(--shadow-elegant)] backdrop-blur-md">
            <p className="text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">Your recipe</p>
            <h3 className="mt-2 font-serif text-3xl text-foreground">Step by step</h3>
            <div className="mt-8 font-sans text-base font-light leading-relaxed text-foreground/85 [&_br]:block [&_h1]:mb-2 [&_h1]:text-2xl [&_h1]:font-bold [&_h2]:mb-2 [&_h2]:text-xl [&_h2]:font-bold [&_h3]:text-lg [&_h3]:font-bold [&_h4]:mt-4 [&_h4]:text-base [&_h4]:font-bold [&_li]:my-1 [&_ol]:ml-5 [&_ol]:list-decimal [&_p]:my-2 [&_strong]:font-bold [&_ul]:ml-5 [&_ul]:list-disc">
              <ReactMarkdown>{recipe}</ReactMarkdown>
            </div>

          </div>
        )}
      </section>
      <Toaster />
    </div>
  );
}
