---
name: AI Learning Community
description: Rapor & Register — komunitas belajar AI/ML sebagai rapor digital yang hidup; kertas HVS dingin, tinta pulpen biru-hitam, tinta aksi indigo terkunci.
colors:
  paper: "#edf0f2"
  sheet: "#fcfcfd"
  sheet-raised: "#ffffff"
  sheet-hover: "#f1f4f6"
  line: "#d6dade"
  ink: "#232946"
  ink-muted: "#575d7a"
  ink-subtle: "#6f7590"
  indigo: "#4f46e5"
  indigo-hover: "#3f38c9"
  indigo-soft: "#e9eafb"
  indigo-ring: "rgb(79 70 229 / 0.32)"
  stamp-green: "#1f7a4d"
  stamp-green-soft: "#e2f2e8"
  stamp-amber: "#976a00"
  stamp-amber-soft: "#f6efd9"
  stamp-red: "#b3372e"
  stamp-red-soft: "#f8e7e4"
  code-well: "#14172b"
  code-ink: "#dfe3f5"
typography:
  display:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "3rem"
    fontWeight: 800
    lineHeight: 1.04
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.875rem"
    fontWeight: 800
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 800
    lineHeight: 1.33
    letterSpacing: "-0.025em"
  body:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.9375rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Archivo, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 700
    lineHeight: 1.33
    letterSpacing: "0.06em"
  entry:
    fontFamily: "Spline Sans Mono, ui-monospace, monospace"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
rounded:
  badge: "3px"
  input: "4px"
  button: "5px"
  card: "6px"
  max: "8px"
spacing:
  xs: "4px"
  sm: "8px"
  md: "16px"
  card: "20px"
  card-lg: "24px"
  panel: "32px"
  section: "56px"
components:
  button-primary:
    backgroundColor: "{colors.indigo}"
    textColor: "#ffffff"
    typography: "600 0.875rem/1.4 Archivo, sans-serif"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  button-primary-hover:
    backgroundColor: "{colors.indigo-hover}"
  button-primary-dark:
    backgroundColor: "#4f46e5"
    textColor: "#ffffff"
    typography: "600 0.875rem/1.4 Archivo, sans-serif"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  button-secondary:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "600 0.875rem/1.4 Archivo, sans-serif"
    rounded: "{rounded.button}"
    padding: "10px 16px"
  input:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    typography: "400 0.875rem/1.4 Archivo, sans-serif"
    rounded: "{rounded.input}"
    padding: "10px 14px"
  card:
    backgroundColor: "{colors.sheet}"
    textColor: "{colors.ink}"
    rounded: "{rounded.card}"
  badge-level:
    backgroundColor: "{colors.stamp-green-soft}"
    textColor: "{colors.stamp-green}"
    typography: "700 10.5px/1.1 Archivo, sans-serif"
    rounded: "{rounded.badge}"
    padding: "2px 6px"
  pill-active:
    backgroundColor: "{colors.indigo}"
    textColor: "#ffffff"
    typography: "500 0.875rem/1.4 Archivo, sans-serif"
    rounded: "{rounded.input}"
    padding: "6px 16px"
---

# Design System: AI Learning Community

## Overview

**Creative North Star: "Rapor & Register" — the living report card**

The platform is a school document that never stops being filled in. Every screen is a sheet on a clerk's desk: cold HVS paper under blue-black ballpoint ink, opened by a double-rule letterhead (kop), advanced by ledger tables and ruled lines, and verdicted by rubber stamps. Progress is not decorated — it is *recorded*: numbers in tabular figures, dates in register format, state carried by stamp ink. The direction contract (seed 94273073, rendered as an HTML comment in `src/app/layout.tsx`) states the thesis verbatim: "setiap progres tercatat tinta, distempel, dipamerkan" — and rejects the gradient hero and the emoji-card SaaS look.

Light mode is the original document: cool gray-blue paper (`#edf0f2`) with blue-black ink (`#232946`). Dark mode is **"salinan karbon"** — a blue carbon copy, not a dimmed gray. It is an equal citizen (a locked brand commitment): same layout, same components, same grain, same stamps; surfaces shift to the desaturated indigo-carbon family and the ink becomes light. The one asymmetry is deliberate: filled actions keep solid `#4f46e5` in dark mode so white button text holds ≥ 4.5:1 contrast, while the dark accent ink `#8f97fa` serves text and icons only.

