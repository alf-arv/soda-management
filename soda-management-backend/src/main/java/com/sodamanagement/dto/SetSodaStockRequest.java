package com.sodamanagement.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

import java.util.Map;

/**
 * Admin override of per-soda-type stock counts. Only the entries provided are updated;
 * any soda types omitted from the map keep their current stock.
 */
public record SetSodaStockRequest(
        @NotNull
        Map<String, @PositiveOrZero @NotNull Integer> stock
) {
}
