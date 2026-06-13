---
name: Liftorium
description: Workout logging built for the rack, not the couch.
colors:
  teal-primary: "#2dd4bf"
  teal-deep: "#14b8a6"
  teal-glow: "#5eead4"
  zinc-bg: "#09090b"
  zinc-surface: "#18181b"
  zinc-border: "#27272a"
  zinc-muted: "#71717a"
  zinc-ink: "#f4f4f5"
  rose-error: "#fda4af"
  amber-warning: "#fbbf24"
typography:
  display:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "2.25rem"
    fontWeight: 600
    lineHeight: 1.15
    letterSpacing: "-0.025em"
  headline:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.5rem"
    fontWeight: 600
    lineHeight: 1.3
    letterSpacing: "-0.015em"
  title:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "1.125rem"
    fontWeight: 600
    lineHeight: 1.4
  body:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 400
    lineHeight: 1.75
  label:
    fontFamily: "Geist Variable, ui-sans-serif, system-ui, sans-serif"
    fontSize: "0.75rem"
    fontWeight: 500
    lineHeight: 1.5
    letterSpacing: "0.05em"
rounded:
  sm: "8px"
  md: "12px"
  lg: "16px"
spacing:
  xs: "8px"
  sm: "12px"
  md: "16px"
  lg: "24px"
  xl: "32px"
  section: "40px"
components:
  button-primary:
    backgroundColor: "{colors.teal-primary}"
    textColor: "{colors.zinc-bg}"
    rounded: "{rounded.sm}"
    padding: "16px 20px"
    height: "48px"
  button-primary-hover:
    backgroundColor: "{colors.teal-glow}"
    textColor: "{colors.zinc-bg}"
  button-secondary:
    backgroundColor: "transparent"
    textColor: "{colors.zinc-ink}"
    rounded: "{rounded.sm}"
    padding: "16px 20px"
    height: "48px"
  button-destructive:
    backgroundColor: "transparent"
    textColor: "{colors.rose-error}"
    rounded: "{rounded.sm}"
    padding: "16px 20px"
    height: "48px"
  input-default:
    backgroundColor: "{colors.zinc-bg}"
    textColor: "{colors.zinc-ink}"
    rounded: "{rounded.sm}"
    padding: "12px 16px"
    height: "48px"
  card-surface:
    backgroundColor: "rgba(24, 24, 27, 0.4)"
    textColor: "{colors.zinc-ink}"
    rounded: "{rounded.md}"
    padding: "24px"
  chip-default:
    backgroundColor: "{colors.zinc-surface}"
    textColor: "{colors.zinc-ink}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
  chip-active:
    backgroundColor: "{colors.teal-primary}"
    textColor: "{colors.zinc-bg}"
    rounded: "{rounded.sm}"
    padding: "8px 16px"
---

# Design System: Liftorium

## 1. Overview

**Creative North Star: "The Training Partner"**

Liftorium's interface is present, pushing, responsive. It doesn't wait for you — it matches your energy between sets. The system is built for sweaty hands gripping a phone in a rack, overhead fluorescents washing out the screen, divided attention between the bar and the display. Every surface is high-contrast, every target oversized, every animation purposeful and fast.

The aesthetic is dark, dense, and direct. Zinc-black surfaces recede; teal accents pull the eye exactly where it needs to go — the next set, the rest timer, the finish button. There is no decoration. There are no illustrations. Information replaces ornamentation.

This system explicitly rejects: bloated fitness apps with ad-stuffed tabs and endless navigation depth (MyFitnessPal); gamified reward loops with badges, streaks, and childish celebration screens (Duolingo-style fitness); and any surface that asks you to scroll past content to reach your next action.

**Key Characteristics:**
- Dark zinc-950 canvas with teal-400 as the sole accent
- Single font family (Geist Variable) across all hierarchy levels
- Oversized touch targets (minimum 48px, prefer 56px for primary actions)
- Tactile feedback: scale-on-tap, immediate state changes, no choreography
- Information density over visual filler — data the lifter needs is always visible

