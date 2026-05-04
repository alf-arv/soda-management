package com.sodamanagement.service;

import com.sodamanagement.dto.DashboardResponse;
import com.sodamanagement.dto.RefillRequest;
import com.sodamanagement.dto.UserResponse;
import com.sodamanagement.model.EventType;
import com.sodamanagement.model.SodaEvent;
import com.sodamanagement.model.SodaType;
import com.sodamanagement.model.User;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Map;
import java.util.stream.Collectors;

@Service
public class SodaService {

    private final StateManager stateManager;

    public SodaService(StateManager stateManager) {
        this.stateManager = stateManager;
    }

    public DashboardResponse getDashboard() {
        synchronized (stateManager.getLock()) {
            List<UserResponse> userViews = stateManager.users().values().stream()
                    .sorted(Comparator.comparing(User::getUsername))
                    .map(u -> UserResponse.fromUser(u, null))
                    .collect(Collectors.toList());
            return new DashboardResponse(
                    computeTotalRemaining(),
                    userViews,
                    new ArrayList<>(stateManager.events()),
                    new ArrayList<>(stateManager.sodaTypes()),
                    new LinkedHashMap<>(stateManager.stockBySodaType())
            );
        }
    }

    public void takeSoda(String authenticatedUsername, String bodyUsername, String sodaType) {
        if (!authenticatedUsername.equalsIgnoreCase(bodyUsername)) {
            throw new IllegalArgumentException("username must match authenticated user");
        }
        synchronized (stateManager.getLock()) {
            User u = stateManager.users().get(bodyUsername.toLowerCase());
            if (u == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            if (hasPerTypeStock()) {
                validateAndDecrementStock(sodaType);
            }
            u.setSodasTaken(u.getSodasTaken() + 1);
            stateManager.appendEvent(new SodaEvent(
                    Instant.now(), u.getUsername(), EventType.TAKE, 1, 0.0, sodaType));
            stateManager.persistLocked();
        }
    }

    public void refill(String authenticatedUsername, RefillRequest request) {
        if (!authenticatedUsername.equalsIgnoreCase(request.username())) {
            throw new IllegalArgumentException("username must match authenticated user");
        }
        synchronized (stateManager.getLock()) {
            User u = stateManager.users().get(request.username().toLowerCase());
            if (u == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            String sodaType = request.sodaType();
            if (hasPerTypeStock() && (sodaType == null || sodaType.isBlank())) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a soda type");
            }
            if (sodaType != null && !sodaType.isBlank()) {
                stateManager.stockBySodaType().merge(sodaType, request.quantity(), Integer::sum);
            }
            u.setSodasRefilled(u.getSodasRefilled() + request.quantity());
            u.setTotalMoneySpentOnRefills(u.getTotalMoneySpentOnRefills() + request.cost());
            stateManager.appendEvent(new SodaEvent(
                    Instant.now(), u.getUsername(), EventType.REFILL,
                    request.quantity(), request.cost(), sodaType));
            stateManager.persistLocked();
        }
    }

    public List<SodaType> getSodaTypes() {
        synchronized (stateManager.getLock()) {
            return new ArrayList<>(stateManager.sodaTypes());
        }
    }

    public void addSodaType(String name, String color) {
        synchronized (stateManager.getLock()) {
            boolean exists = stateManager.sodaTypes().stream()
                    .anyMatch(t -> t.name().equalsIgnoreCase(name));
            if (exists) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "Soda type already exists");
            }
            stateManager.sodaTypes().add(new SodaType(name.trim(), color.trim()));
            stateManager.stockBySodaType().putIfAbsent(name.trim(), 0);
            stateManager.persistLocked();
        }
    }

    /**
     * Force-set per-type stock counts. Values for omitted soda types are left untouched.
     * All keys must reference an existing soda type and all values must be non-negative.
     */
    public void setStock(Map<String, Integer> stockBySodaType) {
        if (stockBySodaType == null) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "stock is required");
        }
        synchronized (stateManager.getLock()) {
            Map<String, String> canonicalByLower = stateManager.sodaTypes().stream()
                    .collect(Collectors.toMap(
                            t -> t.name().toLowerCase(),
                            SodaType::name,
                            (a, b) -> a));
            for (Map.Entry<String, Integer> entry : stockBySodaType.entrySet()) {
                String key = entry.getKey();
                Integer value = entry.getValue();
                if (key == null || key.isBlank()) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Soda type name required");
                }
                if (value == null || value < 0) {
                    throw new ResponseStatusException(HttpStatus.BAD_REQUEST,
                            "Stock for " + key + " must be a non-negative number");
                }
                String canonicalName = canonicalByLower.get(key.toLowerCase());
                if (canonicalName == null) {
                    throw new ResponseStatusException(HttpStatus.NOT_FOUND,
                            "Soda type not found: " + key);
                }
                stateManager.stockBySodaType().put(canonicalName, value);
            }
            stateManager.persistLocked();
        }
    }

    public void removeSodaType(String name) {
        synchronized (stateManager.getLock()) {
            String canonical = stateManager.sodaTypes().stream()
                    .filter(t -> t.name().equalsIgnoreCase(name))
                    .map(SodaType::name)
                    .findFirst()
                    .orElse(null);
            if (canonical == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "Soda type not found");
            }
            stateManager.sodaTypes().removeIf(t -> t.name().equalsIgnoreCase(name));
            stateManager.stockBySodaType().remove(canonical);
            stateManager.persistLocked();
        }
    }

    private int computeTotalRemaining() {
        return stateManager.stockBySodaType().values().stream().mapToInt(Integer::intValue).sum();
    }

    private boolean hasPerTypeStock() {
        return !stateManager.stockBySodaType().isEmpty();
    }

    private void validateAndDecrementStock(String sodaType) {
        if (sodaType == null || sodaType.isBlank()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Select a soda type");
        }
        int typeStock = stateManager.stockBySodaType().getOrDefault(sodaType, 0);
        if (typeStock < 1) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "No " + sodaType + " remaining");
        }
        stateManager.stockBySodaType().put(sodaType, typeStock - 1);
    }
}
