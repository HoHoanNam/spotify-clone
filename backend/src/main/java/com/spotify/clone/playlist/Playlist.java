package com.spotify.clone.playlist;

import java.util.ArrayList;
import java.util.List;
import java.util.Objects;

import com.spotify.clone.common.exception.BadRequestException;
import com.spotify.clone.common.persistence.BaseEntity;
import com.spotify.clone.track.Track;
import com.spotify.clone.user.User;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

/**
 * User playlist. The aggregate owns its entries: add / remove / move go through this class so
 * {@code playlist_tracks.position} always stays 0..n-1 (ADR-0010).
 */
@Entity
@Table(name = "playlists")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class Playlist extends BaseEntity {
  @ManyToOne(fetch = FetchType.LAZY, optional = false)
  @JoinColumn(name = "owner_id", nullable = false)
  private User owner;

  @Column(nullable = false, length = 100)
  private String name;

  @Column(length = 300)
  private String description;

  @Column(name = "cover_path")
  private String coverPath;

  @Column(name = "is_public", nullable = false)
  private boolean isPublic = true;

  @OneToMany(mappedBy = "playlist", cascade = CascadeType.ALL, orphanRemoval = true)
  @OrderBy("position")
  @Setter(AccessLevel.NONE)
  private List<PlaylistTrack> entries = new ArrayList<>();

  public Playlist(User owner, String name) {
    this.owner = owner;
    this.name = name;
  }

  public boolean isOwnedBy(Long userId) {
    return owner.getId().equals(userId);
  }

  public boolean contains(Long trackId) {
    return entries.stream().anyMatch(e -> e.getTrack().getId().equals(trackId));
  }

  /** Appends the track; returns false when it is already in the playlist. */
  public boolean add(Track track) {
    if (contains(track.getId())) return false;
    entries.add(new PlaylistTrack(this, track, entries.size()));
    return true;
  }

  public boolean remove(Long trackId) {
    boolean removed = entries.removeIf(e -> e.getTrack().getId().equals(trackId));
    if (removed) renumber();
    return removed;
  }

  /** Moves the entry at {@code from} to index {@code to}, like dragging a row in the Spotify app. */
  public void move(int from, int to) {
    if (from < 0 || from >= entries.size() || to < 0 || to >= entries.size()) {
      throw new BadRequestException("Position out of range");
    }
    if (from == to) return;
    entries.add(to, entries.remove(from));
    renumber();
  }

  /** Cover to show: own cover, else the covers of the first (up to 4) distinct tracks for a mosaic. */
  public List<String> coverPaths() {
    if (coverPath != null) return List.of(coverPath);
    return entries.stream()
        .map(e -> e.getTrack().effectiveCoverPath())
        .filter(Objects::nonNull)
        .distinct()
        .limit(4)
        .toList();
  }

  private void renumber() {
    for (int i = 0; i < entries.size(); i++) {
      entries.get(i).setPosition(i);
    }
  }
}
