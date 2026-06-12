package com.gymhelper.provider.freedb;

import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;
import com.gymhelper.entity.ExerciseProviderType;
import com.gymhelper.exception.AppException;
import com.gymhelper.provider.ExerciseProvider;
import com.gymhelper.provider.ProviderExercisePage;
import com.gymhelper.provider.freedb.FreeExerciseDbModels.Exercise;
import java.io.IOException;
import java.io.InputStream;
import java.util.List;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class FreeExerciseDbService implements ExerciseProvider {

  private final ObjectMapper objectMapper;
  private final FreeExerciseDbMapper mapper;
  private List<Exercise> exercises;

  public FreeExerciseDbService(ObjectMapper objectMapper, FreeExerciseDbMapper mapper) {
    this.objectMapper = objectMapper;
    this.mapper = mapper;
  }

  @Override
  public ExerciseProviderType type() {
    return ExerciseProviderType.FREE_EXERCISE_DB;
  }

  @Override
  public ProviderExercisePage fetchPage(String cursor, int limit) {
    List<Exercise> all = loadExercises();
    int offset = cursor == null ? 0 : Integer.parseInt(cursor);
    int end = Math.min(offset + limit, all.size());
    boolean hasNext = end < all.size();
    String nextCursor = hasNext ? String.valueOf(end) : null;

    return new ProviderExercisePage(
        all.subList(offset, end).stream().map(mapper::toMetadata).toList(),
        nextCursor,
        hasNext
    );
  }

  private List<Exercise> loadExercises() {
    if (exercises != null) {
      return exercises;
    }

    try (InputStream input = new ClassPathResource("data/exercises.json").getInputStream()) {
      exercises = objectMapper.readValue(input, new TypeReference<>() {});
      return exercises;
    } catch (IOException e) {
      throw new AppException(
          "EXERCISE_PROVIDER_ERROR",
          "Failed to load exercise database from classpath",
          HttpStatus.INTERNAL_SERVER_ERROR
      );
    }
  }
}
