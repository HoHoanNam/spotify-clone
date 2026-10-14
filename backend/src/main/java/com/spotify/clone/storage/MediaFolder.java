package com.spotify.clone.storage;

public enum MediaFolder {
  AUDIO("audio"),
  ARTIST_IMAGES("images/artists"),
  ALBUM_COVERS("images/albums"),
  TRACK_COVERS("images/tracks"),
  PLAYLIST_COVERS("images/playlists"),
  AVATARS("images/avatars");

  private final String path;

  MediaFolder(String path) { this.path = path; }

  public String path() { return path; }
}
