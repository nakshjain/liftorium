package com.gymhelper.util;

import com.gymhelper.exception.AppException;
import java.time.Duration;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import org.springframework.http.HttpStatus;

public final class DurationParser {

  private static final Pattern DURATION_PATTERN = Pattern.compile("^(\\d+)(s|m|h|d)$");

  private DurationParser() {
  }

  public static Duration parse(String value) {
    Matcher matcher = DURATION_PATTERN.matcher(value);

    if (!matcher.matches()) {
      throw new AppException("INVALID_DURATION", "Duration must use s, m, h, or d suffix", HttpStatus.INTERNAL_SERVER_ERROR);
    }

    long amount = Long.parseLong(matcher.group(1));
    return switch (matcher.group(2)) {
      case "s" -> Duration.ofSeconds(amount);
      case "m" -> Duration.ofMinutes(amount);
      case "h" -> Duration.ofHours(amount);
      case "d" -> Duration.ofDays(amount);
      default -> throw new AppException("INVALID_DURATION", "Duration must use s, m, h, or d suffix", HttpStatus.INTERNAL_SERVER_ERROR);
    };
  }
}
