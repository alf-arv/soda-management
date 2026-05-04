package com.sodamanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record AdminVerifyRequest(
        @NotBlank(message = "password is required")
        String password
) {
}
