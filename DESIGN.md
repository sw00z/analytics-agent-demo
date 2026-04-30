---
name: Analytics Agent
description: Editorial-paper skin around a natural-language BI agent over Brazilian e-commerce data.
colors:
  warm-ash-cream: "oklch(0.97 0.005 75)"
  warm-ash-cream-2: "oklch(0.94 0.005 75)"
  editors-ink: "oklch(0.22 0.005 75)"
  editors-ink-2: "oklch(0.42 0.005 75)"
  margin-pencil: "oklch(0.58 0.005 75)"
  hairline-rule: "oklch(0.22 0.005 75 / 0.16)"
  hairline-rule-strong: "oklch(0.22 0.005 75 / 0.36)"
  ink-blue-stamp: "oklch(0.42 0.1 250)"
  ink-blue-stamp-deep: "oklch(0.36 0.12 250)"
  ink-blue-stamp-soft: "oklch(0.42 0.1 250 / 0.12)"
  printers-mark-red: "oklch(0.5 0.18 28)"
  composing-stick: "oklch(0.32 0.02 75)"
  letterpress-sienna: "oklch(0.55 0.13 35)"
  folio-ochre: "oklch(0.62 0.12 75)"
  compositor-teal: "oklch(0.5 0.08 200)"
typography:
  display:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "clamp(2.375rem, 4vw, 2.625rem)"
    fontWeight: 500
    lineHeight: 1.1
    letterSpacing: "-0.01em"
  headline:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "1.4375rem"
    fontWeight: 400
    lineHeight: 1.2
  title:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "1.25rem"
    fontWeight: 400
    lineHeight: 1.2
  body:
    fontFamily: "Iowan Old Style, Palatino Linotype, Palatino, Georgia, serif"
    fontSize: "1.0625rem"
    fontWeight: 400
    lineHeight: 1.62
    fontFeature: '"kern", "liga", "calt"'
  label:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.6875rem"
    fontWeight: 500
    lineHeight: 1
    letterSpacing: "0.14em"
  mono-data:
    fontFamily: "IBM Plex Mono, ui-monospace, monospace"
    fontSize: "0.78125rem"
    fontWeight: 400
    lineHeight: 1.65
rounded:
  sm: "0.3rem"
  md: "0.4rem"
  lg: "0.5rem"
  xl: "0.7rem"
  full: "9999px"
components:
  button-ask-pill:
    backgroundColor: "{colors.ink-blue-stamp-soft}"
    textColor: "{colors.ink-blue-stamp-deep}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    typography: "{typography.label}"
  button-ask-pill-hover:
    backgroundColor: "{colors.ink-blue-stamp}"
    textColor: "{colors.warm-ash-cream}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    typography: "{typography.label}"
  button-stop-pill:
    backgroundColor: "oklch(0.5 0.18 28 / 0.05)"
    textColor: "{colors.printers-mark-red}"
    rounded: "{rounded.full}"
    padding: "6px 14px"
    typography: "{typography.label}"
  button-primary:
    backgroundColor: "{colors.ink-blue-stamp}"
    textColor: "{colors.warm-ash-cream}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-outline:
    backgroundColor: "transparent"
    textColor: "{colors.editors-ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  button-ghost:
    backgroundColor: "transparent"
    textColor: "{colors.editors-ink}"
    rounded: "{rounded.lg}"
    padding: "0 10px"
    height: "32px"
  input-default:
    backgroundColor: "transparent"
    textColor: "{colors.editors-ink}"
    rounded: "{rounded.lg}"
    padding: "4px 10px"
    height: "32px"
  card-default:
    backgroundColor: "{colors.warm-ash-cream}"
    textColor: "{colors.editors-ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  dialog-content:
    backgroundColor: "{colors.warm-ash-cream}"
    textColor: "{colors.editors-ink}"
    rounded: "{rounded.xl}"
    padding: "16px"
  composer-shell:
    backgroundColor: "transparent"
    textColor: "{colors.editors-ink}"
    rounded: "{rounded.sm}"
    padding: "10px 4px"
  sql-block-pre:
    backgroundColor: "{colors.warm-ash-cream-2}"
    textColor: "{colors.editors-ink}"
    rounded: "{rounded.md}"
    padding: "12px 14px"
    typography: "{typography.mono-data}"
---

# Design System: Analytics Agent

## 1. Overview

**Creative North Star: "The Editorial Paper"**

