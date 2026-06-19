package com.liftorium.dto;

/**
 * Response DTO for the catalog version endpoint.
 * Contains an opaque SHA-1 version hash and the count of active exercises.
 */
public record CatalogVersionResponse(
    String version,
    int exerciseCount
) {}
