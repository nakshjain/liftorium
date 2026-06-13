package com.liftorium.provider.freedb;

import com.liftorium.entity.ExerciseType;
import com.liftorium.provider.ProviderExerciseMetadata;
import com.liftorium.provider.freedb.FreeExerciseDbModels.Exercise;
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
    List<String> primaryMuscles = titleCaseList(source.primaryMuscles());
    List<String> secondaryMuscles = titleCaseList(source.secondaryMuscles());
    List<String> equipment = source.equipment() != null && !source.equipment().isBlank()
        ? List.of(titleCase(source.equipment().trim()))
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
        primaryMuscles,
        secondaryMuscles,
        equipment,
        exerciseType,
        DATASET_VERSION,
        sha256(fingerprintSource),
        null,
        safeList(source.instructions()),
        source.level() != null ? titleCase(source.level().trim()) : null,
        source.mechanic() != null ? titleCase(source.mechanic().trim()) : null
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

  private List<String> titleCaseList(List<String> values) {
    if (values == null) {
      return List.of();
    }

    return values.stream()
        .filter(value -> value != null && !value.isBlank())
        .map(v -> titleCase(v.trim()))
        .distinct()
        .sorted()
        .toList();
  }

  private String titleCase(String value) {
    if (value == null || value.isEmpty()) {
      return value;
    }
    String[] words = value.toLowerCase(Locale.ROOT).split("\\s+");
    StringBuilder result = new StringBuilder();
    for (int i = 0; i < words.length; i++) {
      if (i > 0) {
        result.append(' ');
      }
      result.append(Character.toUpperCase(words[i].charAt(0)));
      result.append(words[i].substring(1));
    }
    return result.toString();
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
