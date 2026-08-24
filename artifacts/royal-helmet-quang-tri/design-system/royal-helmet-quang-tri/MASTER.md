# Design System Master File

> **LOGIC:** When building a specific page, first check `design-system/pages/[page-name].md`.
> If that file exists, its rules **override** this Master file.
> If not, strictly follow the rules below.

---

**Project:** Royal Helmet Quảng Trị
**Updated:** 2026-08-21 (manually corrected after verification — see Revision Note)
**Category:** Automotive / Motorcycle Safety Gear — Retail E-commerce

---

## Revision Note

The first auto-generated pass (`--design-system "motorcycle helmet e-commerce retail premium"`) matched
**Liquid Glass** style + **Cormorant/Montserrat** luxury-fashion typography from the word "premium" alone.
Rejected after verification:
- Liquid Glass is an Apple system-chrome style (heavy blur/lensing), not suited to a practical safety-gear
  storefront and adds real accessibility/contrast risk.
- **Cormorant does not carry a `vietnamese` Google Fonts subset** — diacritics (ế, ộ, ữ, ...) would render
  incorrectly. This site is 100% Vietnamese copy, so subset support was made a hard filter for every font
  candidate below (verified via `--domain google-fonts`).

Replaced with verified matches from `--domain style`, `--domain color`, `--domain typography`, and
`--domain google-fonts` queries scoped to "automotive / retail / trustworthy / sporty".

---

## Global Rules

### Color Palette

Base: verified **Automotive/Car Dealership** palette (`--domain color`, query "automotive trust bold red black"),
adapted — dark charcoal for trust/authority, red accent for CTA/urgency (sale, "mua ngay"), plus a dedicated
success green for in-stock indicators (kept separate from the red accent so stock state never collides with CTA color).

| Role | Hex | CSS Variable | Usage |
|------|-----|--------------|-------|
| Primary | `#161A20` | `--color-primary` | Header/footer bg, primary buttons, dark sections |
| On Primary | `#FFFFFF` | `--color-on-primary` | Text/icons on primary |
| Secondary | `#334155` | `--color-secondary` | Secondary text, admin sidebar |
| On Secondary | `#FFFFFF` | `--color-on-secondary` | |
| Accent/CTA | `#DC2626` | `--color-accent` | Brand mark, sale badges, "Mua ngay", links on hover |
| On Accent/CTA | `#FFFFFF` | `--color-on-accent` | |
| Background | `#F8FAFC` | `--color-background` | Page background |
| Foreground | `#0F172A` | `--color-foreground` | Body text |
| Card | `#FFFFFF` | `--color-card` | Product cards, panels |
| Card Foreground | `#0F172A` | `--color-card-foreground` | |
| Muted | `#EEF1F5` | `--color-muted` | Skeletons, subtle fills |
| Muted Foreground | `#64748B` | `--color-muted-foreground` | Secondary copy, meta text |
| Border | `#E2E8F0` | `--color-border` | Card/input borders |
| Success | `#16A34A` | `--color-success` | "Còn hàng" stock badges |
| Destructive | `#DC2626` | `--color-destructive` | Errors, "Hết hàng", delete actions |
| On Destructive | `#FFFFFF` | `--color-on-destructive` | |
| Ring | `#161A20` | `--color-ring` | Focus ring |

**Notes:** Dark charcoal (not pure black) reads as premium without looking like a generic dark-mode template;
red stays reserved for CTA/sale so it keeps its urgency signal instead of being decorative.

### Typography

Both fonts verified to include the **`vietnamese`** Google Fonts subset (hard requirement — full diacritic coverage).

- **Heading Font:** Oswald (condensed, bold — automotive/motorsport character, strong at hero/display sizes)
- **Body Font:** Inter (highly legible at small sizes, clean numerals — important for prices)
- **Label/Eyebrow/Mono Font:** JetBrains Mono (uppercase eyebrows, badges, timestamps — technical accent, replaces the
  original DM Mono which lacked a `vietnamese` subset)
- **Mood:** confident, sporty, trustworthy, technical without being cold
- **Google Fonts:**
```css
@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@500;600;700&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@400;500&display=swap');
```
- Heading weights: 600–700 for H1/H2, 500 for smaller headings/labels
- Body: 400 default, 500/600 for emphasis and prices

### Spacing Variables

| Token | Value | Usage |
|-------|-------|-------|
| `--space-xs` | `4px` | Tight gaps |
| `--space-sm` | `8px` | Icon gaps, inline spacing |
| `--space-md` | `16px` | Standard padding |
| `--space-lg` | `24px` | Section padding |
| `--space-xl` | `32px` | Large gaps |
| `--space-2xl` | `48px` | Section margins |
| `--space-3xl` | `64px` | Hero padding |

### Shadow Depths

