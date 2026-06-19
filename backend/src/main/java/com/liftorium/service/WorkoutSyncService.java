package com.liftorium.service;

import com.liftorium.dto.WorkoutDtos.SyncBulkRequest;
import com.liftorium.dto.WorkoutDtos.SyncBulkResponse;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutExerciseRequest;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutRequest;
import com.liftorium.dto.WorkoutDtos.SyncWorkoutSetRequest;
import com.liftorium.entity.Workout;
import com.liftorium.entity.WorkoutExercise;
import com.liftorium.entity.WorkoutSet;
import com.liftorium.entity.WorkoutStatus;
import com.liftorium.repository.ExerciseRepository;
import com.liftorium.repository.WorkoutRepository;
import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WorkoutSyncService {

  private final WorkoutRepository workoutRepository;
  private final ExerciseRepository exerciseRepository;

  public SyncBulkResponse sync(String userId, SyncBulkRequest request) {
    // 1. Extract incoming clientId values
    List<String> clientIds = request.workouts().stream()
        .map(SyncWorkoutRequest::clientId)
        .toList();

    // 2. Query existing workouts for this user with matching clientIds
    List<Workout> existing = workoutRepository.findByUserIdAndClientIdIn(userId, clientIds);

    // 3. Build a Set of already-existing clientIds
    Set<String> existingClientIds = existing.stream()
        .map(Workout::getClientId)
        .collect(Collectors.toSet());

    // 4. Process each workout in the request
    int synced = 0;
    int skipped = 0;

    for (SyncWorkoutRequest workoutRequest : request.workouts()) {
      if (existingClientIds.contains(workoutRequest.clientId())) {
        skipped++;
      } else {
        Workout workout = Workout.builder()
            .userId(userId)
            .clientId(workoutRequest.clientId())
            .name(workoutRequest.name())
            .status(WorkoutStatus.completed)
            .startedAt(Instant.parse(workoutRequest.startedAt()))
            .finishedAt(Instant.parse(workoutRequest.finishedAt()))
            .durationSeconds(workoutRequest.durationSeconds())
            .exercises(mapExercises(workoutRequest.exercises()))
            .build();

        workoutRepository.save(workout);
        synced++;
      }
    }

    // 5. Return response
    return new SyncBulkResponse(synced, skipped);
  }

  private List<WorkoutExercise> mapExercises(List<SyncWorkoutExerciseRequest> exerciseRequests) {
    List<WorkoutExercise> exercises = new ArrayList<>();
    for (int i = 0; i < exerciseRequests.size(); i++) {
      SyncWorkoutExerciseRequest exerciseRequest = exerciseRequests.get(i);
      exercises.add(WorkoutExercise.builder()
          .exerciseId(exerciseRequest.exerciseId())
          .order(i + 1)
          .sets(mapSets(exerciseRequest.sets()))
          .build());
    }
    return exercises;
  }

  private List<WorkoutSet> mapSets(List<SyncWorkoutSetRequest> setRequests) {
    List<WorkoutSet> sets = new ArrayList<>();
    for (int i = 0; i < setRequests.size(); i++) {
      SyncWorkoutSetRequest setRequest = setRequests.get(i);
      sets.add(WorkoutSet.builder()
          .order(i + 1)
          .reps(setRequest.reps())
          .weight(setRequest.weight())
          .durationSeconds(setRequest.durationSeconds())
          .distanceKm(setRequest.distanceKm())
          .speed(setRequest.speed())
          .incline(setRequest.incline())
          .completedAt(setRequest.completedAt() != null ? Instant.parse(setRequest.completedAt()) : null)
          .build());
    }
    return sets;
  }
}
