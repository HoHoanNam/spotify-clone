package com.spotify.clone.playlist.dto;

import java.util.List;

import com.spotify.clone.playlist.Playlist;
import com.spotify.clone.storage.MediaUrls;
import com.spotify.clone.user.dto.UserRef;

/**
 * images: one URL when the playlist has its own cover, otherwise up to 4 track covers (the client
 * draws a 2×2 mosaic when there are 4, like Spotify), or empty for an empty playlist.
 */
public record PlaylistSummary(Long id, String name, String description, List<String> images,
                              UserRef owner, boolean isPublic, int trackCount) {
  public static PlaylistSummary from(Playlist p) {
    return new PlaylistSummary(p.getId(), p.getName(), p.getDescription(), images(p),
        UserRef.from(p.getOwner()), p.isPublic(), p.getEntries().size());
  }

  static List<String> images(Playlist p) {
    return p.coverPaths().stream().map(MediaUrls::image).toList();
  }
}
