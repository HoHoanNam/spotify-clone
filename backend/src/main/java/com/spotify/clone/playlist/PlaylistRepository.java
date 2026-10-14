package com.spotify.clone.playlist;

import java.util.List;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface PlaylistRepository extends JpaRepository<Playlist, Long> {

  List<Playlist> findByOwnerIdOrderByCreatedAtDesc(Long ownerId);

  @Query("select p from Playlist p where p.owner.id = :ownerId and p.isPublic = true order by p.createdAt desc")
  List<Playlist> findPublicByOwner(Long ownerId);

  @Query("select p from Playlist p where p.isPublic = true")
  Page<Playlist> findPublic(Pageable pageable);

  @Query("select p from Playlist p where p.isPublic = true and lower(p.name) like lower(concat('%', :q, '%'))")
  Page<Playlist> searchPublic(String q, Pageable pageable);

  long countByOwnerId(Long ownerId);
}
