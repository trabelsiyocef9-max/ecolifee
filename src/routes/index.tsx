import { createFileRoute } from "@tanstack/react-router";
import { useState, type FormEvent } from "react";
import { ScanLine, Wrench, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo.png.asset.json";

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

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "EcoLife — Turn household waste into DIY projects" },
      {
        name: "description",
        content:
          "EcoLife uses computer vision to turn your household waste into DIY projects tailored to your hobbies. Built for Gen Z creators.",
      },
      {
        property: "og:title",
        content: "EcoLife — Turn household waste into DIY projects",
      },
      {
        property: "og:description",
        content:
          "Scan waste. Pick your hobby. Get an AI-generated DIY recipe in seconds.",
      },
    ],
  }),
  component: Landing,
});

function Landing() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <TopBar />
      <Hero />
      <InteractiveStrip />
      <Features />
      <Contact />
      <Footer />
      <Toaster />
    </div>
  );
}

/* -------------------- Top bar -------------------- */
function TopBar() {
  return (
    <header className="mx-auto flex w-full max-w-7xl items-center gap-3 px-6 py-6 md:px-10 md:py-8">
      <img
        src={logoAsset.url}
        alt="EcoLife logo"
        className="h-12 w-auto object-contain"
      />
      <span
        className="font-serif text-2xl tracking-tight"
        style={{ color: "#1E2F23" }}
      >
        EcoLife
      </span>
    </header>
  );
}

/* -------------------- Hero -------------------- */
function Hero() {
  return (
    <section className="mx-auto grid w-full max-w-7xl items-center gap-12 px-6 pb-16 pt-8 md:grid-cols-2 md:px-10 md:pb-24 md:pt-12">
      <div className="max-w-xl">
        <p className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          <span className="h-px w-8 bg-[color:var(--sage)]" />
          For Gen Z creators
        </p>
        <h1 className="font-serif text-5xl leading-[1.05] tracking-tight text-foreground md:text-6xl lg:text-7xl">
          Turn today's trash into{" "}
          <em className="italic text-[color:var(--sage)]">tomorrow's</em>{" "}
          project.
        </h1>
        <p className="mt-6 max-w-md text-base font-light leading-relaxed text-foreground/75">
          EcoLife scans the waste around you and remixes it into DIY recipes
          tailored to the hobbies you actually care about — gaming rigs,
          sketchbooks, micro-gardens, and beyond.
        </p>
        <div className="mt-10 flex items-center gap-6">
          <Button
            size="lg"
            className="h-12 rounded-full bg-[color:var(--clay)] px-7 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
          >
            Start scanning
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
          <a
            href="#features"
            className="text-sm font-medium text-foreground/70 underline-offset-4 hover:underline"
          >
            How it works
          </a>
        </div>
      </div>

      <PhoneMock />
    </section>
  );
}

