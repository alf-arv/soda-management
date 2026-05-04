package com.sodamanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.time.Instant;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SodaEvent(
        Instant timestamp,
        String username,
        EventType type,
        int quantity,
        double cost,
        String sodaType
) {
}
