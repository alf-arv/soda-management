package com.sodamanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record TakeSodaRequest(
        @NotBlank(message = "username is required")
        String username,
        String sodaType
) {
}