Brand indigo `#4f46e5` is locked by PRODUCT.md and treated as the action ink everywhere. All copy is Indonesian. Icons are drawn SVG strokes (1.75px, round caps), never glyphs or emoji on rebuilt surfaces.

**Key Characteristics:**
- Document chrome, not app chrome: kop double rules, uppercase tracked eyebrows, 2px ink frames around form sheets.
- Flat solid ink throughout — no gradient text, no gradient fills, no glass.
- Stamp language: badges and stamps carry state as colored outlines/soft grounds (green / amber / red / indigo), slightly rotated when decorative.
- Ledger tables with ruled-line rhythm and tabular figures for every machine number.
- Drawn 1.75-stroke SVG icon set; monospace reserved for register entries (emails, code, IDs).
- Dark mode as blue carbon copy with equal treatment; action fills stay solid `#4f46e5`.
- Ambient paper grain over the whole page (5% light / 7% dark), plus browser-surface theming (selection, caret, scrollbar).

## Colors

A clerk's palette: one authoritative blue-black ink for reading, one locked indigo ink for action, three rubber-stamp inks for verdicts, all on cool gray-blue paper. Semantic tokens live as CSS custom properties in `:root` / `.dark` (`src/app/globals.css`) with parallel `-rgb` triplets wired into Tailwind (`rgb(var(--x-rgb) / <alpha-value>)`), so opacity modifiers work on every token.

### Primary
- **Tinta Aksi / Indigo** (`#4f46e5`): the only action color. Filled buttons and active pills, links and inline accents, progress fills, focus rings (`rgb(79 70 229 / 0.32)`), the 4px header ribbon, and the "AIC" seal. Hover deepens to `#3f38c9`. `indigo-soft` (`#e9eafb`) is its tint ground: blockquotes, badge grounds, the "you are here" leaderboard row.
- **Dark accent ink** (`#8f97fa`, hover `#aab1fa`-family `#aab1fc`, soft `#262a55`, ring at 0.4): the carbon-copy version used for *text, links, icons and outlines only* in dark mode — never as a button fill (see the Carbon Copy Rule).

### Secondary
Stamp inks — used as text color over their soft ground, or as `border-current` stamp outlines. Only danger earns a filled button.
- **Tinta Stempel Hijau** (`#1f7a4d`, soft `#e2f2e8`): "Pemula" level, success toasts, streak badge, 100% states. Dark: `#66c795` on `#1b3226`.
- **Tinta Stempel Kuning** (`#976a00`, soft `#f6efd9`): "Menengah" level, warnings, the streak flame icon. Dark: `#d9ab46` on `#332a12`.
- **Tinta Stempel Merah** (`#b3372e`, soft `#f8e7e4`): "Lanjutan" level, the GRATIS stamp, destructive buttons, error banners (`border-danger/40` + soft ground). Dark: `#e57063` on `#3d1e1a`.

### Tertiary
- **Kode Karbon** (well `#14172b`, ink `#dfe3f5`): code and pre blocks — the only dark-on-light inversion the world allows. Dark mode deepens the well to `#0e1120`; the ink is unchanged.

### Neutral
- **Kertas HVS** (`#edf0f2`): page background — the desk under the sheets.
- **Lembar** (`#fcfcfd`): cards, header, alternating section ground — the paper itself.
- **Lembar Terang** (`#ffffff`): raised menus only.
- **Lembar Sentuh** (`#f1f4f6`): hover wells, skeleton fills, empty-state icon well, input-label boxes.
- **Garis** (`#d6dade`): all 1px rules, table borders, input strokes.
- **Tinta Pulpen** (`#232946`): body text *and* the heavy 2–3px document rules; ink and border share one source.
- **Tinta Pudar** (`#575d7a`): paragraphs, labels, secondary text.
- **Tinta Samar** (`#6f7590`): captions, eyebrows, placeholder-grade asides.

### Dark Mode — Salinan Karbon (full token table)
Equal treatment, hue-shifted to blue carbon — never a gray dim of light mode. `color-scheme: dark` is set; the paper grain rises from 0.05 to 0.07 opacity.

