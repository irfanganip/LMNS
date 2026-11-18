# LMNS Design System

Implementation-facing counterpart to `docs/DESIGN.md`. `DESIGN.md` sets the style family and personality; this document sets the values, roles, states, and bars that the web app is built and reviewed against.

**Audience:** the frontend engineer consuming `docs/tokens.css`, and the design-QA reviewer checking the built screens.
**Scope:** everything the 11 user stories in `docs/prototype-scope.md` §2 need. Nothing beyond them.
**Language:** documentation in English, user-facing strings in Bahasa Indonesia (D10).

---

## 1. Decision log

### DEC-01 — Colour authority: `tokens.css` is the implementation baseline; the DESIGN.md purple becomes a separate brand token

**Decision.** `docs/tokens.css` is authoritative for every value an engineer writes into CSS. `docs/DESIGN.md` governs style family (Material), typographic personality, motion feel, and anti-patterns. `--accent` stays `#1a73e8`. The DESIGN.md primary `#6442D6` is expressed as a **new, non-conflicting brand token family** (`--brand*`), never by editing `--accent`.

**Why not replace the accent with purple.**

1. `tokens.css` already *derives* `--accent-hover` and `--accent-active` from `--accent` with `color-mix(in oklab, …)`. Those stay correct automatically, but `--focus-ring` is a hard-coded `rgba(26, 115, 232, 0.24)` — a purple accent with a blue focus ring is a visible defect. Swapping the accent without touching the ring (which we may not rewrite) ships that defect.
2. The whole surface/text ramp in `tokens.css` (`--bg #f8fafd`, `--surface-warm #e8f0fe`, `--border #dadce0`) is a blue-family neutral. Purple-on-blue-neutral is exactly the "off-palette colour where an existing token solves the problem" anti-pattern in `DESIGN.md` §9.
3. Deciding the accent by committee after the token file is published costs a rewrite of every derivative. Deciding it once, now, in the file engineers consume, costs nothing.
4. Accessibility: measured, white-on-`#1a73e8` is **4.50:1** — at the AA floor with zero margin (§3.1). Purple measures 6.38:1, i.e. purple is the *safer* text colour but the *worse* fit for the existing derived set. We resolve this by keeping blue for fills and adding a darker blue `--accent-text` for text and links, which restores margin (§3.2). That is a cheaper, more honest fix than an accent swap.

**Where purple is allowed (complete list).** Only brand-identity moments, never a competing interaction accent:

| Allowed | Token | Example |
|---|---|---|
| LMNS wordmark / logo | `--brand` | "LMNS" in the header |
| **LMNS Well-Being Certified** badge | `--brand` on `--brand-tint` | badge on the mentor card and profile |
| Premium tier identity surfaces | `--brand-tint`, `--brand-soft` | premium checkout comparison header, premium upgrade panel |
| Decorative accents in empty states | `--brand-soft` at ≤ 24px stroke | illustration strokes only, never text |

Purple never paints a button, a link, an input, a focus ring, or a status. If a designer asks for a purple CTA, the answer is no: the CTA is `--accent`, and the purple belongs on the badge beside it.

**If the client later says the brand primary must be purple**, follow the swap procedure in §3.5 — one edit point, four steps, no component changes.

### DEC-02 — Type families: `tokens.css` (Google Sans / Roboto / Roboto Mono), not DESIGN.md's Inter / Fira Code

`DESIGN.md` §3 names Inter, Roboto, and Fira Code. `tokens.css` names Google Sans, Roboto, Roboto Mono. Material's own family is Google Sans + Roboto, which is the style family `DESIGN.md` declares in its first line; Inter is a DESIGN.md artefact that contradicts the family it sits under. Shipping Inter would also mean loading a third and fourth webfont for no product benefit. **Roboto set wins.** Fira Code is dropped; `--font-mono` resolves to Roboto Mono and is used only for IDs, SISTER/Scopus identifiers, and session links.

DESIGN.md's weight list (100–900) is not implemented: Google Sans ships 400/500/700 and Roboto effectively ships 400/500/700 in the subset we load. Weights are therefore tokenised as 400/500/700 only (§4.2).

### DEC-03 — The prototype ships **light-only**

`tokens.css` defines a single `:root` theme with no `[data-theme]` or `prefers-color-scheme` block. Inventing a dark theme for a demo would double every component state we have to specify and verify, against a prototype whose acceptance bar is 14 screens deep and whose demo audience sees one theme. **Light-only is the decision**, and it is enforced rather than implied:

- Exactly one theme. No `[data-theme="dark"]` selectors, no `prefers-color-scheme` overrides, no theme toggle in the persona switcher.
- `color-scheme: light` is set on `:root` (appended in `tokens.css`) so the browser renders form controls, scrollbars, and autofill in light styling under an OS dark preference. Without it, a user on dark-OS gets black native selects inside our white inputs — a contrast failure we would otherwise ship by accident.
- Reviewers reject any component that hard-codes a colour instead of reading a token; that habit is what makes a real dark theme cheap later, whereas hard-coded hex makes it expensive.

Dark mode is a post-prototype task. Recorded here so nobody re-litigates it mid-build.

---

## 2. Colour roles

Every role below is a token in `docs/tokens.css`. Text/fill pairs are measured; see §3.

### 2.1 Surfaces

| Token | Value | When to use | Never |
|---|---|---|---|
| `--bg` | `#f8fafd` | Page background of every screen; the area behind cards | Not for cards, inputs, or table rows |
| `--surface` | `#ffffff` | Cards, table rows, inputs, modals, sticky header, sheets | Not as the page canvas — `--surface` on `--surface` loses every edge |
| `--surface-warm` | `#e8f0fe` | Informational banner fill, selected-row tint, active tab tint, "info" callout | Never for success/warning/danger messaging |
| `--border` | `#dadce0` | Dividers between rows, card outlines (with `--elev-ring`), table grid | Not as the only boundary of a *focusable* control — see `--border-strong` |
| `--border-soft` | `#edf0f2` | Internal card separators, disabled control fill, skeleton base | Not for input borders |
| `--border-strong` **(new)** | `#868b90` | Input/select/textarea/checkbox borders, secondary-button outline | Not for dividers — it is too heavy at 100% width |

### 2.2 Text

| Token | Value | When to use | Never |
|---|---|---|---|
| `--fg` | `#202124` | Headings, mentor names, prices, primary body copy | Not for secondary metadata |
| `--fg-2` | `#3c4043` | Dense body copy in tables and cards, list item titles | Not for placeholder text |
| `--muted` | `#5f6368` | Helper text, timestamps, counts, placeholder, empty-state body, disabled label | Never for an error message (use `--danger-fg`) |
| `--meta` | `#1a73e8` | Metadata accents: filter chip counts, "3 ulasan" links, secondary inline links | Never as body copy |
| `--accent-text` **(new)** | `#1765cc` | Links, text buttons, active tab label, "lihat detail" — any **text** on `--bg` or `--surface` | Not for large fills — use `--accent` |

