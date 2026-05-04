package com.sodamanagement.controller;

import com.sodamanagement.dto.ChangePasswordRequest;
import com.sodamanagement.model.User;
import com.sodamanagement.security.AuthContext;
import com.sodamanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    private final UserService userService;

    public UserController(UserService userService) {
        this.userService = userService;
    }

    @PostMapping("/change-password")
    public ResponseEntity<Map<String, String>> changePassword(@Valid @RequestBody ChangePasswordRequest request) {
        User current = AuthContext.getCurrentUser();
        String newToken = userService.changePassword(
                current.getUsername(),
                request.currentPassword(),
                request.newPassword()
        );
        return ResponseEntity.ok(Map.of("token", newToken));
    }
}