| Token | Light | Dark |
|---|---|---|
| paper | `#edf0f2` | `#121523` |
| sheet | `#fcfcfd` | `#1a1e31` |
| sheet-raised | `#ffffff` | `#20253c` |
| sheet-hover | `#f1f4f6` | `#232944` |
| line | `#d6dade` | `#2f3554` |
| ink | `#232946` | `#e7e9f6` |
| ink-muted | `#575d7a` | `#a9aecb` |
| ink-subtle | `#6f7590` | `#8f94b3` |
| indigo | `#4f46e5` | `#8f97fa` (text/outline only) |
| indigo-hover | `#3f38c9` | `#aab1fc` |
| indigo-soft | `#e9eafb` | `#262a55` |
| indigo-ring | `rgb(79 70 229 / 0.32)` | `rgb(143 151 250 / 0.4)` |
| stamp-green / soft | `#1f7a4d` / `#e2f2e8` | `#66c795` / `#1b3226` |
| stamp-amber / soft | `#976a00` / `#f6efd9` | `#d9ab46` / `#332a12` |
| stamp-red / soft | `#b3372e` / `#f8e7e4` | `#e57063` / `#3d1e1a` |
| code-well / ink | `#14172b` / `#dfe3f5` | `#0e1120` / `#dfe3f5` |
| **filled actions** | `#4f46e5` → hover `#3f38c9` | **pinned `#4f46e5`** → hover `#5b52ee` |

### Named Rules
**The Locked Ink Rule.** Indigo `#4f46e5` is the brand and the only action color; it may be tuned around, never replaced. In dark mode it stays as the literal fill of every primary button and active pill; `#8f97fa` is its carbon-copy ghost for accents, not a substitute ink.

**The Carbon Copy Rule.** Dark mode is a duplicate of the document, not a theme variant to be designed separately. Both modes carry the same grain, ribbon, kop rules, stamps and layout; only the ink chemistry changes. A screen is not done until it reads correctly on both papers.

**The Stamp-Ground Rule.** Stamp inks (green/amber/red) appear as text over their `-soft` ground or as `border-current` outlines. They never become large fills — the one exception is the destructive button, which fills with red.

**The Grain Rule.** The fixed paper-grain overlay (`body::after`, 160px fractal noise, opacity 0.05 light / 0.07 dark, `z-index` 70, pointer-events none) is part of the paper. Selection is indigo with white text, the caret is indigo, and scrollbars are `line`-colored (`scrollbar-color: var(--border) transparent`; `.thin-scroll` narrows to 6px). Rebuilding a surface without these is off-world.

## Typography

**Display Font:** Archivo (400–800, via `next/font` as `--font-sans`; fallbacks system-ui, Segoe UI, Roboto)
**Body Font:** Archivo
**Label/Mono Font:** Spline Sans Mono (400–600, as `--font-mono`; fallbacks ui-monospace, SF Mono, Cascadia Code, Consolas)

**Character:** Archivo reads like a well-printed government form — even, slightly squarish, confident at extrabold. Spline Sans Mono is the clerk's hand for machine data: emails, code, register IDs. The pairing is "official document, filled in by hand".

### Hierarchy
- **Display** (800, text-4xl → sm:text-5xl / 2.25–3rem, line-height 1.04, tracking -0.025em): the hero command ("Isi rapormu."), optionally split with an indigo continuation clause.
- **Headline** (800, text-3xl / 1.875rem, tracking -0.025em): page h1, always preceded by an eyebrow under a kop rule.
- **Title** (800, text-2xl → sm:text-3xl / 1.5rem, tracking -0.025em): section h2 on landing and long pages.
- **Title-minor** (700, base): card titles, table lead-ins (`uppercase tracking 0.09em` when the card has a kop head).
- **Body** (400–500, text-sm–base; intro paragraphs text-lg with line-height 2; lesson prose 15px / line-height 1.87 via `.prose-lesson` in ink-muted).
- **Label** (700, text-xs / 0.75rem, uppercase, tracking 0.06em, ink-muted): form labels (`.label`), always above the field.
- **Eyebrow** (700, 11px, uppercase, tracking 0.09–0.14em, ink-subtle or ink-muted): the document header line ("Kartu Akses · AI Learning Community", "Formulir Pendaftaran · No. 0001").
- **Entry** (Spline Sans Mono, 400–600, text-xs–sm): emails, code, IDs — machine data in the clerk's hand.

