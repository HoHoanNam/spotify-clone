package com.spotify.clone.track;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.track.dto.TrackResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/tracks")
@RequiredArgsConstructor
public class TrackController {

  private final TrackService trackService;

  @GetMapping
  PageResponse<TrackResponse> list(
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    return trackService.list(pageable);
  }

  @GetMapping("/{id}")
  TrackResponse get(@PathVariable Long id) {
    return trackService.get(id);
  }

  /** Not counted in the stream endpoint: one listen makes many Range requests. */
  @PostMapping("/{id}/play")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void play(@PathVariable Long id) {
    trackService.recordPlay(id);
  }
}
