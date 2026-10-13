package com.spotify.clone.auth.dto;

import java.time.Duration;

import com.spotify.clone.user.dto.UserResponse;

public record AuthResponse(String accessToken, String tokenType, long expiresIn, UserResponse user) {
  public static AuthResponse bearer(String token, Duration ttl, UserResponse user) {
    return new AuthResponse(token, "Bearer", ttl.toSeconds(), user);
  }
}
