package com.spotify.clone.album.dto;

import com.spotify.clone.album.Album;

/** Reference to an album shown inside a track row. */
public record AlbumRef(Long id, String title) {
  public static AlbumRef from(Album album) {
    return album == null ? null : new AlbumRef(album.getId(), album.getTitle());
  }
}