Rationale for the new text token is in §3.2: `--accent` measures 4.31:1 on `--bg`, which fails AA for text. `--accent` remains the fill colour; `--accent-text` is the text colour.

### 2.3 Accent (interaction)

| Token | Value | When to use |
|---|---|---|
| `--accent` | `#1a73e8` | Primary button fill, selected chip fill, checked radio/checkbox, progress bar, star fill (input state), focus ring base |
| `--accent-on` | `#ffffff` | Text and icons **on** `--accent` fills |
| `--accent-hover` | `color-mix(--accent, black 8%)` | Pointer hover on accent fills |
| `--accent-active` | `color-mix(--accent, black 14%)` | Pressed state on accent fills |
| `--accent-text` **(new)** | `#1765cc` | See §2.2 |

One accent, one meaning: **the thing to act on now**. There is no second interaction colour. Selected filters, current step, and the primary CTA on a screen may all be accent, but only one of them per viewport should be a filled accent button (§11, primary-action rule).

### 2.4 Status

Three roles, each with a fill for icon/dot/bar, a text-safe foreground, and a tint for banner backgrounds.

| Role | Fill token | Text token | Tint token | When to use |
|---|---|---|---|---|
| Success | `--success` `#188038` | `--success-fg` `#137333` (new) | `--success-tint` `#e6f4ea` (new) | Payment succeeded, application approved, badge issued, agreement fully confirmed |
| Warning | `--warn` `#f9ab00` | `--warn-fg` `#8a5a00` (new) | `--warn-tint` `#fef7e0` (new) | Pending review / SLA approaching, payment pending, one-sided confirmation (informational, not alarming), missing-but-fixable evidence |
| Danger | `--danger` `#d93025` | `--danger-fg` `#b3261e` (new) | `--danger-tint` `#fce8e6` (new) | Validation failure, payment failed, application rejected, destructive confirm |

Rules:

- `--warn` and `--danger` **fills never carry text**: `#f9ab00` is 1.96:1 on white. Fill for the dot/icon only; the label always uses the `-fg` token.
- Status is never colour-only. Every status surface pairs an icon and a word (§12).
- Mood and pulse data never receive warning/danger styling (**§13, hard rule**). Well-being answers are not an error state and not an alert.

### 2.5 Brand

| Token | Value | When to use |
|---|---|---|
| `--brand` | `#6442D6` | Wordmark, Well-Being Certified badge icon+label, premium section heading rule |
| `--brand-soft` | `#C8B3FD` | Decorative stroke/fill ≤ 24px, badge underline. **Never text** (1.9:1 on white) |
| `--brand-tint` | `#f1ecfd` | Badge fill, premium panel background, premium comparison header |
| `--brand-hover` / `--brand-active` | `color-mix(--brand, black 8% / 14%)` | Only if a brand surface is itself clickable (badge linking to the certification record) |

---

## 3. Contrast, measured

All ratios computed against `#ffffff` unless noted. Bar: **4.5:1** normal text, **3:1** large text (≥ 24px, or ≥ 18.66px at 700) and **3:1** for UI component boundaries and focus indicators (WCAG 2.1 §1.4.3, §1.4.11). We do not rely on the large-text exemption anywhere; everything we ship targets 4.5:1.

### 3.1 Measured pairs

| Pair | Ratio | Verdict |
|---|---|---|
| `--fg` on `--surface` | 16.2:1 | ✓ AA + AAA |
| `--fg-2` on `--surface` | 10.5:1 | ✓ AAA |
| `--muted` on `--surface` | 6.1:1 | ✓ AA |
| `--muted` on `--bg` | 5.8:1 | ✓ AA |
| `--accent-on` on `--accent` | **4.50:1** | ✓ AA, zero margin — see rule below |
| `--accent` on `--surface` | 4.50:1 | ✓ AA, zero margin |
| `--accent` on `--bg` | **4.31:1** | ✗ fails AA for text → use `--accent-text` |
| `--accent-text` on `--bg` | 5.33:1 | ✓ AA |
| `--accent-text` on `--surface` | 5.57:1 | ✓ AA |
| `--success` on `--surface` | 5.0:1 | ✓ AA |
| `--success` on `--success-tint` | 4.4:1 | ✗ → use `--success-fg` (5.2:1) |
| `--success-fg` on `--success-tint` | 5.2:1 | ✓ AA |
| `--danger` on `--surface` | 4.8:1 | ✓ AA |
| `--danger` on `--danger-tint` | 4.1:1 | ✗ → use `--danger-fg` (5.6:1) |
| `--danger-fg` on `--danger-tint` | 5.6:1 | ✓ AA |
| `--warn` on `--surface` | 1.96:1 | ✗ text impossible → fill only |
| `--warn-fg` on `--warn-tint` | 5.5:1 | ✓ AA |
| `--brand` on `--surface` | 6.4:1 | ✓ AA |
| `--brand` on `--brand-tint` | 5.5:1 | ✓ AA |
| `--border-strong` on `--surface` | 3.44:1 | ✓ 3:1 non-text |
| `--border` on `--surface` | 1.37:1 | ✗ non-text only — dividers, never a control boundary |

**Rule from the 4.50:1 pair.** Text on an `--accent` fill is never smaller than `--text-base` (16px) at weight 500, and never used for multi-sentence content. No 12px badge text on accent.

### 3.2 Why `--accent-text` exists

`--accent` on the page canvas (`--bg`) is 4.31:1 — under AA — and every link, text button, and active tab label sits on that canvas. Darkening only the text usage (`#1765cc`, 5.33:1 on `--bg`) keeps the fill colour the designers reviewed while making text compliant. Use `--accent` for fills, `--accent-text` for type. This is the single most likely accessibility regression in the build, so it is called out again in §12.

### 3.3 Why `--border-strong` exists

`--border #dadce0` is 1.37:1 — Google's own default, and a WCAG 1.4.11 failure when it is the only boundary of an input. Focusable controls therefore use `--border-strong` (3.44:1). Dividers, card edges, and table grid keep `--border`. Do not "tidy" these into one token.

### 3.4 Focus indicator

`--focus-ring` (`0 0 0 4px rgba(26,115,232,.24)`) is a 24%-alpha halo: on white it is roughly 1.15:1, which does not meet the 3:1 focus-indicator bar on its own. The system therefore uses a **two-layer ring** for every interactive element:

```css
outline: none;
box-shadow: var(--focus-ring-strong); /* 0 0 0 2px #fff, 0 0 0 4px #1a73e8 */
```

- `--focus-ring-strong` **(new)** = `0 0 0 2px var(--surface), 0 0 0 4px var(--accent)` — a 2px surface gap then 2px of solid accent (4.5:1 against white). On `--surface-warm` backgrounds, swap the inner 2px to `--surface-warm`.
- Danger variant for invalid fields: `0 0 0 2px var(--surface), 0 0 0 4px var(--danger)`.
- Never `outline: none` without a replacement. `--focus-ring` may remain as a decorative soft halo **in addition to**, never instead of, the strong ring.
- Focus is shown on `:focus-visible` only; pointer clicks do not draw it on buttons (but do always draw it on inputs).

