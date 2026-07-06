import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { ArrowRight } from "lucide-react";
import { toast } from "sonner";
import { NavBar } from "@/components/NavBar";
import { Button } from "@/components/ui/button";
import { Toaster } from "@/components/ui/sonner";
import { useAuth } from "@/hooks/useAuth";
import { getAgeInYears } from "@/lib/safety-tier";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Sign in or join — EcoLife" },
      { name: "description", content: "Sign in or create your EcoLife account to start scanning waste into DIY projects." },
    ],
  }),
  component: AuthPage,
});

type Mode = "signin" | "signup";

function AuthPage() {
  const [mode, setMode] = useState<Mode>("signin");
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [dob, setDob] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, isAuthenticated } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (isAuthenticated) navigate({ to: "/scanner" });
  }, [isAuthenticated, navigate]);

  const declaredAge = (() => {
    if (mode !== "signup" || !dob) return null;
    const d = new Date(dob);
    if (Number.isNaN(d.getTime())) return null;
    return getAgeInYears(d);
  })();
  const showUnder13Notice = declaredAge !== null && declaredAge < 13 && declaredAge >= 4;

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const data = new FormData(form);
    const name = ((data.get("name") as string) ?? "").trim();
    const email = ((data.get("email") as string) ?? "").trim();
    const password = ((data.get("password") as string) ?? "");
    const dobValue = ((data.get("date_of_birth") as string) ?? "").trim();
    const next: Record<string, string> = {};

    if (mode === "signup" && !name) next.name = "Name cannot be empty.";
    if (!/^\S+@\S+\.\S+$/.test(email)) next.email = "Please enter a valid email.";
    if (password.length < 6) next.password = "Password must be at least 6 characters.";

    if (mode === "signup") {
      if (!dobValue) {
        next.date_of_birth = "Date of birth is required.";
      } else {
        const d = new Date(dobValue);
        const now = new Date();
        if (Number.isNaN(d.getTime()) || d > now) {
          next.date_of_birth = "Please enter a real past date.";
        } else if (d.getFullYear() < 1900) {
          next.date_of_birth = "Please enter a valid year.";
        } else {
          const age = getAgeInYears(d, now);
          if (age < 4) next.date_of_birth = "You must be at least 4 years old.";
          if (age > 120) next.date_of_birth = "Please enter a real date of birth.";
        }
      }
    }

    setErrors(next);
    if (Object.keys(next).length > 0) return;

    setSubmitting(true);
    const result = mode === "signup"
      ? await signUp(name, email, password, dobValue)
      : await signIn(email, password);
    setSubmitting(false);

    if (!result.ok) {
      toast.error(result.error ?? "Something went wrong.");
      return;
    }
    toast.success(mode === "signup" ? "Welcome to EcoLife." : "Welcome back.");
    navigate({ to: "/scanner" });
  }

  const todayIso = new Date().toISOString().slice(0, 10);

  return (
    <div className="min-h-screen bg-background font-sans text-foreground antialiased">
      <NavBar />
      <section className="mx-auto flex w-full max-w-md flex-col px-6 py-16 md:py-24">
        <div className="text-center">
          <p className="mb-5 text-xs uppercase tracking-[0.22em] text-[color:var(--sage)]">
            {mode === "signup" ? "Join EcoLife" : "Welcome back"}
          </p>
          <h1 className="font-serif text-4xl leading-tight text-foreground md:text-5xl">
            {mode === "signup" ? "Start remaking." : "Sign in to your workshop."}
          </h1>
        </div>

        <div className="mt-10 inline-flex self-center rounded-full border border-border bg-card p-1 text-xs font-medium uppercase tracking-wider">
          <button
            type="button"
            onClick={() => { setMode("signin"); setErrors({}); }}
            className="rounded-full px-5 py-2 transition-colors"
            style={mode === "signin"
              ? { backgroundColor: "#1B261E", color: "#F7F5F0" }
              : { color: "#1B261E" }}
          >
            Sign in
          </button>
          <button
            type="button"
            onClick={() => { setMode("signup"); setErrors({}); }}
            className="rounded-full px-5 py-2 transition-colors"
            style={mode === "signup"
              ? { backgroundColor: "#1B261E", color: "#F7F5F0" }
              : { color: "#1B261E" }}
          >
            Sign up
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-12 space-y-8">
          {mode === "signup" && (
            <Field label="Name" name="name" type="text" autoComplete="name" error={errors.name} />
          )}
          <Field label="Email" name="email" type="email" autoComplete="email" placeholder="you@earth.io" error={errors.email} />
          <Field label="Password" name="password" type="password" autoComplete={mode === "signup" ? "new-password" : "current-password"} error={errors.password} />

          {mode === "signup" && (
            <div>
              <label htmlFor="date_of_birth" className="block text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55">
                Date of Birth — used only to set your safety preferences
              </label>
              <input
                id="date_of_birth"
                name="date_of_birth"
                type="date"
                value={dob}
                max={todayIso}
                onChange={(e) => setDob(e.target.value)}
                className="mt-2 w-full border-0 border-b border-foreground bg-transparent px-0 py-3 font-serif text-lg text-foreground focus:border-[color:var(--sage)] focus:outline-none focus:ring-0"
              />
              <p className="mt-2 text-xs text-foreground/50">
                We store your date of birth securely. It is never shared and is deleted when you close your account.
              </p>
              {errors.date_of_birth && (
                <p className="mt-1.5 text-sm" style={{ color: "#BF5E49" }}>{errors.date_of_birth}</p>
              )}
              {showUnder13Notice && (
                <p className="mt-3 rounded-md border border-[color:var(--sage)]/40 bg-[color:var(--sage)]/10 px-3 py-2 text-sm text-foreground/80">
                  This app is designed for users 13 and older. You can still use it, but some features will be limited.
                </p>
              )}
            </div>
          )}

          {mode === "signup" && (
            <p className="text-center text-xs text-foreground/60">
              By signing up, you confirm that your date of birth is accurate. We use it only to personalize safety settings.
            </p>
          )}

          <div className="pt-2">
            <Button
              type="submit"
              size="lg"
              disabled={submitting}
              className="h-12 w-full rounded-full bg-[color:var(--clay)] px-7 text-sm font-bold uppercase tracking-wider text-[color:var(--clay-foreground)] shadow-[var(--shadow-elegant)] hover:bg-[color:var(--clay)]/90"
            >
              {submitting ? "Please wait…" : mode === "signup" ? "Create account" : "Sign in"}
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>

          <p className="text-center text-sm text-foreground/60">
            {mode === "signup" ? "Already a member?" : "New to EcoLife?"}{" "}
            <button
              type="button"
              onClick={() => { setMode(mode === "signup" ? "signin" : "signup"); setErrors({}); }}
              className="font-medium underline-offset-4 hover:underline"
              style={{ color: "#BF5E49" }}
            >
              {mode === "signup" ? "Sign in" : "Create one"}
            </button>
          </p>

          <p className="text-center text-xs text-foreground/50">
            <Link to="/" className="underline-offset-4 hover:underline">Back to home</Link>
          </p>
        </form>
      </section>
      <Toaster />
    </div>
  );
}

function Field({
  label, name, type, placeholder, error, autoComplete,
}: { label: string; name: string; type: string; placeholder?: string; error?: string; autoComplete?: string }) {
  return (
    <div>
      <label htmlFor={name} className="block text-[11px] font-medium uppercase tracking-[0.18em] text-foreground/55">
        {label}
      </label>
      <input
        id={name}
        name={name}
        type={type}
        placeholder={placeholder}
        autoComplete={autoComplete}
        className="mt-2 w-full border-0 border-b border-foreground bg-transparent px-0 py-3 font-serif text-lg text-foreground placeholder:text-foreground/30 focus:border-[color:var(--sage)] focus:outline-none focus:ring-0"
      />
      {error && (
        <p className="mt-1.5 text-sm" style={{ color: "#BF5E49" }}>{error}</p>
      )}
    </div>
  );
}
