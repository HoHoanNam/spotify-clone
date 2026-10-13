package com.spotify.clone.artist;

import com.spotify.clone.common.persistence.BaseEntity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * Catalog artist (not a login account). Tracks reference artists through {@code Track.artists};
 * the relationship is owned by Track, so Artist keeps no collection back to tracks.
 */
@Entity
@Table(name = "artists")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Artist extends BaseEntity {
  @Column(nullable = false, length = 200)
  private String name;

  @Column(columnDefinition = "TEXT")
  private String bio;

  @Column(name = "image_path")
  private String imagePath;

  public Artist(String name) {
    this.name = name;
  }
}
