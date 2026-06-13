# Graph Report - .  (2026-06-13)

## Corpus Check
- 202 files · ~198,462 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 849 nodes · 1591 edges · 62 communities (40 shown, 22 thin omitted)
- Extraction: 93% EXTRACTED · 7% INFERRED · 0% AMBIGUOUS · INFERRED: 113 edges (avg confidence: 0.8)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Frontend API Layer|Frontend API Layer]]
- [[_COMMUNITY_Auth Service & Tokens|Auth Service & Tokens]]
- [[_COMMUNITY_Exercise Catalog UI|Exercise Catalog UI]]
- [[_COMMUNITY_Live Workout Page|Live Workout Page]]
- [[_COMMUNITY_Angular Build Config|Angular Build Config]]
- [[_COMMUNITY_Plan & Workout Models|Plan & Workout Models]]
- [[_COMMUNITY_Backend Config & Health|Backend Config & Health]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_Workout History UI|Workout History UI]]
- [[_COMMUNITY_Workout Controller|Workout Controller]]
- [[_COMMUNITY_Workout Service|Workout Service]]
- [[_COMMUNITY_Security Filters|Security Filters]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Workout Repository & Stats|Workout Repository & Stats]]
- [[_COMMUNITY_Exercise Sync Pipeline|Exercise Sync Pipeline]]
- [[_COMMUNITY_Community 15|Community 15]]
- [[_COMMUNITY_Community 16|Community 16]]
- [[_COMMUNITY_Community 17|Community 17]]
- [[_COMMUNITY_Community 18|Community 18]]
- [[_COMMUNITY_Community 19|Community 19]]
- [[_COMMUNITY_Community 20|Community 20]]
- [[_COMMUNITY_Community 21|Community 21]]
- [[_COMMUNITY_Community 22|Community 22]]
- [[_COMMUNITY_Community 23|Community 23]]
- [[_COMMUNITY_Community 24|Community 24]]
- [[_COMMUNITY_Community 25|Community 25]]
- [[_COMMUNITY_Community 26|Community 26]]
- [[_COMMUNITY_Community 27|Community 27]]
- [[_COMMUNITY_Community 28|Community 28]]
- [[_COMMUNITY_Community 29|Community 29]]
- [[_COMMUNITY_Community 30|Community 30]]
- [[_COMMUNITY_Community 31|Community 31]]
- [[_COMMUNITY_Community 32|Community 32]]
- [[_COMMUNITY_Community 33|Community 33]]
- [[_COMMUNITY_Community 34|Community 34]]
- [[_COMMUNITY_Community 35|Community 35]]
- [[_COMMUNITY_Community 36|Community 36]]
- [[_COMMUNITY_Community 37|Community 37]]
- [[_COMMUNITY_Community 38|Community 38]]
- [[_COMMUNITY_Community 39|Community 39]]
- [[_COMMUNITY_Community 40|Community 40]]
- [[_COMMUNITY_Community 41|Community 41]]
- [[_COMMUNITY_Community 42|Community 42]]
- [[_COMMUNITY_Community 43|Community 43]]
- [[_COMMUNITY_Community 44|Community 44]]
- [[_COMMUNITY_Community 45|Community 45]]
- [[_COMMUNITY_Community 46|Community 46]]
- [[_COMMUNITY_Community 47|Community 47]]
- [[_COMMUNITY_Community 48|Community 48]]
- [[_COMMUNITY_Community 49|Community 49]]
- [[_COMMUNITY_Community 50|Community 50]]

## God Nodes (most connected - your core abstractions)
1. `of()` - 39 edges
2. `LiveWorkoutStore` - 31 edges
3. `success()` - 23 edges
4. `PlanStore` - 20 edges
5. `PlanPageComponent` - 19 edges
6. `WorkoutService` - 18 edges
7. `AuthService` - 16 edges
8. `ExercisesPageComponent` - 15 edges
9. `String` - 14 edges
10. `WorkoutHistoryPageComponent` - 13 edges

## Surprising Connections (you probably didn't know these)
- `UserPrincipal` --implements--> `UserDetails`  [EXTRACTED]
  backend/src/main/java/com/liftorium/security/UserPrincipal.java → backend/src/main/java/com/liftorium/security/CustomUserDetailsService.java
