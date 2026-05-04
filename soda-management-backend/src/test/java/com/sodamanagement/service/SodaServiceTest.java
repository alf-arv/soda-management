package com.sodamanagement.service;

import com.sodamanagement.dto.DashboardResponse;
import com.sodamanagement.dto.RefillRequest;
import com.sodamanagement.model.*;
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
import java.util.concurrent.ConcurrentHashMap;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.Mockito.*;

@ExtendWith(MockitoExtension.class)
class SodaServiceTest {

    @Mock
    private StateManager stateManager;

    private SodaService sodaService;

    private final Object lock = new Object();
    private Map<String, User> users;
    private List<SodaEvent> events;
    private List<SodaType> sodaTypes;
    private Map<String, Integer> stock;

    @BeforeEach
    void setUp() {
        users = new ConcurrentHashMap<>();
        events = new ArrayList<>();
        sodaTypes = new ArrayList<>();
        stock = new ConcurrentHashMap<>();

        lenient().when(stateManager.getLock()).thenReturn(lock);
        lenient().when(stateManager.users()).thenReturn(users);
        lenient().when(stateManager.events()).thenReturn(events);
        lenient().when(stateManager.sodaTypes()).thenReturn(sodaTypes);
        lenient().when(stateManager.stockBySodaType()).thenReturn(stock);

        sodaService = new SodaService(stateManager);
    }

    // --- getDashboard ---

