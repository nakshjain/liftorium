package com.gymhelper.provider.ascend;

import static org.assertj.core.api.Assertions.assertThat;

import com.gymhelper.entity.ExerciseType;
import com.gymhelper.entity.MovementPattern;
import com.gymhelper.provider.ProviderExerciseContent;
import com.gymhelper.provider.ProviderExerciseMetadata;
import com.gymhelper.provider.ascend.AscendApiModels.Exercise;
import java.util.List;
import java.util.Map;
import org.junit.jupiter.api.Test;

class AscendApiMapperTest {

  private final AscendApiMapper mapper = new AscendApiMapper();

  @Test
  void mapsProviderMetadataIntoCanonicalValues() {
    Exercise source = exercise();

    ProviderExerciseMetadata metadata = mapper.toMetadata(source);

    assertThat(metadata.providerExerciseId()).isEqualTo("exercise-1");
    assertThat(metadata.name()).isEqualTo("Incline Dumbbell Press");
    assertThat(metadata.primaryMuscles()).containsExactly("chest");
    assertThat(metadata.secondaryMuscles()).containsExactly("triceps");
    assertThat(metadata.equipment()).containsExactly("bench", "dumbbell");
    assertThat(metadata.exerciseType()).isEqualTo(ExerciseType.STRENGTH);
    assertThat(metadata.movementPattern()).isEqualTo(MovementPattern.UNKNOWN);
    assertThat(metadata.contentFingerprint()).hasSize(64);
  }

  @Test
  void mapsRichContentWithoutAddingItToMetadata() {
    ProviderExerciseContent content = mapper.toContent(exercise());

    assertThat(content.overview()).isEqualTo("Overview");
    assertThat(content.instructions()).containsExactly("Press");
    assertThat(content.tips()).containsExactly("Control the eccentric");
    assertThat(content.imageUrls()).containsEntry("360p", "https://cdn.example/image.webp");
    assertThat(content.videoUrl()).isEqualTo("https://cdn.example/video.mp4");
  }

  private Exercise exercise() {
    return new Exercise(
        "exercise-1",
        " Incline Dumbbell Press ",
        List.of("Dumbbell", "Bench"),
        List.of("Chest"),
        "strength",
        List.of("Chest"),
        List.of("Triceps"),
        "Overview",
        List.of("Press"),
        List.of("Control the eccentric"),
        Map.of("360p", "https://cdn.example/image.webp"),
        null,
        "https://cdn.example/video.mp4"
    );
  }
}
