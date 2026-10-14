package com.spotify.clone.track;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface TrackRepository extends JpaRepository<Track, Long> {
  Page<Track> findByTitleContainingIgnoreCase(String q, Pageable pageable);
  List<Track> findByAlbumIdOrderByTrackNumberAsc(Long albumId);

  @Query("select t from Track t join t.artists a where a.id = :artistId order by t.playCount desc")
  List<Track> findTopByArtist(Long artistId, Pageable pageable);   // gọi với PageRequest.of(0, 10)

  /** Tracks where the artist is listed after the main artist (position > 0), newest first. */
  @Query("select t from Track t join t.artists a where a.id = :artistId and index(a) > 0 order by t.createdAt desc")
  List<Track> findFeaturing(Long artistId, Pageable pageable);

  @Query("select count(t) > 0 from Track t join t.artists a where a.id = :artistId")
  boolean existsByArtist(Long artistId);

  @Query("select coalesce(sum(t.playCount), 0) from Track t")
  long sumPlayCount();

  /** clearAutomatically: entities loaded earlier in the transaction would still show the old count. */
  @Modifying(clearAutomatically = true)
  @Query("update Track t set t.playCount = t.playCount + 1 where t.id = :id")
  int incrementPlayCount(Long id);
}
