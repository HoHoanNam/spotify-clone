package com.spotify.clone.album;

import java.time.LocalDate;

import com.spotify.clone.artist.Artist;
import com.spotify.clone.common.persistence.BaseEntity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Album with one main artist. Its tracks are loaded via {@code TrackRepository.findByAlbumIdOrderByTrackNumberAsc}
 * instead of a mapped collection; deleting an album turns its tracks into singles (FK ON DELETE SET NULL).
 */
@Entity
@Table(name = "albums")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Album extends BaseEntity {
  @Column(nullable = false, length = 200)
  private String title;

  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "artist_id", nullable = false)
  private Artist artist;

  @Column(name = "cover_path")
  private String coverPath;

  @Column(name = "release_date")
  private LocalDate releaseDate;

  public Album(String title, Artist artist) {
    this.title = title;
    this.artist = artist;
  }
}

