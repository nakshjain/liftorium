---
target: live workout page
total_score: 33
p0_count: 2
p1_count: 2
timestamp: 2026-06-13T20-01-18Z
slug: ontend-src-app-features-workouts-live-workout-page
---
# Design Critique: Live Workout Page

**Target**: `frontend/src/app/features/workouts/live-workout-page`  
**Date**: 2026-06-14

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 4 | n/a — timer, metrics, rest countdown all excellent |
| 2 | Match System / Real World | 4 | n/a — mirrors gym workflow perfectly |
| 3 | User Control and Freedom | 3 | No undo for accidentally completed sets |
| 4 | Consistency and Standards | 4 | n/a — cohesive teal/amber/rose semantic colors |
| 5 | Error Prevention | 2 | No confirmation for destructive actions (Finish, Reset, Remove) |
| 6 | Recognition Rather Than Recall | 4 | n/a — previous set data inline eliminates memory load |
| 7 | Flexibility and Efficiency | 3 | No keyboard shortcuts or exercise reordering |
| 8 | Aesthetic and Minimalist Design | 4 | n/a — zero decorative elements, appropriate density |
| 9 | Error Recovery | 2 | Save failures are silent, stale workout auto-complete invisible |
| 10 | Help and Documentation | 3 | No tooltips for rest timer behavior |
| **Total** | | **33/40** | **Good (82.5%)** — Address weak areas, solid foundation |

---

## Anti-Patterns Verdict

### Does this look AI-generated?

**No.** This is clean, task-focused product UI with zero AI tells.

**LLM assessment**: No glassmorphism, no gradient text, no side-stripe borders, no hero-metric template, no identical card grids, no decorative uppercase eyebrows, no numbered section scaffolding. The uppercase labels (e.g., "PREVIOUS", "SET") serve functional hierarchy, not decoration. The design is appropriately restrained for a product UI where design serves the task. The teal-on-dark aesthetic is committed and consistent, not the generic SaaS-cream default.

**Deterministic scan**: The automated detector found **2 findings** in the HTML file, both **false positives**:
- Lines 34 and 297: Flagged `text-zinc-950` on `bg-teal-400` as "gray on color"
- Reality: `zinc-950` is near-black (`rgb(9, 9, 11)`), not gray. Contrast ratio is **~12.5:1** — well above WCAG AA requirements
- These are high-contrast, accessible primary CTA buttons

---

## Overall Impression

**What works**: The inline previous-set data is a killer feature — seeing "15kg×8" from your last workout right beneath the current input eliminates the universal gym problem of "wait, what did I do last time?" The input flexibility (button mashing vs. precise keyboard) respects the sweaty-hands context, and the state-aware footer keeps rest controls accessible without modal friction.

**What doesn't**: Silent failures everywhere. Workout save errors never notify the user. Exercise search failures leave a blank list with no explanation. Destructive actions (Finish, Reset, Remove exercise with data) have no confirmation. In a sweaty-hands, distracted environment, fat-finger errors are likely—and currently unrecoverable.

**Biggest opportunity**: **Add bulletproof error feedback and destructive-action confirmations.** The UX is solid; the missing piece is safety and transparency. A "Finish workout?" confirmation modal and toast notifications for save/load errors would close the gap between "good" (33/40) and "excellent" (36+).

---

## What's Working

1. **Previous set data inline (line 203)**: Showing "15kg×8" from last workout directly beneath the set number eliminates cross-session memory load. This is the defining feature of gym logging apps—perfectly executed here.

2. **Input flexibility (lines 206-228)**: The three-part stepper (−/input/+) accommodates both button mashing (sweaty hands, gloves) and precise keyboard entry. Weight increments of 2.5kg match physical plate standards. Mobile keyboard optimization (`inputmode="decimal"`, `inputmode="numeric"`) is thoughtful.

3. **State-aware footer (lines 270-304)**: The fixed bottom sheet only appears when workout is active and not paused. Rest controls (+30s, Skip) are immediately accessible without modal friction. This respects the "phone in hand between sets" usage context.

---

## Priority Issues

### [P0] Workout save failure is silent
**What**: If the server call fails when finishing a workout (store line 267), the user never knows. They see "Workout finished" success state but data is lost.

**Why it matters**: Users trust that tapping "Finish" saves their session. Silent failures break that trust. In a gym context where data entry is tedious, losing 45 minutes of logged sets is catastrophic.

**Fix**: 
1. Show toast notification on save error: "Failed to save workout. [Retry] [Export to file]"
2. Keep workout state in store until save succeeds
3. Offer local JSON export as fallback

**Suggested command**: `/impeccable harden` (production-ready error handling)

---

### [P0] No confirmation for "Finish workout"
**What**: The "Finish" button (line 299) ends the session and triggers save with no preview or confirmation.

**Why it matters**: In a sweaty-hands, distracted gym environment, fat-finger taps are likely. Once finished, the user can't add more sets. If they meant to tap "Skip rest" or accidentally brushed the button while repositioning the phone, they lose the ability to continue.

