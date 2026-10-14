package com.spotify.clone.library;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PlayHistoryRepository extends JpaRepository<PlayHistory, Long> {

  /** Distinct tracks, most recently played first. */
  @Query(value = """
      select track_id from play_history
      where user_id = :userId
      group by track_id
      order by max(played_at) desc
      limit :limit""", nativeQuery = true)
  List<Long> findRecentTrackIds(Long userId, int limit);
}
