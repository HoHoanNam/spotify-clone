package com.spotify.clone.track.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/**
 * multipart/form-data for PUT /api/admin/tracks/{id}.
 * Metadata is replaced as a whole (no albumId = single); audio / cover are replaced only when sent.
 */
public record UpdateTrackForm(
    @NotBlank @Size(max = 200) String title,
    @NotEmpty @Size(max = 10) List<@NotNull Long> artistIds,
    Long albumId,
    @Positive Integer trackNumber,
    MultipartFile audio,
    MultipartFile cover,
    Boolean removeCover) {}
