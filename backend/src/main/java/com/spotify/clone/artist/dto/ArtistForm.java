package com.spotify.clone.artist.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/** multipart/form-data: name, bio?, image? */
public record ArtistForm(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 5000) String bio,
    MultipartFile image) {}
