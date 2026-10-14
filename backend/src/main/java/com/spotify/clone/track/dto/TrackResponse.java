package com.spotify.clone.track.dto;

import java.util.List;

import com.spotify.clone.album.dto.AlbumRef;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.storage.MediaUrls;
import com.spotify.clone.track.Track;

public record TrackResponse(Long id, String title, int durationSec, Integer trackNumber,
                            List<ArtistSummary> artists, AlbumRef album,
                            String coverUrl, String audioUrl, long playCount) {
  public static TrackResponse from(Track t) {
    return new TrackResponse(t.getId(), t.getTitle(), t.getDurationSec(), t.getTrackNumber(),
        t.getArtists().stream().map(ArtistSummary::from).toList(),
        AlbumRef.from(t.getAlbum()),
        MediaUrls.image(t.effectiveCoverPath()), MediaUrls.audio(t.getId()), t.getPlayCount());
  }
}
