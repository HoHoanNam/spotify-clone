package com.spotify.clone.playlist.dto;

/** added = 0 means every track was already there; the client says "Already added". */
public record AddTracksResponse(int added, PlaylistSummary playlist) {}
