package com.spotify.clone.album;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.album.dto.AlbumForm;
import com.spotify.clone.album.dto.AlbumSummary;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** /api/admin/** already requires ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin/albums")
@RequiredArgsConstructor
public class AdminAlbumController {

  private final AlbumService albumService;

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  AlbumSummary create(@Valid @ModelAttribute AlbumForm form) {
    return albumService.create(form);
  }

  /** Tracks of the album are kept as singles. */
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@PathVariable Long id) {
    albumService.delete(id);
  }
}
