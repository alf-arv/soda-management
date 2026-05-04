package com.sodamanagement.service;

import com.sodamanagement.config.SodaProperties;
import com.sodamanagement.dto.CreatedUser;
import com.sodamanagement.dto.LoginResponse;
import com.sodamanagement.dto.UserResponse;
import com.sodamanagement.model.EventType;
import com.sodamanagement.model.Role;
import com.sodamanagement.model.SodaEvent;
import com.sodamanagement.model.User;
import com.sodamanagement.security.SecurityUtil;
import com.sodamanagement.security.SimpleTokenCodec;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.web.server.ResponseStatusException;

import java.time.Instant;
import java.util.ArrayList;
import java.util.List;
import java.util.Map;
import java.util.Optional;
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class UserServiceTest {

    @Mock
    private StateManager stateManager;

    @Mock
    private SodaProperties sodaProperties;

    private UserService userService;

    private final Object lock = new Object();
    private Map<String, User> users;
    private List<SodaEvent> events;

    @BeforeEach
    void setUp() {
        users = new ConcurrentHashMap<>();
        events = new ArrayList<>();

        lenient().when(stateManager.getLock()).thenReturn(lock);
        lenient().when(stateManager.users()).thenReturn(users);
        lenient().when(stateManager.events()).thenReturn(events);
        lenient().when(sodaProperties.getOriginUsername()).thenReturn("admin");
        lenient().when(sodaProperties.getAutoAdminUsernames()).thenReturn("");

        userService = new UserService(stateManager, sodaProperties);
    }

    // --- login ---

    @Test
    void login_validCredentials_returnsResponse() {
        String hash = SecurityUtil.sha256hex("pass123");
        users.put("alice", new User("alice", hash, Role.USER));

        LoginResponse resp = userService.login("alice", hash);

        assertNotNull(resp);
        assertEquals("alice", resp.username());
        assertEquals(Role.USER, resp.role());
        assertNotNull(resp.token());
    }

    @Test
    void login_wrongPassword_returnsNull() {
        users.put("alice", new User("alice", SecurityUtil.sha256hex("pass"), Role.USER));

        assertNull(userService.login("alice", "wronghash"));
    }

    @Test
    void login_unknownUser_returnsNull() {
        assertNull(userService.login("nobody", "hash"));
    }

    @Test
    void login_caseInsensitive() {
        String hash = SecurityUtil.sha256hex("pass");
        users.put("alice", new User("alice", hash, Role.USER));

        LoginResponse resp = userService.login("Alice", hash);
        assertNotNull(resp);
    }

    // --- authenticateFromToken ---

    @Test
    void authenticateFromToken_validToken_returnsUser() {
        String hash = SecurityUtil.sha256hex("pwd");
        User user = new User("bob", hash, Role.USER);
        users.put("bob", user);

        String token = SimpleTokenCodec.encode("bob", hash);
        Optional<User> result = userService.authenticateFromToken(token);

        assertTrue(result.isPresent());
        assertEquals("bob", result.get().getUsername());
    }

    @Test
    void authenticateFromToken_invalidToken_returnsEmpty() {
        assertTrue(userService.authenticateFromToken("garbage").isEmpty());
    }

    @Test
    void authenticateFromToken_wrongPassword_returnsEmpty() {
        users.put("bob", new User("bob", "realhash", Role.USER));
        String token = SimpleTokenCodec.encode("bob", "wronghash");

        assertTrue(userService.authenticateFromToken(token).isEmpty());
    }

    // --- isCorrectAdminPassword ---

    @Test
    void isCorrectAdminPassword_correct() {
        when(sodaProperties.getAdminPassword()).thenReturn("secret");
        assertTrue(userService.isCorrectAdminPassword(SecurityUtil.sha256hex("secret")));
    }

    @Test
    void isCorrectAdminPassword_wrong() {
        when(sodaProperties.getAdminPassword()).thenReturn("secret");
        assertFalse(userService.isCorrectAdminPassword("wronghash"));
    }

    @Test
    void isCorrectAdminPassword_null() {
        assertFalse(userService.isCorrectAdminPassword(null));
    }

    // --- createUser ---

    @Test
    void createUser_success() {
        CreatedUser result = userService.createUser("Alice", false);

        assertEquals("alice", result.user().getUsername());
        assertEquals("alice", result.plaintextPassword());
        assertEquals(Role.USER, result.user().getRole());
        assertTrue(users.containsKey("alice"));
        verify(stateManager).persistLocked();
    }

    @Test
    void createUser_admin() {
        CreatedUser result = userService.createUser("bob", true);
        assertEquals(Role.ADMIN, result.user().getRole());
    }

    @Test
    void createUser_autoAdmin() {
        when(sodaProperties.getAutoAdminUsernames()).thenReturn("alice,bob");
        CreatedUser result = userService.createUser("alice", false);
        assertEquals(Role.ADMIN, result.user().getRole());
    }

    @Test
    void createUser_duplicate_throws() {
        users.put("alice", new User("alice", "hash", Role.USER));

        assertThrows(ResponseStatusException.class, () ->
                userService.createUser("alice", false));
    }

    @Test
    void createUser_blank_throws() {
        assertThrows(IllegalArgumentException.class, () ->
                userService.createUser("  ", false));
    }

    @Test
    void createUser_passwordIsHashedUsername() {
        CreatedUser result = userService.createUser("alice", false);
        assertEquals(SecurityUtil.sha256hex("alice"), result.user().getPassword());
    }

    // --- deleteUser ---

    @Test
    void deleteUser_success() {
        User user = new User("alice", "hash", Role.USER);
        user.setSodasTaken(3);
        user.setSodasRefilled(3);
        users.put("alice", user);

        assertTrue(userService.deleteUser("alice"));
        assertFalse(users.containsKey("alice"));
        verify(stateManager).persistLocked();
    }

    @Test
    void deleteUser_notFound_returnsFalse() {
        assertFalse(userService.deleteUser("nobody"));
    }

    @Test
    void deleteUser_originAccount_throws() {
        users.put("admin", new User("admin", "hash", Role.ADMIN));
        assertThrows(ResponseStatusException.class, () ->
                userService.deleteUser("admin"));
    }

    @Test
    void deleteUser_nonZeroBalance_throws() {
        User user = new User("alice", "hash", Role.USER);
        user.setSodasTaken(5);
        user.setSodasRefilled(2);
        users.put("alice", user);

        assertThrows(ResponseStatusException.class, () ->
                userService.deleteUser("alice"));
    }

    @Test
    void deleteUser_removesEventsForUser() {
        User user = new User("alice", "hash", Role.USER);
        users.put("alice", user);
        events.add(new SodaEvent(Instant.now(), "alice", EventType.TAKE, 1, 0, "Pepsi"));
        events.add(new SodaEvent(Instant.now(), "bob", EventType.REFILL, 5, 50.0, "Fanta"));

        userService.deleteUser("alice");
        assertEquals(1, events.size());
        assertEquals("bob", events.get(0).username());
    }

    // --- updateUserStats ---

    @Test
    void updateUserStats_success() {
        users.put("alice", new User("alice", "hash", Role.USER));
        userService.updateUserStats("alice", 10, 5);

        assertEquals(10, users.get("alice").getSodasTaken());
        assertEquals(5, users.get("alice").getSodasRefilled());
        verify(stateManager).persistLocked();
    }

    @Test
    void updateUserStats_notFound_throws() {
        assertThrows(ResponseStatusException.class, () ->
                userService.updateUserStats("nobody", 1, 1));
    }

    // --- changePassword ---

    @Test
    void changePassword_success() {
        String oldHash = SecurityUtil.sha256hex("old");
        String newHash = SecurityUtil.sha256hex("new");
        users.put("alice", new User("alice", oldHash, Role.USER));

        String token = userService.changePassword("alice", oldHash, newHash);

        assertNotNull(token);
        assertEquals(newHash, users.get("alice").getPassword());
        verify(stateManager).persistLocked();
    }

    @Test
    void changePassword_wrongCurrent_throws() {
        users.put("alice", new User("alice", "realhash", Role.USER));
        assertThrows(ResponseStatusException.class, () ->
                userService.changePassword("alice", "wronghash", "newhash"));
    }

    @Test
    void changePassword_notFound_throws() {
        assertThrows(ResponseStatusException.class, () ->
                userService.changePassword("nobody", "old", "new"));
    }

    // --- listUsers ---

    @Test
    void listUsers_returnsSorted() {
        users.put("bob", new User("bob", "hash", Role.USER));
        users.put("alice", new User("alice", "hash", Role.ADMIN));

        List<UserResponse> list = userService.listUsers();
        assertEquals(2, list.size());
        assertEquals("alice", list.get(0).username());
        assertEquals("bob", list.get(1).username());
        assertNull(list.get(0).password());
    }

    @Test
    void listUsers_empty() {
        assertTrue(userService.listUsers().isEmpty());
    }
}
