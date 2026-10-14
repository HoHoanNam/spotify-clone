package com.spotify.clone.storage;

public final class MediaUrls {
  private MediaUrls() {}

  /** path lưu trong DB, ví dụ "images/tracks/3f2a.jpg" → "/api/media/images/tracks/3f2a.jpg". */
  public static String image(String path) {
    return path == null ? null : "/api/media/" + path;
  }

  /** Audio luôn đi qua trackId, không lộ đường dẫn file. */
  public static String audio(Long trackId) {
    return "/api/media/audio/" + trackId;
  }
}
