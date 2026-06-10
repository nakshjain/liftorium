package com.gymhelper.provider.ascend;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import java.util.List;

public final class AscendApiModels {

  private AscendApiModels() {
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record Envelope<T>(
      boolean success,
      T data,
      Meta meta
  ) {
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record Meta(
      boolean hasNextPage,
      String nextCursor
  ) {
  }

  @JsonIgnoreProperties(ignoreUnknown = true)
  public record Exercise(
      String exerciseId,
      String name,
      List<String> equipments,
      List<String> bodyParts,
      String exerciseType,
      List<String> targetMuscles,
      List<String> secondaryMuscles,
      String overview,
      List<String> instructions,
      List<String> exerciseTips
  ) {
  }
}