- `ExercisesPageComponent` --references--> `ExerciseType`  [EXTRACTED]
  frontend/src/app/features/exercises/exercises-page/exercises-page.ts → frontend/src/app/features/exercises/exercise.models.ts
- `PlanPageComponent` --references--> `Exercise`  [EXTRACTED]
  frontend/src/app/features/plan/plan-page/plan-page.ts → frontend/src/app/features/exercises/exercise.models.ts

## Import Cycles
- None detected.

## Communities (62 total, 22 thin omitted)

### Community 0 - "Frontend API Layer"
Cohesion: 0.06
Nodes (27): API_BASE_URL, ApiErrorResponse, ApiResponse, ApiSuccessResponse, App, appConfig, routes, getApiErrorMessage() (+19 more)

### Community 1 - "Auth Service & Tokens"
Cohesion: 0.07
Nodes (28): AppException, Instant, Optional, String, Optional, String, User, AuthSession (+20 more)

### Community 2 - "Exercise Catalog UI"
Cohesion: 0.07
Nodes (11): ExerciseDetailPageComponent, Exercise, ExerciseContent, ExercisePage, ExerciseType, ListExercisesParams, SearchExercisesParams, ExerciseService (+3 more)

### Community 3 - "Live Workout Page"
Cohesion: 0.07
Nodes (8): LiveWorkoutPageComponent, PlanExercise, ExerciseOption, LiveWorkout, PreviousSet, WorkoutExercise, WorkoutSet, LiveWorkoutStore

### Community 4 - "Angular Build Config"
Cohesion: 0.05
Nodes (42): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+34 more)

### Community 5 - "Plan & Workout Models"
Cohesion: 0.09
Nodes (18): FinishedWorkoutSummary, DAY_LABELS, emptyPlan(), MUSCLE_GROUPS, MuscleGroup, PLAN_TEMPLATES, PlanDay, PlanSet (+10 more)

### Community 6 - "Backend Config & Health"
Cohesion: 0.10
Nodes (25): Bean, ApiResponse, GetMapping, Map, String, ErrorResponse, List, String (+17 more)

### Community 7 - "Auth Controller"
Cohesion: 0.14
Nodes (22): ApiResponse, AuthSession, AuthUserDto, Duration, GetMapping, HttpStatus, LoginRequest, Map (+14 more)

### Community 8 - "Workout History UI"
Cohesion: 0.09
Nodes (10): WorkoutDetailPageComponent, WorkoutHistoryPageComponent, PaginatedWorkouts, PersonalRecord, WorkoutDto, WorkoutExerciseDto, WorkoutSetDto, WorkoutStats (+2 more)

### Community 9 - "Workout Controller"
Cohesion: 0.18
Nodes (21): AddWorkoutExerciseRequest, AddWorkoutSetRequest, ApiResponse, FinishWorkoutRequest, GetMapping, ListWorkoutHistoryQuery, Map, PaginatedWorkoutsDto (+13 more)

### Community 10 - "Workout Service"
Cohesion: 0.17
Nodes (16): AddWorkoutExerciseRequest, AddWorkoutSetRequest, FinishWorkoutRequest, Instant, ListWorkoutHistoryQuery, Map, PaginatedWorkoutsDto, StartWorkoutRequest (+8 more)

### Community 11 - "Security Filters"
Cohesion: 0.09
Nodes (21): AuthenticationManager, Bean, Override, String, UserDetails, HttpServletRequest, HttpServletResponse, Override (+13 more)

### Community 12 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (31): dependencies, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/router, @fontsource-variable/geist (+23 more)

### Community 13 - "Workout Repository & Stats"
Cohesion: 0.15
Nodes (17): Instant, List, Optional, String, Workout, List, String, Workout (+9 more)

### Community 14 - "Exercise Sync Pipeline"
Cohesion: 0.15
Nodes (14): List, String, Exercise, ExerciseProviderType, Instant, ProviderExerciseMetadata, User, ExerciseCatalogNormalizer (+6 more)

