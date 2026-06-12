package com.gymhelper.provider.freedb;

import com.gymhelper.entity.ExerciseType;
import com.gymhelper.entity.MovementPattern;
import com.gymhelper.provider.ProviderExerciseMetadata;
import com.gymhelper.provider.freedb.FreeExerciseDbModels.Exercise;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import java.util.List;
import java.util.Locale;
import org.springframework.stereotype.Component;

@Component
public class FreeExerciseDbMapper {

  private static final String DATASET_VERSION = "free-exercise-db-v1";

  public ProviderExerciseMetadata toMetadata(Exercise source) {
    List<String> primaryMuscles = normalizeList(source.primaryMuscles());
    List<String> secondaryMuscles = normalizeList(source.secondaryMuscles());
    List<String> equipment = source.equipment() != null && !source.equipment().isBlank()
        ? List.of(normalize(source.equipment()))
        : List.of();
    ExerciseType exerciseType = mapCategory(source.category());

    String fingerprintSource = String.join("|",
        normalize(source.name()),
        String.join(",", primaryMuscles),
        String.join(",", secondaryMuscles),
        String.join(",", equipment),
        exerciseType.name(),
        source.level() != null ? source.level() : "",
        source.mechanic() != null ? source.mechanic() : ""
    );

    return new ProviderExerciseMetadata(
        source.id(),
        cleanName(source.name()),
        List.of(),
        primaryMuscles,
        secondaryMuscles,
        List.of(),
        equipment,
        MovementPattern.UNKNOWN,
        exerciseType,
        DATASET_VERSION,
        sha256(fingerprintSource),
        null,
        safeList(source.instructions()),
        List.of(),
        source.level() != null ? source.level().toLowerCase(Locale.ROOT) : null,
        source.mechanic() != null ? source.mechanic().toLowerCase(Locale.ROOT) : null
    );
  }

  private ExerciseType mapCategory(String value) {
    if (value == null) {
      return ExerciseType.OTHER;
    }

    return switch (normalize(value).replace('-', '_').replace(' ', '_')) {
      case "strength", "powerlifting", "olympic_weightlifting", "strongman" -> ExerciseType.STRENGTH;
      case "cardio" -> ExerciseType.CARDIO;
      case "stretching" -> ExerciseType.STRETCHING;
      case "plyometrics" -> ExerciseType.PLYOMETRICS;
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
    return values == null ? List.of() : List.copyOf(values);
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
