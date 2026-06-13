# Graph Report - .  (2026-06-09)

## Corpus Check
- Corpus is ~43,063 words - fits in a single context window. You may not need a graph.

## Summary
- 845 nodes · 1484 edges · 60 communities (37 shown, 23 thin omitted)
- Extraction: 90% EXTRACTED · 10% INFERRED · 0% AMBIGUOUS · INFERRED: 153 edges (avg confidence: 0.82)
- Token cost: 0 input · 0 output

## Community Hubs (Navigation)
- [[_COMMUNITY_Angular App Core|Angular App Core]]
- [[_COMMUNITY_Ascend API Mapper|Ascend API Mapper]]
- [[_COMMUNITY_API Contracts|API Contracts]]
- [[_COMMUNITY_Auth Service Layer|Auth Service Layer]]
- [[_COMMUNITY_Workout Service Layer|Workout Service Layer]]
- [[_COMMUNITY_Project Architecture Docs|Project Architecture Docs]]
- [[_COMMUNITY_Exercise Sync Pipeline|Exercise Sync Pipeline]]
- [[_COMMUNITY_Frontend Build Config|Frontend Build Config]]
- [[_COMMUNITY_Spring Security Config|Spring Security Config]]
- [[_COMMUNITY_Live Workout UI|Live Workout UI]]
- [[_COMMUNITY_Exercise Detail Page|Exercise Detail Page]]
- [[_COMMUNITY_Auth Controller|Auth Controller]]
- [[_COMMUNITY_Workout Controller|Workout Controller]]
- [[_COMMUNITY_Architecture Concepts|Architecture Concepts]]
- [[_COMMUNITY_Frontend Dependencies|Frontend Dependencies]]
- [[_COMMUNITY_Exercise Service Layer|Exercise Service Layer]]
- [[_COMMUNITY_Ascend API Client|Ascend API Client]]
- [[_COMMUNITY_Exercise Controller|Exercise Controller]]
- [[_COMMUNITY_Exercise Query Repository|Exercise Query Repository]]
- [[_COMMUNITY_Ascend API Service|Ascend API Service]]
- [[_COMMUNITY_Angular Routing Hub|Angular Routing Hub]]
- [[_COMMUNITY_Graphify Skill|Graphify Skill]]
- [[_COMMUNITY_Exercise Provider Interface|Exercise Provider Interface]]
- [[_COMMUNITY_JWT Configuration|JWT Configuration]]
- [[_COMMUNITY_Health Check Endpoint|Health Check Endpoint]]
- [[_COMMUNITY_Auth UI Components|Auth UI Components]]
- [[_COMMUNITY_Spring Boot Entry Point|Spring Boot Entry Point]]
- [[_COMMUNITY_Ascend API Models|Ascend API Models]]
- [[_COMMUNITY_Claude Code Settings|Claude Code Settings]]
- [[_COMMUNITY_Claude Permissions|Claude Permissions]]
- [[_COMMUNITY_PostCSS Tailwind Config|PostCSS Tailwind Config]]
- [[_COMMUNITY_VSCode Launch Config|VSCode Launch Config]]
- [[_COMMUNITY_VSCode Tasks Config|VSCode Tasks Config]]
- [[_COMMUNITY_Exercise Entity|Exercise Entity]]
- [[_COMMUNITY_Provider Mapping Entity|Provider Mapping Entity]]
- [[_COMMUNITY_RefreshToken Entity|RefreshToken Entity]]
- [[_COMMUNITY_Tempo Entity|Tempo Entity]]
- [[_COMMUNITY_Workout Entity|Workout Entity]]
- [[_COMMUNITY_WorkoutExercise Entity|WorkoutExercise Entity]]
- [[_COMMUNITY_WorkoutSet Entity|WorkoutSet Entity]]
- [[_COMMUNITY_Exercise Feature Routes|Exercise Feature Routes]]
- [[_COMMUNITY_VSCode Extensions|VSCode Extensions]]
- [[_COMMUNITY_Auth Logout Endpoint|Auth Logout Endpoint]]
- [[_COMMUNITY_Active Workout Endpoint|Active Workout Endpoint]]
- [[_COMMUNITY_Workout History Endpoint|Workout History Endpoint]]
- [[_COMMUNITY_Remove Set Endpoint|Remove Set Endpoint]]
- [[_COMMUNITY_Frontend Component Structure|Frontend Component Structure]]
- [[_COMMUNITY_App HTML Root|App HTML Root]]
- [[_COMMUNITY_Frontend README|Frontend README]]

