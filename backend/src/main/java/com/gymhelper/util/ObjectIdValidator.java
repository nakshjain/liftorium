package com.gymhelper.util;

import com.gymhelper.exception.AppException;
import org.bson.types.ObjectId;
import org.springframework.http.HttpStatus;

public final class ObjectIdValidator {

  private ObjectIdValidator() {
  }

  public static void requireValid(String value, String fieldName) {
    if (!ObjectId.isValid(value)) {
      throw new AppException("VALIDATION_ERROR", fieldName + " must be a valid MongoDB ObjectId", HttpStatus.UNPROCESSABLE_ENTITY);
    }
  }
}
