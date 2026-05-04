package com.sodamanagement.security;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.Optional;

public final class SimpleTokenCodec {

    private static final char SEPARATOR = ':';

    private SimpleTokenCodec() {
    }

    public static String encode(String username, String password) {
        String raw = username + SEPARATOR + password;
        return Base64.getEncoder().encodeToString(raw.getBytes(StandardCharsets.UTF_8));
    }

    public static Optional<Credentials> decode(String token) {
        if (token == null || token.isBlank()) {
            return Optional.empty();
        }
        return decodeBase64(token.trim()).flatMap(SimpleTokenCodec::splitCredentials);
    }

    private static Optional<String> decodeBase64(String encoded) {
        try {
            byte[] bytes = Base64.getDecoder().decode(encoded);
            return Optional.of(new String(bytes, StandardCharsets.UTF_8));
        } catch (IllegalArgumentException ex) {
            return Optional.empty();
        }
    }

    private static Optional<Credentials> splitCredentials(String raw) {
        int idx = raw.indexOf(SEPARATOR);
        if (idx <= 0 || idx == raw.length() - 1) {
            return Optional.empty();
        }
        return Optional.of(new Credentials(raw.substring(0, idx), raw.substring(idx + 1)));
    }

    public record Credentials(String username, String password) {
    }
}
