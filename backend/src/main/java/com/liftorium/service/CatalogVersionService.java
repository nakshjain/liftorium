package com.liftorium.service;

import com.liftorium.dto.CatalogVersionResponse;
import com.liftorium.entity.Exercise;
import com.liftorium.repository.ExerciseRepository;
import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.util.HexFormat;
import lombok.RequiredArgsConstructor;
import org.springframework.cache.annotation.Cacheable;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
public class CatalogVersionService {

  private final ExerciseRepository exerciseRepository;

  /**
   * Computes and returns the current catalog version.
   *
   * <p>The version is a SHA-1 hex digest of {@code "<activeCount>:<latestUpdatedAtMillis>"}.
   * When there are no active exercises the input is {@code "0:0"}.
   *
   * <p>The result is cached for 60 seconds so concurrent requests do not re-query MongoDB.
   */
  @Cacheable("catalogVersion")
  public CatalogVersionResponse getVersion() {
    long count = exerciseRepository.countByActiveTrue();

    long latestMillis = exerciseRepository
        .findTopByActiveTrueOrderByUpdatedAtDesc()
        .map(Exercise::getUpdatedAt)
        .map(java.time.Instant::toEpochMilli)
        .orElse(0L);

    String input = count + ":" + (count == 0 ? 0 : latestMillis);
    String version = sha1Hex(input);

    return new CatalogVersionResponse(version, (int) count);
  }

  private static String sha1Hex(String input) {
    try {
      MessageDigest digest = MessageDigest.getInstance("SHA-1");
      byte[] hash = digest.digest(input.getBytes(StandardCharsets.UTF_8));
      return HexFormat.of().formatHex(hash);
    } catch (NoSuchAlgorithmException e) {
      // SHA-1 is guaranteed by the Java spec — this branch is unreachable
      throw new IllegalStateException("SHA-1 algorithm not available", e);
    }
  }
}
