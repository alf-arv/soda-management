package com.sodamanagement.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodamanagement.dto.ErrorResponse;
import com.sodamanagement.model.User;
import com.sodamanagement.service.UserService;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.lang.NonNull;
import org.springframework.core.Ordered;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

import java.io.IOException;
import java.util.Optional;

@Component
public class BearerAuthFilter extends OncePerRequestFilter implements Ordered {

    public static final String ADMIN_PASSWORD_HEADER = "X-Admin-Password";

    private final UserService userService;
    private final ObjectMapper objectMapper;

    public BearerAuthFilter(UserService userService, ObjectMapper objectMapper) {
        this.userService = userService;
        this.objectMapper = objectMapper;
    }

    @Override
    protected boolean shouldNotFilter(@NonNull HttpServletRequest request) {
        String path = request.getRequestURI();
        if (!path.startsWith("/api/")) {
            return true;
        }
        if ("OPTIONS".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        if (path.equals("/api/auth/login") && "POST".equalsIgnoreCase(request.getMethod())) {
            return true;
        }
        return path.equals("/api/admin/verify") && "POST".equalsIgnoreCase(request.getMethod());
    }

    @Override
    protected void doFilterInternal(
            @NonNull HttpServletRequest request,
            @NonNull HttpServletResponse response,
            @NonNull FilterChain filterChain) throws ServletException, IOException {
        try {
            User user = authenticateBearer(request, response);
            if (user == null) {
                return;
            }
            if (!authorizeAdmin(request, response)) {
                return;
            }
            AuthContext.setCurrentUser(user);
            filterChain.doFilter(request, response);
        } finally {
            AuthContext.clear();
        }
    }

    private User authenticateBearer(HttpServletRequest request, HttpServletResponse response) throws IOException {
        Optional<String> token = extractBearerToken(request);
        if (token.isEmpty()) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Missing or invalid Authorization header");
            return null;
        }
        User user = userService.authenticateFromToken(token.get()).orElse(null);
        if (user == null) {
            writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid credentials");
        }
        return user;
    }

    private Optional<String> extractBearerToken(HttpServletRequest request) {
        String header = request.getHeader(HttpHeaders.AUTHORIZATION);
        if (header == null || !header.regionMatches(true, 0, "Bearer ", 0, 7)) {
            return Optional.empty();
        }
        return Optional.of(header.substring(7).trim());
    }

    private boolean authorizeAdmin(HttpServletRequest request, HttpServletResponse response) throws IOException {
        if (!requiresAdminGate(request)) {
            return true;
        }
        String adminPassword = request.getHeader(ADMIN_PASSWORD_HEADER);
        if (userService.isCorrectAdminPassword(adminPassword)) {
            return true;
        }
        writeError(response, HttpServletResponse.SC_UNAUTHORIZED, "Invalid admin password");
        return false;
    }

    private boolean requiresAdminGate(HttpServletRequest request) {
        String path = request.getRequestURI();
        if (path.equals("/api/admin/verify")) {
            return false;
        }
        return path.startsWith("/api/admin/") && !"GET".equalsIgnoreCase(request.getMethod());
    }

    private void writeError(HttpServletResponse response, int status, String message) throws IOException {
        response.setStatus(status);
        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        objectMapper.writeValue(response.getWriter(), new ErrorResponse(message, status));
    }

    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE + 100;
    }
}