### Named Rules
**The Kop Rule.** Every document — page, form sheet, panel, dropdown — opens with an uppercase tracked eyebrow line, then the title, then the kop double rule beneath. No heading floats without its letterhead.

**The Register Hand Rule.** All figures (scores, counts, dates, percentages, point totals) are set in tabular numerals (`font-variant-numeric: tabular-nums`, the `.tabular` utility); emails and code are set in Spline Sans Mono. Numbers are data entries, never display type — except the deliberately oversized leaderboard ranks (text-4xl/2xl extrabold).

## Layout

One container, banded sections, sheet-based composition. `.container-app` = `max-w-6xl` (72rem), centered, `px-4` / `sm:px-6`. The header is 64px tall (`h-16`) plus a 4px indigo ribbon on top; the footer closes the document with a 2px ink rule (`border-t-2 border-content`).

- **Section rhythm:** full-bleed sections separated by 1px rules (`border-b border-border`), each `py-14` (56px) on desktop (`py-10` hero). Grounds alternate — paper, sheet, paper, sheet — like stacked forms in a register.
- **The sheet:** the hero and key panels are one bounded sheet — `rounded-[6px] border border-border bg-surface shadow-lg`, header block, kop rule, content band, and a foot separated by `border-t-2 border-content` where the primary action ("signature") sits.
- **Forms:** single column, `max-w-md`, `p-8`, `space-y-4`; label above input.
- **Density:** ledger rows are airy — `td px-4 py-3`, list rows `py-3.5`; cards pad `p-5`/`p-6`, panels `p-8`.
- **Grids:** two-column register cards at `lg:grid-cols-2`; dashboard 2:1 at `lg:grid-cols-3`; leaderboard teaser `sm:grid-cols-3`.
- **Breakpoints:** Tailwind defaults — sm 640, md 768, lg 1024, xl 1280. Nav collapses below md into a drawer; table columns shed progressively (`hidden sm:table-cell`, `md:`, `lg:`) instead of restyling.

## Elevation & Depth

**The Paper Rule.** Depth is drawn, not lit. Hierarchy comes from 1px rules, 2px ink frames, tonal paper steps (paper → sheet → raised) and the kop double rule. Shadows exist but are whisper-level, tinted slate-ink (`rgb(15 23 42 / …)`), and never the primary depth cue — a document lies on a desk, it does not float.

### Shadow Vocabulary
- **sheet-rest** (`0 1px 2px 0 rgb(15 23 42 / 0.04)`, `shadow-xs`): every card at rest.
- **sheet-lift** (`0 1px 3px 0 rgb(15 23 42 / 0.06), 0 1px 2px -1px rgb(15 23 42 / 0.06)`, `shadow-sm`; step `shadow-md` = `0 4px 12px -2px … 0.08`): hover only, paired with a 2px rise.
- **the-open-sheet** (`0 12px 32px -8px rgb(15 23 42 / 0.14)`, `shadow-lg`): the hero rapor sheet and nothing else.
- **menu** (`0 24px 56px -12px rgb(15 23 42 / 0.2)`, `shadow-xl`): dropdowns/popovers.
- **action-glow** (`0 6px 16px -6px var(--brand-ring)`): primary button hover only.
- **kop-rule** (`0 6px 0 -5px var(--content)`): not elevation — the thin half of the letterhead double rule.

### Named Rules
**The Flat Ink Rule.** Surfaces are flat at rest with `shadow-xs` at most. Shadows answer state (hover, focus, menus) or mark the single hero sheet; a screen with multiple `shadow-lg` sheets is off-world.

## Shapes

Near-square, print-shop corners. The Tailwind radius scale is tightened in `tailwind.config.ts` (`lg` 5px, `xl` 6px, `2xl` 8px) and the component classes sit below it: badges 3px, inputs/stamps/pills 4px, buttons 5px, cards 6px. Anything rounder than 8px breaks the form language.