### 3.5 Procedure: swapping the accent to brand purple (only if the client insists)

1. In `tokens.css`, set `--accent: #6442d6` and `--accent-text: #5636c0` (measured 7.2:1 on `--bg`).
2. Recompute `--focus-ring`'s hard-coded `rgba(26,115,232,.24)` → `rgba(100,66,214,.24)`.
3. Delete the brand block (it becomes redundant) and move the Well-Being badge to `--accent` / `--surface-warm`.
4. Re-run the contrast table in §3.1; only `--accent-on` changes class (4.50 → 6.38) and nothing else breaks.

No component in `apps/web` changes, because components read roles, not hues. If step 4 is not true, a component hard-coded a hex — fix the component.

---

## 4. Typography

### 4.1 Families

| Token | Value | Use |
|---|---|---|
| `--font-display` | `"Google Sans", Roboto, Arial, sans-serif` | `--text-xl` and above, mentor names on cards, screen titles, stat numbers |
| `--font-body` | `Roboto, Arial, sans-serif` | Everything else, including form labels and buttons |
| `--font-mono` | `"Roboto Mono", ui-monospace, Menlo, monospace` | SISTER ID, Scopus/ORCID ID, session link, OTP code (letter-spaced 0.08em), booking reference |

Load only 400/500/700. Weights 100–300 and 800–900 are not available and must not be referenced.

### 4.2 Weights (new tokens — `tokens.css` had none)

| Token | Value | Use |
|---|---|---|
| `--weight-regular` | 400 | Body copy, table cells, help text, long descriptions |
| `--weight-medium` | 500 | Labels, buttons, chips, card titles, nav items, badge text |
| `--weight-bold` | 700 | Screen titles (`--text-xl`+), prices, stat numbers, wordmark |

Rule: **hierarchy comes from size and colour first, weight second.** Never set a paragraph at 700 to make it "important" — use `--fg` and let the muted surround do the work. Never 500+ on a full paragraph.

### 4.3 Scale

| Token | Size | Line height | Weight | Where |
|---|---|---|---|---|
| `--text-xs` | 12 | 1.5 (18px) | 500 | Badge labels, chip counts, table column headers, timestamps |
| `--text-sm` | 14 | 1.5 (21px) | 400/500 | Help text, error text, metadata, secondary buttons, dense tables |
| `--text-base` | 16 | 1.5 (24px) | 400/500 | **Body default**, inputs, primary buttons, list item titles |
| `--text-lg` | 18 | 1.5 (27px) | 500 | Card titles, mentor name on the public page, modal body lead |
| `--text-xl` | 24 | 1.12 tight | 500/700 | Screen titles, section headings, modal titles |
| `--text-2xl` | 32 | 1.12 | 700 | Mentor-page mentor name, checkout total, hero on tablet/phone |
| `--text-3xl` | 48 | 1.12 | 700 | Desktop hero headline only (landing area of P1, P2). One per screen |
| `--text-4xl` | 64 | 1.12 | 700 | **Unused in this prototype.** Do not introduce a screen that needs it |

Non-negotiable body rules: body copy is `--text-base`/1.5; paragraphs cap at **66ch**; table cells may drop to `--text-sm` but never `--text-xs` for content the user must read; mobile never shrinks body below 16px (also prevents iOS input zoom). Numerals in prices, dates, counts, ratings, and IDs use `font-variant-numeric: tabular-nums`.

Indonesian strings run 15–25% longer than English — every label container must be sized against the Indonesian copy in `docs/screens.md` §4, not the English gloss in this doc.

---

## 5. Spacing rhythm

`--space-1 4 · --space-2 8 · --space-3 12 · --space-4 16 · --space-5 20 · --space-6 24 · --space-8 32 · --space-12 48`

| Rhythm | Composition | Applies to |
|---|---|---|
| Component inner padding | `space-3`/`space-4` | Buttons, inputs, chips, badges |
| Card padding | `space-4` phone, `space-6` ≥768 | Mentor cards, panels, modal body |
| Stack between fields | `space-4` (16) | Form fields; `space-2` between label and control, `space-1` between control and help |
| Stack between form sections | `space-6` (24) | Academic profile → goals, evidence groups |
| Stack between cards in a list | `space-3` phone, `space-4` ≥768 | Mentor results, bookings |
| Section padding inside a screen | `space-8` top/bottom | Between the page header band and the content block |
| Page section rhythm | `--section-y-phone 48` / `tablet 68` / `desktop 96` | Only between full-width marketing bands on P1/P2 |
| Inline group (icon + label) | `space-1`/`space-2` | Badge internals, status pill, star rows |

Rules: 4px grid, no odd values. `space-5` (20) is reserved for chip/badge interiors and dense table cell padding — not for stacking blocks, which uses 4/8/12/16/24/32/48. Whitespace before borders: prefer `space-4`+ gap to a new divider; a divider is the fallback when alignment alone is ambiguous (tables, dense lists).

---

## 6. Radii

| Token | Value | Applies to |
|---|---|---|
| `--radius-sm` | 4px | Buttons, inputs, textareas, selects, checkboxes, table row hover tint, small cards inside cards |
| `--radius-md` | 12px | All cards (mentor card, panel, booking card), inline banners, toasts, media thumbs |
| `--radius-lg` | 24px | Modals, bottom sheets on phone, hero/panel surfaces, image hero on P2 |
| `--radius-pill` | 9999px | Filter chips, tier tags, verified badges, status pills, avatars, rating pills, progress bar |

The escalation is deliberate: 4 → 12 → 24 signals control → container → overlay. **Do not** use `--radius-md` on an input (it reads as a card and breaks the field/container distinction), and do not use `--radius-lg` on a card (it competes with modals). Chips are pills even inside a 12px card — the pill is how a filter reads as "pressable" rather than "content".

---

## 7. Elevation

| Token | Value | Applies to |
|---|---|---|
| `--elev-flat` | `none` | Default for everything. Cards are flat by default: `1px solid --border` only |
| `--elev-ring` | `0 0 0 1px var(--border)` | Card/figure outline when a border would shift layout (focus-within, image edge) |
| `--elev-raised` | `0 3px 8px rgba(60,64,67,.18)` | Hovered mentor card, sticky header once scrolled, dropdown/popover |
| `--elev-overlay` **(new)** | `0 12px 32px rgba(60,64,67,.28)` | Modal, bottom sheet, toast |

Rules: one elevation per element, never stacked shadows. Hover lifts one step (`flat`→`raised`, 150ms). Do not use elevation to separate sections — use `--bg` vs `--surface` and spacing. Never animate a shadow beyond 150ms. Modal gets `--elev-overlay` **and** a `rgba(32,33,36,.5)` scrim; the scrim is what makes the layer readable, not the shadow.

---

## 8. Motion

| Token | Value | Use |
|---|---|---|
| `--motion-fast` | 150ms | Hover, focus ring, chip select, badge, tooltip, colour changes |
| `--motion-base` | 250ms | Modal/sheet enter-exit, tab panel swap, accordion, banner slide-in, skeleton fade |
| `--ease-standard` | `cubic-bezier(.2,0,0,1)` | Everything; no bounce, no spring, no overshoot |

