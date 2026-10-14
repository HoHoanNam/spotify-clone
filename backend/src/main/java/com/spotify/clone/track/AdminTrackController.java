package com.spotify.clone.track;

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

import com.spotify.clone.track.dto.CreateTrackForm;
import com.spotify.clone.track.dto.TrackResponse;
import com.spotify.clone.track.dto.UpdateTrackForm;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

/** /api/admin/** already requires ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin/tracks")
@RequiredArgsConstructor
public class AdminTrackController {

  private final TrackService trackService;

  @PostMapping(consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  @ResponseStatus(HttpStatus.CREATED)
  TrackResponse create(@Valid @ModelAttribute CreateTrackForm form) {
    return trackService.create(form);
  }

  @PutMapping(value = "/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  TrackResponse update(@PathVariable Long id, @Valid @ModelAttribute UpdateTrackForm form) {
    return trackService.update(id, form);
  }


  @DeleteMapping("/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@PathVariable Long id) {
    trackService.delete(id);
  }
}