The Analytics Agent presents a natural-language BI agent as if it were a printed essay rather than a console. The surface is a single warm cream paper, the body type is a serif at full reading size (Iowan Old Style 17px / 1.62 leading), and every editorial unit — question, answer, error, figure, follow-up — opens with a mono small-caps kicker the way a journal opens a section. The chrome around the page (masthead, sessions dropdown, composer underline) is intentionally quiet; the rendered answer is the artifact, and quiet chrome is what lets the answer own the eye.

The design rejects the visual register of conventional AI tools. There is no dark mode, no neon accent, no gradient text, no glass card, no decorative blur, no hero-metric grid, no icon-heading-text bento template. The single ink-blue accent (`oklch(0.42 0.1 250)`) earns its place by appearing on no more than 10% of any given screen — buttons, the masthead mark, the `Q.` kicker, the focus ring, and series 1 of the chart palette. Everything else is ink, paper, and the hairline rules that separate them.

The type carries the brand. Italic emphasis is the deliberate device for warmth and pull — never bold color, never a heavier weight as the primary signal. Failure states are written in the same italic register as success: a "Note." or "Stopped." kicker, a hairline-bordered block, the same paper. The system reports state. It does not perform feelings.

**Key Characteristics:**
- Single warm cream theme. No dark counterpart, no high-contrast variant.
- Iowan Old Style serif body at 17px / 1.62 / 60ch — the reading column is the contract.
- One ink-blue accent at ≤10% surface coverage. No second accent, no tertiary.
- Five-step chart palette, all at lightness ≤0.55 to clear contrast on cream.
- Flat by default. Depth comes from hairline rules and tonal layering between cream and `surface-2`, never decorative shadow.
- Mono kicker pattern (`Q.` / `Answer.` / `Note.` / `Working.` / `Stopped.` / `Figure ·` / `Try`) opens every editorial unit.
- No third type family. No exclamation points. No emoji. No anthropomorphism in microcopy.

## 2. Colors

A printer's palette: warm cream paper, warm near-black ink, a single ink-blue accent stamp, and a four-color chart set borrowed from press inks. Every neutral is tinted toward hue 75 (chroma 0.005) so the surface leans amber rather than reading as cold paper.

### Primary
- **Ink-Blue Stamp** (`oklch(0.42 0.1 250)`): The single accent. Used on the Ask pill background-fill on hover, the masthead mark (a 9px square inscribed near the wordmark), the user-bubble's left rule, the `Q.` kicker, the focus ring, the SQL block summary trigger, the active session rule, and series 1 of the chart palette. ≤10% surface coverage at all times.
- **Ink-Blue Stamp Deep** (`oklch(0.36 0.12 250)`): A deeper variant for italic emphasis on prose, hover states on accent links, and the `Q.` kicker. Used wherever the base accent needs to read more confidently against cream without flooding.
- **Ink-Blue Stamp Soft** (`oklch(0.42 0.1 250 / 0.12)`): The base accent at 12% alpha. Backs the resting Ask pill, the focus-within ring around the composer, the bar-chart cursor fill, and the accent-tinted utility surfaces. Never used on a card.

### Secondary
- **Printer's Mark Red** (`oklch(0.5 0.18 28)`): The destructive register. Used only on the `Note.` kicker for agent errors and rate limits, the rate-limit countdown banner above the composer, and the Stop button's border + text. Never used as a card background or surface fill — destructive is a single token on a single token's worth of surface.

### Tertiary (Chart Palette)
The five-step palette beneath series 1. All sit at lightness ≤0.55 to clear 3:1 contrast against cream paper without resorting to a rainbow. Hue separation does the differentiation work, not saturation lifts.
- **Composing Stick** (`oklch(0.32 0.02 75)`): Series 2. Warm near-black at desaturated chroma — reads as the ink the press laid down before the colored runs.
- **Letterpress Sienna** (`oklch(0.55 0.13 35)`): Series 3. A muted red-orange in the register of an iron-oxide press ink.
- **Folio Ochre** (`oklch(0.62 0.12 75)`): Series 4. The same hue family as the cream surface, lifted into a saturated mid-tone so it reads as a deeper page on the same paper. Also the source hue for the user-bubble's `oklch(0.62 0.12 75 / 0.09)` background wash.
- **Compositor Teal** (`oklch(0.5 0.08 200)`): Series 5. A muted slate-teal — the cool counterweight to sienna and ochre.

