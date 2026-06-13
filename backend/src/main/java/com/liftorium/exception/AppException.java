package com.liftorium.exception;

import java.util.List;
import lombok.Getter;
import org.springframework.http.HttpStatus;

@Getter
public class AppException extends RuntimeException {

  private final String code;
  private final HttpStatus status;
  private final List<?> details;

  public AppException(String code, String message, HttpStatus status) {
    this(code, message, status, List.of());
  }

  public AppException(String code, String message, HttpStatus status, List<?> details) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
  }
}
