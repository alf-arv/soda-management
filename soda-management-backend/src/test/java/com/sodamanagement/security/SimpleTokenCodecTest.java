package com.sodamanagement.security;

import org.junit.jupiter.api.Test;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;

class SimpleTokenCodecTest {

    @Test
    void encodeAndDecode_roundTrips() {
        String token = SimpleTokenCodec.encode("alice", "secret");
        Optional<SimpleTokenCodec.Credentials> creds = SimpleTokenCodec.decode(token);

        assertTrue(creds.isPresent());
        assertEquals("alice", creds.get().username());
        assertEquals("secret", creds.get().password());
    }

    @Test
    void decode_nullToken_returnsEmpty() {
        assertTrue(SimpleTokenCodec.decode(null).isEmpty());
    }

    @Test
    void decode_blankToken_returnsEmpty() {
        assertTrue(SimpleTokenCodec.decode("   ").isEmpty());
    }

    @Test
    void decode_invalidBase64_returnsEmpty() {
        assertTrue(SimpleTokenCodec.decode("not!valid!base64!!!").isEmpty());
    }

    @Test
    void decode_noSeparator_returnsEmpty() {
        String encoded = java.util.Base64.getEncoder().encodeToString("noseparator".getBytes());
        assertTrue(SimpleTokenCodec.decode(encoded).isEmpty());
    }

    @Test
    void decode_emptyUsername_returnsEmpty() {
        String encoded = java.util.Base64.getEncoder().encodeToString(":password".getBytes());
        assertTrue(SimpleTokenCodec.decode(encoded).isEmpty());
    }

    @Test
    void decode_emptyPassword_returnsEmpty() {
        String encoded = java.util.Base64.getEncoder().encodeToString("user:".getBytes());
        assertTrue(SimpleTokenCodec.decode(encoded).isEmpty());
    }
}