Rules:

- Only `opacity` and `transform` animate (plus colour). Never animate `width`/`height`/`top` — use a transform or a mounted transition.
- Nothing animates longer than 250ms. No entrance animation on page load content; only overlays and state changes animate.
- Loading spinners rotate at 900ms linear; skeletons pulse opacity 1 → 0.6 → 1 at 1200ms, starting after a **150ms delay** (so a fast response never flashes a skeleton) and never on a surface that resolves under ~300ms.
- `@media (prefers-reduced-motion: reduce)`: all durations to 1ms, no pulse, no slide — content appears in place. Spinners become a static "Memuat…" text label. This is a build requirement, not a nicety.
- No urgency motion anywhere: nothing bounces, shakes, or pulses to demand attention, and mood/pulse surfaces have no motion beyond a normal fade (§13).

---

## 9. Layout, containers, breakpoints

| Token | Value | Use |
|---|---|---|
| `--container-max` | 1200px | Marketing bands (P1 hero, P2), admin queue, wide tables |
| `--container-narrow` **(new)** | 760px | Forms and reading columns: registration, OTP, intake note, self-assessment, review, alignment card. Single-column at every width |
| `--container-gutter-phone` | 16px | < 768 |
| `--container-gutter-tablet` | 24px | 768–1119 |
| `--container-gutter-desktop` | 36px | ≥ 1120, inside the 1200 cap |

Breakpoints (three, exactly — the prototype does not need more): **phone < 768**, **tablet 768–1119**, **desktop ≥ 1120**, with the design reviewed at **360 / 768 / 1440** and reflow-safe at 320.

| Region | Phone 360 | Tablet 768 | Desktop 1440 |
|---|---|---|---|
| Columns | 4 | 8 | 12 |
| Mentor result grid | 1 column | 2 columns | 3 columns |
| Nav | Top app bar + persona switcher in a sheet | Top app bar, horizontal tabs | Top app bar + persistent left rail (240px) for mentor/admin consoles |
| Filter panel | Full-screen sheet via "Filter" button | Inline collapsible band | Persistent 280px left column |
| Alignment card | Stacked items, sticky bottom CTA | Stacked items | 2-column: items left, summary right |
| Mediation thread | Full-height list + fixed composer | List + fixed composer | 2-column: thread 1fr / alignment card 360px sticky |
| Modal | Full-height sheet, 24px top radius only | 640px centred | 640px centred (800px for the admin evidence detail) |
| Tables (admin, bookings) | Stacked cards, one per row, label:value pairs | Horizontal scroll with sticky first column | Full table |
| Section rhythm | 48 | 68 | 96 |

Content width: prose 66ch, form column 560–760px, table full container. Tap targets ≥ 44×44 at every breakpoint; if a desktop control is visually 32–36px, expand its hit area with padding or a pseudo-element — never by shrinking the gap below a 44px box.

---

## 10. Iconography, imagery, data display

- Icons: single set, 20px inline / 24px stand-alone, 1.75px stroke, `currentColor`. Icons never carry meaning alone — always with a label or `aria-label`.
- Avatars: initials fallback on `--surface-warm` with `--accent-text` initials, `--radius-pill`, sizes 24 / 32 / 40 / 56 / 96. Never a placeholder face illustration.
- Badge icons are fixed and distinct, because three trust marks must be separable at 12px text: SISTER (shield), Scopus/ORCID (link/chain), Well-Being Certified (heart-check, purple). Do not reuse the shield for premium tier.
- Money: always `Rp 50.000` — `Rp`, non-breaking space, dot thousands, **no decimals**, no `IDR` prefix in UI. Render from config; never a literal in a component (D4).
- Dates: `24 Nov 2026, 19.00 WIB` in UI; ISO-8601 in API. Relative times ("2 hari lalu") only for activity timestamps, never for scheduled sessions.
- Tier labels come from config, not literals in components (D2): **Basic Mentor**, **Educator Mentor**, **Premium Educator Mentor**.

---

## 11. Component inventory

Every interactive component lists every state it must have. If a state is missing in the build, it is a defect, not a polish item. Sizes: `sm` 36px visual (44px hit area), `md` 44px, `lg` 52px.

### 11.1 Button

Structure: `<button>` with a 16px (or 20px `lg`) leading icon optional, label, optional trailing spinner. `--radius-sm`. Label `--weight-medium`. No text-transform. Never an icon-only button without `aria-label` + tooltip.

| Variant | Fill | Label | Border | Use |
|---|---|---|---|---|
| Primary | `--accent` | `--accent-on` | none | The one forward action on the screen: "Kirim pengajuan", "Bayar biaya platform", "Konfirmasi kesepakatan" |
| Secondary | `--surface` | `--accent-text` | 1px `--border-strong` | Adjacent safe action: "Simpan draf", "Batal", "Lihat detail" |
| Ghost | transparent | `--accent-text` | none | Tertiary/inline: "Lewati untuk sekarang", "Hapus filter", "Ubah" |
| Destructive | `--danger` | `#fff` | none | Irreversible: "Tolak pengajuan", "Batalkan booking" (confirmation required first) |

**Every variant × every state.** Focus uses `--focus-ring-strong` in all cases (`--danger` variant uses the danger ring).

| State | Primary | Secondary | Ghost | Destructive |
|---|---|---|---|---|
| Default | `--accent` / `--accent-on` | `--surface` / `--accent-text`, 1px `--border-strong` | transparent / `--accent-text` | `--danger` / `#fff` |
| Hover (150ms) | `--accent-hover` | `--surface-warm` background, border stays | `--surface-warm` background | `color-mix(--danger, black 8%)` |
| Focus-visible | 2px surface gap + 2px `--accent` ring; **no colour change** | same ring | same ring | 2px + 2px `--danger` ring |
| Active (pressed) | `--accent-active`, `transform: translateY(1px)`, 0ms | `--surface-warm` + `scale(.99)` | same as hover + `scale(.99)` | darker 14% mix, `translateY(1px)` |
| Disabled | `--border-soft` fill, `--muted` label, no shadow, `cursor: not-allowed`, `aria-disabled="true"`, not removed from tab order but inert | transparent, 1px `--border`, `--muted` label | `--muted` label, transparent | `--danger-tint` fill, `--muted` label |
| Loading | fill and label dimmed to 70%, 16px spinner replaces the leading icon, label becomes "Memproses…", `aria-busy="true"`, `pointer-events: none`, **min-width locked** to the pre-loading width so nothing reflows | same | same | same |

Rules: one primary button per viewport. Disabled buttons must still explain why — pair with a helper line or inline banner ("Lengkapi 2 bukti yang kurang untuk mengirim"). Never disable the only path forward without an adjacent reason. Loading never removes the label entirely (screen readers and slow connections both need it).

### 11.2 Text input / textarea / select

