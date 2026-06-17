package com.liftorium.controller;

import com.liftorium.dto.WorkoutDtos.SyncBulkResponse;
import com.liftorium.entity.User;
import com.liftorium.security.UserPrincipal;
import com.liftorium.service.WorkoutSyncService;
import jakarta.servlet.Filter;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.ServletRequest;
import jakarta.servlet.ServletResponse;
import jakarta.servlet.http.HttpServletResponse;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.MethodSource;
import org.junit.jupiter.params.provider.ValueSource;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.io.IOException;
import java.util.stream.Stream;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

/**
 * Unit tests for {@link SyncController}.
 *
 * Uses standalone MockMvc with a lightweight {@code AuthCheckFilter} that reads from
 * {@link SecurityContextHolder}. Tests that need authentication set the context
 * directly on {@code SecurityContextHolder} before performing the request, and
 * clear it in {@code @AfterEach}. This mirrors the production security behaviour
 * without needing the full Spring application context or JWT infrastructure.
 */
@ExtendWith(MockitoExtension.class)
class SyncControllerTest {

    private MockMvc mockMvc;

    @Mock
    private WorkoutSyncService workoutSyncService;

    @InjectMocks
    private SyncController syncController;

    private static final String SYNC_URL = "/api/v1/workouts/sync";
    private static final String USER_ID = "user-test-123";

    @BeforeEach
    void setUp() {
        SecurityContextHolder.clearContext();
        mockMvc = MockMvcBuilders
                .standaloneSetup(syncController)
                .addFilter(new AuthCheckFilter())
                .setCustomArgumentResolvers(
                        new org.springframework.security.web.method.annotation.AuthenticationPrincipalArgumentResolver()
                )
                .setControllerAdvice(new com.liftorium.exception.GlobalExceptionHandler())
                .build();
    }

    @AfterEach
    void tearDown() {
        SecurityContextHolder.clearContext();
    }

    /**
     * Minimal authentication gate: returns 401 when the {@link SecurityContextHolder}
     * has no authenticated principal. This mirrors the {@code anyRequest().authenticated()}
     * rule in {@code SecurityConfig}.
     */
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

    // ---------------------------------------------------------------------------
    // Helper: set up an authenticated security context
    // ---------------------------------------------------------------------------

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

    // ---------------------------------------------------------------------------
    // Helper: minimal valid workout JSON
    // ---------------------------------------------------------------------------

    private String validWorkoutJson(String clientId, String name) {
        return """
                {
                  "clientId": "%s",
                  "name": "%s",
                  "startedAt": "2024-01-15T09:00:00Z",
                  "finishedAt": "2024-01-15T10:00:00Z",
                  "durationSeconds": 3600,
                  "exercises": [
                    {
                      "exerciseId": "exercise-bench-press",
                      "sets": [
                        { "reps": 10, "weight": 50.0, "completedAt": "2024-01-15T09:30:00Z" }
                      ]
                    }
                  ]
                }
                """.formatted(clientId, name);
    }

    private String validPayload() {
        return """
                {
                  "workouts": [%s]
                }
                """.formatted(validWorkoutJson("client-uuid-1", "Morning Workout"));
    }

    // ---------------------------------------------------------------------------
    // Test 1: 401 when no authentication context
    // ---------------------------------------------------------------------------

