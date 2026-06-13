package com.liftorium.service;

import static org.assertj.core.api.Assertions.assertThat;

import java.util.List;
import org.junit.jupiter.api.Test;

class ExerciseCatalogNormalizerTest {

  private final ExerciseCatalogNormalizer normalizer = new ExerciseCatalogNormalizer();

  @Test
  void normalizesNamesAndBuildsStableSlugs() {
    assertThat(normalizer.normalizeName("  Décline   Dumbbell Press "))
        .isEqualTo("decline dumbbell press");
    assertThat(normalizer.slug("Incline Dumbbell Press", "ascend-123456789"))
        .isEqualTo("incline-dumbbell-press-23456789");
  }

  @Test
  void createsPhraseTokenAndAliasPrefixes() {
    List<String> prefixes = normalizer.searchPrefixes(
        "Incline Dumbbell Press",
        List.of("Incline DB Press")
    );

    assertThat(prefixes)
        .contains("in", "incline d", "du", "dumbbell", "pr", "incline db");
  }
}
