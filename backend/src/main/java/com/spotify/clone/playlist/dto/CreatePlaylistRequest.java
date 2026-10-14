package com.spotify.clone.playlist.dto;

import java.util.List;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/**
 * Every field is optional: a blank name becomes "My Playlist #n" like Spotify's "+" button.
 * trackIds lets "Add to playlist → New playlist" create and fill it in one call.
 */
public record CreatePlaylistRequest(
    @Size(max = 100) String name,
    @Size(max = 300) String description,
    @Size(max = 200) List<@NotNull Long> trackIds) {}
