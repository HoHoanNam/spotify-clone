package com.spotify.clone.user.dto;

import java.time.Instant;

import com.spotify.clone.user.Role;
import com.spotify.clone.user.User;

public record UserResponse(
  Long id, 
  Role role, 
  String email, 
  String username, 
  String avatarUrl, 
  Instant createdAt
) {
  public static UserResponse from(User user) {
    String avatarUrl = user.getAvatarPath() == null ? null 
                      : "/api/media/images/" + user.getAvatarPath();

    return new UserResponse(
      user.getId(),
      user.getRole(),
      user.getEmail(),
      user.getUsername(),
      avatarUrl,
      user.getCreatedAt()
    );
  }
} 
