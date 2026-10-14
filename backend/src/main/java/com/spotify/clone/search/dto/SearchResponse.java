package com.spotify.clone.search.dto;

import java.util.List;

import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.track.dto.TrackResponse;

public record SearchResponse(List<TrackResponse> tracks, List<AlbumSummary> albums, List<ArtistSummary> artists) {}
