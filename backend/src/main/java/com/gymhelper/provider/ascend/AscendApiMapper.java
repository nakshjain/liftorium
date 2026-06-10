package com.gymhelper.provider.ascend;

import com.gymhelper.entity.ExerciseType;
import com.gymhelper.entity.MovementPattern;
import com.gymhelper.provider.ProviderExerciseMetadata;
import com.gymhelper.provider.ascend.AscendApiModels.Exercise;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.ArrayList;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class AscendApiMapper {

  private static final String DATASET_VERSION = "exercisedb-v2";

  public ProviderExerciseMetadata toMetadata(Exercise source) {
    List<String> primaryMuscles = normalizeList(source.targetMuscles());
    List<String> secondaryMuscles = normalizeList(source.secondaryMuscles());
    List<String> bodyParts = normalizeList(source.bodyParts());
    List<String> equipment = normalizeList(source.equipments());
    ExerciseType exerciseType = mapExerciseType(source.exerciseType());

    String fingerprintSource = String.join("|",
        normalize(source.name()),
        String.join(",", primaryMuscles),
        String.join(",", secondaryMuscles),
        String.join(",", bodyParts),
        String.join(",", equipment),
        exerciseType.name()
    );

    return new ProviderExerciseMetadata(
        source.exerciseId(),
        cleanName(source.name()),
        List.of(),
        primaryMuscles,
        secondaryMuscles,
        bodyParts,
        equipment,
        MovementPattern.UNKNOWN,
        exerciseType,
        DATASET_VERSION,
        sha256(fingerprintSource),
        source.overview(),
        safeList(source.instructions()),
        safeList(source.exerciseTips())
    );
  }

  private ExerciseType mapExerciseType(String value) {
    if (value == null) {
      return ExerciseType.OTHER;
    }

    return switch (normalize(value).replace('-', '_').replace(' ', '_')) {
      case "strength" -> ExerciseType.STRENGTH;
      case "cardio" -> ExerciseType.CARDIO;
      case "stretching", "stretch" -> ExerciseType.STRETCHING;
      case "mobility" -> ExerciseType.MOBILITY;
      case "balance" -> ExerciseType.BALANCE;
      case "plyometrics", "plyometric" -> ExerciseType.PLYOMETRICS;
      case "rehabilitation", "rehab" -> ExerciseType.REHABILITATION;
      default -> ExerciseType.OTHER;
    };
  }

  private List<String> normalizeList(List<String> values) {
    if (values == null) {
      return List.of();
    }

    return values.stream()
        .filter(value -> value != null && !value.isBlank())
        .map(this::normalize)
        .distinct()
        .sorted()
        .toList();
  }

  private List<String> safeList(List<String> values) {
    if (values == null) {
      return List.of();
    }
    return List.copyOf(new ArrayList<>(values));
  }

  private String cleanName(String value) {
    return value == null ? "" : value.trim().replaceAll("\\s+", " ");
  }

  private String normalize(String value) {
    return cleanName(value).toLowerCase(Locale.ROOT);
  }

  private String sha256(String value) {
    try {
      byte[] digest = MessageDigest.getInstance("SHA-256").digest(value.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(digest);
    } catch (NoSuchAlgorithmException exception) {
      throw new IllegalStateException("SHA-256 is unavailable", exception);
    }
  }
}
