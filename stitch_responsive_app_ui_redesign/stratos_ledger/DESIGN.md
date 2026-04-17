# Design System Specification: Precision Clarity

This design system is built to transform a standard invoice management portal into a high-end editorial experience. We are moving away from the "boxed-in" feel of traditional SaaS and moving toward an architecture of **Tonal Depth**. By prioritizing white space, sophisticated layering, and intentional typography, we create a tool that feels less like a spreadsheet and more like a professional financial dashboard.

---

## 1. Overview & Creative North Star: "The Financial Architect"
The Creative North Star for this system is **The Financial Architect**. Just as high-end architecture uses light, shadow, and material changes to define rooms rather than internal walls, our UI uses tonal shifts and depth to define data.

We break the "template" look through:
*   **Intentional Asymmetry:** Important metrics are given oversized, editorial-style headers while secondary data is tucked into clean, high-contrast labels.
*   **Breathing Room:** We use an aggressive spacing scale to ensure that no single invoice record feels crowded.
*   **Materiality:** Treating the screen as a series of physical layers—frosted glass for navigation, matte paper for data entries.

---

## 2. Colors & Surface Philosophy
The palette is rooted in the authority of **Deep Blue (#11b)** and the modern energy of **Light Indigo (#7473fd)**. 

### The "No-Line" Rule
**Explicit Instruction:** Do not use 1px solid borders to section off the UI. 
Traditional lines create visual noise and "grid fatigue." Instead, define boundaries through:
*   **Background Shifts:** Place a `surface-container-low` card on a `surface` background.
*   **Tonal Transitions:** Use a 4px wide vertical accent of `primary` to denote an active selection rather than outlining the entire element.

### Surface Hierarchy & Nesting
Treat the UI as a physical stack. Each level of "nesting" moves the user closer to the data.
1.  **Base Layer:** `surface` (#fbf9f8) — The desk surface.
2.  **Section Layer:** `surface-container-low` (#f5f3f3) — Large organizational regions (e.g., the Sidebar or Filter Panel).
3.  **Action Layer:** `surface-container-lowest` (#ffffff) — Floating cards for individual invoices or data points.

### The "Glass & Gradient" Rule
To add soul to the interface:
*   **CTAs:** Use a subtle linear gradient from `primary` (#030086) to `primary-container` (#1111bb) at a 135-degree angle.
*   **Overlays:** Use `surface-container-highest` with a 70% opacity and a 20px Backdrop Blur for modals and tooltips to maintain context of the underlying data.

---

## 3. Typography: Editorial Authority
We utilize a dual-typeface system to balance character with utility.

*   **Display & Headlines (Manrope):** Our "Editorial" voice. Use `display-lg` and `headline-md` for high-level totals (e.g., "Total Outstanding"). The geometric nature of Manrope conveys stability and precision.
*   **Body & Labels (Inter):** Our "Functional" voice. All invoice line items, dates, and metadata use Inter. It is chosen for its high x-height and exceptional readability at small sizes (`body-sm`).

**Hierarchy Strategy:**
*   Large `display` styles should use `on-surface` (#1b1c1c) with tight letter-spacing (-0.02em).
*   `label-md` should use `on-surface-variant` (#454555) in All Caps with increased tracking (+0.05em) for secondary metadata like "INVOICE ID."

---

## 4. Elevation & Depth
In this design system, elevation is conveyed through **Tonal Layering** and **Ambient Light**, not structural outlines.

*   **The Layering Principle:** A "floating" card should be `surface-container-lowest` (#ffffff). When it sits on top of a `surface-container-low` background, the natural contrast creates a soft lift.
*   **Ambient Shadows:** For high-priority elements (like an active "Pay Now" modal), use an extra-diffused shadow:
    *   *Y: 20px, Blur: 40px, Color:* `rgba(3, 0, 134, 0.06)` (a primary-tinted shadow).
*   **The "Ghost Border" Fallback:** If a border is required for accessibility (e.g., in a high-density table), use the `outline-variant` (#c6c5d8) at **15% opacity**. It should feel felt, not seen.

---

## 5. Components

### Buttons
*   **Primary:** Gradient of `primary` to `primary-container`. Corner radius: `md` (0.75rem). Use `on-primary` text.
*   **Secondary:** Ghost style. No background, `primary` text, and a `ghost border` on hover.
*   **Tertiary:** No background or border. `on-surface-variant` text.

### Invoice Cards & Lists
*   **Rule:** Forbid divider lines between invoices.
*   **Styling:** Use a 16px vertical gap between invoice rows. Each row is a `surface-container-lowest` container. On hover, transition the background to `primary-fixed` (#e0e0ff) to create a soft, non-intrusive highlight.

### Status Chips
*   **Processed:** Background: `success_container` (or soft green), Text: `on_success`. No border.
*   **Failure:** Background: `error_container` (#ffdad6), Text: `on_error_container` (#93000a). 
*   **Shape:** Use `full` (9999px) roundedness for a modern, friendly feel.

### Input Fields
*   **Styling:** Soft `md` corners. Background is `surface-container-low`. 
*   **Focus State:** A 2px "Glow" using `secondary` (#4a47d2) at 30% opacity, rather than a heavy black outline.

---

## 6. Do's and Don'ts

### Do:
*   **Do** use asymmetrical margins to create a sense of movement (e.g., the right sidebar being wider than the left).
*   **Do** use `primary-fixed` for subtle background highlights behind important data numbers.
*   **Do** prioritize "Tonal Nesting" (Lowest on Low) over shadows.

### Don't:
*   **Don't** use 100% black text (#000). Use `on-surface` (#1b1c1c) for better eye comfort.
*   **Don't** ever use a 1px solid border to separate the sidebar from the main content; use a background color change from `surface` to `surface-container-low`.
*   **Don't** use sharp 90-degree corners. Even the most "professional" components must have at least `sm` (0.25rem) rounding to feel modern.