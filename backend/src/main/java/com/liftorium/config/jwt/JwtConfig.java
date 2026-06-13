package com.liftorium.config.jwt;

import com.liftorium.config.AppProperties;
import javax.crypto.SecretKey;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import io.jsonwebtoken.security.Keys;

@Configuration
public class JwtConfig {

  @Bean
  public SecretKey accessTokenSigningKey(AppProperties appProperties) {
    return Keys.hmacShaKeyFor(appProperties.jwt().accessSecret().getBytes());
  }

  @Bean
  public SecretKey refreshTokenSigningKey(AppProperties appProperties) {
    return Keys.hmacShaKeyFor(appProperties.jwt().refreshSecret().getBytes());
  }
}
