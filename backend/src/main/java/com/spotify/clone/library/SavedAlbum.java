package com.spotify.clone.library;

import java.io.Serializable;
import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.spotify.clone.album.Album;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "saved_albums")
@IdClass(SavedAlbum.Key.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class SavedAlbum {
  @Id
  @Column(name = "user_id")
  private Long userId;

  @Id
  @Column(name = "album_id")
  private Long albumId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "album_id", insertable = false, updatable = false)
  private Album album;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public record Key(Long userId, Long albumId) implements Serializable {}
}
