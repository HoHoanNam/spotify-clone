package com.spotify.clone.library;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface FollowedArtistRepository extends JpaRepository<FollowedArtist, FollowedArtist.Key> {

  List<FollowedArtist> findByUserIdOrderByCreatedAtDesc(Long userId);

  long countByArtistId(Long artistId);

  @Modifying
  @Query(value = "insert into followed_artists (user_id, artist_id) values (:userId, :artistId) on conflict do nothing",
      nativeQuery = true)
  int follow(Long userId, Long artistId);

  @Modifying
  @Query("delete from FollowedArtist f where f.userId = :userId and f.artistId = :artistId")
  int unfollow(Long userId, Long artistId);
}
