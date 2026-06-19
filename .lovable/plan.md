# EcoLife Landing Page

## Note on logo
I don't see `logo.png` attached to this message — the upload didn't come through. Please re-attach it in your next reply (drag into chat or use the + button). If you'd rather I proceed now, I'll use a temporary placeholder mark (a small sage-green leaf SVG) in the same top-left slot and swap it for your file once it arrives.

## Design system (added to `src/styles.css`)
- `--background`: #F7F5F0 (warm sand/cream)
- `--foreground` / `--primary`: #1E2F23 (deep forest green)
- `--cta` / `--accent-clay`: #C06C54 (terracotta)
- `--sage`: #8FA89B (muted sage)
- `--border`: #E5E3D8 (sage silver)
- Fonts loaded via `<link>` in `src/routes/__root.tsx`: **Playfair Display** (headlines) + **Inter** (body). Registered as `--font-serif` and `--font-sans` under `@theme`.
- Soft elegant shadow token (very subtle, no gradients).

## Page structure (`src/routes/index.tsx`)
Single landing route. Sections top-to-bottom:

1. **Top bar (minimal, not a nav)** — left-aligned: `<img>` logo (h-8, w-auto, natural scale) + wordmark "EcoLife" in Playfair, deep forest green. Padding only, no links.
2. **Hero**
   - Left column: serif headline ("Turn today's trash into tomorrow's project."), short sub-paragraph in Inter, primary CTA button in terracotta with bold white text ("Start Scanning").
   - Right column: smartphone mockup (CSS-drawn rounded rectangle device frame with screen showing a stylized "AI scanning a box" — bounding-box overlay + scan line, on a warm soft-focus background block using cream/sage tones, no gradients, just layered solid + blurred shapes for soft-focus feel).
3. **Interactive controls strip** (just below hero):
   - Custom dropdown "Select Your Hobby" → Gaming / Art / Gardening (shadcn `Select`, restyled to fit tokens).
   - Toggle switch "Safety Mode (Under 14)" using shadcn `Switch`; checked state background = muted sage `#8FA89B`.
   - Local `useState` for both — no backend.
4. **Features** — section heading in serif, then 3 minimalist cards in a responsive grid: "1. Scan Waste", "2. Filter Tools", "3. Get AI Recipe". Each card: cream background, 1px sage-silver border, generous padding, subtle shadow, small sage numeral, serif title, Inter description.
5. **Contact form** — serif heading + short sub-line. Inputs: Name, Email, Message. Underline-only inputs (border-b in deep forest green, transparent bg, focus turns sage). Terracotta submit button. Client-side only; on submit show a sonner toast "Thanks — we'll be in touch." (No backend wiring.)

## Technical details
- Files touched:
  - `src/styles.css` — add color + font tokens, keep shadcn `@theme inline` mapping intact.
  - `src/routes/__root.tsx` — add Google Fonts `<link>` tags (preconnect + Playfair + Inter); update default `<title>`/meta to EcoLife.
  - `src/routes/index.tsx` — full rewrite removing placeholder; build all sections above.
  - Small components co-located in `src/components/landing/` (Hero, PhoneMock, HobbyControls, FeatureCard, ContactForm) to keep `index.tsx` readable.
  - Logo: once provided, save to `src/assets/logo.png` then externalize via lovable-assets and import the `.asset.json`.
- Uses existing shadcn `Select`, `Switch`, `Button`, `Input`, `Textarea`, `Label`, `Sonner`.
- No new npm packages. No backend / Lovable Cloud (form is local-only; say the word if you want submissions stored).
- SEO: route `head()` sets title "EcoLife — Turn waste into DIY projects", matching description, og + twitter tags.

## Out of scope (ask if you want these next)
- Full nav bar with links.
- Real form submission / email delivery (needs Lovable Cloud + a sending integration).
- Real AI scanning behavior — the phone mockup is illustrative only.
