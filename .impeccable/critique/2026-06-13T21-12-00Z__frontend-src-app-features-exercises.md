---
target: exercises feature
total_score: 28
p0_count: 2
p1_count: 2
timestamp: 2026-06-13T21-12-00Z
slug: frontend-src-app-features-exercises
---
# Design Critique: Exercises Feature

**Target**: `frontend/src/app/features/exercises` (list page + detail page)  
**Date**: 2026-06-14

---

## Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | No search feedback during debounce, missing result count |
| 2 | Match System / Real World | 3 | Good gym vocabulary, 'Exercise catalog' slightly formal |
| 3 | User Control and Freedom | 2 | No clear-search shortcut, must delete text char-by-char |
| 4 | Consistency and Standards | 3 | Breadcrumb inconsistent (list vs detail), exerciseType duplicated |
| 5 | Error Prevention | 3 | Good auto-apply filters, no conflicting filter prevention |
| 6 | Recognition Rather Than Recall | 3 | Active filters visible, but no breadcrumb trail on detail |
| 7 | Flexibility and Efficiency | 2 | No keyboard nav, no multi-select, manual "Load more" clicks |
| 8 | Aesthetic and Minimalist Design | 4 | n/a — genuinely excellent, zero decoration, perfect density |
| 9 | Error Recovery | 3 | Generic error message, retry clears filters unexpectedly |
| 10 | Help and Documentation | 2 | Technical jargon ("sync"), no filter logic explanation |
| **Total** | | **28/40** | **Good (70%)** — Strong foundation, critical UX gaps |

---

## Anti-Patterns Verdict

### Does this look AI-generated?

**No.** This is clean, purpose-built product UI.

**LLM assessment**: The design is extremely disciplined—zero decorative shadows, no gradients, no unnecessary rounded corners. Touch targets are borderline (filter chips 32px, search 44px) but not egregiously AI-generated. The minimalism is intentional, not default. Filter chip pattern is consistent across categories. The aesthetic perfectly follows "show don't decorate" principle. This passes the AI slop test.

**Deterministic scan**: The automated detector found **0 findings**. Exit code 0 = clean. Both templates (exercises-page.html, exercise-detail-page.html) pass all automated checks for contrast, color usage, borders, and antipatterns. Dark theme implementation is accessible with appropriate zinc-950 backgrounds and properly contrasted text.

---

## Overall Impression

**What works**: The aesthetic discipline is genuinely excellent—this is one of the cleanest minimalist UIs I've evaluated. Zero visual noise. Filter architecture is efficient for power users (toggle-to-clear). Loading states match content structure. The design perfectly embodies "show don't decorate."

**What doesn't**: The exercises feature is a **dead end**. The detail page shows information but offers no forward action—no "add to workout," no "save to plan," no momentum. The 32px filter chips violate the stated 48px minimum for gym-proof design. 17 muscle filters in horizontal scroll creates high friction on mobile. The feature feels like a reference catalog, not a tool that serves the "fastest path to the bar."

**Biggest opportunity**: **Add forward momentum and fix touch targets.** The detail page needs a clear CTA (add to workout/plan), and filter chips need to be 48px+ for sweaty-handed tapping. Transform this from "browse exercises" to "find and use exercises."

---

## What's Working

1. **Aesthetic minimalism (overall)**: Genuinely excellent execution of minimalist design. No decorative elements, perfect information density, clear hierarchy. This is the product UI gold standard—design that disappears into the task.

2. **Filter feedback (lines exercises-page.html)**: Active filter chips get teal background + text-zinc-950, inactive get zinc-800 border + zinc-300 text. Visual distinction is immediate and clear. Toggle semantics work well for power users.

3. **Loading skeletons (lines exercises-page.html)**: Skeleton cards match actual content structure—title, badge, subtitle, metadata. Users build accurate mental model during load. Better than generic spinners.

---

## Priority Issues