## God Nodes (most connected - your core abstractions)
1. `of()` - 34 edges
2. `WorkoutService` - 20 edges
3. `LiveWorkoutStore` - 20 edges
4. `success()` - 19 edges
5. `AuthService` - 16 edges
6. `ExercisesPageComponent` - 15 edges
7. `String` - 13 edges
8. `AuthController` - 10 edges
9. `WorkoutController` - 10 edges
10. `AuthService` - 10 edges

## Surprising Connections (you probably didn't know these)
- `Backend Controller-Service-Repository Pattern` --semantically_similar_to--> `Backend Controller-Service-Repository Layering`  [INFERRED] [semantically similar]
  docs/TECHINAL_REQUIREMENTS_DOCUMENT.md → CLAUDE.md
- `LiveWorkoutStore Signal Service` --shares_data_with--> `Workout Sessions Collection`  [INFERRED]
  CLAUDE.md → docs/BACKEND_SCHEMA.md
- `Dark Theme First Design Principle` --conceptually_related_to--> `Gym Helper Project Overview`  [INFERRED]
  docs/UI-UX_BRIEF.md → AGENTS.md
- `Gym Helper Architecture Overview` --conceptually_related_to--> `Workout Sessions Collection`  [INFERRED]
  CLAUDE.md → docs/BACKEND_SCHEMA.md
- `Milestone 2: Authentication` --conceptually_related_to--> `JWT Auth Flow (Access + Refresh Token)`  [INFERRED]
  docs/IMPLEMENTATION_PLAN.md → CLAUDE.md

## Import Cycles
- None detected.

## Hyperedges (group relationships)
- **JWT Authentication Flow Components** — claude_md_jwt_auth_flow, claude_md_auth_service, claude_md_auth_interceptor, docs_api_readme_auth_api [INFERRED 0.85]
- **Workout Data Model (Embedded Documents)** — docs_backend_schema_workout_sessions_collection, docs_backend_schema_workout_exercise_subdoc, docs_backend_schema_workout_set_subdoc, claude_md_workout_data_model [INFERRED 0.85]
- **MVP Delivery Milestones Sequence** — docs_impl_plan_milestone_auth, docs_impl_plan_milestone_exercise_db, docs_impl_plan_milestone_workout_tracking, docs_impl_plan_milestone_history_progression, docs_impl_plan_milestone_analytics [EXTRACTED 1.00]
- **Auth Token Lifecycle (Register/Login/Refresh/Logout)** — api_auth_register_endpoint, api_auth_login_endpoint, api_auth_refresh_endpoint, api_auth_logout_endpoint [EXTRACTED 1.00]
- **Workout Logging API Flow (Start / Add Exercise / Add Set / Finish)** — api_workouts_start_endpoint, api_workouts_add_exercise_endpoint, api_workouts_add_set_endpoint, api_workouts_finish_endpoint [EXTRACTED 1.00]
- **Exercise Provider Pipeline (Strategy / Registry / AscendAPI)** — architecture_exercise_module_provider_strategy, architecture_exercise_module_registry, architecture_exercise_module_ascend_api [EXTRACTED 1.00]
- **Backend Modules Superseded by Spring Boot Migration** — impl_jwt_auth, impl_exercise_db, impl_workout_session, impl_spring_boot_migration [EXTRACTED 1.00]
- **Angular Frontend Auth Stack (AuthService, Guards, Interceptor)** — impl_angular_auth_flow, concept_angular_auth_flow, concept_jwt_token_strategy, concept_refresh_token_rotation [INFERRED 0.85]
- **Exercise Provider Ecosystem (canonical schema, sync workflow, AscendAPI)** — concept_provider_independent_exercise, concept_exercise_sync_workflow, workflows_exercise_sync [EXTRACTED 1.00]
- **Auth Pages Share Shell Layout and Form Field Components** — login_page_login_page_login_page_component, signup_page_signup_page_signup_page_component, auth_shell_auth_shell_auth_shell_component, auth_form_field_auth_form_field_auth_form_field_component [EXTRACTED 1.00]
- **Dashboard Links to Main App Routes: Workout, Exercises** — dashboard_page_dashboard_page_dashboard_page_component, route_app_workout, route_app_exercises [EXTRACTED 1.00]
- **Exercises Page Lists and Links to Exercise Detail Page** — exercises_page_exercises_page_exercises_page_component, exercise_detail_page_exercise_detail_page_exercise_detail_page_component, route_app_exercises_id [EXTRACTED 1.00]

