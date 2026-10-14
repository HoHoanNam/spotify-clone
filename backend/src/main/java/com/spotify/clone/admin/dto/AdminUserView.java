package com.spotify.clone.admin.dto;

import java.time.Instant;

import com.spotify.clone.storage.MediaUrls;
import com.spotify.clone.user.Role;
import com.spotify.clone.user.User;

public record AdminUserView(Long id, String username, String email, String avatarUrl, Role role, boolean enabled,
                            Instant createdAt) {
  public static AdminUserView from(User u) {
    return new AdminUserView(u.getId(), u.getUsername(), u.getEmail(), MediaUrls.image(u.getAvatarPath()),
        u.getRole(), u.isEnabled(), u.getCreatedAt());
  }
}
