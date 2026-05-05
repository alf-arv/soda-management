package com.sodamanagement.dto;

import jakarta.validation.constraints.PositiveOrZero;

public record UpdateUserStatsRequest(
        @PositiveOrZero
        int sodasTaken,
        @PositiveOrZero
        int sodasRefilled,
        @PositiveOrZero
        double totalMoneySpentOnRefills
) {
}
