package com.spotify.clone.playlist;

import java.time.Instant;

import org.hibernate.annotations.CreationTimestamp;

import com.spotify.clone.track.Track;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/** One track in a playlist. Created and ordered only through {@link Playlist}. */
@Entity
@Table(name = "playlist_tracks")
@Getter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class PlaylistTrack {
  @Id
  @GeneratedValue(strategy = GenerationType.IDENTITY)
  private Long id;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "playlist_id", nullable = false)
  private Playlist playlist;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "track_id", nullable = false)
  private Track track;

  @Setter(AccessLevel.PACKAGE)
  @Column(nullable = false)
  private int position;

  @CreationTimestamp
  @Column(name = "added_at", nullable = false, updatable = false)
  private Instant addedAt;

  PlaylistTrack(Playlist playlist, Track track, int position) {
    this.playlist = playlist;
    this.track = track;
    this.position = position;
  }
}
