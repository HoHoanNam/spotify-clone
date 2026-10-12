package com.spotify.clone.config;

import java.time.Duration;
import java.util.List;

import org.springframework.boot.context.properties.ConfigurationProperties;

@ConfigurationProperties(prefix = "app")
public record AppProperties(Storage storage, Cors cors, Jwt jwt) {

    public record Storage(String root) {
    }

    public record Cors(List<String> allowedOrigins) {
    }

    public record Jwt(String secret, Duration accessTokenTtl) {
    }
}
