package com.sodamanagement.service;

import com.sodamanagement.config.SodaProperties;
import com.sodamanagement.dto.CreatedUser;
import com.sodamanagement.dto.LoginResponse;
import com.sodamanagement.dto.UserResponse;
import com.sodamanagement.model.Role;
import com.sodamanagement.model.User;
import com.sodamanagement.security.SecurityUtil;
import com.sodamanagement.security.SimpleTokenCodec;
import org.springframework.http.HttpStatus;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import java.util.Arrays;
import java.util.Comparator;
import java.util.List;
import java.util.Optional;
import java.util.Set;
import java.util.stream.Collectors;

@Service
public class UserService {

    private final StateManager stateManager;
    private final SodaProperties sodaProperties;

    public UserService(StateManager stateManager, SodaProperties sodaProperties) {
        this.stateManager = stateManager;
        this.sodaProperties = sodaProperties;
    }

    public Optional<User> authenticateFromToken(String token) {
        return SimpleTokenCodec.decode(token).flatMap(c -> {
            User u = stateManager.users().get(c.username().toLowerCase());
            if (u != null && u.getPassword().equals(c.password())) {
                return Optional.of(u);
            }
            return Optional.empty();
        });
    }

    public boolean isCorrectAdminPassword(String password) {
        return password != null && password.equals(SecurityUtil.sha256hex(sodaProperties.getAdminPassword()));
    }

    public LoginResponse login(String username, String password) {
        synchronized (stateManager.getLock()) {
            User u = stateManager.users().get(username.toLowerCase());
            if (u == null || !u.getPassword().equals(password)) {
                return null;
            }
            String token = SimpleTokenCodec.encode(u.getUsername(), u.getPassword());
            return new LoginResponse(
                    u.getUsername(),
                    u.getRole(),
                    u.getSodasTaken(),
                    u.getSodasRefilled(),
                    u.getTotalMoneySpentOnRefills(),
                    token
            );
        }
    }

    public List<UserResponse> listUsers() {
        synchronized (stateManager.getLock()) {
            return stateManager.users().values().stream()
                    .sorted(Comparator.comparing(User::getUsername))
                    .map(u -> UserResponse.fromUser(u, null))
                    .collect(Collectors.toList());
        }
    }

    public CreatedUser createUser(String name, boolean makeAdmin) {
        String username = name.trim().toLowerCase();
        if (username.isEmpty()) {
            throw new IllegalArgumentException("name must not be blank");
        }
        synchronized (stateManager.getLock()) {
            if (stateManager.users().containsKey(username)) {
                throw new ResponseStatusException(HttpStatus.CONFLICT, "User already exists");
            }
            boolean isAdmin = makeAdmin || autoAdminSet().contains(username);
            Role role = isAdmin ? Role.ADMIN : Role.USER;
            User u = new User(username, SecurityUtil.sha256hex(username), role);
            stateManager.users().put(username, u);
            stateManager.persistLocked();
            return new CreatedUser(u, username);
        }
    }

    public boolean deleteUser(String username) {
        synchronized (stateManager.getLock()) {
            String key = username.trim().toLowerCase();
            String originKey = sodaProperties.getOriginUsername().trim().toLowerCase();
            if (originKey.equals(key)) {
                throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Cannot delete the origin admin account");
            }
            User u = stateManager.users().get(key);
            if (u == null) {
                return false;
            }
            int net = u.getSodasRefilled() - u.getSodasTaken();
            if (net != 0) {
                String msg = net > 0
                        ? "This user has contributed " + net + " more soda(s) than taken. Settle the balance first."
                        : "This user owes " + Math.abs(net) + " soda(s) to the group. Settle the balance first.";
                throw new ResponseStatusException(HttpStatus.CONFLICT, msg);
            }
            stateManager.users().remove(key);
            stateManager.events().removeIf(e -> key.equalsIgnoreCase(e.username()));
            stateManager.persistLocked();
            return true;
        }
    }

    public void updateUserStats(String username, int sodasTaken, int sodasRefilled, double totalMoneySpentOnRefills) {
        synchronized (stateManager.getLock()) {
            User u = stateManager.users().get(username.trim().toLowerCase());
            if (u == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            u.setSodasTaken(sodasTaken);
            u.setSodasRefilled(sodasRefilled);
            u.setTotalMoneySpentOnRefills(totalMoneySpentOnRefills);
            stateManager.persistLocked();
        }
    }

    public String changePassword(String username, String currentPasswordHash, String newPasswordHash) {
        synchronized (stateManager.getLock()) {
            User u = stateManager.users().get(username.toLowerCase());
            if (u == null) {
                throw new ResponseStatusException(HttpStatus.NOT_FOUND, "User not found");
            }
            if (!u.getPassword().equals(currentPasswordHash)) {
                throw new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Current password is incorrect");
            }
            u.setPassword(newPasswordHash);
            stateManager.persistLocked();
            return SimpleTokenCodec.encode(u.getUsername(), u.getPassword());
        }
    }

    private Set<String> autoAdminSet() {
        String csv = sodaProperties.getAutoAdminUsernames();
        if (csv == null || csv.isBlank()) {
            return Set.of();
        }
        return Arrays.stream(csv.split(","))
                .map(s -> s.trim().toLowerCase())
                .filter(s -> !s.isEmpty())
                .collect(Collectors.toSet());
    }
}
