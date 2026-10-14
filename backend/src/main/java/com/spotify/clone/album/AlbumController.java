package com.spotify.clone.album;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.album.dto.AlbumDetail;
import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.common.web.PageResponse;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/albums")
@RequiredArgsConstructor
public class AlbumController {

  private final AlbumService albumService;

  @GetMapping
  PageResponse<AlbumSummary> list(
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    return albumService.list(pageable);
  }

  @GetMapping("/{id}")
  AlbumDetail get(@PathVariable Long id) {
    return albumService.get(id);
  }
}
