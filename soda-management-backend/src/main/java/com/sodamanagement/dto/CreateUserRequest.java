package com.sodamanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateUserRequest(
        @NotBlank(message = "name is required")
        String name,
        boolean admin
) {
}
