package com.gymhelper.provider.ascend;

import com.gymhelper.entity.ExerciseProviderType;
import com.gymhelper.exception.AppException;
import com.gymhelper.provider.ExerciseProvider;
import com.gymhelper.provider.ProviderExerciseContent;
import com.gymhelper.provider.ProviderExercisePage;
import com.gymhelper.provider.ascend.AscendApiModels.Envelope;
import com.gymhelper.provider.ascend.AscendApiModels.Exercise;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class AscendApiService implements ExerciseProvider {

  private final AscendApiClient client;
  private final AscendApiMapper mapper;

  @Override
  public ExerciseProviderType type() {
    return ExerciseProviderType.ASCEND_API;
  }

  @Override
  public ProviderExercisePage fetchPage(String cursor, int limit) {
    Envelope<List<Exercise>> response = requireResponse(client.fetchPage(cursor, limit));
    boolean hasNext = response.meta() != null && response.meta().hasNextPage();
    String nextCursor = response.meta() == null ? null : response.meta().nextCursor();
    if (hasNext && (nextCursor == null || nextCursor.isBlank())) {
      throw new AppException(
          "EXERCISE_PROVIDER_ERROR",
          "Exercise provider returned an invalid pagination cursor",
          HttpStatus.BAD_GATEWAY
      );
    }
    return new ProviderExercisePage(
        response.data().stream().map(mapper::toMetadata).toList(),
        nextCursor,
        hasNext
    );
  }

  @Override
  public ProviderExerciseContent fetchContent(String providerExerciseId) {
    Envelope<Exercise> response = requireResponse(client.fetchById(providerExerciseId));
    return mapper.toContent(response.data());
  }

  private <T> Envelope<T> requireResponse(Envelope<T> response) {
    if (response == null || !response.success() || response.data() == null) {
      throw new AppException(
          "EXERCISE_PROVIDER_ERROR",
          "Exercise provider returned an invalid response",
          HttpStatus.BAD_GATEWAY
      );
    }
    return response;
  }
}
