package com.sodamanagement.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.PositiveOrZero;

public record RefillRequest(
        @NotBlank(message = "username is required")
        String username,
        @Positive(message = "quantity must be positive")
        int quantity,
        @PositiveOrZero(message = "cost must be zero or positive")
        double cost,
        String sodaType
) {
}