## Communities (60 total, 23 thin omitted)

### Community 0 - "Angular App Core"
Cohesion: 0.07
Nodes (25): ApiErrorResponse, ApiResponse, ApiSuccessResponse, App, appConfig, routes, getApiErrorMessage(), BYPASS_AUTH_INTERCEPTOR (+17 more)

### Community 1 - "Ascend API Mapper"
Cohesion: 0.08
Nodes (31): AscendApiMapper, AscendApiMapperTest, Bean, ErrorResponse, List, String, HttpStatus, List (+23 more)

### Community 2 - "API Contracts"
Cohesion: 0.05
Nodes (54): POST /api/v1/auth/login, GET /api/v1/auth/me, POST /api/v1/auth/refresh, POST /api/v1/auth/register, API Pagination Convention, API Response Envelope, Exercise Catalog Cursor Pagination, GET /api/v1/exercises/{exerciseId} (+46 more)

### Community 3 - "Auth Service Layer"
Cohesion: 0.08
Nodes (26): Instant, Optional, String, Optional, String, User, AuthSession, AuthUserDto (+18 more)

### Community 4 - "Workout Service Layer"
Cohesion: 0.11
Nodes (25): Optional, String, Workout, AddWorkoutExerciseRequest, AddWorkoutSetRequest, FinishWorkoutRequest, Instant, ListWorkoutHistoryQuery (+17 more)

### Community 5 - "Project Architecture Docs"
Cohesion: 0.06
Nodes (44): Gym Helper Project Overview, Gym Helper Architecture Overview, AuthInterceptor (JWT Bearer + Auto-Retry), AuthService (Signals-Based), Backend Controller-Service-Repository Layering, ExerciseProviderService (Ascend API Sync), JWT Auth Flow (Access + Refresh Token), LiveWorkoutStore Signal Service (+36 more)

### Community 6 - "Exercise Sync Pipeline"
Cohesion: 0.10
Nodes (21): ExerciseProviderType, Instant, List, Optional, String, List, String, Exercise (+13 more)

### Community 7 - "Frontend Build Config"
Cohesion: 0.05
Nodes (41): build, serve, test, builder, configurations, defaultConfiguration, options, cli (+33 more)

### Community 8 - "Spring Security Config"
Cohesion: 0.08
Nodes (27): AuthenticationEntryPoint, AuthenticationException, AuthenticationManager, Bean, Override, String, UserDetails, HttpServletRequest (+19 more)

### Community 9 - "Live Workout UI"
Cohesion: 0.09
Nodes (9): FinishedWorkoutSummary, LiveWorkoutPageComponent, ExerciseOption, LiveWorkout, PreviousSet, WorkoutExercise, WorkoutSet, exerciseCatalog (+1 more)

### Community 10 - "Exercise Detail Page"
Cohesion: 0.11
Nodes (12): API_BASE_URL, ExerciseDetailPageComponent, Exercise, ExerciseContent, ExercisePage, ExerciseType, ListExercisesParams, MovementPattern (+4 more)

### Community 11 - "Auth Controller"
Cohesion: 0.14
Nodes (22): ApiResponse, AuthSession, AuthUserDto, Duration, GetMapping, HttpStatus, LoginRequest, Map (+14 more)

### Community 12 - "Workout Controller"
Cohesion: 0.16
Nodes (21): AddWorkoutExerciseRequest, AddWorkoutSetRequest, ApiResponse, FinishWorkoutRequest, GetMapping, ListWorkoutHistoryQuery, Map, PaginatedWorkoutsDto (+13 more)

### Community 13 - "Architecture Concepts"
Cohesion: 0.09
Nodes (33): AI-Assisted Engineering Workflow, Angular Auth Flow (Signals-based AuthService, guards, interceptor), Angular Component Dedicated Folder Structure (ts/html/scss), Exercise Database Module Design (DTO mapping, public reads, auth mutations, Mongo indexes), Exercise Provider Sync Workflow (full scan, fingerprint diff, soft deletion), JWT Token Strategy (access token in memory, refresh in HTTP-only cookie), Live Workout Signals Store (feature-level signals for active session state), MVP Definition (register, login, start workout, add exercises, log sets, complete, view history) (+25 more)

