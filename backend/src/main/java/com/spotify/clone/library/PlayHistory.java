package com.spotify.clone.library;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;

/** One counted listen. Append-only, so it does not extend BaseEntity (no updated_at). */
@Entity
@Table(name = "play_history")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlayHistory {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @Column(name = "user_id", nullable = false)
  private Long userId;

  @Column(name = "track_id", nullable = false)
  private Long trackId;

  @CreationTimestamp
  @Column(name = "played_at", nullable = false, updatable = false)
  private Instant playedAt;

  public PlayHistory(Long userId, Long trackId) {
    this.userId = userId;
    this.trackId = trackId;
  }
}
