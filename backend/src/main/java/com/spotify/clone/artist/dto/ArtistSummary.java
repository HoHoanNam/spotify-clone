package com.spotify.clone.artist.dto;

import com.spotify.clone.artist.Artist;
import com.spotify.clone.storage.MediaUrls;

public record ArtistSummary(Long id, String name, String imageUrl) {
  public static ArtistSummary from(Artist artist) {
    return new ArtistSummary(artist.getId(), artist.getName(), MediaUrls.image(artist.getImagePath()));
  }
}
