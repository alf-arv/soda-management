package com.sodamanagement.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodamanagement.dto.CreatedUser;
import com.sodamanagement.model.Role;
import com.sodamanagement.model.SodaType;
import com.sodamanagement.model.User;
import com.sodamanagement.security.BearerAuthFilter;
import com.sodamanagement.security.SecurityUtil;
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

import java.util.List;
import java.util.Map;
import java.util.Optional;

import static org.mockito.ArgumentMatchers.*;
import static org.mockito.Mockito.*;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AdminController.class)
@Import(BearerAuthFilter.class)
class AdminControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @Autowired
    private ObjectMapper objectMapper;

    @MockBean
    private UserService userService;

    @MockBean
    private SodaService sodaService;

    private final User adminUser = new User("admin", "hash", Role.ADMIN);
    private static final String ADMIN_PW_HASH = SecurityUtil.sha256hex("admin123");

    @BeforeEach
    void setupAuth() {
        when(userService.authenticateFromToken(anyString())).thenReturn(Optional.of(adminUser));
        when(userService.isCorrectAdminPassword(ADMIN_PW_HASH)).thenReturn(true);
    }

    // --- verify ---

    @Test
    void verify_correctPassword_returnsOk() throws Exception {
        when(userService.isCorrectAdminPassword("hashed")).thenReturn(true);

        String body = objectMapper.writeValueAsString(Map.of("password", "hashed"));

        mockMvc.perform(post("/api/admin/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.success").value(true));
    }

    @Test
    void verify_wrongPassword_returns401() throws Exception {
        when(userService.isCorrectAdminPassword("wrong")).thenReturn(false);

        String body = objectMapper.writeValueAsString(Map.of("password", "wrong"));

        mockMvc.perform(post("/api/admin/verify")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized())
                .andExpect(jsonPath("$.success").value(false));
    }

    // --- users ---

    @Test
    void listUsers_returnsOk() throws Exception {
        when(userService.listUsers()).thenReturn(List.of());

        mockMvc.perform(get("/api/admin/users")
                        .header("Authorization", "Bearer test-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$").isArray());
    }

    @Test
    void createUser_returns201() throws Exception {
        User newUser = new User("bob", SecurityUtil.sha256hex("bob"), Role.USER);
        when(userService.createUser("bob", false)).thenReturn(new CreatedUser(newUser, "bob"));

        String body = objectMapper.writeValueAsString(Map.of("name", "bob", "admin", false));

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.username").value("bob"))
                .andExpect(jsonPath("$.password").value("bob"));
    }

    @Test
    void createUser_noAdminPassword_returns401() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", "bob", "admin", false));

        mockMvc.perform(post("/api/admin/users")
                        .header("Authorization", "Bearer test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void deleteUser_returns204() throws Exception {
        when(userService.deleteUser("bob")).thenReturn(true);

        mockMvc.perform(delete("/api/admin/users/bob")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH))
                .andExpect(status().isNoContent());
    }

    @Test
    void deleteUser_notFound_returns404() throws Exception {
        when(userService.deleteUser("nobody")).thenReturn(false);

        mockMvc.perform(delete("/api/admin/users/nobody")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH))
                .andExpect(status().isNotFound());
    }

    @Test
    void updateUserStats_returnsOk() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("sodasTaken", 5, "sodasRefilled", 3));

        mockMvc.perform(patch("/api/admin/users/bob/stats")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(userService).updateUserStats("bob", 5, 3);
    }

    // --- soda types ---

    @Test
    void getSodaTypes_returnsOk() throws Exception {
        when(sodaService.getSodaTypes()).thenReturn(List.of(new SodaType("Pepsi", "#00f")));

        mockMvc.perform(get("/api/admin/soda-types")
                        .header("Authorization", "Bearer test-token"))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$[0].name").value("Pepsi"));
    }

    @Test
    void addSodaType_returns201() throws Exception {
        String body = objectMapper.writeValueAsString(Map.of("name", "Fanta", "color", "#ff8800"));

        mockMvc.perform(post("/api/admin/soda-types")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isCreated());

        verify(sodaService).addSodaType("Fanta", "#ff8800");
    }

    @Test
    void removeSodaType_returns204() throws Exception {
        mockMvc.perform(delete("/api/admin/soda-types/Pepsi")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH))
                .andExpect(status().isNoContent());

        verify(sodaService).removeSodaType("Pepsi");
    }

    // --- soda stock override ---

    @Test
    void setSodaStock_returnsOk() throws Exception {
        String body = objectMapper.writeValueAsString(
                Map.of("stock", Map.of("Pepsi", 12, "Fanta", 4)));

        mockMvc.perform(put("/api/admin/soda-stock")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isOk());

        verify(sodaService).setStock(Map.of("Pepsi", 12, "Fanta", 4));
    }

    @Test
    void setSodaStock_noAdminPassword_returns401() throws Exception {
        String body = objectMapper.writeValueAsString(
                Map.of("stock", Map.of("Pepsi", 12)));

        mockMvc.perform(put("/api/admin/soda-stock")
                        .header("Authorization", "Bearer test-token")
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isUnauthorized());
    }

    @Test
    void setSodaStock_negativeValue_returns400() throws Exception {
        String body = objectMapper.writeValueAsString(
                Map.of("stock", Map.of("Pepsi", -1)));

        mockMvc.perform(put("/api/admin/soda-stock")
                        .header("Authorization", "Bearer test-token")
                        .header("X-Admin-Password", ADMIN_PW_HASH)
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(body))
                .andExpect(status().isBadRequest());
    }
}
