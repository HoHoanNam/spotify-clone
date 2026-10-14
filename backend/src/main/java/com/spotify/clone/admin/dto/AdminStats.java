package com.spotify.clone.admin.dto;

import java.util.List;

import com.spotify.clone.track.dto.TrackResponse;

public record AdminStats(long users, long artists, long albums, long tracks, long playlists, long totalPlays,
                         List<TrackResponse> topTracks) {}
