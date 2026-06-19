package com.liftorium.service;

import com.liftorium.dto.WorkoutDtos.SyncBulkRequest;
import com.liftorium.dto.WorkoutDtos.SyncBulkResponse;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutExerciseRequest;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutRequest;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutSetRequest;
import com.liftorium.entity.User;
import com.liftorium.entity.Workout;
import com.liftorium.repository.ExerciseRepository;
import com.liftorium.repository.WorkoutRepository;
import com.liftorium.security.UserPrincipal;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.CsvSource;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import com.liftorium.controller.SyncController;
import com.liftorium.exception.GlobalExceptionHandler;

import java.io.IOException;
import java.util.Arrays;
import java.util.List;
import java.util.stream.Stream;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Property-based tests for the backend sync endpoint and service.
 *
 * Property 15 — Backend input validation (Validates: Requirements 16.6, 16.7, 16.8)
 * Property 3  — Backend sync idempotency   (Validates: Requirements 17.1, 17.2, 19.2)
 * Property 16 — User-scoped deduplication  (Validates: Requirements 22.3, 16.3)
 */
@ExtendWith(MockitoExtension.class)
class WorkoutSyncPropertyTest {

    // -------------------------------------------------------------------------
    // MockMvc (Property 15)
    // -------------------------------------------------------------------------

    private MockMvc mockMvc;

    @Mock
    private WorkoutSyncService workoutSyncService;

    @InjectMocks
    private SyncController syncController;

    // -------------------------------------------------------------------------
    // Direct service mocks (Properties 3 & 16)
    // -------------------------------------------------------------------------

    @Mock
    private WorkoutRepository workoutRepository;

    @Mock
    private ExerciseRepository exerciseRepository;

    @InjectMocks
    private WorkoutSyncService syncService;

    private static final String SYNC_URL = "/api/v1/workouts/sync";
    private static final String USER_A = "user-alice-001";
    private static final String USER_B = "user-bob-002";

    // -------------------------------------------------------------------------
    // Auth filter (mirrors SyncControllerTest pattern)
    // -------------------------------------------------------------------------

    static class AuthCheckFilter implements Filter {
        @Override
        public void doFilter(ServletRequest request, ServletResponse response, FilterChain chain)
                throws IOException, ServletException {
            var auth = SecurityContextHolder.getContext().getAuthentication();
            if (auth == null || !auth.isAuthenticated()) {
                var httpResponse = (HttpServletResponse) response;
                httpResponse.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
                httpResponse.setContentType("application/json");
                httpResponse.getWriter().write("{\"success\":false,\"message\":\"Authentication required\"}");
                return;
            }
            chain.doFilter(request, response);
        }
    }

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        mockMvc = MockMvcBuilders
                .standaloneSetup(syncController)
                .addFilter(new AuthCheckFilter())
                .setCustomArgumentResolvers(new AuthenticationPrincipalArgumentResolver())
                .setControllerAdvice(new GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    private void authenticateAs(String userId) {
        User user = User.builder()
                .id(userId)
                .email("test@example.com")
                .displayName("Test User")
                .build();
        UserPrincipal principal = new UserPrincipal(user);
        var authentication = new UsernamePasswordAuthenticationToken(
                principal, null, principal.getAuthorities());
        var context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
    }

    // =========================================================================
    // Property 15 — Backend input validation
    // Validates: Requirements 16.6, 16.7, 16.8
    // =========================================================================

    /**
     * Property 15a: reps boundary values outside [0..1000] must be rejected with 422.
     * Boundary values tested: -1 (below min=0) and 1001 (above max=1000).
     */
    @ParameterizedTest(name = "Property 15 — reps={0} (out of range [0,1000]) → 422")
    @ValueSource(ints = {-1, 1001})
    void property15_repsOutOfRange_returns422(int invalidReps) throws Exception {
        authenticateAs(USER_A);

        String payload = """
                {
                  "workouts": [
                    {
                      "clientId": "client-uuid-1",
                      "name": "Morning Workout",
                      "startedAt": "2024-01-15T09:00:00Z",
                      "finishedAt": "2024-01-15T10:00:00Z",
                      "durationSeconds": 3600,
                      "exercises": [
                        {
                          "exerciseId": "exercise-bench-press",
                          "sets": [{ "reps": %d, "weight": 50.0 }]
                        }
                      ]
                    }
                  ]
                }
                """.formatted(invalidReps);

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity());
    }