| Level | Value | Usage |
|-------|-------|-------|
| `--shadow-sm` | `0 1px 2px rgba(15,23,42,0.06)` | Subtle lift (buttons) |
| `--shadow-md` | `0 4px 12px rgba(15,23,42,0.08)` | Product cards (resting) |
| `--shadow-lg` | `0 12px 24px rgba(15,23,42,0.12)` | Product cards (hover), dropdowns |
| `--shadow-xl` | `0 24px 48px rgba(15,23,42,0.16)` | Modals |

---

## Component Specs

### Buttons

```css
.btn-primary {
  background: var(--color-primary);
  color: var(--color-on-primary);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 200ms ease, transform 200ms ease;
  cursor: pointer;
}
.btn-primary:hover { background: #0F1318; transform: translateY(-1px); }

.btn-accent {
  background: var(--color-accent);
  color: var(--color-on-accent);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: background-color 200ms ease, transform 200ms ease;
  cursor: pointer;
}
.btn-accent:hover { background: #B91C1C; transform: translateY(-1px); }

.btn-secondary {
  background: transparent;
  color: var(--color-primary);
  border: 1.5px solid var(--color-border);
  padding: 12px 24px;
  border-radius: 8px;
  font-weight: 600;
  transition: border-color 200ms ease, background-color 200ms ease;
  cursor: pointer;
}
.btn-secondary:hover { border-color: var(--color-primary); background: var(--color-muted); }
```

### Product Cards

```css
.product-card {
  background: var(--color-card);
  border: 1px solid var(--color-border);
  border-radius: 12px;
  overflow: hidden;
  box-shadow: var(--shadow-sm);
  transition: box-shadow 200ms ease, transform 200ms ease;
}
.product-card:hover {
  box-shadow: var(--shadow-lg);
  transform: translateY(-3px);
}
```
No layout-shifting scale transforms — only translateY + shadow, so grid neighbors never jump.

### Inputs

```css
.input {
  padding: 12px 16px;
  border: 1px solid var(--color-border);
  border-radius: 8px;
  font-size: 16px;
  transition: border-color 200ms ease, box-shadow 200ms ease;
}
.input:focus {
  border-color: var(--color-primary);
  outline: none;
  box-shadow: 0 0 0 3px rgba(22,26,32,0.12);
}
```

### Modals

```css
.modal-overlay { background: rgba(15,23,42,0.55); }
.modal {
  background: var(--color-card);
  border-radius: 16px;
  padding: 32px;
  box-shadow: var(--shadow-xl);
  max-width: 560px;
  width: 92%;
}
```
No `backdrop-filter: blur()` — keep the overlay a plain dark scrim for contrast/perf, not glass.

---

## Style Guidelines

**Style:** Minimalism & Swiss Style (`--domain style`, verified match for "clean premium minimal ecommerce trustworthy")
adapted with soft product-card elevation (`shadow-sm` → `shadow-lg` on hover) for retail warmth — pure Swiss minimalism
reads too austere for a product-photo-driven storefront.

**Keywords:** clean, spacious, functional, grid-based, high contrast, generous white space, essential

**Key Effects:** Subtle translateY + shadow lift on hover (200ms), no blur/glass, no gradients, single accent color
used sparingly and consistently for CTA/sale.

### Page Pattern

**Pattern Name:** Feature-Rich Showcase (already structurally correct in the existing build)

- **Section Order:** Hero (value prop) → Trust strip (4 guarantees) → Category grid → Featured products →
  Editorial/brand story → New arrivals → Footer
- **CTA Placement:** Hero primary CTA + repeated "Xem chi tiết"/"Thêm vào giỏ" on every product card + footer CTA

---

## Anti-Patterns (Do NOT Use)

- ❌ Glassmorphism / Liquid Glass (`backdrop-filter: blur()`) — wrong register for this product, real contrast risk
- ❌ Vibrant & Block-based / neon colors — too playful for safety gear
- ❌ Luxury serif display type (Cormorant, Playfair, etc.) — wrong mood, and **no Vietnamese subset**
- ❌ Emojis as icons — use `lucide-react` (already in use)
- ❌ Missing `cursor-pointer` on clickable elements
- ❌ Scale-transform hovers that shift sibling layout — use translateY only
- ❌ Text contrast below 4.5:1
- ❌ Instant (0ms) state changes — always transition 150–300ms
- ❌ Invisible focus states — visible focus ring required (keyboard nav)

---

## Pre-Delivery Checklist

- [ ] No emojis used as icons
- [ ] All icons from `lucide-react` consistently
- [ ] `cursor: pointer` on all clickable elements
- [ ] Hover states with smooth transitions (150–300ms)
- [ ] Text contrast 4.5:1 minimum (verify red accent on white, and white text on charcoal)
- [ ] Focus states visible for keyboard navigation
- [ ] `prefers-reduced-motion` respected
- [ ] Responsive: 375px, 768px, 1024px, 1440px, no horizontal scroll
- [ ] All Vietnamese diacritics render correctly in both fonts at every weight used
- [ ] No content hidden behind the sticky header