- **Border weight is meaning:** 1px `line` for ordinary structure; 2px `content` ink for emphasis (footer, registration box, stamp borders, sheet foot); dashed 1px for the empty-state icon well only.
- **The kop** is the signature geometry: a 3px solid ink rule with a 1px ink rule 6px below it (`.kop` — `border-bottom: 3px solid var(--content)` + `box-shadow: 0 6px 0 -5px var(--content)`).
- **Ruled paper:** `.ruled` lays 2rem repeating ledger lines (`repeating-linear-gradient`, transparent → `line`) behind register rows.
- **Circles are rationed:** avatars, the progress ring, and path-line stations (12–14px, 2px indigo border, sheet fill) — nothing else.
- **Stamps sit crooked:** decorative stamps carry `-rotate-2`; the seal rotates `-3deg` on hover. Everything else stays square.

## Components

The vocabulary is small and deliberately repetitive — every surface is the same stationery. Motion belongs to the pieces: **stamp-in** (`.stamp` appears with `animation: stamp-in 0.45s cubic-bezier(0.16, 1, 0.3, 1) both` — drops from `scale(1.6) rotate(-10deg)` through `scale(0.96) rotate(-2deg)` at 60% to rest `rotate(-2deg)`), the scroll-drawn ink line, incumbent **Reveal** (IntersectionObserver fade + 16px rise, 500ms ease-out, once, disabled under reduced motion), and micro-timings (`fade-in` 200ms, `slide-up` 250ms, `pop-in` 150ms, `toast-in` 200ms, `shimmer` 1.6s linear infinite, theme cross-fade 250ms on body). `prefers-reduced-motion` zeroes every duration globally and hands the ink line fully drawn.

### Buttons
- **Shape:** near-square (5px), `px-4 py-2.5`, text-sm semibold, tracking 0.01em.
- **Primary:** solid indigo fill, white text; hover `#3f38c9` + action-glow shadow; `active:translate-y-px` (the pen press). **In dark mode the fill pins to `#4f46e5`** (hover `#5b52ee`) — the accent `#8f97fa` never fills buttons.
- **Secondary:** 1px line border on sheet; hover fills `sheet-hover`.
- **Ghost:** muted ink, transparent; hover sheet-hover well.
- **Danger:** red fill, white text; hover dims via `brightness(0.92)`.
- **Focus:** always a 2px indigo ring offset by the paper color (`ring-brand-ring`, offset `bg`) — never a color-only cue.

### Pills (filter tabs)
- **Style:** rounded 4px, `px-4 py-1.5`, text-sm medium. Idle: line border on sheet, muted ink. Active: solid indigo, white text — pinned `#4f46e5` in dark mode like primary buttons.

### Badges (small stamps) & Stamps
- **Badge** (`.badge`): 3px radius, 1px `border-current`, 10.5px bold uppercase, tracking 0.08em, `px-1.5 py-0.5`. Colored by context: level chips use `LEVEL_BADGE` mapping (pemula green, menengah amber, lanjutan red on their soft grounds), roles/roles-and-states use indigo or muted.
- **Stamp** (`.stamp`): the decorative rubber stamp — 2px `border-current`, 4px radius, text-sm extrabold uppercase tracking 0.14em, `-rotate-2`, red or green ink, enters with `stamp-in`. Used sparingly: GRATIS on the hero and register form.
- **State:** badges are verdicts, not decoration — if it has no state to record, it is not a badge.

### Cards / Containers
- **Corner Style:** 6px.
- **Background:** sheet, 1px line border, `shadow-xs` at rest.
- **Hover:** `.card-hover` — rise 2px, border turns indigo, `shadow-md`; 200ms.
- **Internal Padding:** `p-5`–`p-6`; panels `p-8`. Cards that lead a document open with a kop head.
- **Skeleton:** `.skeleton` — 4px radius, sheet-hover→raised shimmer sweep (200% background, 1.6s).

### Ledger Tables (`.table-ledger`)
- **Style:** full-width, text-sm. Headers: 11px bold uppercase tracking 0.09em, muted ink, 1px underline. Cells: `px-4 py-3`, 1px row rules, last row unruled.
- **Behavior:** rows tint `sheet-hover` on hover; numeric columns right-aligned and tabular; the "you" row tints `indigo-soft/40`. Paired with `.ruled` backing or the 2rem line rhythm for register lists.