**Fix**: Add confirmation modal:
```
Finish workout?
12 sets logged • 2,450kg total volume
[Cancel] [Finish]
```

**Suggested command**: `/impeccable harden`

---

### [P1] No confirmation for "Reset workout"
**What**: The "Reset workout" button (line 44) is irreversible and appears on the paused screen with no confirmation.

**Why it matters**: "Reset" wipes all logged sets. If the user intended to tap "Resume" but missed by 20px, they lose all progress. Undo is impossible.

**Fix**: Add confirmation modal:
```
Reset workout?
All logged sets will be lost.
[Cancel] [Reset]
```

**Suggested command**: `/impeccable harden`

---

### [P1] Exercise search error is invisible
**What**: If the exercise API fails (store line 86), the loading spinner stops but nothing explains why the list is empty.

**Why it matters**: Users assume the search worked but returned no results. They might retype the query, close and reopen the app, or give up. No indication that a network/server error occurred.

**Fix**: Show inline error state:
```
Failed to load exercises.
[Retry]
```

**Suggested command**: `/impeccable harden`

---

### [P2] Stale workout auto-complete is silent
**What**: Workouts older than 23 hours auto-complete (store line 350-362). User opens app the next day, their workout is gone.

**Why it matters**: Users might think data was lost, not auto-saved. Creates confusion and distrust.

**Fix**: Show toast on mount if auto-complete happened:
```
Yesterday's workout was auto-saved (12 sets).
[View history]
```

**Suggested command**: `/impeccable harden`

---

## Persona Red Flags

### Casey (Distracted Mobile User)
**Primary action**: Log a set mid-workout while holding phone in one hand, sweaty, distracted, bright overhead lights.

**Red flags**:
- **No confirmation for "Finish"**: Fat-finger tap on slippery screen ends workout prematurely. High frustration risk.
- **Silent save failures**: Returns to phone after cooldown, assumes data saved. Opens app later, session gone. Abandonment risk.
- **No haptic/audio rest timer**: Must keep checking phone during rest to avoid missing when timer ends. Competes with attention needed for form setup.

---

### Riley (Deliberate Stress Tester)
**Primary action**: Push the workout flow beyond happy paths—long sessions, edge inputs, interruptions, refresh mid-workout.

**Red flags**:
- **No indicator for 30+ exercises**: Horizontal scroll for exercise picker shows 30 items. No "scroll for more" hint or "Showing 30 of 847" count.
- **Stale workout auto-complete is silent**: Opens app 24 hours later, data gone. No explanation. Looks like a bug.
- **Save error only logs to console**: Network failures during save leave user with "success" UI but no data persisted. Undetectable by user.
- **No max-sets warning**: Logging 47 sets in one workout creates infinite scroll with no soft warning or summary collapse pattern.

---

### Jordan (Confused First-Timer)
**Primary action**: Start first workout, add exercises, log first set, understand rest timer.

**Red flags**:
- **"90s rest" has no explanation**: What does this mean? Does it auto-start? Can I skip? No tooltip or first-run guidance.
- **"New" set label unexplained**: Set row shows "NEW" instead of previous data. User doesn't know this means "no previous session data."
- **Exercise search shows 30 items with no count**: Is this all exercises or just the first page? No "Showing 30" indicator.

---

## Minor Observations

- The "Available" count (line 133) updates reactively as exercises are added—nice detail but serves no critical function. Could be removed to reduce clutter.
- Tabular nums (`tabular-nums` class lines 116, 120, 124) ensure metrics don't shift width—excellent typographic detail.
- Empty state copy (line 28-30) is specific and helpful, not generic marketing fluff: "Create a plan to organize workouts by day."
- The `active:scale-[0.99]` button feedback (lines 34, 231, etc.) provides tactile response appropriate for touch context.
- Header sticky positioning (line 3) keeps elapsed timer visible during scroll—critical for long workouts with many exercises.
- SCSS file is empty—all styling is Tailwind inline. Correct per project conventions, but means no custom CSS escape hatch exists if needed.
- Toggling set completion doesn't reset rest timer (line 235): If user accidentally taps "Done", untapping removes checkmark but timer keeps running. Minor UX inconsistency.

---

## Questions to Consider

1. **Why can't I reorder exercises?** If I add Squats, Bench, Deadlift and realize I want Deadlift first, I have to remove and re-add. Drag handles would break the minimalist aesthetic—but is there a one-tap "Move up/down" pattern that fits?

2. **What happens if I log 47 sets in one workout?** The page will scroll infinitely. Should there be a soft warning at ~15-20 exercises ("This is a lot—consider splitting into multiple sessions") or collapse completed exercises into summary cards?

3. **Why doesn't the rest timer make sound?** In a loud gym, visual-only countdown means I have to keep checking my phone. A subtle haptic buzz or optional audio ping at 10s remaining would let me focus on rest without staring at the screen. Too opinionated for default behavior?