### Neutral
- **Warm Ash Cream** (`oklch(0.97 0.005 75)`): The surface. Used on the page body, all card and popover backgrounds, the masthead, the composer base. The fixed radial wash at the top of the page (`radial-gradient(1100px 520px at 50% -8%, oklch(0.99 0.008 75), transparent 65%)`) lifts this surface a half-step without leaving the cream register.
- **Warm Ash Cream 2** (`oklch(0.94 0.005 75)`): The figure-inset surface. Used for the SQL block `<pre>` body, the table sticky `<thead>`, hover row fills on tables and dropdowns, the muted/secondary tints, and the in-line copy-popup chrome. The contract is "one shade darker on the same paper" — never a separate grey.
- **Editor's Ink** (`oklch(0.22 0.005 75)`): The body type colour. Warm near-black at the same hue 75 as the surface — never `#000`.
- **Editor's Ink 2** (`oklch(0.42 0.005 75)`): The secondary type colour. Carries the user-bubble body, the italic blockquote, the error prose, the follow-up chips, and the message-actions row.
- **Margin Pencil** (`oklch(0.58 0.005 75)`): The captioning ink. Mono kickers, axis labels, table header cells, ellipsis controls, "Other" pie slice, captions, the keyboard-hint footer, the inactive state on follow-ups and message actions.
- **Hairline Rule** (`oklch(0.22 0.005 75 / 0.16)`): The default 1px border. Lives on every figure boundary, the masthead bottom, the composer top, the sample-query rows, the message-actions top, the SQL block top, the table cell separators (at `/0.6` for inner rows), the follow-up chip underlines.
- **Hairline Rule Strong** (`oklch(0.22 0.005 75 / 0.36)`): The reserved heavier rule for inputs that need to read at distance (the textarea's `border-input`). Rare.

### Named Rules
**The One Voice Rule.** The accent is the only voice. Ink-Blue Stamp and its two variants are the only saturated colours allowed on chrome — buttons, kickers, focus rings, links, the masthead mark, series 1. Tertiary chart colours are only allowed inside the `<figure>` boundary. Total accent coverage stays ≤10% of any visible surface.

**The Cream Rule.** No `#fff`, no `#000`, no purely chromatic neutrals. Every neutral is tinted toward warm hue 75 at chroma 0.005 — the surface leans amber so the page reads as paper, not cold tile.

**The Destructive-Is-A-Note Rule.** Printer's Mark Red appears as ink, never as a surface fill. The "Note." kicker is red. The Stop button has a red border and red text on a 5%-alpha red wash. The rate-limit countdown is red prose. There is no destructive card, no red banner, no flooded warning surface.

## 3. Typography

**Display Font:** Iowan Old Style (with Palatino Linotype, Palatino, Georgia, serif fallback)
**Body Font:** Iowan Old Style (same stack — the body type is the brand)
**Label / Mono Font:** IBM Plex Mono (with `ui-monospace, monospace` fallback)

**Character:** A book serif with classical proportions paired against a humanist mono. The serif at full reading size (17px / 1.62 leading) carries the editorial register; the mono carries the structural labels — kickers, axes, code, table headers, keyboard hints — and never the body. Italic emphasis is used pervasively as the deliberate emphasis register: never bold colour, never a heavier weight as the primary signal.

### Hierarchy
- **Display** (medium 500, `clamp(2.375rem, 4vw, 2.625rem)`, line-height 1.1, letter-spacing -0.01em): Empty-state hero only. "Hi, what would you like to know?" Capped at 18ch so the line breaks before it overruns the reading column.
- **Headline** (regular 400, 1.4375rem / 23px, line-height 1.2): Markdown `<h1>` inside an answer. Reserved for the rare answer that benefits from a section break.
- **Title** (regular 400, 1.25rem / 20px, line-height 1.2): Markdown `<h2>`. The `<h3>` variant drops to 1.125rem / 18px, regular weight; `<h4>` matches body size at semibold weight. Dialog titles use this role at semibold.
- **Body** (regular 400, 1.0625rem / 17px, line-height 1.62): The reading column. Capped at `60ch` for prose, `60rem` for the composer rail, `56ch` for the user-bubble quotation block. Italic is the deliberate emphasis variant — used in user prose at 18px, captions at 13.5px, error prose at 15px, follow-up chips at 14px, message-actions row at 13.5px. The italic variant uses the same family/weight/lh as upright body; it differs only by `font-style: italic`.
- **Label** (medium 500, 0.6875rem / 11px, line-height 1, letter-spacing 0.14em): The mono kicker. Used for `Q.`, `Answer.`, `Note.`, `Working.`, `Stopped.` and the masthead `DEMO ·` tagline. A tighter variant (10.5px / 0.10em uppercase) carries the chart figure kicker (`FIGURE · BAR CHART`), the table `<thead>` cells, the Ask/Stop button text, the keyboard-hint footer, the follow-up `Try` kicker, and the sample-query tag column. A tightest variant (9.5px) carries the Recharts axis ticks. All variants use the same family.
- **Mono Data** (regular 400, 0.78125rem / 12.5px, line-height 1.65): The figure-inset code register. Used for the SQL block body, inline `<code>`, fenced `<pre>`, and the numeric column cells of result tables (with `font-feature-settings: "tnum"` for tabular alignment).

### Named Rules
**The Single-Family Rule.** Iowan Old Style and IBM Plex Mono are the only families. There is no third family, no display-only face, no decorative script. Adding a sans-serif body would dissolve the editorial register; the body type is the brand.

**The Italic-Emphasis Rule.** Italic is the canonical emphasis device. It carries weight contrast wherever the upright register would feel flat — user prose, captions, error notes, follow-ups, the message-actions row. Bold and colour are reserved for primary action and the accent system; never use `<strong>` or accent colour as a substitute for italic emphasis on prose.

**The Kicker Rule.** Every editorial unit opens with a mono small-caps kicker. `Q.` opens a question, `Answer.` an answer, `Note.` an error, `Working.` a placeholder, `Stopped.` an aborted run, `Figure ·` a chart, `Try` a follow-up strip. Kickers are 11px label / 0.14em tracking with a one-period terminator — they read like printer's notations, not button labels.

**The 60ch Rule.** Body prose never exceeds 60 characters per line, regardless of viewport width. Figures (charts, tables) may exceed the prose column — this is the only contract that breaks reading-column constraint, and only inside the `<figure>` boundary.

## 4. Elevation

The system is flat by default. Cards, buttons, inputs, and message bubbles carry no `box-shadow` at rest. Depth is conveyed entirely by hairline rules (1px borders at `hairline-rule` alpha) and tonal layering between `warm-ash-cream` (the page) and `warm-ash-cream-2` (figure-inset surfaces — SQL block, table thead, hover states). Where a conventional UI would float a card with a soft drop shadow, this system pairs a hairline top + bottom with a `surface-2` fill.

Shadows appear in exactly three places: dropdown popups, dialogs, and chart tooltips. They are reserved for *transient* surfaces that need to read off the page when they appear and disappear when they don't.

### Shadow Vocabulary
- **Popup Elevation** (`box-shadow: 0 8px 24px -4px var(--shadow-ink)`, where `--shadow-ink` is `oklch(0.22 0.005 75 / 0.18)`): The Sessions dropdown body, custom popovers, the Recharts tooltip. Soft, ink-tinted, no spread — falls 8px below the surface and feathers out within 24px.
- **Dropdown Default** (Tailwind `shadow-md`): The Base UI Menu popup body. Pairs with `ring-1 ring-foreground/10` to read as a soft floating block over cream.
- **Dropdown Submenu** (Tailwind `shadow-lg`): The submenu popup body. One step heavier than its parent so the nesting reads at a glance.

### Named Rules
**The Flat-By-Default Rule.** Resting surfaces are flat. Cards, buttons, inputs, message bubbles, the masthead, the composer — none carry a shadow at rest. If a surface needs depth, it gets a hairline rule and a tonal step on the same paper, not a drop shadow.

**The Popup-Only Shadow Rule.** Shadows are reserved for transient floating surfaces — dropdown popups, dialogs, chart tooltips. A persistent shadow on a card is always wrong in this system; the appearance of a shadow is the reader's signal that the surface is temporarily lifted off the page.

**The Hairline Rule.** A 1px border at `hairline-rule` alpha (`oklch(0.22 0.005 75 / 0.16)`) does the work that elevation usually does. Hairline above and below a figure, hairline beneath the masthead, hairline atop the composer, hairline between sample-query rows, hairline top + bottom on the error block. The system reads as paper because the divisions are inked, not lifted.

## 5. Components

### Masthead
- **Shape:** Full-width header at 70px tall with a hairline bottom rule. Padding `px-6 sm:px-14`.
- **Layout:** Left cluster — a 9px ink-blue square mark (`rounded-[1px]`, vertical-translate -1px), the wordmark "Analytics Agent" in serif 17px / semibold / `tracking-[0.01em]`, and the small-caps tagline `DEMO · BRAZILIAN E-COMMERCE` (mono 11px / 0.10em / `margin-pencil`) separated by a 1px hairline left border. Right cluster — the Sessions dropdown trigger and the Source GitHub link.
- **The mark.** A single 9px square in `ink-blue-stamp`, vertically centred against the wordmark baseline. This is the only logotype the system uses.

### Reading Column
- **Prose:** `max-w-[60ch]` — 60 characters per line for body type. The chat scroll host pads `px-6 sm:px-14` and centres the column inside `mx-auto w-full max-w-[60rem]`.
- **Composer:** `max-w-[60rem]` — wider than prose so the composer reads as a full-width affordance, not a sentence.
- **User quotation:** `max-w-[56ch]` — slightly tighter than prose, so the question reads as an inset.

### Question (User Bubble)
A *quotation block*, not a chat bubble. Italic serif body at 18px on a hairline-cornered ochre wash, with an accent left rule and a mono `Q.` kicker.
- **Shape:** `border-l-2 border-accent`, asymmetric `rounded-r-[4px]` (sharp left edge for the rule), `pl-4 pr-3.5 py-[9px]`.
- **Background:** `oklch(0.62 0.12 75 / 0.09)` — folio-ochre at 9% alpha. Warm enough to read as paper, distinct enough to read as quoted material.
- **Kicker:** `Q.` in label-tight (mono 11px / 0.14em / `ink-blue-stamp-deep`).
- **Body:** italic serif 18px / 1.5 leading / `editors-ink-2` / max 56ch.
- **Retry affordance:** When this bubble is the latest message and a Stop or error followed, a small italic serif "Retry" link appears beneath, aligned to the body baseline, with a hairline accent underline.

### Answer (Assistant Turn)
The assistant turn is *not a card*. No background, no border, no container — just prose and the mono `Answer.` kicker that opens it.
- **Kicker:** `Answer.` in label (mono 11px / 0.14em / `margin-pencil`). Switches to `Working.` while the placeholder spinner shows.
- **Body:** Markdown delegated to AssistantMarkdown — body 17px / 1.62 / max 60ch. Headings (H1-H4) inherit the headline / title hierarchy. Inline `<code>` rounds to `rounded-sm` on `surface-2` at mono 12.5px.
- **Figure (chart):** `<figure>` with hairline top + bottom rules (`border-y border-rule py-4.5`), mono `FIGURE · [TYPE]` kicker (label-tight uppercase), Recharts body, italic serif `<figcaption>` 13.5px / `margin-pencil` / max 50ch describing row count in the chart-type's vocabulary ("6,943 points.", "8 segments, sized by share.", "Showing 20 rows.").
- **SQL block:** Collapsible `<details>` with hairline top, mono summary trigger ("The query, in N lines") in label-tight uppercase / `ink-blue-stamp-deep`, and an italic serif "show / hide" affordance on the right. Body is `<pre>` on `surface-2` with a hairline border, mono-data 12.5px / 1.65.
- **Action row:** italic serif row beneath the answer with a hairline top. "Was this useful?" prompt in `margin-pencil`, then `Helpful` · `Not helpful` · `Copy` — each italic 13.5px with a hairline underline that thickens to accent on hover. Submitted state turns `ink-blue-stamp-deep` and the underline stays sticky.

### Error (Note Block)
The "printer's note" pattern. Hairline top + bottom (`border-y border-rule py-3.5`), no left rule, no flooded fill.
- **Kicker:** `Note.` for agent errors and rate limits in label / `printers-mark-red`. `Stopped.` for user-initiated aborts in label / `margin-pencil`.
- **Body:** italic serif 15px / 1.55 / `editors-ink-2` / max 60ch.
- **Try-again affordance:** italic serif 14px / `ink-blue-stamp-deep` with an accent hairline underline that thickens on hover. Rate-limit errors omit this — the countdown banner above the composer is the affordance for that path.

### Composer
A bare, hairline-bordered rectangle with an italic serif placeholder and a mono small-caps Ask pill.
- **Shape:** `border border-rule rounded-sm px-1 py-2.5`. Focus-within transitions the border to `accent` and adds a 2px `accent/10` ring.
- **Textarea:** Borderless, transparent background, italic serif 17px / 1.5 / `editors-ink`, italic placeholder in `margin-pencil`. Auto-grows to 160px before scrolling internally. Submits on Enter; Shift+Enter for newline.
- **Ask pill:** `rounded-full` with `border border-accent`, `bg-accent-soft`, `text-accent-strong`, mono 11px / 500 / 0.14em / uppercase, `px-3.5 py-1.5`. Hover swaps to `bg-accent` / `text-accent-foreground` (cream on ink-blue). The pill is the editorial signature submit affordance — no rectangle, no shadow, no descent.
- **Stop pill:** Mirrors the Ask pill geometry exactly. Border becomes `border-destructive/30`, fill becomes `destructive/5`, text becomes `destructive`. The slot does not shift between Ask and Stop — the pill changes register, not size.
- **Footer hint:** Centred mono 10px / 0.10em / uppercase / `margin-pencil` — `ENTER TO ASK · SHIFT+ENTER FOR NEWLINE · READ-ONLY VIA GPT-4O`.
- **Rate-limit notice:** When the per-IP limiter trips, a small italic serif `<AlertCircle>` notice in `printers-mark-red` appears above the chip strip with a live countdown.

### Sample Queries (Empty-State Starter List)
A numbered hairline-divided list, *not* a card grid. Replaces the "icon-heading-text bento" template the system explicitly rejects.
- **Shape:** `<ol>` with a hairline top rule. Each `<li>` is a three-column grid (`grid-cols-[50px_1fr_auto]`) with a hairline bottom rule and `px-1 py-3.5` rhythm.
- **Number column:** mono 11px / 0.06em / `margin-pencil`, padded to three digits (`001`–`008`).
- **Label column:** serif 16px / `editors-ink`. Each label uses inline `<em>` to italicise the chart-shape word (`*trends*`, `*cumulative orders*`, `*categories*`); italic `<em>` resolves to `ink-blue-stamp-deep` so the keyword reads as a soft inline stamp.
- **Tag column:** mono 10.5px / 0.10em / uppercase / `margin-pencil`. Names the chart type the question will likely produce (`Line`, `Area`, `Bar`, `Ranked`, `Stacked`, `Pie`, `Scatter`, `Table`).
- **Hover:** entire row tints to `surface-2`. No border colour change.

### Follow-Up Chips
Despite the file name, these are not chips. They are italic serif inline links with hairline underlines, separated by a middle-dot, scrolled horizontally inside a soft mask.
- **Shape:** Single horizontal line. `<button>` per question wrapped inline. Mono `Try` kicker on the left in label-tight / 0.14em / uppercase / `margin-pencil`.
- **Type:** italic serif 14px / `editors-ink-2`, with a 1px `border-b border-rule` baseline that thickens to `border-accent` on hover and shifts colour to `ink-blue-stamp-deep`.
- **Separator:** middle-dot (`·`) in `margin-pencil` between siblings (no separator before the first item).
- **Edge mask:** A hand-rolled `mask-image` linear-gradient fades the left or right edge only when content overflows in that direction (so the strip never looks faded when there's nothing hidden).
- **Stagger:** each chip mounts with `animate-chip-in` (280ms / `ease-out-strong`) at a 50ms-per-item delay.

### Message Actions
A row of italic serif links beneath each assistant turn, opened by a hairline top rule and the prompt "Was this useful?" — same register as the body, never an icon-button cluster.
- **Type:** italic serif 13.5px on `editors-ink-2`, with a hairline `border-b border-rule` underline. Hover thickens the underline to `border-accent` and shifts colour to `ink-blue-stamp-deep`.
- **Submitted state:** stays sticky in `ink-blue-stamp-deep` with the accent underline.
- **Copy menu:** When the assistant turn carries SQL, the Copy link expands inline (not a popover) into a `surface-2`-tinted strip with three options — `Answer`, `SQL`, `Both`. Reveal animates via `clip-path: inset(0 100% 0 0 round 4px)` to `inset(0 0% 0 0 round 4px)` over 260ms / `ease-out-quint`. Outside-click and Escape dismiss.

### Sessions Dropdown
The single dropdown affordance in the system, used in the masthead to switch conversations.
- **Trigger:** italic serif 14px / `editors-ink-2` with a hairline underline that thickens to `accent` on hover or popup-open. Active session title replaces the literal "Recent" text and stays in `ink-blue-stamp-deep`.
- **Popup:** `rounded-md` on cream, `ring-1 ring-rule`, popup-elevation shadow. Width 300–360px.
- **New conversation row:** "+ New conversation" in italic serif 14px / `editors-ink-2`, hairline-bordered bottom, hover tints to `surface-2`.
- **Session row:** serif 14px title (truncated single line) over a mono 10.5px / 0.10em / uppercase / `margin-pencil` relative timestamp ("3m ago", "2d ago"). Active row gets a 1px accent left rule (a 1px absolutely-positioned line, *not* a `border-left` colour) and a `surface-2` fill; title shifts to `ink-blue-stamp-deep`.
- **Delete affordance:** trash icon in `margin-pencil`, opacity 0 until row hover or focus; hover lifts to `printers-mark-red`.

### Tables (Result Tables)
- **Shape:** outer hairline border, `rounded` (4px). Inner row separators at `hairline-rule/0.6` alpha. Max height `26.25rem` with the data scrolling under a sticky header.
- **Header cells:** mono 10.5px / 0.10em / uppercase / 500 / `margin-pencil` on a `surface-2` sticky `<thead>`. Numeric columns right-align; categorical columns left-align. Underscores in column names translate to spaces.
- **Data cells:** numeric — mono 13px / `tabular-nums` / right-aligned / `editors-ink`. Categorical — serif 13px / left-aligned / `editors-ink`.
- **Row hover:** `surface-2` fill across the row.
- **Truncation note:** when a result reaches 100 rows, an italic serif 12px caption appears at the foot in `margin-pencil` on `surface-2` ("Showing first 100 rows (capped by the agent's LIMIT guardrail).").

### Charts (Recharts)
The figure body. All five chart types share a single visual vocabulary so the editorial register holds across types.
- **Grid:** `strokeDasharray="3 3"`, stroke `var(--rule)`. Horizontal-only on bar; both axes on scatter; horizontal-only on line/area.
- **Ticks:** mono 9.5px / `margin-pencil` (label tightest variant).
- **Axis lines:** the X-axis baseline shows in `var(--rule)`; the Y-axis line is suppressed (`axisLine={false}`) so the chart reads as type-on-paper, not as a graph paper grid.
- **Tooltip:** cream background, hairline border, popup-elevation shadow, `rounded` (4px). Body in serif 12px; series label in mono 11px / 0.06em / `margin-pencil`.
- **Cursor:** dashed accent line on line and scatter charts; `accent-soft` fill on bars.
- **Series 1:** always `ink-blue-stamp` (`var(--chart-1)`). Line and area renderers use only series 1; bar / horizontal-bar / pie / stacked-bar walk the five-step palette.
- **Bar radius:** `[3,3,0,0]` for vertical bars (top corners), `[0,3,3,0]` for horizontal bars (right end). Stacked bars only round the *last* segment in the stack so the total reads as one rounded mass.
- **Pie:** donut at `innerRadius 56 / outerRadius 100`, with a 2px `var(--background)` stroke between slices to read as a paper gap. Slices past the 6th aggregate into a `margin-pencil`-coloured "Other" wedge so mid-cardinality data doesn't render as a 12-slice rainbow.
- **Scatter density:** dots shrink to 2px / 0.4 alpha above 200 points; below that, 3px / 0.55. Both densities use series 1 only.
- **Line density:** stroke shrinks from 2.25 to 1.5 above 24 points; dots disappear above 24 points and survive only as the active hover dot.

### Thinking Indicator
A Lucide `Feather` glyph that wobbles like a quill writing on a page — and never repeats.
- **Animation engine:** Web Animations API, not CSS `@keyframes`. Each cycle generates fresh keyframes inside an envelope tuned for handwriting at 18px scale (3–4 strokes of varying amplitude, a lift-and-hover phase whose peak position drifts, a soft settle to a fixed rest pose so consecutive cycles chain without a seam). Cycle length 1.0–1.85s.
- **Colour:** `ink-blue-stamp-deep` (`text-accent-strong`).
- **Pivot:** `transform-origin: 78% 92%` — the Lucide Feather glyph's writing tip — so the body wags from the page.
- **Reduced-motion:** explicitly bypasses the universal `prefers-reduced-motion` clamp because (per WCAG 2.3.3) loading indicators that communicate system state qualify as essential motion. The copy-popup-menu reveal carries the same exemption for the same reason.

### Scrollbar
The scrollbar is part of the accent system, not a chrome afterthought.
- **Native rails (everywhere except the chat scroll host):** 7px wide, `rounded-full`. Track is a 6%-alpha ink wash; thumb is `ink-blue-stamp` at 32% alpha rising to 55% on hover. Same hue as the masthead mark — the scrollbar feels native to the accent system, not a separate slate.
- **Floating overlay (chat scroll host only):** 11px-wide track inset 24px from top and bottom of the message panel, `rounded-full`, with a 9px capsule thumb inside. The chat scroll host opts out of native rails (`scrollbar-none`) and renders this overlay so the rail clears the masthead and composer chrome and reads as a floating gutter.

## 6. Do's and Don'ts

### Do:
- **Do** open every editorial unit with a mono small-caps kicker. `Q.` for a question, `Answer.` / `Working.` for an answer, `Note.` / `Stopped.` for a failure, `Figure ·` for a chart, `Try` for a follow-up strip. Kickers are 11px / 0.14em with a one-period terminator.
- **Do** cap body prose at 60 characters per line. Figures and tables may exceed the prose column inside their `<figure>` boundary, but only inside.
- **Do** use italic for emphasis. Italic carries the warmth-and-pull register; bold colour and heavier weight are reserved for primary action and the accent system.
- **Do** treat error states with the same care as success — italic serif on a hairline-bordered block, a printer's-note kicker, no flooded red surface, no exclamation point.
- **Do** keep accent coverage ≤10% of any visible surface. Accent goes on buttons, kickers, focus rings, the masthead mark, links, and series 1 of charts — never on a card background.
- **Do** stay flat by default. Use hairline rules and tonal layering between `warm-ash-cream` and `surface-2` to separate. Reserve shadow for dropdown popups, dialogs, and chart tooltips.
- **Do** tint every neutral toward warm hue 75 at chroma 0.005. The cream surface, the ink, the muted ink, the rules — all hue 75. The page reads as paper because the neutrals are warm.
- **Do** keep the chart palette deliberately muted. All five series sit at lightness ≤0.55 to clear contrast on cream; hue separation does the differentiation work, not saturation lifts.
- **Do** keep the type system to two families — Iowan Old Style and IBM Plex Mono. The body type is the brand.
- **Do** use the user-bubble's `border-l-2 border-accent` exception only in its full canonical form: paired with a `Q.` kicker, a folio-ochre 9% wash, asymmetric `rounded-r-[4px]`, italic serif 18px body. Never as a generic accent stripe elsewhere.

### Don't:
- **Don't** use `border-left` or `border-right` greater than 1px as a colored stripe accent on cards, list items, callouts, or alerts. The user-bubble is the *only* sanctioned exception in this system; replicating just the stripe without the kicker, ochre wash, asymmetric radius, and quotation typography is the AI-slop pattern this system explicitly forbids.
- **Don't** use `background-clip: text` with gradients. Single solid colour for type, always. (PRODUCT.md: *"every one of these screams 'generated.'"*)
- **Don't** use decorative glassmorphism, blurred backgrounds, or glass cards stacked over a colored backdrop. The dialog backdrop's `backdrop-blur-xs` is the single sanctioned exception, gated to modal context only. (PRODUCT.md anti-reference.)
- **Don't** add the hero-metric SaaS dashboard cliché — big number, tiny label, gradient accent, supporting stats grid. (PRODUCT.md anti-reference.)
- **Don't** render identical card grids with icon-heading-text. The numbered, hairline-divided `SampleQueries` list is the editorial replacement; the bento-of-equal-cards is forbidden. (PRODUCT.md anti-reference.)
- **Don't** introduce a third type family. No sans-serif body, no display-only face, no decorative script, no oversized initial caps, no ornamental quote marks. Iowan + IBM Plex Mono only. (PRODUCT.md anti-reference: *"Iowan Old Style is an editorial typeface, not a wedding invitation."*)
- **Don't** use exclamation points anywhere — error, empty, success, microcopy, kickers, button labels, captions. The system reports state. It does not perform feelings. (PRODUCT.md.)
- **Don't** use emoji or "chatty assistant" tone in error and empty states. No "Sorry!", no "I'm working on it!", no anthropomorphism. Errors read like a printer's note. (PRODUCT.md anti-reference.)
- **Don't** use bold colour or heavier weight as the primary emphasis device on prose. Italic carries weight contrast; `<strong>` and accent colour are reserved for action and structural signal.
- **Don't** flood the surface with destructive red. `printers-mark-red` is an ink, not a fill — it appears on the `Note.` kicker, the Stop button border + text, and the rate-limit countdown. There is no destructive card, no red banner, no red-flooded warning surface. (PRODUCT.md: *"no destructive red flooding the surface."*)
- **Don't** ship a dark theme. There is one theme — Editorial Paper. A dark counterpart would betray the editorial register; the cream surface is the brand. (globals.css: *"Single light theme — no dark counterpart."*)
- **Don't** use toy-box pastel rainbow palettes for charts. The 5-step palette stays at lightness ≤0.55 with deliberate hue separation. The `pie` chart's "Other" aggregator past slice 6 exists specifically to prevent a 12-slice rainbow on mid-cardinality data. (PRODUCT.md anti-reference.)
- **Don't** stack nested cards. Nested cards are always wrong. The chat surface uses `<figure>` with hairline rules and `surface-2` insets where a conventional UI would nest cards.
- **Don't** add Layout, Motion, or Responsive sections to this spec. The six sections (Overview, Colors, Typography, Elevation, Components, Do's and Don'ts) are the system. Layout content folds into Overview and Components; motion content lives in `DESIGN.json`.
