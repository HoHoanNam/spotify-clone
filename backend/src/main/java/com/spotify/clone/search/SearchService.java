package com.spotify.clone.search;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.album.AlbumRepository;
import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.ArtistRepository;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.search.dto.SearchResponse;
import com.spotify.clone.track.TrackRepository;
import com.spotify.clone.track.dto.TrackResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class SearchService {

  private static final Pageable TOP_10 = PageRequest.of(0, 10);

  private final TrackRepository trackRepository;
  private final AlbumRepository albumRepository;
  private final ArtistRepository artistRepository;

  @Transactional(readOnly = true)
  public SearchResponse search(String q) {
    String term = q.strip();
    return new SearchResponse(
        trackRepository.findByTitleContainingIgnoreCase(term, TOP_10).map(TrackResponse::from).getContent(),
        albumRepository.findByTitleContainingIgnoreCase(term, TOP_10).map(AlbumSummary::from).getContent(),
        artistRepository.findByNameContainingIgnoreCase(term, TOP_10).map(ArtistSummary::from).getContent());
  }
}
