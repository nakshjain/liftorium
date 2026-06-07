package com.gymhelper.provider;

import java.util.List;
import java.util.Map;

public record ProviderExerciseContent(
    String overview,
    List<String> instructions,
    List<String> tips,
    Map<String, String> imageUrls,
    String videoUrl
) {
}