### Community 15 - "Community 15"
Cohesion: 0.15
Nodes (16): Exercise, ExerciseProviderType, Instant, List, Optional, String, CursorPageDto, Exercise (+8 more)

### Community 16 - "Community 16"
Cohesion: 0.13
Nodes (16): AuthenticationEntryPoint, AuthenticationException, Exercise, ExerciseProviderType, List, Override, ProviderExercisePage, String (+8 more)

### Community 17 - "Community 17"
Cohesion: 0.17
Nodes (14): Optional, String, WorkoutPlan, List, String, UpsertPlanRequest, WorkoutPlan, WorkoutPlanDto (+6 more)

### Community 18 - "Community 18"
Cohesion: 0.25
Nodes (9): Exercise, List, ListExercisesQuery, SearchExercisesQuery, String, Criteria, Cursor, CursorResult (+1 more)

### Community 19 - "Community 19"
Cohesion: 0.33
Nodes (6): Exercise, ExerciseType, List, ProviderExerciseMetadata, String, FreeExerciseDbMapper

### Community 20 - "Community 20"
Cohesion: 0.39
Nodes (7): ApiResponse, CursorPageDto, ExerciseDto, ExerciseType, GetMapping, String, ExerciseController

### Community 21 - "Community 21"
Cohesion: 0.35
Nodes (9): ApiResponse, GetMapping, Map, String, UpsertPlanRequest, UserPrincipal, WorkoutPlanDto, WorkoutPlanController (+1 more)

### Community 22 - "Community 22"
Cohesion: 0.24
Nodes (6): ApplicationArguments, ApplicationRunner, String, Override, LiftoriumApplication, ExerciseSyncStartupRunner

### Community 23 - "Community 23"
Cohesion: 0.25
Nodes (7): computedHash, skillPath, source, sourceType, skills, design-taste-frontend, version

### Community 24 - "Community 24"
Cohesion: 0.57
Nodes (4): AppProperties, Bean, SecretKey, JwtConfig

### Community 25 - "Community 25"
Cohesion: 0.33
Nodes (4): ExerciseProviderType, ProviderExercisePage, String, ExerciseProvider

### Community 26 - "Community 26"
Cohesion: 0.43
Nodes (4): ExerciseProvider, ExerciseProviderType, List, ExerciseProviderRegistry

### Community 27 - "Community 27"
Cohesion: 0.53
Nodes (4): ApiResponse, PostMapping, AdminExerciseController, SyncResultDto

### Community 28 - "Community 28"
Cohesion: 0.50
Nodes (3): /api, secure, target

## Knowledge Gaps
- **130 isolated node(s):** `PreToolUse`, `allow`, `String`, `Boolean`, `T` (+125 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **22 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `of()` connect `Backend Config & Health` to `Auth Controller`, `Workout Controller`, `Workout Service`, `Security Filters`, `Exercise Sync Pipeline`, `Community 16`, `Community 17`, `Community 19`, `Community 21`?**
  _High betweenness centrality (0.117) - this node is a cross-community bridge._
- **Why does `AppException` connect `Auth Service & Tokens` to `Backend Config & Health`, `Auth Controller`, `Workout Service`, `Exercise Sync Pipeline`, `Community 15`, `Community 16`, `Community 18`, `Community 26`?**
  _High betweenness centrality (0.082) - this node is a cross-community bridge._
- **Why does `success()` connect `Workout Controller` to `Backend Config & Health`, `Auth Controller`, `Community 20`, `Community 21`, `Community 27`?**
  _High betweenness centrality (0.025) - this node is a cross-community bridge._
- **Are the 35 inferred relationships involving `of()` (e.g. with `.logout()` and `.me()`) actually correct?**
  _`of()` has 35 INFERRED edges - model-reasoned connections that need verification._
- **Are the 20 inferred relationships involving `success()` (e.g. with `.sync()` and `.logout()`) actually correct?**
  _`success()` has 20 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PreToolUse`, `allow`, `String` to the rest of the system?**
  _130 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Frontend API Layer` be split into smaller, more focused modules?**
  _Cohesion score 0.06284153005464481 - nodes in this community are weakly interconnected._