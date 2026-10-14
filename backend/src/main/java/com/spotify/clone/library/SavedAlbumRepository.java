package com.spotify.clone.library;

import java.util.List;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;

public interface SavedAlbumRepository extends JpaRepository<SavedAlbum, SavedAlbum.Key> {

  List<SavedAlbum> findByUserIdOrderByCreatedAtDesc(Long userId);

  @Modifying
  @Query(value = "insert into saved_albums (user_id, album_id) values (:userId, :albumId) on conflict do nothing",
      nativeQuery = true)
  int add(Long userId, Long albumId);

  @Modifying
  @Query("delete from SavedAlbum s where s.userId = :userId and s.albumId = :albumId")
  int remove(Long userId, Long albumId);
}
