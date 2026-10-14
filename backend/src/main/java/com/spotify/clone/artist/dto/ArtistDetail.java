package com.spotify.clone.artist.dto;

import java.util.List;

import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.Artist;
import com.spotify.clone.storage.MediaUrls;
import com.spotify.clone.track.dto.TrackResponse;

public record ArtistDetail(Long id, String name, String imageUrl, String bio, long followers,
                           List<AlbumSummary> albums, List<TrackResponse> topTracks, List<TrackResponse> appearsOn) {
  public static ArtistDetail from(Artist a, long followers, List<AlbumSummary> albums,
                                  List<TrackResponse> topTracks, List<TrackResponse> appearsOn) {
    return new ArtistDetail(a.getId(), a.getName(), MediaUrls.image(a.getImagePath()), a.getBio(), followers,
        albums, topTracks, appearsOn);
  }
}
