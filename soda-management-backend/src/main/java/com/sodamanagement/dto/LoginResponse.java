package com.sodamanagement.dto;

import com.sodamanagement.model.Role;

public record LoginResponse(
        String username,
        Role role,
        int sodasTaken,
        int sodasRefilled,
        double totalMoneySpentOnRefills,
        String token
) {
}
