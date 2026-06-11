package com.gymhelper.service;

import com.gymhelper.dto.WorkoutDtos.AddWorkoutExerciseRequest;
import com.gymhelper.dto.WorkoutDtos.AddWorkoutSetRequest;
import com.gymhelper.dto.WorkoutDtos.FinishWorkoutRequest;
import com.gymhelper.dto.WorkoutDtos.ListWorkoutHistoryQuery;
import com.gymhelper.dto.WorkoutDtos.PaginatedWorkoutsDto;
import com.gymhelper.dto.WorkoutDtos.StartWorkoutRequest;
import com.gymhelper.dto.WorkoutDtos.WorkoutDto;
import com.gymhelper.dto.WorkoutDtos.WorkoutExerciseDto;
import com.gymhelper.dto.WorkoutDtos.WorkoutSetDto;
import com.gymhelper.entity.Workout;
import com.gymhelper.entity.WorkoutExercise;
import com.gymhelper.entity.WorkoutSet;
import com.gymhelper.entity.WorkoutStatus;
import com.gymhelper.exception.AppException;
import com.gymhelper.repository.WorkoutRepository;
import java.time.Instant;
import java.time.format.DateTimeParseException;
import java.util.Comparator;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class WorkoutService {

  private final WorkoutRepository workoutRepository;

  public WorkoutDto start(String userId, StartWorkoutRequest input) {
    Workout workout = Workout.builder()
        .userId(userId)
        .name(input.name().trim())
        .status(WorkoutStatus.active)
        .startedAt(parseInstantOrNow(input.startedAt()))
        .notes(trim(input.notes()))
        .build();

    return toDto(workoutRepository.save(workout));
  }

  public WorkoutDto getActive(String userId) {
    return workoutRepository.findFirstByUserIdAndStatusOrderByStartedAtDesc(userId, WorkoutStatus.active)
        .map(this::toDto)
        .orElse(null);
  }

  public WorkoutDto getById(String userId, String workoutId) {
    return toDto(findWorkoutForUser(userId, workoutId));
  }

  public PaginatedWorkoutsDto listHistory(String userId, ListWorkoutHistoryQuery query) {
    PageRequest pageRequest = PageRequest.of(
        query.page() - 1,
        query.limit(),
        Sort.by(Sort.Order.desc("finishedAt"), Sort.Order.desc("startedAt"))
    );
    Page<Workout> page = workoutRepository.findByUserIdAndStatus(userId, WorkoutStatus.completed, pageRequest);

    return new PaginatedWorkoutsDto(
        page.getContent().stream().map(this::toDto).toList(),
        query.page(),
        query.limit(),
        page.getTotalElements(),
        page.getTotalPages()
    );
  }

  public WorkoutDto addExercise(String userId, String workoutId, AddWorkoutExerciseRequest input) {
    Workout workout = findWorkoutForUser(userId, workoutId);
    ensureActive(workout);

    workout.getExercises().add(WorkoutExercise.builder()
        .exerciseId(input.exerciseId())
        .order(workout.getExercises().size() + 1)
        .build());

    return toDto(workoutRepository.save(workout));
  }

  public WorkoutDto addSet(String userId, String workoutId, String workoutExerciseId, AddWorkoutSetRequest input) {
    Workout workout = findWorkoutForUser(userId, workoutId);
    ensureActive(workout);
    WorkoutExercise workoutExercise = findWorkoutExercise(workout, workoutExerciseId);

    workoutExercise.getSets().add(WorkoutSet.builder()
        .order(workoutExercise.getSets().size() + 1)
        .reps(input.reps())
        .weight(input.weight())
        .completedAt(parseInstantOrNow(input.completedAt()))
        .build());

    return toDto(workoutRepository.save(workout));
  }

  public WorkoutDto removeSet(String userId, String workoutId, String workoutExerciseId, String setId) {
    Workout workout = findWorkoutForUser(userId, workoutId);
    ensureActive(workout);
    WorkoutExercise workoutExercise = findWorkoutExercise(workout, workoutExerciseId);

    boolean removed = workoutExercise.getSets().removeIf(set -> set.getId().equals(setId));
    if (!removed) {
      throw new AppException("WORKOUT_SET_NOT_FOUND", "Workout set was not found", HttpStatus.NOT_FOUND);
    }

    workoutExercise.getSets().sort(Comparator.comparingInt(WorkoutSet::getOrder));
    for (int index = 0; index < workoutExercise.getSets().size(); index++) {
      workoutExercise.getSets().get(index).setOrder(index + 1);
    }

    return toDto(workoutRepository.save(workout));
  }

  public WorkoutDto finish(String userId, String workoutId, FinishWorkoutRequest input) {
    Workout workout = findWorkoutForUser(userId, workoutId);
    ensureActive(workout);

    Instant finishedAt = parseInstantOrNow(input.finishedAt());
    workout.setStatus(WorkoutStatus.completed);
    workout.setFinishedAt(finishedAt);
    workout.setDurationSeconds(input.durationSeconds() != null
        ? input.durationSeconds()
        : Math.max(0, Math.toIntExact((finishedAt.toEpochMilli() - workout.getStartedAt().toEpochMilli()) / 1000)));

    if (input.notes() != null) {
      workout.setNotes(trim(input.notes()));
    }

    return toDto(workoutRepository.save(workout));
  }

  private Workout findWorkoutForUser(String userId, String workoutId) {
    return workoutRepository.findByIdAndUserId(workoutId, userId)
        .orElseThrow(() -> new AppException("WORKOUT_NOT_FOUND", "Workout was not found", HttpStatus.NOT_FOUND));
  }

  private void ensureActive(Workout workout) {
    if (workout.getStatus() != WorkoutStatus.active) {
      throw new AppException("WORKOUT_NOT_ACTIVE", "Workout is not active", HttpStatus.CONFLICT);
    }
  }

  private WorkoutExercise findWorkoutExercise(Workout workout, String workoutExerciseId) {
    return workout.getExercises().stream()
        .filter(exercise -> exercise.getId().equals(workoutExerciseId))
        .findFirst()
        .orElseThrow(() -> new AppException("WORKOUT_EXERCISE_NOT_FOUND", "Workout exercise was not found", HttpStatus.NOT_FOUND));
  }

  private WorkoutDto toDto(Workout workout) {
    return new WorkoutDto(
        workout.getId(),
        workout.getUserId(),
        workout.getName(),
        workout.getStatus(),
        toIso(workout.getStartedAt()),
        toIso(workout.getFinishedAt()),
        workout.getDurationSeconds(),
        workout.getNotes(),
        workout.getExercises().stream().map(this::toExerciseDto).toList(),
        toIso(workout.getCreatedAt()),
        toIso(workout.getUpdatedAt())
    );
  }

  private WorkoutExerciseDto toExerciseDto(WorkoutExercise exercise) {
    return new WorkoutExerciseDto(
        exercise.getId(),
        exercise.getExerciseId(),
        exercise.getOrder(),
        exercise.getSets().stream().map(this::toSetDto).toList()
    );
  }

  private WorkoutSetDto toSetDto(WorkoutSet set) {
    return new WorkoutSetDto(
        set.getId(),
        set.getOrder(),
        set.getReps(),
        set.getWeight(),
        toIso(set.getCompletedAt())
    );
  }

  private Instant parseInstantOrNow(String value) {
    if (value == null) {
      return Instant.now();
    }

    try {
      return Instant.parse(value);
    } catch (DateTimeParseException exception) {
      throw new AppException("VALIDATION_ERROR", "Request validation failed", HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  private String toIso(Instant instant) {
    return instant == null ? null : instant.toString();
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }
}