Anatomy: label (always visible, `--text-sm`/500/`--fg`) → control → help text (`--text-sm`/`--muted`) or error text (`--text-sm`/`--danger-fg`, icon-prefixed) → optional counter (`--text-xs`/`--muted`, right-aligned, tabular). Label is not a placeholder; placeholder is an example only ("cth. Skripsi bab 3 — metodologi").

| State | Spec |
|---|---|
| Default | `--surface`, 1px `--border-strong`, `--radius-sm`, 44px min height (textarea 96px, auto-grow to 240px), padding `space-3` + `space-3`, text `--text-base`/`--fg`, placeholder `--muted` |
| Hover | border → `--fg-2` at 40% (border darkens, no layout change) |
| Focus-visible | `--focus-ring-strong`; border stays `--border-strong`; **the ring is the only focus signal** — no glow, no colour swap |
| Filled | text `--fg`; nothing else changes (no green borders) |
| Disabled | `--border-soft` fill, `--muted` text, label `--muted`, `cursor: not-allowed`, value still readable and selectable |
| Read-only | `--surface-warm` fill, `--fg-2` text, no border change, copy icon where the value is an ID/link. Used for verified evidence under review (US 2.1a: "cannot edit verified academic evidence while under review") |
| Error | 1px `--danger-fg` border **plus** 2px `--danger-tint` outer ring (so it is visible without colour at 100% saturation alone), error icon + message below, `aria-invalid="true"`, `aria-describedby` → message id |
| Loading (async validation, e.g. OTP, domain check) | trailing 16px spinner inside the field, `aria-busy`, control stays editable, label unchanged |
| Success (async validation only) | 16px check icon in `--success-fg` trailing; **no green border** (success must not look like an error variant); message only when the copy adds information ("Domain ui.ac.id terverifikasi") |
| Counter over limit | counter turns `--danger-fg`, text allowed past limit but submit blocked, error message appears; counter never blocks typing |

Selects: native `<select>` styled to the same box, 24px chevron trailing, no custom listbox (prototype scope). Search: leading 20px magnifier, trailing clear button (44px hit area) shown only when non-empty, `type="search"`, `Enter` submits, `/` focuses on desktop.

Error semantics (all fields): message states what is wrong **and** what to do, in Indonesian, ≤ 2 lines. First invalid field receives focus on submit. Inline banner summarises when >1 field fails: "3 isian perlu diperbaiki." Screen-reader announcement via `role="alert"` on the summary only, not on each field (avoid an alert storm).

### 11.3 Search + filter chips

- Search field: as above, placeholder "Cari nama mentor, topik, atau kampus". Debounced 250ms; results region announces "12 mentor ditemukan" via `aria-live="polite"`.
- Filter chip (toggle): pill, height 36px / 44px hit area, `--surface` + 1px `--border-strong`, label `--text-sm`/500.
  - Default: `--fg-2` label. Hover: `--surface-warm`. Selected: `--accent` fill, `--accent-on` label, leading check icon, count in parentheses ("Premium (4)"). Focus-visible: strong ring. Disabled: `--border-soft` fill, `--muted`, reason in `title`/helper. Loading (counts refreshing): label keeps last count, 12px spinner replaces the count, chip stays interactive.
- Active filter set is always visible as chips above results (removable with an × that has a 44px hit area) — this is what makes the zero-result state recoverable.
- Phone: chips collapse behind a "Filter" button that opens a sheet with the same chips grouped by facet, plus "Terapkan" and "Hapus semua".

### 11.4 Card

Base: `--surface`, 1px `--border`, `--radius-md`, padding `space-4`/`space-6`, `--elev-flat`.

| State | Spec |
|---|---|
| Default | as above; card title `--text-lg`/500; metadata `--text-sm`/`--muted` |
| Hover (mentor card only) | `--elev-raised`, `translateY(-1px)`, border → `--border-strong`, 150ms. Whole card is one link target (with a `<a>` wrapping the title, stretched by `::after`), badges and external verification links sit above it and are individually clickable |
| Focus-within | `--elev-raised` + strong ring on the focused element; never a ring around the whole card *and* the inner link |
| Selected | 2px `--accent` inset ring + `--surface-warm` tint (used in the tier comparison selection, never as the only signal — the radio is checked too) |
| Pending/unpublished | `--border-soft` border, `--surface-warm` band across the top with label "Belum terbit" (`--warn-fg` on `--warn-tint`), no hover lift — used for the mentor's own storefront preview |
| Loading | skeleton variant (§11.13) with identical dimensions |
| Error | card remains, content replaced by a compact inline banner: "Gagal memuat data mentor" + "Coba lagi" ghost button |

### 11.5 Badges

Pill, `--text-xs`/500, height 24px, padding inline `space-2`, 14px leading icon, `--radius-pill`, `--radius-pill` internals never wrap. Badge text is **never** on `--warn` or `--danger` fills.

| Badge | Fill / text | Icon | Behaviour | a11y |
|---|---|---|---|---|
| SISTER Verified | `--surface-warm` / `--accent-text` | shield | Links to SISTER record if public, else non-interactive with tooltip | `aria-label="SISTER terverifikasi"` |
| Scopus/ORCID Verified | `--surface-warm` / `--accent-text` | chain | Links out to Scopus/ORCID (new tab, `rel="noopener"`) | label includes the external destination |
| LMNS Well-Being Certified | `--brand-tint` / `--brand` | heart-check | Links to the certification record (badge issuance log) | label: "Bersertifikasi Well-Being LMNS" |
| Tier tag (Basic / Educator / Premium Educator) | Premium → `--brand-tint`/`--brand`; Educator → `--surface-warm`/`--accent-text`; Basic → `--border-soft`/`--fg-2` | none | Non-interactive; tier label read from config | plain text label, no `aria` needed |

Badge states: default, hover (only when interactive: underline + `--brand-hover`/`--accent-hover` text), focus-visible (strong ring, 1px offset), disabled (not applicable), **unavailable** (precondition unmet in admin detail: `--border-soft` fill, `--muted` label, `aria-disabled`, tooltip naming the unmet item). Unavailability is never expressed by hiding the badge in the admin detail — the reviewer must see *what* is missing, which is why it renders greyed with a reason.

### 11.6 Stepper

Vertical on phone/tablet, horizontal on desktop ≥1120 (wizard US 2.1a), `--radius-pill` nodes (24px), connector 2px.

| State | Spec |
|---|---|
| Upcoming | node `--surface` + 1px `--border-strong`, number `--muted`, label `--muted`, connector `--border` |
| Current | node `--accent` fill, `--accent-on` number, label `--text-base`/500/`--fg`, connector left half accent, `aria-current="step"` |
| Completed | node `--success` fill, check icon `#fff`, label `--fg-2`, clickable "Ubah" ghost button beside |
| Error | node `--danger` fill, `!` icon, label `--danger-fg`, helper line with the field-level cause, `aria-invalid` on the step button |
| Skipped | node `--border-soft`, dash icon, label `--muted`, annotation "Dilewati" (used for the pulse only) |
| Disabled (future step) | node `--border-soft`, `--muted`, not focusable, `aria-disabled` |

