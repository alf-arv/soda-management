package com.sodamanagement.model;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;

import java.util.List;
import java.util.Map;

@JsonIgnoreProperties(ignoreUnknown = true)
public record SystemState(
        List<User> users,
        List<SodaType> sodaTypes,
        Map<String, Integer> stockBySodaType
) {
}
