package com.spotify.clone.playlist.dto;

import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;

/** Drag and drop: move the row at index {@code from} to index {@code to} (0-based). */
public record MoveTrackRequest(@NotNull @PositiveOrZero Integer from, @NotNull @PositiveOrZero Integer to) {}
