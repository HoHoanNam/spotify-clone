package com.spotify.clone.user.dto;

import com.spotify.clone.storage.MediaUrls;
import com.spotify.clone.user.User;

/** Public view of a user (playlist owner, profile header): no email, no role. */
public record UserRef(Long id, String username, String avatarUrl) {
  public static UserRef from(User user) {
    return new UserRef(user.getId(), user.getUsername(), MediaUrls.image(user.getAvatarPath()));
  }
}
