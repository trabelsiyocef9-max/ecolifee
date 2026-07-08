import { createFileRoute } from "@tanstack/react-router";
import { NavBar } from "@/components/NavBar";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    meta: [
      { title: "Privacy Policy — EcoLife" },
      { name: "description", content: "How EcoLife collects, uses, and protects your data." },
      { property: "og:title", content: "Privacy Policy — EcoLife" },
      { property: "og:description", content: "How EcoLife collects, uses, and protects your data." },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <NavBar />
      <section className="mx-auto w-full max-w-3xl px-6 py-16 md:px-10 md:py-24">
        <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">Legal</p>
        <h1 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">Privacy Policy</h1>
        <p className="mt-3 text-sm font-light text-foreground/60">Last updated: July 8, 2026</p>

        <div className="mt-10 space-y-10 text-base font-light leading-relaxed text-foreground/80">
          <Section title="1. What We Collect">
            <ul className="ml-5 list-disc space-y-2">
              <li>Name and email address (required for account creation)</li>
              <li>Date of birth (required — used only to calculate your safety tier for tool recommendations)</li>
              <li>Hobby selections and tool inventory (stored to personalize your experience)</li>
              <li>Waste item photos (uploaded for recipe generation — see below)</li>
            </ul>
          </Section>

          <Section title="2. What We Do NOT Store">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                Waste item photos are sent to Google Gemini for analysis and are never saved to our database.
                They are discarded immediately after the recipe is generated.
              </li>
              <li>We do not store facial images or any biometric data.</li>
              <li>We do not sell, share, or monetize any personal data.</li>
            </ul>
          </Section>

          <Section title="3. How We Use Your Data">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                Date of birth is used solely to calculate which safety tier applies to your account. It is
                stored encrypted and never exposed in the app interface.
              </li>
              <li>Your hobbies and tools are used to personalize AI-generated recipes.</li>
              <li>Your email is used only for account authentication.</li>
            </ul>
          </Section>

          <Section title="4. Third-Party Services">
            <p>The following third-party services process your data as part of EcoLife's operation:</p>
            <ul className="ml-5 list-disc space-y-2">
              <li>
                Google Gemini API: receives your uploaded waste item photo and recipe prompt. Subject to
                Google's privacy policy.
              </li>
              <li>
                Supabase: stores your account data (name, email, date of birth, hobbies, tools). Subject to
                Supabase's privacy policy.
              </li>
            </ul>
          </Section>

          <Section title="5. Your Rights">
            <ul className="ml-5 list-disc space-y-2">
              <li>
                You may request deletion of your account and all associated data at any time from your
                profile settings.
              </li>
              <li>You may update your name, hobbies, and tool inventory at any time.</li>
              <li>You may contact us to request a copy of your stored data.</li>
            </ul>
          </Section>

          <Section title="6. Children's Privacy">
            <p>
              EcoLife is intended for users aged 13 and older. Users under 13 may use the app with parental
              consent and will have limited tool recommendations. We do not knowingly collect data from
              children under 4 years of age.
            </p>
          </Section>
        </div>
      </section>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <h2 className="font-serif text-2xl text-foreground">{title}</h2>
      <div className="mt-3 space-y-3">{children}</div>
    </div>
  );
}
