---
target: plan page
total_score: 25
p0_count: 2
p1_count: 2
timestamp: 2026-06-13T20-47-51Z
slug: frontend-src-app-features-plan-plan-page
---
# Design Critique: Plan Page

**Target**: `frontend/src/app/features/plan/plan-page`  
**Date**: 2026-06-14

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No loading indicator on mount, no unsaved changes indicator |
| 2 | Match System / Real World | 3 | Good gym terminology, minor abstraction in "6/7 active days" |
| 3 | User Control and Freedom | 2 | No undo for destructive actions, unclear Reset behavior |
| 4 | Consistency and Standards | 4 | n/a — excellent consistency across all patterns |
| 5 | Error Prevention | 2 | No confirmation for destructive actions, no autosave |
| 6 | Recognition Rather Than Recall | 3 | Good template/exercise visibility, missing some status indicators |
| 7 | Flexibility and Efficiency | 1 | No keyboard shortcuts, no bulk actions, no exercise reordering |
| 8 | Aesthetic and Minimalist Design | 4 | n/a — purposeful, clear hierarchy, appropriate density |
| 9 | Error Recovery | 1 | Weak error messages, no retry buttons, no detail on failures |
| 10 | Help and Documentation | 2 | Minimal help, relies on self-evident design |
| **Total** | | **25/40** | **Acceptable (62.5%)** — Significant improvements needed |

---

## Anti-Patterns Verdict

### Does this look AI-generated?

**No.** This is clean, task-focused product UI built for a specific workflow.

**LLM assessment**: The design feels intentional and purpose-built. No gradient text, no glassmorphism, no hero-metric cards, no identical card grids. The uppercase labels ("ACTIVE DAYS", "START FROM A TEMPLATE") are functional section headers in a complex form interface, not decorative eyebrows. The template chip carousel is a practical mobile pattern. The accordion-style day editor keeps weekly context visible—this is thoughtful interaction design, not template-driven sameness. The aesthetic is appropriately restrained for product UI where design serves the task.

**Deterministic scan**: The automated detector found **2 findings**, both **false positives**:
- Line 183: Flagged `text-zinc-600` on `bg-red-500` — detector misread hover state classes; the default state is `text-zinc-600` on dark `bg-zinc-900/40`, and the hover state applies both `hover:bg-red-500/10` and `hover:text-red-400` together
- Line 329: Flagged `text-zinc-950` on `bg-teal-500` — `zinc-950` is near-black (`#09090b`), not gray; this is a standard high-contrast button pattern that exceeds WCAG AAA standards

**Cognitive load**: 3 checklist failures (moderate severity) — 8 muscle group toggles exceed chunking limits, template picker shows 5 options, day editor reveals all complexity at once without progressive disclosure.

---

## Overall Impression

**What works**: The inline editing pattern is the killer feature here—expand a day to edit without losing sight of the full week. No modals, no navigation depth, no context switching. The template system with clear visual selection (teal border + background tint) makes it obvious which structure you're working from. The "today" indicator helps users orient themselves in recurring usage.

**What doesn't**: This interface is a data-loss minefield. Tap the X on an exercise with 5 configured sets—it's gone instantly, no confirmation, no recovery. Exercise search fails silently if the backend is down. No autosave means 10 minutes of configuration work disappears if you navigate away. These aren't edge cases; they're the primary failure modes for sweaty-handed gym-goers using a phone between sets.

**Biggest opportunity**: **Add bulletproof safety rails for destructive actions and data persistence.** The workflow is solid; the missing piece is protection against fat-finger mistakes and unexpected failures. Confirmation modals, undo toasts, autosave, and retry buttons would transform this from "functional but risky" (25/40) to "production-ready" (34+).

---

## What's Working

1. **Inline day editor (lines 93-287)**: Expanding a day reveals the editor inside the same view, keeping the full week visible. This respects the mental model—you're always editing "the week," not navigating to "day detail page." No modal takeover, no back-button confusion.

2. **Template selection state (lines 41-57)**: Active template gets teal border + `bg-teal-500/5` tint + bold text. Visual hierarchy makes it instantly clear which structure you're building from. The dashed-border "Custom" option differentiates it as the blank-slate alternative.

3. **Today indicator (line 73)**: Current day shows `text-teal-400` with a leading dot. Subtle but effective orientation cue for users returning daily. Pairs well with "Mon, Tue, Wed..." labels that speak the user's language.

