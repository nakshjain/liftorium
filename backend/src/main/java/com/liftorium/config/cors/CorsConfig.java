package com.liftorium.config.cors;

import com.liftorium.config.AppProperties;
import java.util.Arrays;
import java.util.List;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

@Configuration
@RequiredArgsConstructor
public class CorsConfig {

  private final AppProperties appProperties;

  @Bean
  public CorsConfigurationSource corsConfigurationSource() {
    // Split comma-separated origins and trim whitespace from each entry.
    // setAllowedOriginPatterns is used (not setAllowedOrigins) because it
    // supports wildcard patterns such as https://*.liftorium.fit.
    List<String> origins = Arrays.stream(appProperties.cors().allowedOrigins().split(","))
        .map(String::trim)
        .filter(s -> !s.isBlank())
        .toList();

    CorsConfiguration configuration = new CorsConfiguration();
    configuration.setAllowedOriginPatterns(origins);
    configuration.setAllowedMethods(List.of("GET", "POST", "PATCH", "DELETE", "OPTIONS", "PUT"));
    configuration.setAllowedHeaders(List.of("Authorization", "Content-Type"));
    configuration.setAllowCredentials(true);

    UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
    source.registerCorsConfiguration("/**", configuration);
    return source;
  }
}
