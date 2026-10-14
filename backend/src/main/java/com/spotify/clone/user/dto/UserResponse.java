package com.spotify.clone.user.dto;

import java.time.Instant;

import com.spotify.clone.storage.MediaUrls;
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
    return new UserResponse(
      user.getId(),
      user.getRole(),
      user.getEmail(),
      user.getUsername(),
      MediaUrls.image(user.getAvatarPath()),
      user.getCreatedAt()
    );
  }
} 