function PhoneMock() {
  return (
    <div className="relative mx-auto flex h-[520px] w-full max-w-md items-center justify-center md:h-[600px]">
      {/* Soft-focus backdrop — layered solid blobs, no gradients */}
      <div
        className="absolute inset-6 rounded-[3rem] bg-[#E8E1D2]"
        aria-hidden
      />
      <div
        className="absolute right-2 top-4 h-56 w-56 rounded-full opacity-70 blur-2xl"
        style={{ backgroundColor: "#D9C7B0" }}
        aria-hidden
      />
      <div
        className="absolute bottom-6 left-2 h-48 w-48 rounded-full opacity-60 blur-2xl"
        style={{ backgroundColor: "#B7C7B6" }}
        aria-hidden
      />

      {/* Phone frame */}
      <div
        className="relative h-[460px] w-[230px] rounded-[2.5rem] border border-border bg-[#1E2F23] p-2 shadow-[0_30px_60px_-20px_rgba(30,47,35,0.35)] md:h-[520px] md:w-[260px]"
      >
        <div className="relative h-full w-full overflow-hidden rounded-[2rem] bg-[#F7F5F0]">
          {/* notch */}
          <div className="absolute left-1/2 top-2 h-4 w-20 -translate-x-1/2 rounded-full bg-[#1E2F23]" />

          {/* status row */}
          <div className="flex items-center justify-between px-5 pt-7 text-[10px] font-medium tracking-wider text-foreground/60">
            <span>9:41</span>
            <span>EcoLife</span>
          </div>

          {/* viewfinder */}
          <div className="relative mx-4 mt-4 aspect-[3/4] overflow-hidden rounded-2xl border border-border bg-[#EDE7DA]">
            {/* "box" being scanned */}
            <div
              className="absolute left-1/2 top-1/2 h-24 w-28 -translate-x-1/2 -translate-y-1/2 rounded-sm"
              style={{
                backgroundColor: "#C9B28B",
                boxShadow: "inset 0 -10px 0 rgba(0,0,0,0.08)",
              }}
            />
            <div
              className="absolute left-1/2 top-[42%] h-1 w-28 -translate-x-1/2 rounded-full"
              style={{ backgroundColor: "#8A6E4B" }}
            />

            {/* AI bounding box */}
            <div className="absolute inset-6 rounded-md">
              <Corner className="left-0 top-0" />
              <Corner className="right-0 top-0 rotate-90" />
              <Corner className="bottom-0 right-0 rotate-180" />
              <Corner className="bottom-0 left-0 -rotate-90" />
              {/* scan line */}
              <div
                className="absolute inset-x-2 top-1/2 h-px"
                style={{ backgroundColor: "#C06C54" }}
              />
            </div>

            {/* AI tag */}
            <div className="absolute bottom-3 left-3 rounded-full bg-[#1E2F23] px-2.5 py-1 text-[9px] font-semibold uppercase tracking-wider text-white">
              <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[color:var(--sage)]" />
              Cardboard · 98%
            </div>
          </div>

          {/* caption */}
          <div className="px-5 pt-4">
            <p className="font-serif text-base leading-snug text-foreground">
              Hold steady — finding makes…
            </p>
            <p className="mt-1 text-[11px] text-foreground/55">
              3 DIY recipes ready
            </p>
          </div>

          {/* shutter */}
          <div className="absolute bottom-5 left-1/2 -translate-x-1/2">
            <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-[#1E2F23]">
              <div className="h-9 w-9 rounded-full bg-[color:var(--clay)]" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function Corner({ className = "" }: { className?: string }) {
  return (
    <div
      className={`absolute h-4 w-4 border-l-2 border-t-2 ${className}`}
      style={{ borderColor: "#1E2F23" }}
    />
  );
}

/* -------------------- Interactive strip -------------------- */
function InteractiveStrip() {
  const [hobby, setHobby] = useState<string>("");
  const [safety, setSafety] = useState<boolean>(false);

  return (
    <section className="mx-auto w-full max-w-7xl px-6 pb-20 md:px-10">
      <div className="flex flex-col items-start justify-between gap-8 rounded-2xl border border-border bg-card p-8 shadow-[var(--shadow-elegant)] md:flex-row md:items-center md:p-10">
        <div className="flex w-full flex-col gap-2 md:max-w-xs">
          <Label
            htmlFor="hobby"
            className="text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55"
          >
            Select your hobby
          </Label>
          <Select value={hobby} onValueChange={setHobby}>
            <SelectTrigger
              id="hobby"
              className="h-12 rounded-none border-0 border-b border-foreground bg-transparent px-0 font-serif text-lg shadow-none focus:ring-0"
            >
              <SelectValue placeholder="Choose one…" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="gaming">Gaming</SelectItem>
              <SelectItem value="art">Art</SelectItem>
              <SelectItem value="gardening">Gardening</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="hidden h-16 w-px bg-border md:block" />

        <div className="flex items-center gap-4">
          <Switch
            id="safety"
            checked={safety}
            onCheckedChange={setSafety}
            className="data-[state=checked]:bg-[color:var(--sage)]"
          />
          <div>
            <Label
              htmlFor="safety"
              className="block font-serif text-lg text-foreground"
            >
              Safety Mode
            </Label>
            <p className="text-xs text-foreground/55">
              Recommended for makers under 14
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

/* -------------------- Features -------------------- */
const FEATURES = [
  {
    n: "01",
    title: "Scan Waste",
    body: "Point your camera at any household item. Our vision model identifies materials, dimensions, and reusable parts in seconds.",
    Icon: ScanLine,
  },
  {
    n: "02",
    title: "Filter Tools",
    body: "Tell us what you've got on hand — scissors, a glue gun, a soldering iron. We match recipes to your toolkit and skill level.",
    Icon: Wrench,
  },
  {
    n: "03",
    title: "Get AI Recipe",
    body: "Receive a step-by-step DIY recipe tailored to your hobby, complete with images, time estimates, and remix ideas.",
    Icon: Sparkles,
  },
];

function Features() {
  return (
    <section
      id="features"
      className="mx-auto w-full max-w-7xl px-6 py-24 md:px-10 md:py-32"
    >
      <div className="mx-auto max-w-2xl text-center">
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          How it works
        </p>
        <h2 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
          Three quiet steps from{" "}
          <em className="italic">scrap</em> to something you'll keep.
        </h2>
      </div>

      <div className="mt-16 grid gap-6 md:mt-20 md:grid-cols-3 md:gap-8">
        {FEATURES.map(({ n, title, body, Icon }) => (
          <article
            key={n}
            className="group flex flex-col rounded-2xl border border-border bg-card p-10 shadow-[var(--shadow-elegant)] transition-colors hover:border-[color:var(--sage)]/60"
          >
            <div className="flex items-center justify-between">
              <span className="font-serif text-sm tracking-widest text-[color:var(--sage)]">
                {n}
              </span>
              <Icon
                className="h-5 w-5 text-foreground/70"
                strokeWidth={1.5}
                aria-hidden
              />
            </div>
            <h3 className="mt-12 font-serif text-2xl text-foreground">
              {title}
            </h3>
            <p className="mt-4 text-sm font-light leading-relaxed text-foreground/70">
              {body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

/* -------------------- Contact -------------------- */
function Contact() {
  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    toast.success("Thanks — we'll be in touch soon.");
    form.reset();
  }

  return (
    <section
      id="contact"
      className="mx-auto w-full max-w-3xl px-6 py-24 md:px-10 md:py-32"
    >
      <div className="text-center">
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          Get in touch
        </p>
        <h2 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
          Have an idea? Send it our way.
        </h2>
        <p className="mx-auto mt-4 max-w-md text-sm font-light text-foreground/70">
          We read every note. Tell us what you'd love to remake, or just say hi.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="mt-14 space-y-10">
        <FieldLine label="Name" name="name" type="text" required />
        <FieldLine
          label="Email"
          name="email"
          type="email"
          required
          placeholder="you@earth.io"
        />
        <FieldArea label="Message" name="message" required />
        <div className="pt-4">
          <Button
            type="submit"
            size="lg"
            className="h-12 rounded-full bg-[color:var(--clay)] px-8 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
          >
            Send message
          </Button>
        </div>
      </form>
    </section>
  );
}

function FieldLine({
  label,
  name,
  type,
  required,
  placeholder,
}: {
  label: string;
  name: string;
  type: string;
  required?: boolean;
  placeholder?: string;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55"
      >
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        required={required}
        placeholder={placeholder}
        className="mt-2 w-full border-0 border-b border-foreground bg-transparent px-0 py-3 font-serif text-lg text-foreground placeholder:text-foreground/30 focus:border-[color:var(--sage)] focus:outline-none focus:ring-0"
      />
    </div>
  );
}

function FieldArea({
  label,
  name,
  required,
}: {
  label: string;
  name: string;
  required?: boolean;
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="block text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55"
      >
        {label}
      </label>
      <textarea
        id={name}
        name={name}
        required={required}
        rows={4}
        className="mt-2 w-full resize-none border-0 border-b border-foreground bg-transparent px-0 py-3 font-sans text-base text-foreground placeholder:text-foreground/30 focus:border-[color:var(--sage)] focus:outline-none focus:ring-0"
      />
    </div>
  );
}

/* -------------------- Footer -------------------- */
function Footer() {
  return (
    <footer className="mx-auto w-full max-w-7xl px-6 pb-10 pt-4 md:px-10">
      <div className="flex flex-col items-start justify-between gap-3 border-t border-border pt-8 text-xs text-foreground/55 md:flex-row md:items-center">
        <div className="flex items-center gap-2">
          <img
            src={logoAsset.url}
            alt="EcoLife logo"
            className="h-6 w-auto object-contain"
          />
          <span className="font-serif text-sm text-foreground">EcoLife</span>
        </div>
        <p>© {new Date().getFullYear()} EcoLife. Made for makers.</p>
      </div>
    </footer>
  );
}
