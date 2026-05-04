package com.sodamanagement.dto;

import com.sodamanagement.model.SodaEvent;
import com.sodamanagement.model.SodaType;

import java.util.List;
import java.util.Map;

public record DashboardResponse(
        int totalSodasRemaining,
        List<UserResponse> users,
        List<SodaEvent> recentEvents,
        List<SodaType> sodaTypes,
        Map<String, Integer> stockBySodaType
) {
}
