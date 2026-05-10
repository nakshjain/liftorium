package com.gymhelper.service;

import com.gymhelper.config.AppProperties;
import com.gymhelper.dto.AuthDtos.AuthUserDto;
import com.gymhelper.exception.AppException;
import com.gymhelper.util.DurationParser;
import io.jsonwebtoken.Claims;
import io.jsonwebtoken.Jwts;
import java.time.Instant;
import java.util.Date;
import javax.crypto.SecretKey;
import org.springframework.beans.factory.annotation.Qualifier;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;

@Service
public class JwtService {

  private final AppProperties appProperties;
  private final SecretKey accessTokenSigningKey;
  private final SecretKey refreshTokenSigningKey;

  public JwtService(
      AppProperties appProperties,
      @Qualifier("accessTokenSigningKey") SecretKey accessTokenSigningKey,
      @Qualifier("refreshTokenSigningKey") SecretKey refreshTokenSigningKey
  ) {
    this.appProperties = appProperties;
    this.accessTokenSigningKey = accessTokenSigningKey;
    this.refreshTokenSigningKey = refreshTokenSigningKey;
  }

  public String signAccessToken(AuthUserDto user) {
    Instant now = Instant.now();
    Instant expiresAt = now.plus(DurationParser.parse(appProperties.jwt().accessTokenTtl()));

    return Jwts.builder()
        .subject(user.id())
        .claim("email", user.email())
        .claim("displayName", user.displayName())
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(accessTokenSigningKey)
        .compact();
  }

  public String signRefreshToken(String userId, String tokenId) {
    Instant now = Instant.now();
    Instant expiresAt = now.plus(getRefreshTokenTtl());

    return Jwts.builder()
        .subject(userId)
        .claim("tokenId", tokenId)
        .issuedAt(Date.from(now))
        .expiration(Date.from(expiresAt))
        .signWith(refreshTokenSigningKey)
        .compact();
  }

  public Claims verifyAccessToken(String token) {
    try {
      return Jwts.parser()
          .verifyWith(accessTokenSigningKey)
          .build()
          .parseSignedClaims(token)
          .getPayload();
    } catch (RuntimeException exception) {
      throw new AppException("INVALID_ACCESS_TOKEN", "Access token is invalid or expired", HttpStatus.UNAUTHORIZED);
    }
  }

  public Claims verifyRefreshToken(String token) {
    try {
      return Jwts.parser()
          .verifyWith(refreshTokenSigningKey)
          .build()
          .parseSignedClaims(token)
          .getPayload();
    } catch (RuntimeException exception) {
      throw new AppException("INVALID_REFRESH_TOKEN", "Refresh token is invalid or expired", HttpStatus.UNAUTHORIZED);
    }
  }

  public String getAccessTokenEmail(String token) {
    return verifyAccessToken(token).get("email", String.class);
  }

  public java.time.Duration getRefreshTokenTtl() {
    return DurationParser.parse(appProperties.jwt().refreshTokenTtl());
  }
}
