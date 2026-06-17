package com.liftorium.service;

import com.liftorium.dto.WorkoutDtos.SyncBulkRequest;
import com.liftorium.dto.WorkoutDtos.SyncBulkResponse;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutExerciseRequest;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutRequest;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutSetRequest;
import com.liftorium.entity.Workout;
import com.liftorium.repository.ExerciseRepository;
import com.liftorium.repository.WorkoutRepository;
import java.util.List;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.assertj.core.api.Assertions.assertThat;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyList;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.times;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

/**
 * Validates: Requirements 17.1, 17.2, 19.2
 */
@ExtendWith(MockitoExtension.class)
class WorkoutSyncServiceTest {

    @Mock
    private WorkoutRepository workoutRepository;

    @Mock
    private ExerciseRepository exerciseRepository;

    @InjectMocks
    private WorkoutSyncService workoutSyncService;

    private static final String USER_ID = "user-abc-123";

    // -------------------------------------------------------------------------
    // Test 1: First sync – all workouts are new, all should be saved
    // -------------------------------------------------------------------------

    @Test
    void sync_firstSync_savesAllWorkouts() {
        // Given: 3 workouts, none exist yet for this user
        SyncBulkRequest request = buildRequest("client-1", "client-2", "client-3");
        when(workoutRepository.findByUserIdAndClientIdIn(eq(USER_ID), anyList()))
                .thenReturn(List.of());
        when(workoutRepository.save(any(Workout.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        SyncBulkResponse response = workoutSyncService.sync(USER_ID, request);

        // Then
        assertThat(response.synced()).isEqualTo(3);
        assertThat(response.skipped()).isEqualTo(0);
        verify(workoutRepository, times(3)).save(any(Workout.class));
    }

    // -------------------------------------------------------------------------
    // Test 2: Second identical sync – all clientIds already exist, none saved
    // -------------------------------------------------------------------------

    @Test
    void sync_secondIdenticalSync_skipsAllWorkouts() {
        // Given: 3 workouts that all already exist
        SyncBulkRequest request = buildRequest("client-1", "client-2", "client-3");
        List<Workout> existingWorkouts = List.of(
                buildExistingWorkout("client-1"),
                buildExistingWorkout("client-2"),
                buildExistingWorkout("client-3")
        );
        when(workoutRepository.findByUserIdAndClientIdIn(eq(USER_ID), anyList()))
                .thenReturn(existingWorkouts);

        // When
        SyncBulkResponse response = workoutSyncService.sync(USER_ID, request);

        // Then
        assertThat(response.synced()).isEqualTo(0);
        assertThat(response.skipped()).isEqualTo(3);
        verify(workoutRepository, never()).save(any(Workout.class));
    }

    // -------------------------------------------------------------------------
    // Test 3: Mixed payload – 2 exist, 3 are new
    // -------------------------------------------------------------------------

    @Test
    void sync_mixedPayload_savesNewSkipsExisting() {
        // Given: 5 workouts, 2 already exist
        SyncBulkRequest request = buildRequest(
                "client-1", "client-2", "client-3", "client-4", "client-5");
        List<Workout> existingWorkouts = List.of(
                buildExistingWorkout("client-1"),
                buildExistingWorkout("client-3")
        );
        when(workoutRepository.findByUserIdAndClientIdIn(eq(USER_ID), anyList()))
                .thenReturn(existingWorkouts);
        when(workoutRepository.save(any(Workout.class))).thenAnswer(inv -> inv.getArgument(0));

        // When
        SyncBulkResponse response = workoutSyncService.sync(USER_ID, request);

        // Then
        assertThat(response.synced()).isEqualTo(3);
        assertThat(response.skipped()).isEqualTo(2);
        verify(workoutRepository, times(3)).save(any(Workout.class));
    }

    // -------------------------------------------------------------------------
    // Helpers
    // -------------------------------------------------------------------------

    /**
     * Builds a {@link SyncBulkRequest} containing one {@link SyncWorkoutRequest}
     * per supplied clientId, each with minimal valid data.
     */
    private SyncBulkRequest buildRequest(String... clientIds) {
        List<SyncWorkoutRequest> workouts = java.util.Arrays.stream(clientIds)
                .map(this::buildWorkoutRequest)
                .toList();
        return new SyncBulkRequest(workouts);
    }

    /**
     * Builds a single {@link SyncWorkoutRequest} with valid ISO-8601 timestamps
     * and one exercise containing one set with positive reps/weight.
     */
    private SyncWorkoutRequest buildWorkoutRequest(String clientId) {
        SyncWorkoutSetRequest set = new SyncWorkoutSetRequest(
                10,         // reps
                50.0,       // weight (kg)
                "2024-01-15T10:30:00Z"
        );
        SyncWorkoutExerciseRequest exercise = new SyncWorkoutExerciseRequest(
                "exercise-bench-press",
                List.of(set)
        );
        return new SyncWorkoutRequest(
                clientId,
                "Morning Workout",
                "2024-01-15T09:00:00Z",   // startedAt
                "2024-01-15T10:00:00Z",   // finishedAt
                3600,                      // durationSeconds
                List.of(exercise)
        );
    }

    /**
     * Builds an existing {@link Workout} entity with the given clientId,
     * simulating a record already stored in the database.
     */
    private Workout buildExistingWorkout(String clientId) {
        return Workout.builder()
                .id("db-id-" + clientId)
                .userId(USER_ID)
                .clientId(clientId)
                .name("Morning Workout")
                .build();
    }
}
