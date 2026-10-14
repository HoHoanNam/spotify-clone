package com.spotify.clone.artist;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.artist.dto.ArtistForm;
import com.spotify.clone.artist.dto.ArtistSummary;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** /api/admin/** already requires ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin/artists")
@RequiredArgsConstructor
public class AdminArtistController {

  private final ArtistService artistService;

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  ArtistSummary create(@Valid @ModelAttribute ArtistForm form) {
    return artistService.create(form);
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  ArtistSummary update(@PathVariable Long id, @Valid @ModelAttribute ArtistForm form) {
    return artistService.update(id, form);
  }

  /** 409 if the artist still has albums or tracks. */
  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@PathVariable Long id) {
    artistService.delete(id);
  }
}
