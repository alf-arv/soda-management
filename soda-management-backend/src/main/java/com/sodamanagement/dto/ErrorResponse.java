package com.sodamanagement.dto;

public record ErrorResponse(
        String message,
        int status
) {
}
