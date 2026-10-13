package com.spotify.clone.album;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AlbumRepository extends JpaRepository<Album, Long> {
  Page<Album> findByTitleContainingIgnoreCase(String q, Pageable pageable);

  List<Album> findByArtistIdOrderByReleaseDateDesc(Long artistId);

  boolean existsByArtistId(Long artistId);
}
