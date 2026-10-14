package com.spotify.clone.library;

import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.album.AlbumRepository;
import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.ArtistRepository;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.library.dto.LibraryIds;
import com.spotify.clone.library.dto.LikedTrackItem;
import com.spotify.clone.track.Track;
import com.spotify.clone.track.TrackRepository;
import com.spotify.clone.track.dto.TrackResponse;

import lombok.RequiredArgsConstructor;

/**
 * Liked Songs, saved albums, followed artists and listening history of the current user.
 * Adding is idempotent (PUT twice = one row) and removing something that is not there is a no-op,
 * so a double click or a retried request never shows an error.
 */
@Service
@RequiredArgsConstructor
public class LibraryService {

  private final LikedTrackRepository likedTrackRepository;
  private final SavedAlbumRepository savedAlbumRepository;
  private final FollowedArtistRepository followedArtistRepository;
  private final PlayHistoryRepository playHistoryRepository;
  private final TrackRepository trackRepository;
  private final AlbumRepository albumRepository;
  private final ArtistRepository artistRepository;

  @Transactional(readOnly = true)
  public LibraryIds ids(Long userId) {
    return new LibraryIds(
        likedTrackRepository.findTrackIds(userId),
        savedAlbumRepository.findByUserIdOrderByCreatedAtDesc(userId).stream().map(SavedAlbum::getAlbumId).toList(),
        followedArtistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
            .map(FollowedArtist::getArtistId).toList());
  }

  // ---- Liked Songs

  @Transactional(readOnly = true)
  public PageResponse<LikedTrackItem> likedTracks(Long userId, Pageable pageable) {
    return PageResponse.from(
        likedTrackRepository.findByUserIdOrderByCreatedAtDesc(userId, pageable).map(LikedTrackItem::from));
  }

  @Transactional
  public void likeTrack(Long userId, Long trackId) {
    if (!trackRepository.existsById(trackId)) throw new ResourceNotFoundException("Track not found");
    likedTrackRepository.like(userId, trackId);
  }

  @Transactional
  public void unlikeTrack(Long userId, Long trackId) {
    likedTrackRepository.unlike(userId, trackId);
  }

  // ---- Saved albums

  @Transactional(readOnly = true)
  public List<AlbumSummary> savedAlbums(Long userId) {
    return savedAlbumRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(s -> AlbumSummary.from(s.getAlbum())).toList();
  }

  @Transactional
  public void saveAlbum(Long userId, Long albumId) {
    if (!albumRepository.existsById(albumId)) throw new ResourceNotFoundException("Album not found");
    savedAlbumRepository.add(userId, albumId);
  }

  @Transactional
  public void removeAlbum(Long userId, Long albumId) {
    savedAlbumRepository.remove(userId, albumId);
  }

  // ---- Followed artists

  @Transactional(readOnly = true)
  public List<ArtistSummary> followedArtists(Long userId) {
    return followedArtistRepository.findByUserIdOrderByCreatedAtDesc(userId).stream()
        .map(f -> ArtistSummary.from(f.getArtist())).toList();
  }

  @Transactional
  public void followArtist(Long userId, Long artistId) {
    if (!artistRepository.existsById(artistId)) throw new ResourceNotFoundException("Artist not found");
    followedArtistRepository.follow(userId, artistId);
  }

  @Transactional
  public void unfollowArtist(Long userId, Long artistId) {
    followedArtistRepository.unfollow(userId, artistId);
  }

  // ---- History

  @Transactional
  public void recordListen(Long userId, Long trackId) {
    playHistoryRepository.save(new PlayHistory(userId, trackId));
  }

  /** Distinct tracks, most recent first. */
  @Transactional(readOnly = true)
  public List<TrackResponse> recentlyPlayed(Long userId, int limit) {
    List<Long> ids = playHistoryRepository.findRecentTrackIds(userId, limit);
    Map<Long, Track> byId = trackRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(Track::getId, Function.identity()));
    return ids.stream().map(byId::get).filter(Objects::nonNull).map(TrackResponse::from).toList();
  }
}
