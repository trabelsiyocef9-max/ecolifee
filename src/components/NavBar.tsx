import { useEffect, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Menu, X } from "lucide-react";

const LANGUAGES = [
  { value: "English", label: "English" },
  { value: "Arabic", label: "العربية" },
  { value: "French", label: "Français" },
];

function LanguageSelect({ className = "" }: { className?: string }) {
  const [lang, setLang] = useState("English");
  useEffect(() => {
    const stored = typeof window !== "undefined" ? localStorage.getItem("preferredLanguage") : null;
    if (stored) setLang(stored);
  }, []);
  function onChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const v = e.target.value;
    setLang(v);
    localStorage.setItem("preferredLanguage", v);
  }
  return (
    <select
      aria-label="Language"
      value={lang}
      onChange={onChange}
      className={`rounded-full border border-foreground/20 bg-transparent px-3 py-1.5 text-xs font-medium tracking-wide text-foreground/80 focus:outline-none ${className}`}
    >
      {LANGUAGES.map((l) => (
        <option key={l.value} value={l.value}>{l.label}</option>
      ))}
    </select>
  );
}
import logoAsset from "@/assets/logo.png.asset.json";
import { useAuth } from "@/hooks/useAuth";

type NavLink = { label: string; to: string };

export function NavBar() {
  const [open, setOpen] = useState(false);
  const { isAuthenticated, signOut } = useAuth();
  const navigate = useNavigate();

  const links: NavLink[] = isAuthenticated
    ? [
        { label: "Home", to: "/" },
        { label: "About", to: "/about" },
        { label: "Workspace", to: "/scanner" },
      ]
    : [
        { label: "Home", to: "/" },
        { label: "About", to: "/about" },
      ];

  async function handleSignOut() {
    await signOut();
    setOpen(false);
    navigate({ to: "/" });
  }

  return (
    <header
      className="sticky top-0 z-50 w-full border-b border-border/40 backdrop-blur-md"
      style={{ backgroundColor: "rgba(242, 239, 233, 0.8)" }}
    >
      <div className="mx-auto flex w-full max-w-7xl items-center justify-between px-6 py-4 md:px-10">
        <Link to="/" className="flex items-center gap-3">
          <img
            src={logoAsset.url}
            alt="EcoLife logo"
            className="h-12 w-auto object-contain md:h-14"
          />
          <span
            className="font-serif text-2xl tracking-tight md:text-3xl"
            style={{ color: "#1B261E" }}
          >
            EcoLife
          </span>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden items-center gap-10 md:flex">
          {links.map((l) => (
            <Link
              key={l.label}
              to={l.to}
              className="text-sm font-medium tracking-wide text-foreground/75 transition-colors hover:text-foreground"
              activeOptions={{ exact: true }}
              activeProps={{ className: "text-foreground" }}
            >
              {l.label}
            </Link>
          ))}
          <LanguageSelect />
          {isAuthenticated ? (
            <button
              type="button"
              onClick={handleSignOut}
              className="rounded-full border border-foreground/20 px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition-colors hover:bg-foreground hover:text-background"
            >
              Log out
            </button>
          ) : (
            <Link
              to="/auth"
              className="rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider shadow-[var(--shadow-elegant)] transition-colors"
              style={{ backgroundColor: "var(--clay)", color: "var(--clay-foreground)" }}
            >
              Login
            </Link>
          )}
        </nav>

        {/* Mobile toggle */}
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle navigation"
          aria-expanded={open}
          className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-border/60 text-foreground md:hidden"
        >
          {open ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
        </button>
      </div>

      {/* Mobile menu */}
      {open && (
        <nav
          className="border-t border-border/40 md:hidden"
          style={{ backgroundColor: "rgba(242, 239, 233, 0.95)" }}
        >
          <ul className="flex flex-col gap-1 px-6 py-4">
            {links.map((l) => (
              <li key={l.label}>
                <Link
                  to={l.to}
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 font-serif text-lg text-foreground/85 hover:bg-foreground/5"
                >
                  {l.label}
                </Link>
              </li>
            ))}
            <li>
              {isAuthenticated ? (
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="block w-full rounded-md px-2 py-3 text-left font-serif text-lg text-foreground/85 hover:bg-foreground/5"
                >
                  Log out
                </button>
              ) : (
                <Link
                  to="/auth"
                  onClick={() => setOpen(false)}
                  className="block rounded-md px-2 py-3 font-serif text-lg"
                  style={{ color: "var(--clay)" }}
                >
                  Login
                </Link>
              )}
            </li>
            <li className="px-2 py-3">
              <LanguageSelect className="w-full" />
            </li>
          </ul>
        </nav>
      )}
    </header>
  );
}
