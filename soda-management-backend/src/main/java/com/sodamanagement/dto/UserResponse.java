package com.sodamanagement.dto;

import com.sodamanagement.model.Role;
import com.sodamanagement.model.User;

public record UserResponse(
        String username,
        Role role,
        int sodasTaken,
        int sodasRefilled,
        double totalMoneySpentOnRefills,
        String password
) {
    public static UserResponse fromUser(User u, String password) {
        return new UserResponse(
                u.getUsername(),
                u.getRole(),
                u.getSodasTaken(),
                u.getSodasRefilled(),
                u.getTotalMoneySpentOnRefills(),
                password
        );
    }
}
