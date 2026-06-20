import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/about")({
  head: () => ({
    meta: [
      { title: "About EcoLife — Waste, remade into something worth keeping" },
      {
        name: "description",
        content:
          "EcoLife is an AI platform that turns household waste into craft. Built by a teenage maker to turn eco-anxiety into creative play.",
      },
      {
        property: "og:title",
        content: "About EcoLife — Waste, remade into something worth keeping",
      },
      {
        property: "og:description",
        content:
          "An AI platform converting waste into craft. Built by a teenage maker to fight landfill waste with creativity.",
      },
    ],
  }),
  component: AboutPage,
});

function AboutPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <NavBar />

      <article className="mx-auto w-full max-w-3xl px-6 py-20 md:px-10 md:py-28">
        <p className="mb-6 inline-flex items-center gap-2 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
          <span className="h-px w-8 bg-[color:var(--sage)]" />
          Our story
        </p>

        <h1
          className="font-serif text-5xl leading-[1.05] tracking-tight md:text-6xl"
          style={{ color: "#1B261E" }}
        >
          Waste, <em className="italic text-[color:var(--sage)]">remade</em>{" "}
          into something worth keeping.
        </h1>

        <p className="mt-10 font-serif text-2xl leading-relaxed text-foreground/80 md:text-3xl">
          EcoLife is an AI platform that turns the things you were about to
          throw away into small, beautiful, useful projects you'll actually
          finish.
        </p>

        <Section title="What it is">
          <p>
            Point your camera at a cardboard box, a glass jar, a tangle of old
            charging cables. EcoLife's computer-vision model identifies the
            material, its rough dimensions, and the parts still worth saving —
            then writes you a step-by-step craft recipe tuned to a hobby you
            actually care about. Gaming setups. Sketchbooks. Window-sill
            gardens. Tiny weird sculptures.
          </p>
          <p>
            No moralising, no green guilt. Just a quiet little tool that
            translates "trash" into "materials," and materials into something
            you'll keep.
          </p>
        </Section>

        <Section title="Who built it">
          <p>
            EcoLife is the work of a teenage developer and maker — somebody who
            grew up watching their kitchen bin fill up faster than anything
            they could ever build, and who got curious about whether the same
            AI that writes essays could, instead, help them build a shelf out
            of a shoebox.
          </p>
          <p>
            It's a one-person project, made between school terms, hot-glue
            sessions, and a lot of late-night prompting. Every recipe, every
            illustration, every gentle nudge in the app has been hand-tuned.
          </p>
        </Section>

        <Section title="Why it exists">
          <p>
            Roughly two billion tonnes of municipal waste end up in landfill
            every year. That number is too large to feel anything about, and
            that's exactly the problem — eco-anxiety paralyses, it doesn't
            create.
          </p>
          <p>
            EcoLife exists to turn that anxiety into play. Not because one
            cardboard lamp will save the planet, but because the habit of
            looking at waste and seeing material is the habit a whole
            generation of makers is going to need. We'd rather give you a
            craft knife than a guilt trip.
          </p>
        </Section>

        <div className="mt-20 flex flex-col items-start gap-6 border-t border-border pt-12 md:flex-row md:items-center md:justify-between">
          <p className="max-w-md font-serif text-xl leading-snug text-foreground/80">
            Ready to look at your bin differently?
          </p>
          <Button
            asChild
            size="lg"
            className="h-12 rounded-full bg-[color:var(--clay)] px-7 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
          >
            <Link to="/" hash="scan">
              Start scanning
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </div>
      </article>
    </div>
  );
}

function Section({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="mt-16">
      <h2
        className="font-serif text-3xl tracking-tight md:text-4xl"
        style={{ color: "#1B261E" }}
      >
        {title}
      </h2>
      <div className="mt-6 space-y-5 text-base font-light leading-[1.85] text-foreground/75 md:text-lg">
        {children}
      </div>
    </section>
  );
}
