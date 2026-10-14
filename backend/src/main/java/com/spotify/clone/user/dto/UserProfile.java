package com.spotify.clone.user.dto;

import java.util.List;

import com.spotify.clone.playlist.dto.PlaylistSummary;
import com.spotify.clone.storage.MediaUrls;
import com.spotify.clone.user.User;

/** Public profile page (/user/:id): only public playlists, no email. */
public record UserProfile(Long id, String username, String avatarUrl, List<PlaylistSummary> playlists) {
  public static UserProfile from(User user, List<PlaylistSummary> playlists) {
    return new UserProfile(user.getId(), user.getUsername(), MediaUrls.image(user.getAvatarPath()), playlists);
  }
}
