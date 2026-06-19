---
target: /app dashboard
total_score: 25
p0_count: 0
p1_count: 2
p2_count: 2
timestamp: 2026-06-18T10-22-49Z
slug: tures-dashboard-dashboard-page-dashboard-page-html
---
### Design Health Score

| # | Heuristic | Score | Key Issue |
|---|-----------|-------|-----------|
| 1 | Visibility of System Status | 3 | Live workout pulsing dot excellent. Loading skeletons present. Missing feedback when auth gate triggers |
| 2 | Match System / Real World | 4 | Language is gym-native throughout |
| 3 | User Control and Freedom | 2 | Guest can start workout but has no easy path back. Auth gate modal dismiss unclear |
| 4 | Consistency and Standards | 3 | Card hierarchy consistent. guest-dashboard.ts uses raw href instead of routerLink |
| 5 | Error Prevention | 3 | Auth gate protects locked features cleanly |
| 6 | Recognition Rather Than Recall | 3 | Week ring has no tooltip/label explaining the number |
| 7 | Flexibility and Efficiency | 1 | No shortcuts, no quick-access to last exercise, no power-user paths |
| 8 | Aesthetic and Minimalist Design | 2 | Below the fold is uniform gray-soup card grid |
| 9 | Error Recovery | 2 | No empty state when stats fail to load. Skeleton spins forever on API failure |
| 10 | Help and Documentation | 2 | No explanation for week ring. Plan card assumes gym literacy |
| **Total** | | **25/40** | Acceptable |

### Anti-Patterns Verdict
Not obvious AI slop. Palette is committed, token system is real. Tells: uniform card density, hero-metric week ring, filler greeting strip.
Detector: 2 gray-on-color findings in guest-dashboard.ts lines 40/103 (likely false positives - zinc-950 on teal-400 is high contrast).

### Priority Issues
P1: Locked cards communicate lock not value — give aspirational treatment with blurred sample data
P1: Lower half has no visual hierarchy — gray flatline after the teal hero
P2: Greeting strip is personality-free filler
P2: Week ring opaque to new users — missing label/context
P3: guest-dashboard.ts appears unused — parallel dead implementation

### Persona Red Flags
Alex (returning lifter): Progress info buried in third row behind locked cards
Jordan (first-timer): Three empty states on first login, no encouragement or direction
Sam (anonymous): Conversion nudge at very bottom, easy to miss

### Minor Observations
- anim-enter stagger imperceptible on last two rows
- exercises count is static 300+ copy not live
- guest footer has Sign Up + Login but nav only shows Login now — inconsistent
- guest-dashboard.ts uses emoji icons inconsistent with zinc/teal system
