package com.spotify.clone.library;

import java.io.Serializable;
import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.spotify.clone.track.Track;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** Row of liked_tracks. Written with an idempotent native insert (see {@link LikedTrackRepository#like}). */
@Entity
@Table(name = "liked_tracks")
@IdClass(LikedTrack.Key.class)
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class LikedTrack {
  @Id
  @Column(name = "user_id")
  private Long userId;

  @Id
  @Column(name = "track_id")
  private Long trackId;

  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "track_id", insertable = false, updatable = false)
  private Track track;

  @CreationTimestamp
  @Column(name = "created_at", nullable = false, updatable = false)
  private Instant createdAt;

  public record Key(Long userId, Long trackId) implements Serializable {}
}
