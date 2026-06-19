package com.liftorium.exception;

import com.liftorium.dto.ErrorResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.ConstraintViolationException;
import java.util.List;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.MissingServletRequestParameterException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;
import org.springframework.http.converter.HttpMessageNotReadableException;
import org.springframework.web.method.annotation.MethodArgumentTypeMismatchException;
import org.springframework.web.servlet.NoHandlerFoundException;

@Slf4j

@RestControllerAdvice
public class GlobalExceptionHandler {

  @ExceptionHandler(AppException.class)
  public ResponseEntity<ErrorResponse> handleAppException(AppException exception) {
    return ResponseEntity
        .status(exception.getStatus())
        .body(ErrorResponse.of(exception.getCode(), exception.getMessage(), exception.getDetails()));
  }

  @ExceptionHandler(MethodArgumentNotValidException.class)
  public ResponseEntity<ErrorResponse> handleValidationException(MethodArgumentNotValidException exception) {
    List<ValidationIssue> details = exception.getBindingResult().getFieldErrors().stream()
        .map(error -> new ValidationIssue(error.getField(), error.getDefaultMessage()))
        .toList();

    return ResponseEntity
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(ErrorResponse.of("VALIDATION_ERROR", "Request validation failed", details));
  }

  @ExceptionHandler(ConstraintViolationException.class)
  public ResponseEntity<ErrorResponse> handleConstraintViolationException(ConstraintViolationException exception) {
    List<ValidationIssue> details = exception.getConstraintViolations().stream()
        .map(error -> new ValidationIssue(error.getPropertyPath().toString(), error.getMessage()))
        .toList();

    return ResponseEntity
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(ErrorResponse.of("VALIDATION_ERROR", "Request validation failed", details));
  }

  @ExceptionHandler({
      MethodArgumentTypeMismatchException.class,
      MissingServletRequestParameterException.class,
      HttpMessageNotReadableException.class
  })
  public ResponseEntity<ErrorResponse> handleRequestBindingException(Exception exception) {
    return ResponseEntity
        .status(HttpStatus.UNPROCESSABLE_ENTITY)
        .body(ErrorResponse.of("VALIDATION_ERROR", "Request validation failed", List.of(exception.getMessage())));
  }

  @ExceptionHandler(AccessDeniedException.class)
  public ResponseEntity<ErrorResponse> handleAccessDeniedException() {
    return ResponseEntity
        .status(HttpStatus.FORBIDDEN)
        .body(ErrorResponse.of("FORBIDDEN", "Access denied", List.of()));
  }

  @ExceptionHandler(NoHandlerFoundException.class)
  public ResponseEntity<ErrorResponse> handleNotFound(HttpServletRequest request) {
    return ResponseEntity
        .status(HttpStatus.NOT_FOUND)
        .body(ErrorResponse.of(
            "NOT_FOUND",
            "Route " + request.getMethod() + " " + request.getRequestURI() + " was not found",
            List.of()
        ));
  }

  @ExceptionHandler(Exception.class)
  public ResponseEntity<ErrorResponse> handleUnexpectedException(Exception exception) {
    log.error("Unhandled exception", exception);
    return ResponseEntity
        .status(HttpStatus.INTERNAL_SERVER_ERROR)
        .body(ErrorResponse.of("INTERNAL_SERVER_ERROR", exception.getMessage(), List.of(exception.getClass().getName())));
  }

  private record ValidationIssue(String field, String message) {
  }
}