Step labels are Indonesian and short: "Jenjang & kredensial", "Asesmen kesejahteraan", "Etalase". Progress persistence is visible as text under the stepper: "Draf tersimpan otomatis · 12 Nov 2026, 19.04".

### 11.7 Tabs

Underline variant: label `--text-sm`/500/`--muted`, 2px bottom indicator `--accent` when selected, container border-bottom 1px `--border`. States: default, hover (`--surface-warm` tint, text `--fg-2`), selected (`--accent-text` + indicator), focus-visible (strong ring **inside** the tab so it is not clipped by the container), disabled (`--muted` at 60%, `aria-disabled`), loading (12px spinner after the label while the panel loads — the tab itself stays selected). Roving tabindex, `←/→` move, `Home/End` jump, panel `role="tabpanel"` labelled by its tab. Never more than 5 tabs; overflow becomes a select on phone.

### 11.8 Table / list

Shared anatomy: toolbar (search + filters + count) → header row → rows → footer (count + load more).

| State | Spec |
|---|---|
| Default | `--surface` rows, 1px `--border` row dividers, hover row `--surface-warm`, header `--text-xs`/500/uppercase-off/`--muted`, sticky header on scroll inside a `max-height: 70vh` container |
| Selected | `--surface-warm` + 2px `--accent` left bar; `aria-selected` |
| Sortable header | button inside `th`, arrow icon when sorted, `aria-sort` on `th`, focus-visible ring |
| Empty | centered empty state (§11.12), header retained so filters stay visible |
| Loading | 5 skeleton rows matching column widths; header retained; `aria-busy` on the table; **no spinner overlay** |
| Partial | rows render with per-row missing data as "—" plus a row-level banner above the table: "Sebagian data belum tersedia." (used when an evidence link fails to resolve) |
| Error | header retained, body replaced by inline danger banner "Gagal memuat data. Periksa koneksi lalu coba lagi." + "Coba lagi" secondary button; sort/filter state preserved |
| Load more | secondary button, in flight → loading state, `aria-live` announces "Menampilkan 12 dari 20" |

Phone: table becomes stacked cards (each row → a 12px card with label:value pairs, `--text-sm` labels in `--muted`). Sticky first column on tablet horizontal scroll. No pagination component — 8–20 records, "Muat lebih banyak" only.

### 11.9 Modal / sheet

Sizes: `sm` 480px (confirmations), `md` 640px (tier comparison, intake note), `lg` 800px (admin evidence detail). Phone: bottom sheet, `--radius-lg` top only, 90vh max, scroll within.

| State | Spec |
|---|---|
| Open | scrim `rgba(32,33,36,.5)`, panel `--surface` + `--elev-overlay` + `--radius-lg`, enter `opacity` + `translateY(8px)` in 250ms; focus moves to the dialog, first focusable or the title for destructive dialogs |
| Loading (content fetch) | title + close always visible, body = 3 skeletons, footer buttons disabled with reason |
| Error | body replaced by danger banner + "Coba lagi"; footer keeps only close/secondary |
| Submitting | primary button → loading state, close disabled, Esc disabled while submitting (or a confirm prompt) |
| Completed | close, return focus to the invoking element, toast if the result is not visible on the page behind |
| Dismiss | `Esc` (unless submitting), scrim click (same rule), explicit close button 44×44 with `aria-label="Tutup"`. Destructive dialogs require an explicit choice — scrim click does not dismiss |

Contract: `role="dialog"` `aria-modal="true"` `aria-labelledby`; focus trap; body scroll lock; content never taller than viewport without internal scroll; no nested modals (the tier comparison opens *from* checkout as a modal — checkout itself is a screen, not a modal, so this never nests).

### 11.10 Inline banner

Full-width of its container, `--radius-md`, padding `space-3`/`space-4`, 20px icon, title `--text-sm`/500, body `--text-sm`/400, optional action (ghost button, right-aligned desktop / below on phone).

| Variant | Fill | Border | Title / body | Icon | Role |
|---|---|---|---|---|---|
| Info | `--surface-warm` | none | `--accent-text` / `--fg-2` | info | `role="status"` |
| Success | `--success-tint` | none | `--success-fg` / `--fg-2` | check-circle | `role="status"` |
| Warning | `--warn-tint` | none | `--warn-fg` / `--fg-2` | alert-triangle | `role="status"` |
| Danger | `--danger-tint` | 1px `--danger-fg` at 20% | `--danger-fg` / `--fg-2` | alert-circle | `role="alert"` |

States: static, dismissible (× 44×44, only for promo/info — **never** for errors or the fee disclosure), with-action, and (loading) skeleton text lines while a dependent check resolves. Warning is the default for "action needed but not broken" (pending review, one-sided agreement, missing evidence) — danger is reserved for "this failed".

### 11.11 Toast

Max 1 visible; bottom-left desktop, bottom-center above the safe area on phone; `--radius-md`, `--surface`, `--elev-overlay`, 1px `--border`, 280–420px, `--text-sm`, one optional action.

| State | Spec |
|---|---|
| Success | `--success` check icon + message, auto-dismiss **6s**, `role="status"` |
| Error | `--danger` icon + message, **no auto-dismiss**, explicit close, `role="alert"` |
| Loading/in-flight | 16px spinner, no dismiss, replaced in place by the result |
| Action available | action as ghost button ("Lihat booking"), extends dismiss to 8s |
| Dismissing | fade+translate 150ms; hovering pauses the timer (WCAG 2.2.1) |

Toasts never carry information that is not also visible (or recoverable) on the page: the booking status banner, not the toast, is the source of truth.

### 11.12 Empty state

Centered block, max 420px: 48px icon (`--muted`, 1.75px stroke), title `--text-lg`/500/`--fg`, body `--text-sm`/`--muted` ≤2 lines, one primary or secondary action.

| Variant | Title (ID) | Action |
|---|---|---|
| Zero results | "Tidak ada mentor yang cocok" | "Hapus semua filter" (primary, secondary style) — active filter chips repeated above |
| Nothing yet (mentee) | "Belum ada booking" | "Cari mentor" |
| Nothing yet (mentor) | "Belum ada permintaan masuk" | none — helper text about the verified-listing lag |
| Nothing yet (admin) | "Antrean kosong" | none |
| Awaiting publication | "Etalase belum terbit" | "Lihat pratinjau" |
| Permission/state gate | "Sesi ini belum bisa diakses" + reason ("Booking belum dibayar") | context action ("Selesaikan pembayaran") |
| Not found (404) | "Halaman tidak ditemukan" | "Kembali ke beranda" |
| Offline/error | "Tidak dapat memuat data" | "Coba lagi" |

Illustrations: none beyond a stroke icon — a decorative illustration is `--brand-soft` stroke only (DEC-01 allowance), `aria-hidden="true"`.

### 11.13 Skeleton

