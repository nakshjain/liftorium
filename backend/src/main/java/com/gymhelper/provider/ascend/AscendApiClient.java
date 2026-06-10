package com.gymhelper.provider.ascend;

import com.gymhelper.config.AppProperties;
import com.gymhelper.exception.AppException;
import com.gymhelper.provider.ascend.AscendApiModels.Envelope;
import com.gymhelper.provider.ascend.AscendApiModels.Exercise;
import java.util.List;
import org.springframework.core.ParameterizedTypeReference;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Component;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientException;

@Component
public class AscendApiClient {

  private final RestClient restClient;

  public AscendApiClient(AppProperties properties) {
    AppProperties.AscendApi config = properties.ascendApi();
    this.restClient = RestClient.builder()
        .baseUrl(config.baseUrl())
        .defaultHeader("X-RapidAPI-Key", config.apiKey())
        .defaultHeader("X-RapidAPI-Host", config.host())
        .build();
  }

  public Envelope<List<Exercise>> fetchPage(String cursor, int limit) {
    try {
      return restClient.get()
          .uri(uriBuilder -> {
            uriBuilder.path("/api/v1/exercises").queryParam("limit", limit);
            if (cursor != null) {
              uriBuilder.queryParam("after", cursor);
            }
            return uriBuilder.build();
          })
          .retrieve()
          .body(new ParameterizedTypeReference<>() {
          });
    } catch (RestClientException exception) {
      throw providerFailure(exception);
    }
  }

  private AppException providerFailure(RestClientException exception) {
    return new AppException(
        "EXERCISE_PROVIDER_ERROR",
        "Exercise provider request failed",
        HttpStatus.BAD_GATEWAY,
        List.of(exception.getClass().getSimpleName())
    );
  }
}