    /**
     * Property 15b: weight boundary values outside [0..2000] must be rejected with 422.
     * Boundary values tested: -0.1 (below min=0) and 2001.0 (above max=2000).
     */
    static Stream<Double> invalidWeightBoundaries() {
        return Stream.of(-0.1, 2001.0);
    }

    @ParameterizedTest(name = "Property 15 — weight={0} (out of range [0,2000]) → 422")
    @MethodSource("invalidWeightBoundaries")
    void property15_weightOutOfRange_returns422(double invalidWeight) throws Exception {
        authenticateAs(USER_A);

        String payload = """
                {
                  "workouts": [
                    {
                      "clientId": "client-uuid-1",
                      "name": "Morning Workout",
                      "startedAt": "2024-01-15T09:00:00Z",
                      "finishedAt": "2024-01-15T10:00:00Z",
                      "durationSeconds": 3600,
                      "exercises": [
                        {
                          "exerciseId": "exercise-bench-press",
                          "sets": [{ "reps": 10, "weight": %s }]
                        }
                      ]
                    }
                  ]
                }
                """.formatted(invalidWeight);

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity());
    }

    /**
     * Property 15c: workout list size 0 (below min=1) and 51 (above max=50) must be rejected with 422.
     */
    @ParameterizedTest(name = "Property 15 — workoutCount={0} (out of range [1,50]) → 422")
    @ValueSource(ints = {0, 51})
    void property15_workoutListSizeOutOfRange_returns422(int workoutCount) throws Exception {
        authenticateAs(USER_A);

        StringBuilder workoutsJson = new StringBuilder();
        for (int i = 0; i < workoutCount; i++) {
            if (i > 0) workoutsJson.append(",");
            workoutsJson.append("""
                    {
                      "clientId": "client-uuid-%d",
                      "name": "Workout %d",
                      "startedAt": "2024-01-15T09:00:00Z",
                      "finishedAt": "2024-01-15T10:00:00Z",
                      "durationSeconds": 3600,
                      "exercises": [
                        {
                          "exerciseId": "exercise-bench-press",
                          "sets": [{ "reps": 10, "weight": 50.0 }]
                        }
                      ]
                    }
                    """.formatted(i, i));
        }
        String payload = "{ \"workouts\": [%s] }".formatted(workoutsJson);

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity());
    }

    // =========================================================================
    // Property 3 — Backend sync idempotency
    // Validates: Requirements 17.1, 17.2, 19.2
    //
    // Submitting the same request N times must result in exactly 1 saved record:
    //   - Call 1: returns synced=1, skipped=0
    //   - Calls 2..N: return synced=0, skipped=1
    //   - Cumulative: synced=1, skipped=(N-1)
    // =========================================================================

    @ParameterizedTest(name = "Property 3 — sync idempotency over {0} identical submissions")
    @ValueSource(ints = {2, 3, 5})
    void property3_syncIdempotency_exactlyOneRecordSaved(int n) {
        SyncBulkRequest request = buildRequest("idempotent-client-id");
        Workout existingWorkout = buildExistingWorkout(USER_A, "idempotent-client-id");

        // First call: no existing record → synced=1, skipped=0
        when(workoutRepository.findByUserIdAndClientIdIn(eq(USER_A), anyList()))
                .thenReturn(List.of())           // call 1: nothing exists yet
                .thenReturn(List.of(existingWorkout)); // calls 2..N: record already present
        when(workoutRepository.save(any(Workout.class))).thenAnswer(inv -> inv.getArgument(0));

        int totalSynced = 0;
        int totalSkipped = 0;

        for (int i = 0; i < n; i++) {
            SyncBulkResponse response = syncService.sync(USER_A, request);
            totalSynced += response.synced();
            totalSkipped += response.skipped();
        }

        assertThat(totalSynced).as("exactly one record should be saved across %d calls", n).isEqualTo(1);
        assertThat(totalSkipped).as("remaining %d calls should all skip", n - 1).isEqualTo(n - 1);
    }

    // =========================================================================
    // Property 16 — User-scoped deduplication isolation
    // Validates: Requirements 22.3, 16.3
    //
    // Two different users sharing the same clientId must each get their own
    // saved record — deduplication is scoped to (userId, clientId), not globally
    // to clientId alone.
    // =========================================================================

    @ParameterizedTest(name = "Property 16 — user-scoped isolation: user={0} gets independent record")
    @CsvSource({"user-alice-001", "user-bob-002"})
    void property16_userScopedDeduplication_eachUserSavesIndependently(String userId) {
        // Both users send a request with the same clientId
        final String sharedClientId = "shared-client-id-xyz";
        SyncBulkRequest request = buildRequest(sharedClientId);

        // For this user, the clientId does not yet exist → should save
        when(workoutRepository.findByUserIdAndClientIdIn(eq(userId), anyList()))
                .thenReturn(List.of());
        when(workoutRepository.save(any(Workout.class))).thenAnswer(inv -> inv.getArgument(0));

        SyncBulkResponse response = syncService.sync(userId, request);

        assertThat(response.synced())
                .as("user '%s' with shared clientId should have synced=1", userId)
                .isEqualTo(1);
        assertThat(response.skipped())
                .as("user '%s' with shared clientId should have skipped=0", userId)
                .isEqualTo(0);
    }

    /**
     * Composite assertion: both users independently sync the same clientId
     * and each gets synced=1, skipped=0, with no cross-user interference.
     */
    @org.junit.jupiter.api.Test
    void property16_twoUsersWithSameClientId_eachGetIndependentRecord() {
        final String sharedClientId = "shared-client-id-xyz";
        SyncBulkRequest requestA = buildRequest(sharedClientId);
        SyncBulkRequest requestB = buildRequest(sharedClientId);

        // User A: no existing record for user-A
        when(workoutRepository.findByUserIdAndClientIdIn(eq(USER_A), anyList()))
                .thenReturn(List.of());
        // User B: no existing record for user-B (independent lookup)
        when(workoutRepository.findByUserIdAndClientIdIn(eq(USER_B), anyList()))
                .thenReturn(List.of());
        when(workoutRepository.save(any(Workout.class))).thenAnswer(inv -> inv.getArgument(0));

        SyncBulkResponse responseA = syncService.sync(USER_A, requestA);
        SyncBulkResponse responseB = syncService.sync(USER_B, requestB);

        assertThat(responseA.synced())
                .as("user-A should independently sync the shared clientId")
                .isEqualTo(1);
        assertThat(responseA.skipped()).isEqualTo(0);

        assertThat(responseB.synced())
                .as("user-B should independently sync the same clientId")
                .isEqualTo(1);
        assertThat(responseB.skipped()).isEqualTo(0);
    }

    // =========================================================================
    // Helpers (same pattern as WorkoutSyncServiceTest)
    // =========================================================================

    private SyncBulkRequest buildRequest(String... clientIds) {
        List<SyncWorkoutRequest> workouts = Arrays.stream(clientIds)
                .map(this::buildWorkoutRequest)
                .toList();
        return new SyncBulkRequest(workouts);
    }

    private SyncWorkoutRequest buildWorkoutRequest(String clientId) {
        SyncWorkoutSetRequest set = new SyncWorkoutSetRequest(
                10,
                50.0,
                null,       // durationSeconds
                null,       // distanceKm
                null,       // speed
                null,       // incline
                "2024-01-15T10:30:00Z"
        );
        SyncWorkoutExerciseRequest exercise = new SyncWorkoutExerciseRequest(
                "exercise-bench-press",
                List.of(set)
        );
        return new SyncWorkoutRequest(
                clientId,
                "Morning Workout",
                "2024-01-15T09:00:00Z",
                "2024-01-15T10:00:00Z",
                3600,
                List.of(exercise)
        );
    }

    private Workout buildExistingWorkout(String userId, String clientId) {
        return Workout.builder()
                .id("db-id-" + clientId)
                .userId(userId)
                .clientId(clientId)
                .name("Morning Workout")
                .build();
    }
}
