package com.spotify.clone.playlist.dto;

import java.time.Instant;
import java.util.List;

import com.spotify.clone.playlist.Playlist;
import com.spotify.clone.playlist.PlaylistTrack;
import com.spotify.clone.track.dto.TrackResponse;
import com.spotify.clone.user.dto.UserRef;

public record PlaylistDetail(Long id, String name, String description, List<String> images, UserRef owner,
                             boolean isPublic, boolean hasCover, int totalDurationSec, Instant createdAt,
                             List<Item> items) {

  /** A track plus when it was added ("Date added" column). */
  public record Item(TrackResponse track, Instant addedAt) {
    static Item from(PlaylistTrack entry) {
      return new Item(TrackResponse.from(entry.getTrack()), entry.getAddedAt());
    }
  }

  public static PlaylistDetail from(Playlist p) {
    List<Item> items = p.getEntries().stream().map(Item::from).toList();
    int total = items.stream().mapToInt(i -> i.track().durationSec()).sum();
    return new PlaylistDetail(p.getId(), p.getName(), p.getDescription(), PlaylistSummary.images(p),
        UserRef.from(p.getOwner()), p.isPublic(), p.getCoverPath() != null, total, p.getCreatedAt(), items);
  }
}
