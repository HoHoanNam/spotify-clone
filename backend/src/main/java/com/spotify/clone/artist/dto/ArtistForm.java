package com.spotify.clone.artist.dto;

import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

/**
 * multipart/form-data: name, bio?, image?
 * Used by POST and PUT; on PUT the image is replaced only when sent, removeImage=true drops it.
 */
public record ArtistForm(
    @NotBlank @Size(max = 200) String name,
    @Size(max = 5000) String bio,
    MultipartFile image,
    Boolean removeImage) {}