Shapes mirror the real layout exactly (no generic grey boxes): avatar circle 40px, title bar 60% width 16px high, two meta bars 40%/30% at 12px, badge pills 72×24. Radius follows the element it replaces. Base `--border-soft`, pulse opacity 1↔0.6 at 1200ms, 150ms delay before appearing, `aria-hidden="true"` on the skeleton and `aria-busy="true"` on the region. Never skeletons for a single field, never inside a button, never more than 5 rows without a "Memuat…" label for screen readers.

### 11.14 Avatar

Sizes 24/32/40/56/96, `--radius-pill`, `--surface-warm` fill, initials `--accent-text`/500 (size/2.5), 1px `--border`. States: loaded (image, `alt` = mentor name), fallback initials, loading (`--border-soft`, no pulse on avatar — the surrounding skeleton covers it), broken image → fallback initials (never a broken-image icon), with-badge ring (2px `--brand` for Well-Being Certified on the profile hero only).

### 11.15 Rating stars — two independent axes

Two separate components that are never summed, averaged, or displayed as one number. Axis names are fixed copy (`docs/screens.md` §4.4): **Bimbingan Akademik & Riset** and **Keamanan Psikologis & Dukungan Kesejahteraan**.

**Display mode** (mentor card, mentor page):
- Per axis: 5 stars 16px, filled `#f9ab00` (decorative fill; contrast not required for the star shape because the numeric value is adjacent), half-star via clipped overlay, then `4,8` (`--text-sm`/500/`--fg`, tabular, Indonesian decimal comma) and `(12 ulasan)` (`--text-sm`/`--muted`).
- Zero reviews: no stars, "Belum ada ulasan" (`--text-sm`/`--muted`). Never render 0 stars.
- Axis label always present above the stars (`--text-xs`/500/`--muted`); on cards where space is tight, the label is the two-word short form ("Akademik" / "Kesejahteraan") with an `aria-label` carrying the full name.
- `aria-label`: "Bimbingan Akademik & Riset: 4,8 dari 5, dari 12 ulasan".

**Input mode** (US 5.1 review form):
- Radio group of 5 buttons per axis, each 44×44, star 28px. States: empty (outline star `--border-strong`), hover (preview fills up to hovered star in `--accent` at 40%), selected (filled `#f9ab00`), focus-visible (strong ring around the focused star), disabled (submitting), error (no selection on submit: axis label `--danger-fg` + message "Pilih nilai untuk aspek ini.", `role="alert"` once).
- Anchors under the stars: 1 "Sangat kurang" · 3 "Cukup" · 5 "Sangat baik". Keyboard: `←/→` adjust, `1`–`5` jump, space selects.
- Both axes required; the submit button stays enabled and validates on press (better than a silently disabled button — see §11.1). Each axis reports its own error independently.
- Star colours are never the only signal: the numeric value and the anchor word accompany the selection.

### 11.16 Progressive status pill

`--radius-pill`, `--text-xs`/500, height 24px, 8px dot + label, dot carries the status colour, label `--fg-2`, fill `--surface-warm`. Used for booking status and application status.

| Domain | Value | Dot | Label (ID) |
|---|---|---|---|
| Booking | `UNPAID` | `--warn` | "Menunggu pembayaran" |
| Booking | `AWAITING_ALIGNMENT` | `--warn` | "Menunggu kesepakatan" |
| Booking | `PARTIALLY_CONFIRMED` | `--warn` | "Menunggu konfirmasi pihak lain" |
| Booking | `SCHEDULED` | `--success` | "Terjadwal" |
| Booking | `COMPLETED` | `--muted` | "Selesai" |
| Booking | `CANCELLED` | `--muted` | "Dibatalkan" |
| Application | `DRAFT` | `--muted` | "Draf" |
| Application | `PENDING_REVIEW` | `--warn` | "Menunggu verifikasi" |
| Application | `APPROVED` | `--success` | "Disetujui" |
| Application | `REJECTED` | `--danger` | "Perlu perbaikan" |
| Application | `WITHDRAWN` | `--muted` | "Ditarik" |
| Premium | `TRAINING_IN_PROGRESS` | `--warn` | "Pelatihan berjalan" |
| Premium | `BADGE_ISSUED` | `--success` | "Bersertifikat" |

States of the pill component: static, with-icon (leading dot animates **never** — no pulsing for "waiting"), loading (label "Memuat status…" + 12px spinner; only while the booking status itself is fetching), error (`--danger` dot + "Status tidak diketahui" + retry link). Colour never carries the meaning: the label always states it. Rejected-but-resubmitted uses two pills in sequence: "Perlu perbaikan" (danger) then "Menunggu verifikasi" (warn) — with the history in the application timeline, not as a blended state.

---

## 12. Accessibility bar (build gates)

Numbers, not adjectives. Reviewers check these.

| Requirement | Bar |
|---|---|
| Text contrast | ≥ **4.5:1** for all text under 24px (and all bold under 18.66px). We do not use the large-text exemption. `--muted` minimum; never lighter |
| Non-text contrast | ≥ **3:1** for input borders (`--border-strong` 3.44:1), focus indicators, checkbox/radio boundaries, status dots against their fill, chart/link affordances |
| Focus indicator | **2px solid accent + 2px surface gap**, visible on every interactive element, ≥ 3:1 against both the control and the surrounding canvas, never removed, never `outline: none` without replacement |
| Target size | ≥ **44×44 CSS px** for every interactive element (including chips, close buttons, star buttons, table sort arrows) and ≥ **8px** between adjacent targets |
| Body type | ≥ **16px** at every breakpoint; inputs ≥ 16px (iOS zoom); line-height ≥ 1.5 for body |
| Reflow | Usable at **320px** width and at **200% zoom** with no horizontal page scroll; content columns collapse to one |
| Keyboard | Full journey keyboard-only: register → verify → discover → book → pay → align → review. Logical DOM tab order, visible focus at all times, skip link ("Langsung ke konten") as the first tab stop, no focus traps outside modals, `Esc` closes overlays, `Tab` cycles within a modal |
| Error semantics | `aria-invalid` + `aria-describedby` on the field; one `role="alert"` summary per submit; focus moves to the first invalid field; errors never colour-only (icon + text) |
| Status announcements | `aria-live="polite"` for result counts, saved-state, async validation; `role="alert"` for failures only. Never announce mood/pulse answers |
| Semantics | One `<h1>` per screen, heading levels never skipped, `nav`/`main`/`section` landmarks, `role="dialog"` + `aria-modal` + `aria-labelledby`, `aria-current="step"/"page"`, tables with `<th scope>`, form controls always label-associated |
| Forms | Every control has a visible label (no placeholder-as-label); required fields marked with text ("wajib") not only `*`; helper text is programmatically associated |
| Language | `<html lang="id">`; English only in code/IDs. Numeric/date formats Indonesian (`Rp 50.000`, `24 Nov 2026, 19.00 WIB`) |
| Motion | `prefers-reduced-motion: reduce` → no transform/opacity animation >1ms, no pulse; nothing flashes more than 3×/s; no autoplay media |
| Images/icons | Decorative `aria-hidden="true"`; meaningful images get Indonesian `alt`; no text baked into images |
| Link text | Descriptive Indonesian ("Lihat catatan intake"), never "klik di sini"; external links announce the destination and open in a new tab with `rel="noopener noreferrer"` |
| Colour-only meaning | None. Every status, selection, and error carries an icon or a word. Verified badges carry text labels, not just colour |
| Screen-reader check | One pass per screen on VoiceOver/Safari or NVDA/Chrome before demo; a screen that cannot be completed blind is a blocker |

