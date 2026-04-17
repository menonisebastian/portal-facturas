# Design System Specification: The Architectural Ledger

## 1. Overview & Creative North Star: "Precision Atmospheric"
This design system moves beyond the "fintech template" by embracing **Precision Atmospheric** design. In high-end finance, trust is built through clarity, but prestige is built through depth. We achieve this by rejecting the rigid, boxy constraints of standard UI in favor of an editorial layout that feels curated and expansive.

**The North Star:** Treat the screen as a physical workspace of layered glass and slate. We use intentional asymmetry, generous white space (breathing room), and a sophisticated interplay of typography scales to guide the eye. Instead of "fencing in" content with lines, we allow data to sit with authority on tonal islands.

---

## 2. Color & Tonal Architecture
The palette is rooted in deep, cinematic slates and a singular, high-energy primary blue. 

### The "No-Line" Rule
**Borders are a failure of hierarchy.** To maintain a premium aesthetic, 1px solid borders for sectioning are strictly prohibited. Boundaries must be defined through:
- **Background Shifts:** Placing a `surface-container-low` element on a `surface` background.
- **Tonal Transitions:** Using the hierarchy of containers to "lift" or "sink" content.

### Surface Hierarchy & Nesting
Depth is built by stacking our `surface-container` tiers. This creates a "nested" physical reality:
- **Base Level:** `surface` (#0b1326) – The infinite floor.
- **Sectioning:** `surface-container-low` (#131b2e) – Large structural regions.
- **Interactive Elements:** `surface-container` (#171f33) – Cards and primary content areas.
- **Elevated States:** `surface-container-high` (#222a3d) – Hover states or active modals.

### The "Glass & Gradient" Rule
To inject "soul" into the professional interface:
- **Glassmorphism:** For floating navigation or overlays, use `surface-variant` at 60% opacity with a `20px` backdrop blur.
- **Signature Gradients:** Main CTAs or Hero data points should utilize a subtle linear gradient from `primary` (#bfc2ff) to `primary-container` (#1111bb) at a 135-degree angle. This prevents the "flat" look and adds a sense of light source.

---

## 3. Typography: Editorial Authority
We pair **Manrope** (Headlines) with **Inter** (Body) to balance modern architectural structure with high-utility legibility.

- **Display (Manrope):** Large, airy, and bold. Used for high-level portfolio totals. It signals confidence.
- **Headline (Manrope):** Reserved for section titles. Use asymmetric placement (e.g., flush left with a wide right margin) to create an editorial feel.
- **Body (Inter):** Tight tracking and optimized line heights (1.5x) for dense financial data.
- **Labels (Inter):** Always in `label-md` or `label-sm` using `on-surface-variant` (#c6c5d8). These should feel like metadata—secondary to the primary figures.

---

## 4. Elevation & Depth: Tonal Layering
Traditional drop shadows are often messy. We use **Tonal Layering** to convey importance.

- **The Layering Principle:** Instead of a shadow, place a `surface-container-lowest` card (#060e20) inside a `surface-container-low` section. This "recessed" look is a hallmark of high-end digital craftsmanship.
- **Ambient Shadows:** If an element must float (e.g., a dropdown), use a shadow color tinted with the primary hue: `rgba(11, 19, 187, 0.08)` with a `48px` blur and `0px 12px` offset.
- **The "Ghost Border" Fallback:** If accessibility requires a stroke, use the `outline-variant` token at **15% opacity**. It should be felt, not seen.
- **Depth Integration:** Use backdrop blurs on any element that sits "above" the content. This integrates the component into the environment rather than making it look "pasted on."

---

## 5. Components

### Buttons
- **Primary:** Gradient fill (`primary` to `primary-container`). Roundedness `md` (0.375rem). No border.
- **Secondary:** Surface-tinted. Background: `surface-container-high`, Text: `primary`.
- **Tertiary:** Text-only using `primary` color. No container. High-end interfaces use these for "lesser" actions to reduce visual noise.

### Cards & Lists
- **Rule:** **Strictly no divider lines.**
- Separate transactions or list items using `8px` of vertical white space or a subtle toggle between `surface-container-low` and `surface-container-lowest`.
- **Roundedness:** Cards use `xl` (0.75rem) for a friendly yet structured feel.

### Input Fields
- **Background:** `surface-container-lowest`. 
- **Border:** None (or Ghost Border on focus).
- **Focus State:** A 2px glow using `primary` at 30% opacity. This mimics a "lit from within" effect.

### Chips & Tags
- Used for "Status" (e.g., Pending, Completed). Use `secondary-container` with `on-secondary-container` text. Keep them small (`label-sm`) and pill-shaped (`full` roundedness).

### Specialized Component: The "Data Monolith"
For financial totals, use `display-lg` typography with a subtle `primary` glow behind the text to make the numbers feel like the "hero" of the experience.

---

## 6. Do's and Don'ts

### Do:
- **Do** use `primary_container` (#1111bb) as your primary "action" color against the dark slate.
- **Do** lean into asymmetry. A right-aligned button next to a left-aligned headline creates professional tension.
- **Do** use `on-surface-variant` for all non-essential text to maintain high contrast only where it matters.

### Don't:
- **Don't** use pure black (#000000). It kills the "Atmospheric" depth. Use `surface` (#0b1326).
- **Don't** use 1px solid borders to separate sections of a page.
- **Don't** use standard "Material Design" shadows. They are too heavy for a high-end financial aesthetic.
- **Don't** overcrowd the interface. If a screen feels full, increase the spacing scale rather than shrinking the font.

### Accessibility Note
While we prioritize aesthetic depth, ensure all `on-surface` text against `surface` containers maintains a minimum contrast ratio of 4.5:1. Use `primary` accents only for interactive or highlighted states to avoid "color fatigue."