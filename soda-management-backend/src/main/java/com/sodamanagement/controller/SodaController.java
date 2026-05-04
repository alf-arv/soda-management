package com.sodamanagement.controller;

import com.sodamanagement.dto.DashboardResponse;
import com.sodamanagement.dto.RefillRequest;
import com.sodamanagement.dto.TakeSodaRequest;
import com.sodamanagement.model.User;
import com.sodamanagement.security.AuthContext;
import com.sodamanagement.service.SodaService;
import jakarta.validation.Valid;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/soda")
public class SodaController {

    private final SodaService sodaService;

    public SodaController(SodaService sodaService) {
        this.sodaService = sodaService;
    }

    @GetMapping
    public DashboardResponse status() {
        return sodaService.getDashboard();
    }

    @PostMapping("/take")
    public ResponseEntity<Void> take(@Valid @RequestBody TakeSodaRequest request) {
        User current = AuthContext.getCurrentUser();
        sodaService.takeSoda(current.getUsername(), request.username(), request.sodaType());
        return ResponseEntity.ok().build();
    }

    @PostMapping("/refill")
    public ResponseEntity<Void> refill(@Valid @RequestBody RefillRequest request) {
        User current = AuthContext.getCurrentUser();
        sodaService.refill(current.getUsername(), request);
        return ResponseEntity.ok().build();
    }
}
