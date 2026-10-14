package com.spotify.clone.library;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface LikedTrackRepository extends JpaRepository<LikedTrack, LikedTrack.Key> {

  Page<LikedTrack> findByUserIdOrderByCreatedAtDesc(Long userId, Pageable pageable);

  @Query("select l.trackId from LikedTrack l where l.userId = :userId")
  List<Long> findTrackIds(Long userId);

  /** Idempotent: liking twice is not an error, and two concurrent likes cannot collide. */
  @Modifying
  @Query(value = "insert into liked_tracks (user_id, track_id) values (:userId, :trackId) on conflict do nothing",
      nativeQuery = true)
  int like(Long userId, Long trackId);

  @Modifying
  @Query("delete from LikedTrack l where l.userId = :userId and l.trackId = :trackId")
  int unlike(Long userId, Long trackId);
}