### Inputs / Fields
- **Style:** full-width, sheet ground, 1px line stroke, 4px radius, `px-3.5 py-2.5`, text-sm; placeholder in ink-subtle.
- **Label:** `.label` above every field — xs bold uppercase tracking 0.06em.
- **Focus:** border turns indigo + 2px indigo ring; the caret is already indigo browser-wide.
- **Error:** banner below the header — `border-danger/40` on `danger-soft`, text-sm content ink.

### Navigation
- **Ribbon:** a 4px indigo band across the very top — "tinta indigo membuka setiap dokumen".
- **Seal:** 36px indigo square (6px radius), white "AIC" extrabold, inset white ring; wordmark uppercase extrabold tracking 0.09em beside it.
- **Links:** text-sm medium, muted at rest; active state is an ink-underline — a 2.5px indigo bar pinned to the baseline of the item (not a background).
- **User menu:** raised sheet, `shadow-xl`, opens with `pop-in`; its head is a kop block holding name, mono email, and role badge.

### Icon Language
All icons are hand-drawn inline SVGs on a 24 viewBox: `fill="none"`, `stroke="currentColor"`, `strokeWidth 1.75` (2 for interactive controls), round caps and joins. The set (shield, bookmark, play, grid, user, logout, arrow-up, heart, flame, flask) is drawn once per feature, colored by `currentColor` like ink from the same pen. No icon fonts, no third-party glyph packs.

### Signature: the Ink Line (`.InkLine` pattern)
A single continuous indigo stroke (SVG path, 2.5px, round cap) that draws itself down the Jalur Belajar section as the visitor scrolls — `stroke-dasharray`/`stroke-dashoffset` driven by scroll progress through rAF, with 14px hollow station dots (2px indigo border) at each path card. Reduced-motion users receive the line fully drawn. This is the world's storytelling device: "satu garis tinta dari pemula sampai mahir".

## Do's and Don'ts

### Do:
- **Do** open every page, form, panel and menu with the kop double rule and an uppercase tracked eyebrow (11px, tracking 0.09–0.14em).
- **Do** set all figures in tabular numerals (`.tabular`) and machine data (email, code, IDs) in Spline Sans Mono.
- **Do** record state with badges/stamps: `LEVEL_BADGE` grounds (green/amber/red), indigo for identity, `border-current` outlines, `stamp-in` when a stamp appears.
- **Do** keep the primary action as a solid `#4f46e5` fill — and pin that fill in dark mode for contrast.
- **Do** draw new icons as 1.75-stroke inline SVGs with round caps, colored via `currentColor`.
- **Do** verify both papers: a surface ships only when light and dark ("salinan karbon") both read correctly, grain included.
- **Do** keep all copy in Bahasa Indonesia.

### Don't:
- **Don't** use gradient text or gradient fills — the world is solid ink. (The legacy `.text-gradient` shim now resolves to flat `var(--brand)`; do not add new uses.)
- **Don't** use emoji as icons on rebuilt surfaces; the drawn stroke set replaces them. (Dead `emoji` fields survive in `src/lib/data/learning-paths.ts` and `src/lib/store/gamification.ts` for inherited surfaces only — do not render them, do not copy the pattern.)
- **Don't** round past 8px or build pill-shaped cards; corners are print-shop square.
- **Don't** light depth with large or colored shadows; borders, tonal paper and the kop rule carry hierarchy.
- **Don't** introduce a second accent hue; success/warning/danger are stamp inks for verdicts, not decoration, and only danger may fill a button.
- **Don't** dim dark mode toward gray or design it as an afterthought — it is an equal carbon copy under the Carbon Copy Rule.
- **Don't** replace the locked indigo `#4f46e5` or let the dark accent `#8f97fa` fill buttons.

### Known gaps (recorded, not canonized)
- **Tabular figures are partially inert as shipped.** The markup convention writes `num-tabular` (34 uses across 8 files), but the only defined utility is `.tabular { font-variant-numeric: tabular-nums; }` — so the register-number intent of the world currently renders without tabular metrics on those surfaces. New work should use a class that actually resolves; the rule above remains the system's intent.
- Legacy animation vocabulary in `tailwind.config.ts` (`float`, `gradient-x`, `confetti-fall`, `pulse-glow`) and the filled eye/eye-off icons on the login form predate this world and survive on inherited surfaces; they are not part of the system and must not seed new screens.