    @Test
    void sync_noAuthentication_returns401() throws Exception {
        // SecurityContextHolder is empty (cleared in @BeforeEach)
        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload()))
                .andExpect(status().isUnauthorized());
    }

    // ---------------------------------------------------------------------------
    // Test 2: 422 when zero workouts (empty list violates @Size(min=1))
    // ---------------------------------------------------------------------------

    @Test
    void sync_emptyWorkoutsList_returns422() throws Exception {
        authenticateAs(USER_ID);

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content("{ \"workouts\": [] }"))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---------------------------------------------------------------------------
    // Test 3: 422 when more than 50 workouts (@Size(max=50))
    // ---------------------------------------------------------------------------

    @Test
    void sync_tooManyWorkouts_returns422() throws Exception {
        authenticateAs(USER_ID);

        StringBuilder workouts = new StringBuilder();
        for (int i = 0; i < 51; i++) {
            if (i > 0) workouts.append(",");
            workouts.append("""
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
        String payload = "{ \"workouts\": [%s] }".formatted(workouts);

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---------------------------------------------------------------------------
    // Test 4: 422 when reps > 1000 (@Max(1000))
    // ---------------------------------------------------------------------------

    @Test
    void sync_repsExceedMax_returns422() throws Exception {
        authenticateAs(USER_ID);

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
                          "sets": [{ "reps": 1001, "weight": 50.0 }]
                        }
                      ]
                    }
                  ]
                }
                """;

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---------------------------------------------------------------------------
    // Test 5: 422 when weight > 2000 (@Max(2000))
    // ---------------------------------------------------------------------------

    @Test
    void sync_weightExceedsMax_returns422() throws Exception {
        authenticateAs(USER_ID);

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
                          "sets": [{ "reps": 10, "weight": 2001.0 }]
                        }
                      ]
                    }
                  ]
                }
                """;

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---------------------------------------------------------------------------
    // Test 6: 422 when name is blank (@NotBlank)
    // ---------------------------------------------------------------------------

    @Test
    void sync_blankWorkoutName_returns422() throws Exception {
        authenticateAs(USER_ID);

        String payload = """
                {
                  "workouts": [
                    {
                      "clientId": "client-uuid-1",
                      "name": "",
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
                  ]
                }
                """;

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(payload))
                .andExpect(status().isUnprocessableEntity());
    }

    // ---------------------------------------------------------------------------
    // Test 7: 200 success — valid payload, mocked service returns (1, 0)
    // ---------------------------------------------------------------------------

    @Test
    void sync_validPayload_returns200WithSyncedCount() throws Exception {
        authenticateAs(USER_ID);
        when(workoutSyncService.sync(eq(USER_ID), any()))
                .thenReturn(new SyncBulkResponse(1, 0));

        mockMvc.perform(post(SYNC_URL)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(validPayload()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.data.synced").value(1))
                .andExpect(jsonPath("$.data.skipped").value(0));
    }

    // ---------------------------------------------------------------------------
    // Property 15: Backend input validation — reps out of range [0..1000]
    // Tests boundary values: -1 (below min), 1001 and 9999 (above max)
    // Validates: Requirements 16.6, 16.7, 16.8
    // ---------------------------------------------------------------------------

    @ParameterizedTest(name = "reps={0} should be rejected with 422")
    @ValueSource(ints = {-1, 1001, 9999})
    void property15_repsOutOfRange_returns422(int invalidReps) throws Exception {
        authenticateAs(USER_ID);

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

    // ---------------------------------------------------------------------------
    // Property 15: Backend input validation — weight out of range [0..2000]
    // Tests boundary values: -0.1 (below min), 2001.0 and 99999.0 (above max)
    // Validates: Requirements 16.6, 16.7, 16.8
    // ---------------------------------------------------------------------------

    static Stream<Double> invalidWeightValues() {
        return Stream.of(-0.1, 2001.0, 99999.0);
    }

    @ParameterizedTest(name = "weight={0} should be rejected with 422")
    @MethodSource("invalidWeightValues")
    void property15_weightOutOfRange_returns422(double invalidWeight) throws Exception {
        authenticateAs(USER_ID);

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

    // ---------------------------------------------------------------------------
    // Property 15: Backend input validation — workout list size boundaries
    // Tests: 0 workouts (below min=1) and 51 workouts (above max=50)
    // Validates: Requirements 16.6, 16.7, 16.8
    // ---------------------------------------------------------------------------

    @ParameterizedTest(name = "workoutCount={0} should be rejected with 422")
    @ValueSource(ints = {0, 51})
    void property15_workoutListSizeOutOfRange_returns422(int workoutCount) throws Exception {
        authenticateAs(USER_ID);

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
}
