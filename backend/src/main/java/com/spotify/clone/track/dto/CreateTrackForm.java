package com.spotify.clone.track.dto;

import java.util.List;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Positive;
import jakarta.validation.constraints.Size;

/** multipart/form-data: title, artistIds (repeated, in display order), albumId?, trackNumber?, audio, cover? */
public record CreateTrackForm(
    @NotBlank @Size(max = 200) String title,
    @NotEmpty @Size(max = 10) List<@NotNull Long> artistIds,
    Long albumId,
    @Positive Integer trackNumber,
    @NotNull MultipartFile audio,
    MultipartFile cover) {}