Standard: **WCAG 2.1 AA**, verified against the checklist above. We do not claim AAA; we do guarantee the numbers in this table.

---

## 13. Well-being and copy rules (hard constraints)

These follow from PRD §9 (US 1.2), §10 (Data & Privacy), and `prototype-scope.md` D12. Violating them is a release blocker, not a style note.

1. **No clinical language.** Banned in all user-facing copy: *diagnosis, mendiagnosis, terapi, psikoterapi, gangguan mental, depresi, kecemasan klinis, skrining, gejala, pasien, penyembuhan, konseling klinis*. The product is **non-clinical**; it matches mentors and asks reflective questions. Allowed: *reflektif, keseimbangan akademik, dukungan, rasa aman, beban kerja*.
2. **No score or label ever rendered back.** Pulse answers, intake stress level, and post-session mood are never turned into a number, band, percentage, grade, radar chart, streak, or adjective shown to the mentee. The only permitted feedback is the neutral acknowledgement string in `docs/screens.md` §4.2 ("Terima kasih. Jawaban Anda tersimpan dan hanya dapat Anda lihat.") and, for matching, "Preferensi Anda dipakai untuk menyarankan mentor." Nothing else.
3. **No urgency or alarm styling for mood data.** Mood/pulse surfaces never use `--warn`/`--danger` fills, never red, never an alert icon, never a countdown, badge dot, "streak", "3 hari berturut-turut", or notification nag. Options are equal-weight chips/faces; no option is pre-selected; no visual nudge toward a "better" answer. Skipping is a first-class, equally styled ghost action.
4. **Privacy is visible, not just true.** Every well-being capture screen carries a one-line privacy statement ("Hanya Anda yang dapat melihat jawaban ini. Mentor dan admin tidak dapat melihatnya."). Mentor and admin surfaces must never expose any pulse/mood/stress field — including in the admin application detail, where the *self-assessment* is reviewable prose written for review, not mentee mood data.
5. **No crisis-support claim.** The product does not handle emergencies and must not imply it can. Where a well-being question appears, one footer line: "LMNS bukan layanan kesehatan mental dan tidak menangani kondisi darurat." Do not add a hotline number unless the client supplies a verified one (out of prototype scope).
6. **No unenforceable claim** (PRD §10). Every promise in copy maps to implemented behaviour: no "mentor terverifikasi otomatis", no "respons dalam 1 jam" unless the SLA is enforced and displayed from config, no "garansi uang kembali" (escrow/refunds are out of scope, D6). Premium perks in the checkout comparison render only when the API reports them true for that mentor (US 4.2) — the copy for each perk exists in `docs/screens.md`, and its *absence* is the correct output when unenforced.
7. **Tone.** Second person, plain, no exclamation marks in error copy, no blame ("Anda memasukkan data yang salah" → "Format SISTER ID belum sesuai"). Mentors are addressed neutrally, never graded.
8. **Two ratings stay two.** No screen, badge, sort control, or API payload may present a blended mentor score. Sorting is per-axis at most; the marketplace card may sort by "Bimbingan Akademik" only when the label says so.

---

## 14. Token additions recorded

Appended to `docs/tokens.css` under a `/* --- LMNS design-system additions (DEC-01/02/03) --- */` block. Originals are untouched.

| Token | Value | Why it is needed |
|---|---|---|
| `--accent-text` | `#1765cc` | `--accent` is 4.31:1 on `--bg` — fails AA for text (§3.2) |
| `--border-strong` | `#868b90` | `--border` is 1.37:1 — fails the 3:1 control-boundary bar (§3.3) |
| `--focus-ring-strong` | `0 0 0 2px #fff, 0 0 0 4px #1a73e8` | the 24%-alpha `--focus-ring` is ~1.15:1 alone (§3.4) |
| `--focus-ring-danger` | `0 0 0 2px #fff, 0 0 0 4px #d93025` | focus on invalid fields |
| `--success-fg` / `--success-tint` | `#137333` / `#e6f4ea` | `--success` on its own tint is 4.4:1; banner text needs 5.2:1 |
| `--warn-fg` / `--warn-tint` | `#8a5a00` / `#fef7e0` | `--warn #f9ab00` is 1.96:1 — cannot carry text |
| `--danger-fg` / `--danger-tint` | `#b3261e` / `#fce8e6` | `--danger` on its own tint is 4.1:1; error text needs 5.6:1 |
| `--brand`, `--brand-soft`, `--brand-tint`, `--brand-hover`, `--brand-active`, `--brand-on` | `#6442D6`, `#C8B3FD`, `#f1ecfd`, mixes, `#fff` | expresses DESIGN.md's purple as a brand accent without touching `--accent` (DEC-01) |
| `--weight-regular/medium/bold` | 400/500/700 | `tokens.css` had no weight tokens; 100–900 is not shipped |
| `--elev-overlay` | `0 12px 32px rgba(60,64,67,.28)` | modals/sheets/toasts need a layer above `--elev-raised` |
| `--container-narrow` | `760px` | form/reading column (§9) |
| `--hit-target` | `44px` | single source for the 44×44 requirement (§12) |
| `color-scheme: light` | `light` | forces light native controls under OS dark preference (DEC-03) |

Nothing else was added. If a screen seems to need a new token, the screen is probably inventing a pattern — check §11 first.

---

## 15. Handoff notes for the web build

1. **Map roles to Tailwind theme keys**, not raw values: `accent`, `accentText`, `brand`, `fg`, `fg2`, `muted`, `surface`, `surfaceWarm`, `bg`, `border`, `borderStrong`, `success/fg/tint`, `warn/fg/tint`, `danger/fg/tint`. Components use `bg-accent`, `text-accentText`, `border-borderStrong` — never `bg-[#1a73e8]`.
2. **Forbid raw hex in `apps/web`.** One grep in CI (`rg '#[0-9a-fA-F]{3,6}' apps/web/src --glob '!*.css'`) is enough; the only file allowed to contain hex is the token stylesheet.
3. **Ship the state components, not the happy path.** Every list and form imports the same `EmptyState`, `Skeleton`, `InlineBanner`, `ErrorRetry` — a screen that hand-rolls its empty state will drift and fail the state matrix in `docs/screens.md` §3.
4. **Indonesian copy lives in one module** (`apps/web/src/copy/id.ts` or equivalent), and product-variable values (fee, tier labels, OTP) are interpolated from config — never concatenated literals (D4, DoD 3).
5. **Do not add screens, tabs, or steps** beyond `docs/screens.md` §1. Scope creep is a delivery-cost decision, not a design one.
6. The design-QA pass (PERS2-41) reviews against §12 and the state matrix; ship the states required there or expect them filed as defects.
