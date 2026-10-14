package com.spotify.clone.playlist.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** multipart/form-data for PUT /api/playlists/{id} ("Edit details" dialog). cover is replaced only when sent. */
public record UpdatePlaylistForm(
    @NotBlank @Size(max = 100) String name,
    @Size(max = 300) String description,
    Boolean isPublic,
    MultipartFile cover,
    Boolean removeCover) {}
