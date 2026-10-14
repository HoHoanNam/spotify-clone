package com.spotify.clone.album.dto;

import java.time.LocalDate;

import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.web.multipart.MultipartFile;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

/** multipart/form-data: title, artistId, releaseDate? (yyyy-MM-dd), cover? */
public record AlbumForm(
    @NotBlank @Size(max = 200) String title,
    @NotNull Long artistId,
    @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate releaseDate,
    MultipartFile cover) {}
