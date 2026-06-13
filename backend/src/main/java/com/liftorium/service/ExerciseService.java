package com.liftorium.service;

import com.liftorium.dto.ExerciseDtos.CursorPageDto;
import com.liftorium.dto.ExerciseDtos.ExerciseContentDto;
import com.liftorium.dto.ExerciseDtos.ExerciseDto;
import com.liftorium.dto.ExerciseDtos.ListExercisesQuery;
import com.liftorium.dto.ExerciseDtos.SearchExercisesQuery;
import com.liftorium.entity.Exercise;
import com.liftorium.exception.AppException;
import com.liftorium.repository.ExerciseQueryRepository;
import com.liftorium.repository.ExerciseRepository;
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
          exercise.getInstructions()
      );
    }

    return toDto(exercise, content);
  }

  private ExerciseDto toDto(Exercise exercise, ExerciseContentDto content) {
    return new ExerciseDto(
        exercise.getId(),
        exercise.getName(),
        exercise.getSlug(),
        exercise.getPrimaryMuscles(),
        exercise.getSecondaryMuscles(),
        exercise.getEquipment(),
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
