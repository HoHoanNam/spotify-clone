package com.spotify.clone.library.dto;

import java.time.Instant;

import com.spotify.clone.library.LikedTrack;
import com.spotify.clone.track.dto.TrackResponse;

public record LikedTrackItem(TrackResponse track, Instant addedAt) {
  public static LikedTrackItem from(LikedTrack liked) {
    return new LikedTrackItem(TrackResponse.from(liked.getTrack()), liked.getCreatedAt());
  }
}