### [P0] Touch targets below minimum
**What**: Filter chips are 32px (`h-8`), search input is 44px (`h-11`). Design system specifies 48px minimum, 56px for primary actions.

**Why it matters**: This is a gym app. Users have sweaty hands, wear gloves, use one-handed. The stated design principle is "gym-proof." 32px chips are genuinely difficult to tap accurately in this context. This violates the core product promise.

**Fix**: 
- Change filter chips from `h-8` to `h-12` (48px)
- Change search from `h-11` to `h-14` (56px, primary action)
- Adjust padding (`px-3` → `px-4`) to maintain visual density

**Suggested command**: `/impeccable harden`

---

### [P0] Filter UX - 17 muscle options in horizontal scroll
**What**: Muscle filter has 17 options (Chest, Back, Shoulders, Biceps, Triceps, Forearms, Lats, Traps, Quads, Hamstrings, Glutes, Calves, Abs, Obliques, Lower Back, Adductors, Abductors). Users must swipe 4-5 times on phone to see all.

**Why it matters**: Horizontal scrolling is high-friction in workout context (sweaty fingers, one-handed). Users abandon complex filters. This violates "momentum not friction" principle. Cognitive load assessment found 7 failures, with filter scanning being primary issue.

**Fix**: Change Muscle filter to dropdown/modal picker OR vertical wrap with `flex-wrap`. Alternative: Group into Upper (8) / Lower (7) / Core (2) categories with expansion, reducing initial choice count from 17 to 3.

**Suggested command**: `/impeccable distill`

---

### [P1] Dead-end detail page - no forward action
**What**: Exercise detail page shows information (name, type, level, muscles, equipment, instructions) but offers no action. No "add to workout," "save to plan," "mark favorite," or any CTA.

**Why it matters**: Violates "fastest path to the bar." Why browse catalog if you can't act on it? Creates aimless browsing with no forward momentum. The emotional journey assessment found "End is neutral, not motivating." This is an information page, not a tool.

**Fix**: Add action button based on context:
- If workout active: "Add to current workout" (teal primary button)
- If no workout: "Quick log sets" or "Add to plan"
- Fallback: "Save to favorites" (secondary action)

**Suggested command**: `/impeccable craft detail-page-actions`

---

### [P1] Search feedback missing
**What**: No indication that search is happening. 300ms debounce delay feels unresponsive. No result count shown. Search input loses focus after typing triggers new results.

**Why it matters**: Visibility of system status failure (scored 3/4). Users don't know if typing registered or if system is processing. Re-focusing for search refinement adds friction.

**Fix**:
- Add subtle "Searching..." indicator during debounce
- Show result count: "247 exercises" below search
- Add search icon inside input
- Maintain focus after results load

**Suggested command**: `/impeccable polish`

---

### [P2] Filter logic unclear
**What**: Multiple filters applied without indication of logic. Is "Chest + Strength + Intermediate" AND or OR? Users cannot predict results.

**Why it matters**: Trial-and-error filtering wastes time. Recognition vs recall failure. Users abandon filters when behavior is unpredictable.

**Fix**: Add filter summary above results: "3 filters applied: Chest • Strength • Intermediate" OR show result count change: "1,247 → 42 exercises"

**Suggested command**: `/impeccable clarify`

---

### [P2] Error recovery clears filters
**What**: "Try again" button on error clears filters instead of retrying same query (exercises-page.ts line handling error).

**Why it matters**: Unexpected behavior. User loses filter state after error. Violates principle of least surprise. Forces re-selecting filters.

**Fix**: Change to true retry (same params). Add separate "Clear filters and retry" button if retry fails again. Preserve user work.

**Suggested command**: `/impeccable harden`

---

### [P2] Equipment truncation hides information
**What**: Equipment label shows first 2 items: "Barbell, Dumbbell" but exercise might need "Barbell, Dumbbell, Cable, Bench." No ellipsis indicator.

**Why it matters**: Hidden information. User might skip exercise thinking it doesn't need cable when it does. Recognition vs recall failure.

