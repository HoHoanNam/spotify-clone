package com.spotify.clone.library;

import java.io.Serializable;
import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.spotify.clone.artist.Artist;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "followed_artists")
@IdClass(FollowedArtist.Key.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class FollowedArtist {
  @Id
  @Column(name = "user_id")
  private Long userId;

  @Id
  @Column(name = "artist_id")
  private Long artistId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "artist_id", insertable = false, updatable = false)
  private Artist artist;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public record Key(Long userId, Long artistId) implements Serializable {}
}