## 2. Colors

A restrained palette of cold zinc neutrals with a single high-energy teal accent. The teal is functional, not decorative: it marks active state, primary actions, and positive confirmation.

### Primary
- **Training Teal** (#2dd4bf): Primary buttons, active selection indicators, completion checkmarks, rest-timer active state. Applied at full saturation only on interactive elements that demand immediate attention.
- **Deep Teal** (#14b8a6): Subtle tinted backgrounds for active cards and accent containers (at 8-12% opacity). The glow variant of the primary.
- **Bright Teal** (#5eead4): Hover states on primary buttons. Progression from primary.

### Neutral
- **Void Black** (#09090b): Body background. The deepest layer — all content sits on top of this.
- **Surface Dark** (#18181b): Card and container backgrounds (at 40-70% opacity). One step up from void.
- **Border Zinc** (#27272a): All borders, dividers, and separators. Structural, never decorative.
- **Muted Zinc** (#71717a): Secondary text, labels, metadata. Passes 4.5:1 contrast against void black.
- **Ink White** (#f4f4f5): Primary text, headings, data values. Maximum readability.

### Semantic
- **Rose Error** (#fda4af): Destructive actions, validation errors, and error messages. Always paired with a rose-tinted background at 10% opacity.
- **Amber Warning** (#fbbf24): Paused states, caution indicators. The workout-paused state uses amber to differentiate from teal-active.

### Named Rules
**The One Accent Rule.** Teal is the only saturated hue in the product UI. Rose and amber appear exclusively for semantic state (error, warning, pause). If you're reaching for a second accent color, the design has failed.

## 3. Typography

**Body & Display Font:** Geist Variable (with ui-sans-serif, system-ui fallback)

**Character:** A single variable-weight sans-serif carries the entire hierarchy through weight and size alone. The pairing is itself: Geist at 600 for headings, Geist at 400 for body, Geist at 500 uppercase tracked for labels. The result is calm uniformity that keeps the eye on the data, not the letterforms.

### Hierarchy
- **Display** (600, 2.25rem/36px, line-height 1.15, tracking -0.025em): Hero statements on pre-workout and post-workout screens. "Start, tap, lift, repeat." Maximum one per screen.
- **Headline** (600, 1.5rem/24px, line-height 1.3, tracking -0.015em): Section headings, exercise names in the active workout, primary stat values.
- **Title** (600, 1.125rem/18px, line-height 1.4): Card titles, navigation page headers, secondary stat values.
- **Body** (400, 0.875rem/14px, line-height 1.75): Descriptions, helper text, workout notes. Max width 65ch for readable prose.
- **Label** (500, 0.75rem/12px, line-height 1.5, tracking 0.05em, uppercase): Section kickers, stat labels, metadata categories. Always uppercase, always tracked.

### Named Rules
**The Weight-Not-Size Rule.** Hierarchy within a section is expressed through font-weight changes (400 → 600), not size jumps. Size steps are reserved for cross-section hierarchy (label → body → headline). Within a card or stat block, weight does the lifting.

## 4. Elevation

Liftorium is flat by default. Depth is conveyed through background opacity layering (zinc-900 at 40–70% over zinc-950) and border definition (zinc-800 single-pixel strokes), not shadows.

The single exception is the sticky header and bottom toolbar, which use `backdrop-blur` with a semi-transparent zinc-950/95 background. This is structural — separating scrolling content from fixed controls — not decorative.

### Named Rules
**The No-Shadow Rule.** No box-shadow anywhere in the product. Elevation is tonal: zinc-950 (floor) → zinc-900/40 (surface) → zinc-900 (elevated). If something needs to feel "lifted", increase its background opacity and sharpen its border; don't add shadows.

## 5. Components

### Buttons
- **Shape:** Gently curved (8px radius). Never pill-shaped, never sharp-cornered.
- **Primary:** Teal-400 fill, zinc-950 text, 48px minimum height, 56px for critical actions (Start Workout, Finish). Scale to 0.99 on active press.
- **Hover / Focus:** Background shifts to teal-300. Focus ring: 2px teal-400 at 20% opacity.
- **Secondary:** Transparent fill, zinc-700 border stroke, zinc-100 text. Border brightens to zinc-600 on hover.
- **Destructive:** Transparent fill, rose-400 border at 40% opacity, rose-300 text. Border strengthens on hover.
- **Disabled:** Zinc-700 fill, zinc-400 text, cursor-not-allowed. No opacity reduction.

### Chips (Exercise Selector)
- **Style:** Zinc-900 fill, zinc-800 border, zinc-100 text. Horizontal scrolling strip with edge-to-edge bleed on mobile.
- **Active state:** Teal-400 fill with zinc-950 text — full inversion. No intermediate "selected" style.
- **Touch target:** Minimum 48px height with internal padding for comfortable thumb taps between sets.

### Cards / Containers
- **Corner style:** Rounded-xl (12px radius) for primary containers, rounded-lg (8px) for nested elements.
- **Background:** Zinc-900 at 40% opacity (never fully opaque — the void shows through).
- **Border:** Single pixel zinc-800 stroke. Teal-tinted borders (teal-400/25) for promoted or active containers.
- **Internal padding:** 24px (p-6) for primary cards, 16-20px (p-4/p-5) for compact items.
- **No nesting.** Cards never contain cards. Flat list items inside cards use dividers, not sub-containers.

### Inputs / Fields
- **Style:** Zinc-950 fill (darker than card surface), zinc-800 border, 8px radius, 48px height.
- **Focus:** Border shifts to teal-400 with a 2px ring at teal-400/20.
- **Placeholder:** Zinc-600 (passes 4.5:1 against zinc-950).
- **Error:** Rose-300 text below field, no border color change on the field itself.

### Stepper Controls (Weight/Reps Input)
- **Style:** Three-column grid — decrement button | numeric input | increment button — inside a single zinc-800 bordered container.
- **Height:** 44px. Buttons fill full height for maximum tap area.
- **Feedback:** Active press darkens button to zinc-800. No debounce; every tap registers immediately.

### Navigation
- **Header:** Sticky, zinc-950/95 with backdrop-blur, single-pixel zinc-900 border-bottom.
- **Back links:** Text-only, zinc-400 → zinc-200 on hover. No icons, no chevrons.
- **Page title:** Headline weight (600), 1.5rem, tracking-normal. Below the back link.

## 6. Do's and Don'ts

### Do:
- **Do** use teal-400 exclusively for actionable elements (buttons, links, active states). It's a signal, not decoration.
- **Do** make every primary action target at least 48px tall, 56px preferred. Gym gloves and sweaty thumbs are the baseline user.
- **Do** show previous-session data inline with current input (the "previous set" label below each set number).
- **Do** use `active:scale-[0.99]` on tappable elements. Tactile feedback that confirms registration without animation delay.
- **Do** keep the bottom toolbar fixed and always-visible during active workouts. The user's next action lives at thumb height.
- **Do** use zinc-900/40 (translucent) for card backgrounds, never solid zinc-900. The depth comes from seeing through.

### Don't:
- **Don't** add badges, streaks, achievements, or any gamification elements. This is a training tool, not a game.
- **Don't** add social features, feeds, comments, or sharing prompts. The workout is a solo activity.
- **Don't** add ads, upsell banners, or promotional surfaces that interrupt the logging flow.
- **Don't** use shadows or box-shadow anywhere. Elevation is tonal layering only.
- **Don't** introduce a second accent color beyond teal. Rose and amber are semantic-only (error, warning).
- **Don't** use display-size text (>2.25rem) for anything other than the single hero statement per screen.
- **Don't** put navigation items behind hamburger menus or drawers on mobile. Tab bars and direct links only.
- **Don't** animate page transitions or orchestrate staggered loads during active workout logging. Motion is 150-250ms state feedback only.
- **Don't** use opacity reduction for disabled states. Disabled is zinc-700 fill + zinc-400 text — visually distinct, not faded.
