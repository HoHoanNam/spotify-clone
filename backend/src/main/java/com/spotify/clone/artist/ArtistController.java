package com.spotify.clone.artist;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.artist.dto.ArtistDetail;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.common.web.PageResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/artists")
@RequiredArgsConstructor
public class ArtistController {

  private final ArtistService artistService;

  @GetMapping
  PageResponse<ArtistSummary> list(@PageableDefault(size = 20, sort = "name") Pageable pageable) {
    return artistService.list(pageable);
  }

  @GetMapping("/{id}")
  ArtistDetail get(@PathVariable Long id) {
    return artistService.get(id);
  }
}
