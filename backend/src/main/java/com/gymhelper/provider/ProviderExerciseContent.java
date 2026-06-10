package com.gymhelper.provider;

import java.util.List;

public record ProviderExerciseContent(
    String overview,
    List<String> instructions,
    List<String> tips
) {
}
