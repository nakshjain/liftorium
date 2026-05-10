package com.gymhelper.service;

import com.gymhelper.dto.ExerciseDtos.CreateExerciseRequest;
import com.gymhelper.dto.ExerciseDtos.ExerciseDto;
import com.gymhelper.dto.ExerciseDtos.ListExercisesQuery;
import com.gymhelper.dto.ExerciseDtos.PaginatedExercisesDto;
import com.gymhelper.dto.ExerciseDtos.UpdateExerciseRequest;
import com.gymhelper.entity.Exercise;
import com.gymhelper.exception.AppException;
import com.gymhelper.repository.ExerciseQueryRepository;
import com.gymhelper.repository.ExerciseRepository;
import java.time.Instant;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExerciseService {

  private final ExerciseRepository exerciseRepository;
  private final ExerciseQueryRepository exerciseQueryRepository;

  public ExerciseDto create(CreateExerciseRequest input) {
    Exercise exercise = Exercise.builder()
        .name(trim(input.name()))
        .description(trim(input.description()))
        .category(trim(input.category()))
        .equipment(trim(input.equipment()))
        .targetMuscles(trimList(input.targetMuscles()))
        .secondaryMuscles(trimListOrEmpty(input.secondaryMuscles()))
        .instructions(trimList(input.instructions()))
        .tips(trimListOrEmpty(input.tips()))
        .mediaUrl(trim(input.mediaUrl()))
        .build();

    return toDto(exerciseRepository.save(exercise));
  }

  public ExerciseDto getById(String exerciseId) {
    return exerciseRepository.findById(exerciseId)
        .map(this::toDto)
        .orElseThrow(() -> new AppException("EXERCISE_NOT_FOUND", "Exercise was not found", HttpStatus.NOT_FOUND));
  }

  public PaginatedExercisesDto list(ListExercisesQuery query) {
    Page<Exercise> page = exerciseQueryRepository.list(query);

    return new PaginatedExercisesDto(
        page.getContent().stream().map(this::toDto).toList(),
        query.page(),
        query.limit(),
        page.getTotalElements(),
        page.getTotalPages()
    );
  }

  public ExerciseDto update(String exerciseId, UpdateExerciseRequest input) {
    validateUpdatePayload(input);

    Exercise exercise = exerciseRepository.findById(exerciseId)
        .orElseThrow(() -> new AppException("EXERCISE_NOT_FOUND", "Exercise was not found", HttpStatus.NOT_FOUND));

    if (input.name() != null) {
      exercise.setName(trim(input.name()));
    }
    if (input.description() != null) {
      exercise.setDescription(trim(input.description()));
    }
    if (input.category() != null) {
      exercise.setCategory(trim(input.category()));
    }
    if (input.equipment() != null) {
      exercise.setEquipment(trim(input.equipment()));
    }
    if (input.targetMuscles() != null) {
      exercise.setTargetMuscles(trimList(input.targetMuscles()));
    }
    if (input.secondaryMuscles() != null) {
      exercise.setSecondaryMuscles(trimListOrEmpty(input.secondaryMuscles()));
    }
    if (input.instructions() != null) {
      exercise.setInstructions(trimList(input.instructions()));
    }
    if (input.tips() != null) {
      exercise.setTips(trimListOrEmpty(input.tips()));
    }
    if (input.mediaUrl() != null) {
      exercise.setMediaUrl(trim(input.mediaUrl()));
    }

    return toDto(exerciseRepository.save(exercise));
  }

  public void delete(String exerciseId) {
    if (!exerciseRepository.existsById(exerciseId)) {
      throw new AppException("EXERCISE_NOT_FOUND", "Exercise was not found", HttpStatus.NOT_FOUND);
    }

    exerciseRepository.deleteById(exerciseId);
  }

  private ExerciseDto toDto(Exercise exercise) {
    return new ExerciseDto(
        exercise.getId(),
        exercise.getName(),
        exercise.getDescription(),
        exercise.getCategory(),
        exercise.getEquipment(),
        exercise.getTargetMuscles(),
        exercise.getSecondaryMuscles(),
        exercise.getInstructions(),
        exercise.getTips(),
        exercise.getMediaUrl(),
        toIso(exercise.getCreatedAt()),
        toIso(exercise.getUpdatedAt())
    );
  }

  private String toIso(Instant instant) {
    return instant == null ? null : instant.toString();
  }

  private void validateUpdatePayload(UpdateExerciseRequest input) {
    if (
        input.name() == null &&
            input.description() == null &&
            input.category() == null &&
            input.equipment() == null &&
            input.targetMuscles() == null &&
            input.secondaryMuscles() == null &&
            input.instructions() == null &&
            input.tips() == null &&
            input.mediaUrl() == null
    ) {
      throw new AppException("VALIDATION_ERROR", "At least one field must be provided", HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }

  private String trim(String value) {
    return value == null ? null : value.trim();
  }

  private List<String> trimList(List<String> values) {
    return values.stream().map(String::trim).toList();
  }

  private List<String> trimListOrEmpty(List<String> values) {
    return values == null ? List.of() : trimList(values);
  }
}