    @Test
    void getDashboard_returnsAllData() {
        users.put("alice", new User("alice", "hash", Role.USER));
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));
        stock.put("Pepsi", 5);
        events.add(new SodaEvent(Instant.now(), "alice", EventType.TAKE, 1, 0, "Pepsi"));

        DashboardResponse resp = sodaService.getDashboard();

        assertEquals(5, resp.totalSodasRemaining());
        assertEquals(1, resp.users().size());
        assertEquals(1, resp.recentEvents().size());
        assertEquals(1, resp.sodaTypes().size());
        assertEquals(5, resp.stockBySodaType().get("Pepsi"));
    }

    @Test
    void getDashboard_sumsStockAcrossTypes() {
        stock.put("Pepsi", 3);
        stock.put("Fanta", 7);

        DashboardResponse resp = sodaService.getDashboard();
        assertEquals(10, resp.totalSodasRemaining());
    }

    @Test
    void getDashboard_emptyState() {
        DashboardResponse resp = sodaService.getDashboard();
        assertEquals(0, resp.totalSodasRemaining());
        assertTrue(resp.users().isEmpty());
        assertTrue(resp.recentEvents().isEmpty());
    }

    // --- takeSoda ---

    @Test
    void takeSoda_withTypedStock_decrementsAndPersists() {
        User alice = new User("alice", "hash", Role.USER);
        users.put("alice", alice);
        stock.put("Pepsi", 5);

        sodaService.takeSoda("alice", "alice", "Pepsi");

        assertEquals(1, alice.getSodasTaken());
        assertEquals(4, stock.get("Pepsi"));
        verify(stateManager).appendEvent(any(SodaEvent.class));
        verify(stateManager).persistLocked();
    }

    @Test
    void takeSoda_noTypedStock_incrementsTaken() {
        User alice = new User("alice", "hash", Role.USER);
        users.put("alice", alice);

        sodaService.takeSoda("alice", "alice", null);

        assertEquals(1, alice.getSodasTaken());
        verify(stateManager).persistLocked();
    }

    @Test
    void takeSoda_usernameMismatch_throws() {
        assertThrows(IllegalArgumentException.class, () ->
                sodaService.takeSoda("alice", "bob", null));
    }

    @Test
    void takeSoda_userNotFound_throws() {
        assertThrows(ResponseStatusException.class, () ->
                sodaService.takeSoda("alice", "alice", null));
    }

    @Test
    void takeSoda_noStockRemaining_throws() {
        users.put("alice", new User("alice", "hash", Role.USER));
        stock.put("Pepsi", 0);

        assertThrows(ResponseStatusException.class, () ->
                sodaService.takeSoda("alice", "alice", "Pepsi"));
    }

    @Test
    void takeSoda_typedStockButNoTypeGiven_throws() {
        users.put("alice", new User("alice", "hash", Role.USER));
        stock.put("Pepsi", 5);

        assertThrows(ResponseStatusException.class, () ->
                sodaService.takeSoda("alice", "alice", null));
    }

    @Test
    void takeSoda_caseInsensitive() {
        users.put("alice", new User("alice", "hash", Role.USER));

        sodaService.takeSoda("Alice", "ALICE", null);
        assertEquals(1, users.get("alice").getSodasTaken());
    }

    // --- refill ---

    @Test
    void refill_withType_addsStockAndPersists() {
        User alice = new User("alice", "hash", Role.USER);
        users.put("alice", alice);
        stock.put("Pepsi", 2);

        RefillRequest req = new RefillRequest("alice", 6, 89.90, "Pepsi");
        sodaService.refill("alice", req);

        assertEquals(8, stock.get("Pepsi"));
        assertEquals(6, alice.getSodasRefilled());
        assertEquals(89.90, alice.getTotalMoneySpentOnRefills(), 0.01);
        verify(stateManager).appendEvent(any(SodaEvent.class));
        verify(stateManager).persistLocked();
    }

    @Test
    void refill_noType_whenNoTypedStock() {
        User alice = new User("alice", "hash", Role.USER);
        users.put("alice", alice);

        RefillRequest req = new RefillRequest("alice", 3, 30.0, null);
        sodaService.refill("alice", req);

        assertEquals(3, alice.getSodasRefilled());
    }

    @Test
    void refill_usernameMismatch_throws() {
        RefillRequest req = new RefillRequest("bob", 1, 10.0, null);
        assertThrows(IllegalArgumentException.class, () ->
                sodaService.refill("alice", req));
    }

    @Test
    void refill_userNotFound_throws() {
        RefillRequest req = new RefillRequest("alice", 1, 10.0, null);
        assertThrows(ResponseStatusException.class, () ->
                sodaService.refill("alice", req));
    }

    @Test
    void refill_typedStockButNoType_throws() {
        users.put("alice", new User("alice", "hash", Role.USER));
        stock.put("Pepsi", 5);

        RefillRequest req = new RefillRequest("alice", 3, 30.0, null);
        assertThrows(ResponseStatusException.class, () ->
                sodaService.refill("alice", req));
    }

    // --- soda types ---

    @Test
    void addSodaType_success() {
        sodaService.addSodaType("Pepsi", "#0066cc");

        assertEquals(1, sodaTypes.size());
        assertEquals("Pepsi", sodaTypes.get(0).name());
        assertEquals(0, stock.get("Pepsi"));
        verify(stateManager).persistLocked();
    }

    @Test
    void addSodaType_duplicate_throws() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));

        assertThrows(ResponseStatusException.class, () ->
                sodaService.addSodaType("pepsi", "#000"));
    }

    @Test
    void removeSodaType_success() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));
        stock.put("Pepsi", 5);

        sodaService.removeSodaType("Pepsi");

        assertTrue(sodaTypes.isEmpty());
        assertFalse(stock.containsKey("Pepsi"));
        verify(stateManager).persistLocked();
    }

    @Test
    void removeSodaType_notFound_throws() {
        assertThrows(ResponseStatusException.class, () ->
                sodaService.removeSodaType("Unknown"));
    }

    @Test
    void removeSodaType_caseInsensitive() {
        sodaTypes.add(new SodaType("Pepsi Max", "#0066cc"));
        stock.put("Pepsi Max", 3);

        sodaService.removeSodaType("pepsi max");

        assertTrue(sodaTypes.isEmpty());
    }

    @Test
    void getSodaTypes_returnsCopy() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));

        List<SodaType> result = sodaService.getSodaTypes();
        assertEquals(1, result.size());

        result.clear();
        assertEquals(1, sodaTypes.size());
    }

    // --- setStock ---

    @Test
    void setStock_overridesProvidedTypesAndPersists() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));
        sodaTypes.add(new SodaType("Fanta", "#ff8800"));
        stock.put("Pepsi", 10);
        stock.put("Fanta", 4);

        sodaService.setStock(Map.of("Pepsi", 7, "Fanta", 0));

        assertEquals(7, stock.get("Pepsi"));
        assertEquals(0, stock.get("Fanta"));
        verify(stateManager).persistLocked();
    }

    @Test
    void setStock_omittedTypesUnchanged() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));
        sodaTypes.add(new SodaType("Fanta", "#ff8800"));
        stock.put("Pepsi", 10);
        stock.put("Fanta", 4);

        sodaService.setStock(Map.of("Pepsi", 2));

        assertEquals(2, stock.get("Pepsi"));
        assertEquals(4, stock.get("Fanta"));
    }

    @Test
    void setStock_caseInsensitiveLookup() {
        sodaTypes.add(new SodaType("Pepsi Max", "#0066cc"));
        stock.put("Pepsi Max", 1);

        sodaService.setStock(Map.of("pepsi max", 9));

        assertEquals(9, stock.get("Pepsi Max"));
    }

    @Test
    void setStock_unknownType_throwsNotFound() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));
        stock.put("Pepsi", 1);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> sodaService.setStock(Map.of("Coca", 5)));
        assertEquals(404, ex.getStatusCode().value());
    }

    @Test
    void setStock_negativeValue_throwsBadRequest() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));
        stock.put("Pepsi", 1);

        Map<String, Integer> req = new java.util.HashMap<>();
        req.put("Pepsi", -1);

        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> sodaService.setStock(req));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void setStock_nullMap_throwsBadRequest() {
        ResponseStatusException ex = assertThrows(ResponseStatusException.class,
                () -> sodaService.setStock(null));
        assertEquals(400, ex.getStatusCode().value());
    }

    @Test
    void setStock_emptyMap_isNoOp() {
        sodaTypes.add(new SodaType("Pepsi", "#0066cc"));
        stock.put("Pepsi", 5);

        sodaService.setStock(Map.of());

        assertEquals(5, stock.get("Pepsi"));
        verify(stateManager).persistLocked();
    }
}
