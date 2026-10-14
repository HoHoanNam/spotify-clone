package com.spotify.clone.album.dto;

import java.time.LocalDate;
import java.util.List;

import com.spotify.clone.album.Album;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.storage.MediaUrls;
import com.spotify.clone.track.dto.TrackResponse;

public record AlbumDetail(Long id, String title, String coverUrl, ArtistSummary artist,
                          LocalDate releaseDate, List<TrackResponse> tracks) {
  public static AlbumDetail from(Album album, List<TrackResponse> tracks) {
    return new AlbumDetail(album.getId(), album.getTitle(), MediaUrls.image(album.getCoverPath()),
        ArtistSummary.from(album.getArtist()), album.getReleaseDate(), tracks);
  }
}
