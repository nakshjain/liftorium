package com.gymhelper.service;

import com.gymhelper.dto.ExerciseDtos.CursorPageDto;
import com.gymhelper.dto.ExerciseDtos.ExerciseContentDto;
import com.gymhelper.dto.ExerciseDtos.ExerciseDto;
import com.gymhelper.dto.ExerciseDtos.ListExercisesQuery;
import com.gymhelper.dto.ExerciseDtos.SearchExercisesQuery;
import com.gymhelper.entity.Exercise;
import com.gymhelper.exception.AppException;
import com.gymhelper.repository.ExerciseQueryRepository;
import com.gymhelper.repository.ExerciseRepository;
import java.time.Instant;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class ExerciseService {

  private final ExerciseRepository exerciseRepository;
  private final ExerciseQueryRepository exerciseQueryRepository;

  public CursorPageDto list(ListExercisesQuery query) {
    ExerciseQueryRepository.CursorResult result = exerciseQueryRepository.list(query);
    return new CursorPageDto(
        result.items().stream().map(exercise -> toDto(exercise, null)).toList(),
        result.nextCursor(),
        result.hasNext()
    );
  }

  public CursorPageDto search(SearchExercisesQuery query) {
    ExerciseQueryRepository.CursorResult result = exerciseQueryRepository.search(query);
    return new CursorPageDto(
        result.items().stream().map(exercise -> toDto(exercise, null)).toList(),
        null,
        false
    );
  }

  public ExerciseDto getById(String exerciseId, boolean includeContent) {
    Exercise exercise = exerciseRepository.findByIdAndActiveTrue(exerciseId)
        .orElseThrow(() -> new AppException(
            "EXERCISE_NOT_FOUND",
            "Exercise was not found",
            HttpStatus.NOT_FOUND
        ));

    ExerciseContentDto content = null;
    if (includeContent) {
      content = new ExerciseContentDto(
          exercise.getOverview(),
          exercise.getInstructions(),
          exercise.getTips()
      );
    }

    return toDto(exercise, content);
  }

  private ExerciseDto toDto(Exercise exercise, ExerciseContentDto content) {
    return new ExerciseDto(
        exercise.getId(),
        exercise.getName(),
        exercise.getSlug(),
        exercise.getAliases(),
        exercise.getPrimaryMuscles(),
        exercise.getSecondaryMuscles(),
        exercise.getBodyParts(),
        exercise.getEquipment(),
        exercise.getMovementPattern(),
        exercise.getExerciseType(),
        exercise.getLevel(),
        exercise.getMechanic(),
        exercise.isActive(),
        content,
        toIso(exercise.getCreatedAt()),
        toIso(exercise.getUpdatedAt())
    );
  }

  private String toIso(Instant instant) {
    return instant == null ? null : instant.toString();
  }
}
