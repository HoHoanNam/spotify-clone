package com.spotify.clone.search.dto;

import java.util.List;

import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.playlist.dto.PlaylistSummary;
import com.spotify.clone.track.dto.TrackResponse;

/** Top 10 of each kind; the per-kind list endpoints (?q=) page through the rest. */
public record SearchResponse(List<TrackResponse> tracks, List<AlbumSummary> albums, List<ArtistSummary> artists,
                             List<PlaylistSummary> playlists) {}