---

## Priority Issues

### [P0] No undo for destructive actions
**What**: Tapping the X icon to remove an exercise (line 183) deletes it instantly—no confirmation, no undo. If the exercise has configured sets or custom rep ranges, that work is gone.

**Why it matters**: This violates the "gym-proof" design principle. Sweaty hands on a phone between sets cause fat-finger taps. Losing 5-10 minutes of configuration work because of an accidental tap is catastrophic to user trust. The design assumes perfect input accuracy in an explicitly inaccurate environment.

**Fix**: Add confirmation dialog for removing exercises with >1 set or custom reps: "Remove Bench Press? (3 sets configured) [Cancel] [Remove]". Alternative: undo toast pattern ("Exercise removed. [Undo]") with 5-second window.

**Suggested command**: `/impeccable harden`

---

### [P0] Exercise search fails silently if backend is down
**What**: If the exercise API fails or returns empty (line 258), users see "Failed to load exercises" but no retry button. Search becomes non-functional. Users are stuck—can't add exercises, can't complete their plan.

**Why it matters**: Network failures happen, especially in gyms (basement locations, thick walls, airplane mode accidents). A failed exercise fetch renders the entire plan editor useless. The error message names the problem but offers no recovery path.

**Fix**: Add "Retry" button next to error message that calls `planStore.loadExercises()` again. Consider caching the exercise catalog in localStorage as offline fallback—exercises rarely change, so stale data is better than no data.

**Suggested command**: `/impeccable harden`

---

### [P1] No autosave or unsaved changes warning
**What**: The sticky save bar (line 322) requires manual "Save plan" button tap. There's no autosave, no indication of unsaved changes, no browser `beforeunload` warning.

**Why it matters**: User spends 10 minutes configuring their week, then navigates away (muscle memory from other apps that autosave, or browser back-button accident)—all work lost. Requiring memory and diligence to save manually contradicts the "momentum, not friction" principle.

**Fix**: Implement autosave with 2-3 second debounce after last change, OR add unsaved changes indicator ("• Unsaved changes" in save bar) + browser `beforeunload` warning. Show visual diff: save bar background changes to amber when plan differs from server state.

**Suggested command**: `/impeccable harden`

---

### [P1] Reset button behavior is ambiguous
**What**: The "Reset" button (line 324) fetches plan from server, but the label doesn't clarify intent. Does it discard edits? Restore last save? Reset to empty plan?

**Why it matters**: Users don't know what this button does, so they're hesitant to use it even when it would help. Risky-sounding button with unclear outcome creates anxiety. The code shows it's actually "revert to saved state," but the label doesn't communicate that.

**Fix**: Rename to "Revert to saved" or "Discard changes" with a rotate-left icon. Add confirmation modal: "Discard unsaved changes and restore your last saved plan? [Cancel] [Revert]"

**Suggested command**: `/impeccable clarify`

---

### [P2] Muscle group selection shows 8 options
**What**: When expanding a day editor, 8 muscle group toggle buttons appear (lines 103-133): Chest, Back, Shoulders, Biceps, Triceps, Forearms, Legs, Cardio.

**Why it matters**: Cognitive overload—users must scan all 8 to find relevant groups. Violates chunking principle (max 4 items per group). Increases decision time and error rate. Users configuring an upper-body day still see Legs and Cardio, adding noise.

**Fix**: Group into "Upper" (Chest, Back, Shoulders, Arms) and "Lower" (Legs, Cardio) with expand/collapse, or show common combinations as quick-picks: "Push (Chest, Shoulders, Triceps)", "Pull (Back, Biceps)", "Legs". Progressive disclosure reduces initial choice count to 3-4.

**Suggested command**: `/impeccable distill`

---

### [P2] No reordering of exercises
**What**: Users can't reorder exercises once added. If you add exercises in wrong order (e.g., deadlifts after isolation work), you must remove and re-add to fix.

**Why it matters**: Exercise order matters for training—compound lifts first, isolation later. Friction in core workflow. Users see the mistake after adding 3-4 exercises, then face tedious delete/re-add loop.

**Fix**: Add drag handles to exercise cards for reorder (drag target at least 48px for thumb-friendly interaction), or add up/down arrow buttons on each exercise. Touch-and-hold to drag on mobile.

**Suggested command**: `/impeccable craft reordering`

