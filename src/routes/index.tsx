import { createFileRoute, Link } from "@tanstack/react-router";
import { useState, useEffect, type FormEvent } from "react";
import { ScanLine, Wrench, Sparkles, ArrowRight } from "lucide-react";
import { toast } from "sonner";
import logoAsset from "@/assets/logo.png.asset.json";
import { NavBar } from "@/components/NavBar";


import { Button } from "@/components/ui/button";
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
      <NavBar />
      <Hero />
      
      <Features />
      <DailyInspiration />
      <Contact />
      <Footer />
      <Toaster />
    </div>
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

const SUSTAINABILITY_TIPS = [
  "Glass jars can be upcycled into premium storage canisters; they take 1 million years to decompose in a landfill.",
  "A single cotton T-shirt requires 2,700 liters of water to produce — upcycle old tees into tote bags instead.",
  "Aluminum cans are infinitely recyclable and can be remade into planters, lanterns, or desk organizers.",
  "Composting at home can divert up to 30% of household waste from landfills while enriching your soil.",
  "Bamboo grows 30 times faster than trees and makes a sustainable alternative to plastic utensils.",
  "Upcycling one piece of furniture can save approximately 50 kg of CO2 compared to buying new.",
  "Plastic bags take 500 years to decompose; swap them for reusable totes made from old textiles.",
  "Newspaper and cardboard can be woven into biodegradable seedling pots for your garden.",
  "Cork is biodegradable and renewable — save wine corks to craft bulletin boards or coasters.",
  "The average person generates over 4 pounds of trash daily; even small upcycling habits create massive collective impact.",
];

/* -------------------- Daily Inspiration -------------------- */
function DailyInspiration() {
  const [advice, setAdvice] = useState<string>("");

  useEffect(() => {
    let cancelled = false;

    fetch("https://api.adviceslip.com/advice")
      .then((res) => {
        if (!res.ok) throw new Error("API failed");
        return res.json();
      })
      .then((data) => {
        if (!cancelled && data?.slip?.advice) {
          setAdvice(data.slip.advice);
        }
      })
      .catch(() => {
        if (!cancelled) {
          const tip =
            SUSTAINABILITY_TIPS[Math.floor(Math.random() * SUSTAINABILITY_TIPS.length)];
          setAdvice(tip);
        }
      });

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <section className="mx-auto w-full max-w-3xl px-6 md:px-10">
      <div className="rounded-2xl border border-[#E5E3D8] bg-card p-10 shadow-[var(--shadow-elegant)]">
        <span className="inline-block rounded-full bg-[color:var(--sage)] px-3 py-1 text-[10px] font-semibold uppercase tracking-wider text-white">
          Eco-Tip
        </span>
        <p className="mt-5 font-serif text-xl leading-relaxed text-foreground md:text-2xl">
          {advice || "Loading today's inspiration…"}
        </p>
      </div>
    </section>
  );
}

/* -------------------- Contact -------------------- */
function Contact() {
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(form: HTMLFormElement) {
    const data = new FormData(form);
    const name = (data.get("name") as string | null) ?? "";
    const email = (data.get("email") as string | null) ?? "";
    const message = (data.get("message") as string | null) ?? "";
    const nextErrors: Record<string, string> = {};

    if (!name.trim()) {
      nextErrors.name = "Name cannot be empty.";
    }

    const emailTrimmed = email.trim();
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(emailTrimmed)) {
      nextErrors.email = "Please enter a valid email address.";
    }

    if (message.trim().length < 10) {
      nextErrors.message = "Message must be at least 10 characters long.";
    }

    return nextErrors;
  }

  function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const validationErrors = validate(form);
    setErrors(validationErrors);

    if (Object.keys(validationErrors).length === 0) {
      toast.success(
        "Message sent successfully! We will get back to you shortly."
      );
      form.reset();
    }
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
        <FieldLine
          label="Name"
          name="name"
          type="text"
          error={errors.name}
        />
        <FieldLine
          label="Email"
          name="email"
          type="email"
          placeholder="you@earth.io"
          error={errors.email}
        />
        <FieldArea label="Message" name="message" error={errors.message} />
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
  placeholder,
  error,
}: {
  label: string;
  name: string;
  type: string;
  placeholder?: string;
  error?: string;
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
        placeholder={placeholder}
        className="mt-2 w-full border-0 border-b border-foreground bg-transparent px-0 py-3 font-serif text-lg text-foreground placeholder:text-foreground/30 focus:border-[color:var(--sage)] focus:outline-none focus:ring-0"
      />
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: "#BF5E49" }}>
          {error}
        </p>
      )}
    </div>
  );
}

function FieldArea({
  label,
  name,
  error,
}: {
  label: string;
  name: string;
  error?: string;
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
        rows={4}
        className="mt-2 w-full resize-none border-0 border-b border-foreground bg-transparent px-0 py-3 font-sans text-base text-foreground placeholder:text-foreground/30 focus:border-[color:var(--sage)] focus:outline-none focus:ring-0"
      />
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: "#BF5E49" }}>
          {error}
        </p>
      )}
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
            className="h-16 w-auto object-contain"
          />
          <span className="font-serif text-3xl text-foreground">EcoLife</span>
        </div>
        <p>© {new Date().getFullYear()} EcoLife. Made for makers.</p>
      </div>
    </footer>
  );
}
