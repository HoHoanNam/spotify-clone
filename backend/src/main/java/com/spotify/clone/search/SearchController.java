package com.spotify.clone.search;

import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.search.dto.SearchResponse;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class SearchController {

  private final SearchService searchService;

  /** Constraints on plain params are checked by Spring MVC's built-in method validation → 400. */
  @GetMapping("/api/search")
  SearchResponse search(@RequestParam @NotBlank @Size(max = 100) String q) {
    return searchService.search(q);
  }
}
