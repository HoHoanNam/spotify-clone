package com.spotify.clone.album.dto;

import java.time.LocalDate;

import com.spotify.clone.album.Album;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.storage.MediaUrls;

public record AlbumSummary(Long id, String title, String coverUrl, ArtistSummary artist, LocalDate releaseDate) {
  public static AlbumSummary from(Album album) {
    return new AlbumSummary(album.getId(), album.getTitle(), MediaUrls.image(album.getCoverPath()),
        ArtistSummary.from(album.getArtist()), album.getReleaseDate());
  }
}
