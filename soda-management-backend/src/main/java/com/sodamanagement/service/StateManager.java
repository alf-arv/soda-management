package com.sodamanagement.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.sodamanagement.config.SodaProperties;
import com.sodamanagement.model.*;
import com.sodamanagement.security.SecurityUtil;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Component;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.*;
import java.util.concurrent.ConcurrentHashMap;

@Component
public class StateManager {

    private static final int MAX_EVENTS = 50;

    private final Object stateLock = new Object();
    private final SodaProperties sodaProperties;
    private final ObjectMapper objectMapper;

    private final Map<String, User> usersByName = new ConcurrentHashMap<>();
    private final List<SodaEvent> events = new ArrayList<>();
    private final List<SodaType> sodaTypes = new ArrayList<>();
    private final Map<String, Integer> stockBySodaType = new ConcurrentHashMap<>();

    public StateManager(SodaProperties sodaProperties, ObjectMapper objectMapper) {
        this.sodaProperties = sodaProperties;
        this.objectMapper = objectMapper;
    }

    @PostConstruct
    void initialize() {
        synchronized (stateLock) {
            Path path = Path.of(sodaProperties.getDataFile());
            if (Files.isRegularFile(path)) {
                loadFromExistingFile(path);
            } else {
                initializeFreshState();
            }
        }
    }

    private void loadFromExistingFile(Path path) {
        try {
            JsonNode root = objectMapper.readTree(path.toFile());
            SystemState loaded = objectMapper.convertValue(root, SystemState.class);

            loadUsers(loaded);
            loadSodaTypes(loaded);
            loadStock(loaded);
            loadEvents(path, root);

            boolean passwordsMigrated = migratePlaintextPasswords();
            ensureBootstrapAdmin();

            if (passwordsMigrated) {
                persistLocked();
            }
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to load state from " + path, ex);
        }
    }

    private void loadUsers(SystemState loaded) {
        usersByName.clear();
        if (loaded.users() != null) {
            for (User u : loaded.users()) {
                String key = u.getUsername().toLowerCase();
                u.setUsername(key);
                usersByName.put(key, u);
            }
        }
    }

    private void loadSodaTypes(SystemState loaded) {
        sodaTypes.clear();
        if (loaded.sodaTypes() != null) {
            sodaTypes.addAll(loaded.sodaTypes());
        }
    }

    private void loadStock(SystemState loaded) {
        stockBySodaType.clear();
        if (loaded.stockBySodaType() != null) {
            stockBySodaType.putAll(loaded.stockBySodaType());
        }
    }

    private void loadEvents(Path dataPath, JsonNode legacyRoot) throws IOException {
        events.clear();
        List<SodaEvent> loaded = loadEventsFromFile(dataPath);
        if (loaded == null) {
            loaded = loadEventsFromLegacyState(legacyRoot);
        }
        if (loaded != null) {
            events.addAll(trimAndSort(loaded));
        }
    }

    private List<SodaEvent> loadEventsFromFile(Path dataPath) throws IOException {
        Path eventsPath = eventsFilePath(dataPath);
        if (!Files.isRegularFile(eventsPath)) {
            return null;
        }
        EventsState es = objectMapper.readValue(eventsPath.toFile(), EventsState.class);
        return es.events();
    }

    private List<SodaEvent> loadEventsFromLegacyState(JsonNode root) {
        if (root == null || !root.has("events") || !root.get("events").isArray()) {
            return null;
        }
        return objectMapper.convertValue(root.get("events"), new TypeReference<>() {
        });
    }

    private List<SodaEvent> trimAndSort(List<SodaEvent> raw) {
        List<SodaEvent> sorted = new ArrayList<>(raw);
        sorted.sort(Comparator.comparing(SodaEvent::timestamp));
        int from = Math.max(0, sorted.size() - MAX_EVENTS);
        return new ArrayList<>(sorted.subList(from, sorted.size()));
    }

    private boolean migratePlaintextPasswords() {
        boolean any = false;
        for (User u : usersByName.values()) {
            if (u.getPassword() != null && u.getPassword().length() != 64) {
                u.setPassword(SecurityUtil.sha256hex(u.getPassword()));
                any = true;
            }
        }
        return any;
    }

    private void ensureBootstrapAdmin() {
        if (usersByName.isEmpty()) {
            seedOriginAccount();
            persistLocked();
        }
    }

    private void initializeFreshState() {
        usersByName.clear();
        events.clear();
        sodaTypes.clear();
        stockBySodaType.clear();
        seedOriginAccount();
        persistLocked();
    }

    private void seedOriginAccount() {
        String username = sodaProperties.getOriginUsername().trim().toLowerCase();
        String pwd = sodaProperties.getOriginPassword();
        User origin = new User(username, SecurityUtil.sha256hex(pwd), Role.ADMIN);
        usersByName.put(origin.getUsername(), origin);
    }

    // --- State accessors (used by services under stateLock) ---
    public Object getLock() {
        return stateLock;
    }

    public Map<String, User> users() {
        return usersByName;
    }

    public List<SodaEvent> events() {
        return events;
    }

    public List<SodaType> sodaTypes() {
        return sodaTypes;
    }

    public Map<String, Integer> stockBySodaType() {
        return stockBySodaType;
    }

    public void appendEvent(SodaEvent event) {
        events.add(event);
        while (events.size() > MAX_EVENTS) {
            events.remove(0);
        }
    }

    public void persist() {
        synchronized (stateLock) {
            persistLocked();
        }
    }

    /**
     * Writes state and events to disk. Caller must hold stateLock or call persist() instead.
     */
    public void persistLocked() {
        try {
            Path path = Path.of(sodaProperties.getDataFile());
            if (path.getParent() != null) {
                Files.createDirectories(path.getParent());
            }
            SystemState state = new SystemState(
                    new ArrayList<>(usersByName.values()),
                    new ArrayList<>(sodaTypes),
                    new LinkedHashMap<>(stockBySodaType)
            );
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(path.toFile(), state);

            Path eventsPath = eventsFilePath(path);
            if (eventsPath.getParent() != null) {
                Files.createDirectories(eventsPath.getParent());
            }
            objectMapper.writerWithDefaultPrettyPrinter().writeValue(
                    eventsPath.toFile(), new EventsState(new ArrayList<>(events)));
        } catch (IOException ex) {
            throw new IllegalStateException("Failed to persist state", ex);
        }
    }

    private Path eventsFilePath(Path dataPath) {
        Path parent = dataPath.getParent();
        if (parent != null) {
            return parent.resolve("events.json");
        }
        return Path.of("events.json");
    }
}
