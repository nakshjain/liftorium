package com.gymhelper.provider;

import java.util.List;

public record ProviderExercisePage(
    List<ProviderExerciseMetadata> items,
    String nextCursor,
    boolean hasNext
) {
}
