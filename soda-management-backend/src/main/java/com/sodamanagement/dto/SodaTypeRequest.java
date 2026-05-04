package com.sodamanagement.dto;

import jakarta.validation.constraints.NotBlank;

public record SodaTypeRequest(
        @NotBlank
        String name,
        @NotBlank
        String color
) {
}