### Community 14 - "Frontend Dependencies"
Cohesion: 0.06
Nodes (30): dependencies, @angular/common, @angular/compiler, @angular/core, @angular/forms, @angular/platform-browser, @angular/router, rxjs (+22 more)

### Community 15 - "Exercise Service Layer"
Cohesion: 0.17
Nodes (13): Exercise, Optional, String, CursorPageDto, Exercise, ExerciseDto, Instant, ListExercisesQuery (+5 more)

### Community 16 - "Ascend API Client"
Cohesion: 0.18
Nodes (12): AscendApiClient, AppException, AppProperties, Envelope, Exercise, List, String, ExerciseProvider (+4 more)

### Community 17 - "Exercise Controller"
Cohesion: 0.24
Nodes (9): ApiResponse, CursorPageDto, ExerciseDto, ExerciseType, GetMapping, String, ExerciseController, ExerciseDtos (+1 more)

### Community 18 - "Exercise Query Repository"
Cohesion: 0.27
Nodes (9): Exercise, List, ListExercisesQuery, SearchExercisesQuery, String, Criteria, Cursor, CursorResult (+1 more)

### Community 19 - "Ascend API Service"
Cohesion: 0.25
Nodes (9): AscendApiService, Envelope, ExerciseProviderType, Override, ProviderExerciseContent, ProviderExercisePage, String, T (+1 more)

### Community 20 - "Angular Routing Hub"
Cohesion: 0.25
Nodes (11): AuthService (signals-based), Dashboard Page Component, Exercise Detail Page Component, Exercises Page Component, App Root Bootstrap Entry, Live Workout Page Component, LiveWorkoutStore (signal service), Route /app (Training Hub) (+3 more)

### Community 21 - "Graphify Skill"
Cohesion: 0.20
Nodes (10): graphify Skill Reference, Add URL and Watch Folder, Extra Exports and Benchmark, Extraction Subagent Prompt Template, GitHub Clone and Cross-Repo Merge, Commit Hook and CLAUDE.md Integration, Graph Query / Path / Explain Flow, graphify Pipeline Skill (+2 more)

### Community 22 - "Exercise Provider Interface"
Cohesion: 0.28
Nodes (5): ExerciseProviderType, ProviderExerciseContent, ProviderExercisePage, String, ExerciseProvider

### Community 23 - "JWT Configuration"
Cohesion: 0.57
Nodes (4): AppProperties, Bean, SecretKey, JwtConfig

### Community 24 - "Health Check Endpoint"
Cohesion: 0.43
Nodes (5): ApiResponse, GetMapping, Map, String, HealthController

### Community 25 - "Auth UI Components"
Cohesion: 0.67
Nodes (6): Auth Form Field Component, Auth Shell Component, Login Page Component, Route /auth/login, Route /auth/signup, Signup Page Component

## Knowledge Gaps
- **148 isolated node(s):** `PreToolUse`, `allow`, `String`, `Boolean`, `String` (+143 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **23 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `of()` connect `Ascend API Mapper` to `Workout Service Layer`, `Exercise Sync Pipeline`, `Spring Security Config`, `Auth Controller`, `Workout Controller`, `Ascend API Client`, `Health Check Endpoint`?**
  _High betweenness centrality (0.101) - this node is a cross-community bridge._
- **Why does `success()` connect `Workout Controller` to `Auth Controller`, `Exercise Controller`, `Ascend API Service`, `Health Check Endpoint`?**
  _High betweenness centrality (0.033) - this node is a cross-community bridge._
- **Are the 30 inferred relationships involving `of()` (e.g. with `.providerFailure()` and `.normalizeList()`) actually correct?**
  _`of()` has 30 INFERRED edges - model-reasoned connections that need verification._
- **Are the 16 inferred relationships involving `success()` (e.g. with `.requireResponse()` and `.logout()`) actually correct?**
  _`success()` has 16 INFERRED edges - model-reasoned connections that need verification._
- **What connects `PreToolUse`, `allow`, `String` to the rest of the system?**
  _152 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Angular App Core` be split into smaller, more focused modules?**
  _Cohesion score 0.06829573934837092 - nodes in this community are weakly interconnected._
- **Should `Ascend API Mapper` be split into smaller, more focused modules?**
  _Cohesion score 0.07644110275689223 - nodes in this community are weakly interconnected._