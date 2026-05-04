package com.sodamanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;

@JsonIgnoreProperties(ignoreUnknown = true)
public record EventsState(
        List<SodaEvent> events
) {
}
