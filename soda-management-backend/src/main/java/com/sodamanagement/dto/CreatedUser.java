package com.sodamanagement.dto;

import com.sodamanagement.model.User;

public record CreatedUser(User user, String plaintextPassword) {
}
