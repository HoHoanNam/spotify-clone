package com.spotify.clone.track;

import java.util.ArrayList;
import java.util.List;

import com.spotify.clone.album.Album;
import com.spotify.clone.artist.Artist;
import com.spotify.clone.common.persistence.BaseEntity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "tracks")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Track extends BaseEntity {
  @Column(nullable = false, length = 200)
  private String title;

  /** Null = single, not part of an album. */
  @ManyToOne(fetch = FetchType.LAZY)
  @JoinColumn(name = "album_id")
  private Album album;

  @Column(name = "track_number")
  private Integer trackNumber;

  /** One or more artists, in display order; position 0 is the main artist. */
  @ManyToMany
  @JoinTable(
    name = "track_artists",
    joinColumns = @JoinColumn(name = "track_id"),
    inverseJoinColumns = @JoinColumn(name = "artist_id")
  )
  @OrderColumn(name = "position")
  private List<Artist> artists = new ArrayList<>();

  /** Read from the audio file by the backend on upload. */
  @Column(name = "duration_sec", nullable = false)
  private int durationSec;

  @Column(name = "audio_path", nullable = false)
  private String audioPath;

  /** Optional; falls back to the album cover, see {@link #effectiveCoverPath()}. */
  @Column(name = "cover_path")
  private String coverPath;

  @Column(name = "play_count", nullable = false)
  private long playCount;

  public Track(String title, int durationSec, String audioPath) {
    this.title = title;
    this.durationSec = durationSec;
    this.audioPath = audioPath;
  }

  /** Cover to display: the track's own cover, otherwise the album's. */
  public String effectiveCoverPath() {
    if (coverPath != null) return coverPath;
    return album != null ? album.getCoverPath() : null;
  }
}
