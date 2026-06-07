package com.gymhelper.provider;

import com.gymhelper.entity.ExerciseProviderType;
import com.gymhelper.exception.AppException;
import java.util.EnumMap;
import java.util.List;
import java.util.Map;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;

@Component
public class ExerciseProviderRegistry {

  private final Map<ExerciseProviderType, ExerciseProvider> providers;

  public ExerciseProviderRegistry(List<ExerciseProvider> providerList) {
    Map<ExerciseProviderType, ExerciseProvider> configured = new EnumMap<>(ExerciseProviderType.class);
    providerList.forEach(provider -> configured.put(provider.type(), provider));
    this.providers = Map.copyOf(configured);
  }

  public ExerciseProvider get(ExerciseProviderType type) {
    ExerciseProvider provider = providers.get(type);
    if (provider == null) {
      throw new AppException(
          "EXERCISE_PROVIDER_UNAVAILABLE",
          "Exercise provider is not configured",
          HttpStatus.SERVICE_UNAVAILABLE
      );
    }
    return provider;
  }
}
