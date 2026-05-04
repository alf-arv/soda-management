package com.sodamanagement.security;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class SecurityUtilTest {

    @Test
    void sha256hex() {
        // Gives expected output
        String hash = SecurityUtil.sha256hex("admin");
        assertEquals(64, hash.length());
        assertEquals("8c6976e5b5410415bde908bd4dee15dfb167a9c873fc4bb8a81f6f2ab448a918", hash);

        // Is deterministic
        assertEquals(SecurityUtil.sha256hex("hello"), SecurityUtil.sha256hex("hello"));

        // Is not static
        assertNotEquals(SecurityUtil.sha256hex("alice"), SecurityUtil.sha256hex("bob"));

        // Works for empty string
        hash = SecurityUtil.sha256hex("");
        assertEquals(64, hash.length());
        assertEquals("e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855", hash);
    }
}
