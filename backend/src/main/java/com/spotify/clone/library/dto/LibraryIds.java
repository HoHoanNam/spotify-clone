package com.spotify.clone.library.dto;

import java.util.List;

/**
 * Everything the user has liked / saved / followed, as ids. The client loads this once and keeps it
 * in memory, so every heart and "Follow" button renders instantly without a request per item (ADR-0011).
 */
public record LibraryIds(List<Long> likedTrackIds, List<Long> savedAlbumIds, List<Long> followedArtistIds) {}
