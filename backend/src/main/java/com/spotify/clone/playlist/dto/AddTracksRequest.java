package com.spotify.clone.playlist.dto;

import java.util.List;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** Tracks are appended in the given order; ones already in the playlist are skipped. */
public record AddTracksRequest(@NotEmpty @Size(max = 200) List<@NotNull Long> trackIds) {}
