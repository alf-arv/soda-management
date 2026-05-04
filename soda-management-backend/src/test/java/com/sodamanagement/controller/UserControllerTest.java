package com.sodamanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodamanagement.model.Role;
import com.sodamanagement.model.User;
import com.sodamanagement.security.BearerAuthFilter;
import com.sodamanagement.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(UserController.class)
@Import(BearerAuthFilter.class)
class UserControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    private final User testUser = new User("alice", "hash", Role.USER);

    @BeforeEach
    void setupAuth() {
        when(userService.authenticateFromToken(anyString())).thenReturn(Optional.of(testUser));
    }

    @Test
    void changePassword_success_returnsNewToken() throws Exception {
        when(userService.changePassword("alice", "oldhash", "newhash")).thenReturn("new-token");

        String body = objectMapper.writeValueAsString(
                Map.of("currentPassword", "oldhash", "newPassword", "newhash"));

        mockMvc.perform(post("/api/user/change-password")
                        .header("Authorization", "Bearer test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.token").value("new-token"));
    }

    @Test
    void changePassword_missingFields_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("currentPassword", "old"));

        mockMvc.perform(post("/api/user/change-password")
                        .header("Authorization", "Bearer test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void changePassword_noAuth_returns401() throws Exception {
        String body = objectMapper.writeValueAsString(
                Map.of("currentPassword", "old", "newPassword", "new"));

        mockMvc.perform(post("/api/user/change-password")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }
}
