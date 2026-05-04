package com.sodamanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodamanagement.dto.LoginResponse;
import com.sodamanagement.model.Role;
import com.sodamanagement.security.BearerAuthFilter;
import com.sodamanagement.service.UserService;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.util.Map;

import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AuthController.class)
@Import(BearerAuthFilter.class)
class AuthControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @Test
    void login_success_returnsOk() throws Exception {
        LoginResponse resp = new LoginResponse("alice", Role.USER, 0, 0, 0.0, "token123");
        when(userService.login("alice", "hashedpw")).thenReturn(resp);

        String body = objectMapper.writeValueAsString(Map.of("username", "alice", "password", "hashedpw"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.username").value("alice"))
                .andExpect(jsonPath("$.token").value("token123"));
    }

    @Test
    void login_invalidCredentials_returns401() throws Exception {
        when(userService.login(anyString(), anyString())).thenReturn(null);

        String body = objectMapper.writeValueAsString(Map.of("username", "alice", "password", "wrong"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.message").value("Invalid username or password"));
    }

    @Test
    void login_missingUsername_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("password", "hash"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }

    @Test
    void login_noAuthHeaderRequired() throws Exception {
        LoginResponse resp = new LoginResponse("alice", Role.USER, 0, 0, 0.0, "tok");
        when(userService.login("alice", "pw")).thenReturn(resp);

        String body = objectMapper.writeValueAsString(Map.of("username", "alice", "password", "pw"));

        mockMvc.perform(post("/api/auth/login")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());
    }
}