**Fix**: Add ellipsis if >2 items: "Barbell, Dumbbell, +2 more" OR show all equipment (multi-line allowed in list card)

**Suggested command**: `/impeccable clarify`

---

### [P3] Duplicate exerciseType on detail page
**What**: exerciseType shown twice: badge at top + "Type" metadata card. Visual noise, wastes vertical space.

**Why it matters**: Adds no information value. Aesthetic minimalism score is 4/4 but this is the one violation.

**Fix**: Remove Type metadata card. Badge at top is sufficient and more prominent.

**Suggested command**: `/impeccable distill`

---

### [P3] Technical jargon in empty state
**What**: "Content not yet available. Run a sync to populate exercise details." assumes user knows what "sync" means and how to trigger it.

**Why it matters**: Breaks user mental model. System implementation leaking into UI. Help & documentation scored 2/4 partly due to this.

**Fix**: Change to "Detailed instructions coming soon." OR hide incomplete exercises from catalog entirely until sync completes. Don't show unusable data.

**Suggested command**: `/impeccable clarify`

---

## Persona Red Flags

### Casey (Distracted Mobile User)
**Primary action**: Browse exercises on phone between sets, sweaty hands, one-handed, divided attention.

**Red flags**:
- **32px filter chips**: Extremely difficult to tap accurately with sweaty thumb. Will cause frequent mis-taps.
- **Horizontal scroll for 17 muscles**: Must swipe 4-5 times while phone is slippery. High abandonment risk.
- **Search loses focus**: After typing triggers results, must re-tap input to refine. Friction adds up over multiple searches.
- **No quick action on detail page**: Found perfect exercise but can't add it without backing out, finding workout page, remembering exercise name. Flow is broken.

---

### Alex (Power User)
**Primary action**: Quickly filter to specific exercises, keyboard nav through results, bulk actions.

**Red flags**:
- **No keyboard shortcuts**: Cannot Tab through filters, cannot use arrow keys for results, cannot hit Enter to select.
- **No multi-select**: Want "Chest OR Shoulders" but can't. Must search twice.
- **Manual "Load more"**: Want to see all results but must click repeatedly. No "Show all" option.
- **No favorites or recently used**: Keeps refiltering for same exercises. No memory of past usage.

---

### Jordan (Confused First-Timer)
**Primary action**: Explore catalog to learn what exercises exist, understand categorization.

**Red flags**:
- **No explanation of filters**: What's difference between "Strength" and "Powerlifting"? No tooltips.
- **Filter logic unclear**: Selected Chest + Cardio, got empty results. Doesn't understand AND logic.
- **"Run a sync" message**: Completely unclear. Thinks app is broken.
- **Detail page dead-end**: Found exercise, read description... now what? No next step guidance.

---

## Minor Observations

- Loading skeleton shows 8 cards but typical page loads 25. Should match actual count for accurate loading perception.
- "Load more" could be "Load 25 more exercises" (shows control).
- Sticky header could show active filter count in sticky position.
- Primary muscle badge uses `ring-teal-400/20` — good hierarchy distinction from chips.
- Empty state "No exercises found" could suggest "Try different filters" since search might be the issue, not filters.
- Breadcrumb "Training hub → Exercise catalog" appears on list page but not detail page (inconsistent hierarchy).

---

## Questions to Consider

1. **Is there a workout logging flow where users add exercises from this catalog?** If so, how do they access it from detail page? This is the critical missing link.

2. **What brings users to exercise catalog?** Discovery? Planning? Mid-workout addition? The design should serve the primary journey, not all journeys equally.

3. **Are there plans for favorites or recently used?** These would reduce filter dependence and serve repeat users better than cold catalog browsing.

4. **Why show exercises without content?** Should incomplete catalog entries be hidden until sync completes? Showing "content not available" undermines trust.

5. **What's the target exercise count?** If >1000, current filter UX won't scale. Need search-first design or filter categories.
