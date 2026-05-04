package com.sodamanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodamanagement.dto.DashboardResponse;
import com.sodamanagement.model.*;
import com.sodamanagement.security.BearerAuthFilter;
import com.sodamanagement.service.SodaService;
import com.sodamanagement.service.UserService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.context.annotation.Import;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;

import java.time.Instant;
import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(SodaController.class)
@Import(BearerAuthFilter.class)
class SodaControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private SodaService sodaService;

    @MockBean
    private UserService userService;

    private final User testUser = new User("alice", "hash", Role.USER);

    @BeforeEach
    void setupAuth() {
        when(userService.authenticateFromToken(anyString())).thenReturn(Optional.of(testUser));
    }

    @Test
    void getDashboard_returnsOk() throws Exception {
        DashboardResponse resp = new DashboardResponse(
                5, List.of(), List.of(), List.of(new SodaType("Pepsi", "#00f")), Map.of("Pepsi", 5));
        when(sodaService.getDashboard()).thenReturn(resp);

        mockMvc.perform(get("/api/soda")
                        .header("Authorization", "Bearer test-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.totalSodasRemaining").value(5))
                .andExpect(jsonPath("$.sodaTypes[0].name").value("Pepsi"));
    }

    @Test
    void getDashboard_noAuth_returns401() throws Exception {
        mockMvc.perform(get("/api/soda"))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void takeSoda_returnsOk() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("username", "alice", "sodaType", "Pepsi"));

        mockMvc.perform(post("/api/soda/take")
                        .header("Authorization", "Bearer test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(sodaService).takeSoda(eq("alice"), eq("alice"), eq("Pepsi"));
    }

    @Test
    void refill_returnsOk() throws Exception {
        String body = objectMapper.writeValueAsString(
                Map.of("username", "alice", "quantity", 6, "cost", 59.90, "sodaType", "Fanta"));

        mockMvc.perform(post("/api/soda/refill")
                        .header("Authorization", "Bearer test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(sodaService).refill(eq("alice"), any());
    }

    @Test
    void refill_missingUsername_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("quantity", 6, "cost", 59.90));

        mockMvc.perform(post("/api/soda/refill")
                        .header("Authorization", "Bearer test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
