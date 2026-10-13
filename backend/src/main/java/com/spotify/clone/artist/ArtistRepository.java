package com.spotify.clone.artist;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface ArtistRepository extends JpaRepository<Artist, Long> {
  Page<Artist> findByNameContainingIgnoreCase(String q, Pageable pageable);
}