---

### [P3] Template descriptions truncated in chips
**What**: Line 48 splits template description on " — " and shows only the first part in chips. Users see "6 days" but not "high frequency, great for intermediate lifters" until after selection.

**Why it matters**: Users can't evaluate templates without selecting them first. Hidden context forces trial-and-error ("pick one, see what happens, go back, pick another").

**Fix**: Show full description below template picker when hovering/focusing a chip. Mobile: on tap (before selection), show description in a toast or inline expansion.

**Suggested command**: `/impeccable polish`

---

## Persona Red Flags

### Casey (Distracted Mobile User)
**Primary action**: Configure a weekly plan on phone, one-handed, interrupted by gym sounds and visual distractions.

**Red flags**:
- **No autosave**: Switches to Spotify mid-configuration, returns to browser—all work gone. High abandonment risk.
- **8 muscle groups visible at once**: Thumb must scroll up to reach "Chest" after expanding day editor. Divides attention.
- **No loading skeleton on mount**: Blank screen until plan fetches—looks broken, not loading. User refreshes page, creating a loop.
- **Primary save button requires scroll on smaller phones**: Sticky bar at bottom is good, but if day editor is expanded, "Save plan" may be off-screen (below fold).

---

### Riley (Deliberate Stress Tester)
**Primary action**: Test edge cases—add many exercises, remove and re-add, rapid template switching, leave page without saving.

**Red flags**:
- **Rapid template switching has no protection**: Clicking 4 templates in 2 seconds triggers 4 server overwrites. No debounce, no "are you sure?" State thrashing likely.
- **Removing last exercise leaves empty day with no guidance**: Day editor shows muscle groups + "Add an exercise" but no explicit "This day is now empty" message.
- **Exercise search with 1 character shows nothing**: No hint that results require 2+ chars. User thinks search is broken.
- **No indication of whether "Reset" affects unsaved changes only or entire plan**: Ambiguous destruction zone.

---

### Jordan (Confused First-Timer)
**Primary action**: Create first training plan, understand templates, configure exercises and sets.

**Red flags**:
- **Template selection triggers immediate overwrite**: No confirmation. User clicks "PPL (6 days)" → plan changes instantly. Feels risky.
- **Muscle group labels with no context**: What's the difference between "Biceps" and "Triceps" days? User doesn't know gym taxonomy yet.
- **"Active days 6/7" metric is abstract**: First-timers don't know what this means—"I'm training 6 days?" "There are 7 possible active days?" Show actual day names instead.
- **No help text for first-run experience**: User sees complex interface (templates, days, muscle groups, sets/reps) with no onboarding.

---

## Minor Observations

- Active days metric (line 23: "6/7") is abstract—users care about *which* days, not *how many*. "Mon, Tue, Wed, Thu, Fri, Sat" is clearer.
- Exercise search requires 2+ characters but no hint appears when user types 1 char—could show "Keep typing..." message.
- Set removal button only shows when `sets.length > 1` (line 207), which is correct, but last set has no visual distinction that it's non-removable.
- Search results show `primaryMuscles` on right (line 263) in `text-zinc-500`—low contrast, hard to read while scrolling quickly.
- No loading skeleton for initial page load—screen is blank until plan fetches from server. User doesn't know if it's loading or broken.
- Template selection triggers immediate plan overwrite with no confirmation—less dangerous than exercise removal but still destructive.
- "Add an exercise below" text (line 146) when no exercises exist could be more directive: "Add your first exercise to start".
- The sticky save bar is always visible (56px+ of screen space)—could hide until changes are detected to maximize plan viewing area.

---

## Questions to Consider

1. **Why does "Reset" fetch from server instead of reverting to pre-edit local state?** Is the assumption that users never want to discard just this session's changes, only restore the last server save? If so, what about mid-edit "oops, I want to start this day over"?

2. **What happens if a user toggles between templates multiple times rapidly?** Are there protections against state thrashing (debounce, queued updates), or does each click overwrite the previous async call's result?

3. **Could the day editor use progressive disclosure?** Instead of showing all 8 muscle groups + exercise list + search at once, reveal sections as user completes each step: name → muscle groups → exercises → sets. Would this reduce cognitive load or add friction?

4. **Why is exercise reordering not supported?** Was it deferred for MVP, or is there a technical constraint (backend expects fixed order)? Users will need this eventually.
