package com.sodamanagement.controller;

import com.sodamanagement.dto.*;
import com.sodamanagement.model.SodaType;
import com.sodamanagement.service.SodaService;
import com.sodamanagement.service.UserService;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin")
public class AdminController {

    private final UserService userService;
    private final SodaService sodaService;

    public AdminController(UserService userService, SodaService sodaService) {
        this.userService = userService;
        this.sodaService = sodaService;
    }

    @PostMapping("/verify")
    public ResponseEntity<AdminVerifyResponse> verify(@Valid @RequestBody AdminVerifyRequest request) {
        boolean ok = userService.isCorrectAdminPassword(request.password());
        if (ok) {
            return ResponseEntity.ok(new AdminVerifyResponse(true, "Password accepted"));
        }
        return ResponseEntity.status(HttpStatus.UNAUTHORIZED)
                .body(new AdminVerifyResponse(false, "Invalid password"));
    }

    // --- User management ---

    @GetMapping("/users")
    public List<UserResponse> listUsers() {
        return userService.listUsers();
    }

    @PostMapping("/users")
    public ResponseEntity<UserResponse> createUser(@Valid @RequestBody CreateUserRequest request) {
        CreatedUser result = userService.createUser(request.name(), request.admin());
        UserResponse resp = UserResponse.fromUser(result.user(), result.plaintextPassword());
        return ResponseEntity.status(HttpStatus.CREATED).body(resp);
    }

    @DeleteMapping("/users/{username}")
    public ResponseEntity<?> deleteUser(@PathVariable String username) {
        boolean removed = userService.deleteUser(username);
        if (!removed) {
            return ResponseEntity.status(HttpStatus.NOT_FOUND)
                    .body(new ErrorResponse("User not found", HttpStatus.NOT_FOUND.value()));
        }
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/users/{username}/stats")
    public ResponseEntity<Void> updateUserStats(@PathVariable String username,
                                                @Valid @RequestBody UpdateUserStatsRequest request) {
        userService.updateUserStats(username, request.sodasTaken(), request.sodasRefilled());
        return ResponseEntity.ok().build();
    }

    // --- Soda type management ---

    @GetMapping("/soda-types")
    public List<SodaType> getSodaTypes() {
        return sodaService.getSodaTypes();
    }

    @PostMapping("/soda-types")
    public ResponseEntity<Void> addSodaType(@Valid @RequestBody SodaTypeRequest request) {
        sodaService.addSodaType(request.name(), request.color());
        return ResponseEntity.status(HttpStatus.CREATED).build();
    }

    @DeleteMapping("/soda-types/{name}")
    public ResponseEntity<Void> removeSodaType(@PathVariable String name) {
        sodaService.removeSodaType(name);
        return ResponseEntity.noContent().build();
    }

    @PutMapping("/soda-stock")
    public ResponseEntity<Void> setSodaStock(@Valid @RequestBody SetSodaStockRequest request) {
        sodaService.setStock(request.stock());
        return ResponseEntity.ok().build();
    }
}
