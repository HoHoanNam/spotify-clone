package com.spotify.clone.playlist;

import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.spotify.clone.common.exception.BadRequestException;
import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.playlist.dto.AddTracksResponse;
import com.spotify.clone.playlist.dto.CreatePlaylistRequest;
import com.spotify.clone.playlist.dto.PlaylistDetail;
import com.spotify.clone.playlist.dto.PlaylistSummary;
import com.spotify.clone.playlist.dto.UpdatePlaylistForm;
import com.spotify.clone.storage.MediaFolder;
import com.spotify.clone.storage.MediaUploadService;
import com.spotify.clone.track.Track;
import com.spotify.clone.track.TrackRepository;
import com.spotify.clone.user.User;
import com.spotify.clone.user.UserRepository;

import lombok.RequiredArgsConstructor;

/**
 * Visibility: a private playlist is invisible (404) to everyone but its owner; a public one can be
 * read by any logged-in user but only changed by its owner (403).
 */
@Service
@RequiredArgsConstructor
public class PlaylistService {

  private final PlaylistRepository playlistRepository;
  private final TrackRepository trackRepository;
  private final UserRepository userRepository;
  private final MediaUploadService mediaUploadService;

  @Transactional(readOnly = true)
  public List<PlaylistSummary> listMine(Long userId) {
    return playlistRepository.findByOwnerIdOrderByCreatedAtDesc(userId).stream().map(PlaylistSummary::from).toList();
  }

  @Transactional(readOnly = true)
  public PageResponse<PlaylistSummary> listPublic(String q, Pageable pageable) {
    Page<Playlist> page = StringUtils.hasText(q)
        ? playlistRepository.searchPublic(q.strip(), pageable)
        : playlistRepository.findPublic(pageable);
    return PageResponse.from(page.map(PlaylistSummary::from));
  }

  @Transactional(readOnly = true)
  public List<PlaylistSummary> listPublicByOwner(Long ownerId) {
    return playlistRepository.findPublicByOwner(ownerId).stream().map(PlaylistSummary::from).toList();
  }

  @Transactional(readOnly = true)
  public PlaylistDetail get(Long id, Long userId) {
    return PlaylistDetail.from(findVisible(id, userId));
  }

  @Transactional
  public PlaylistSummary create(Long userId, CreatePlaylistRequest req) {
    User owner = userRepository.getReferenceById(userId);
    String name = StringUtils.hasText(req.name())
        ? req.name().strip()
        : "My Playlist #" + (playlistRepository.countByOwnerId(userId) + 1);
    Playlist playlist = new Playlist(owner, name);
    playlist.setDescription(blankToNull(req.description()));
    if (req.trackIds() != null) {
      loadTracksInOrder(req.trackIds()).forEach(playlist::add);
    }
    return PlaylistSummary.from(playlistRepository.save(playlist));
  }

  @Transactional
  public PlaylistSummary update(Long id, Long userId, UpdatePlaylistForm form) {
    Playlist playlist = findOwned(id, userId);
    playlist.setName(form.name().strip());
    playlist.setDescription(blankToNull(form.description()));
    if (form.isPublic() != null) playlist.setPublic(form.isPublic());

    String newCover = mediaUploadService.storeImage(form.cover(), MediaFolder.PLAYLIST_COVERS);
    if (newCover != null || Boolean.TRUE.equals(form.removeCover())) {
      mediaUploadService.deleteAfterCommit(playlist.getCoverPath());
      playlist.setCoverPath(newCover);   // null → mosaic of track covers
    }
    return PlaylistSummary.from(playlist);
  }

  @Transactional
  public void delete(Long id, Long userId) {
    Playlist playlist = findOwned(id, userId);
    mediaUploadService.deleteAfterCommit(playlist.getCoverPath());
    playlistRepository.delete(playlist);
  }

  @Transactional
  public AddTracksResponse addTracks(Long id, Long userId, List<Long> trackIds) {
    Playlist playlist = findOwned(id, userId);
    int added = (int) loadTracksInOrder(trackIds).stream().filter(playlist::add).count();
    return new AddTracksResponse(added, PlaylistSummary.from(playlist));
  }

  @Transactional
  public void removeTrack(Long id, Long userId, Long trackId) {
    if (!findOwned(id, userId).remove(trackId)) {
      throw new ResourceNotFoundException("Track is not in this playlist");
    }
  }

  @Transactional
  public void moveTrack(Long id, Long userId, int from, int to) {
    findOwned(id, userId).move(from, to);
  }

  private Playlist findVisible(Long id, Long userId) {
    Playlist playlist = playlistRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("Playlist not found"));
    if (!playlist.isPublic() && !playlist.isOwnedBy(userId)) {
      throw new ResourceNotFoundException("Playlist not found");   // do not reveal private playlists
    }
    return playlist;
  }

  private Playlist findOwned(Long id, Long userId) {
    Playlist playlist = findVisible(id, userId);
    if (!playlist.isOwnedBy(userId)) {
      throw new AccessDeniedException("Only the owner can change this playlist");
    }
    return playlist;
  }

  /** findAllById does not keep the requested order, so rebuild it from the ids. */
  private List<Track> loadTracksInOrder(List<Long> ids) {
    Map<Long, Track> byId = trackRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(Track::getId, Function.identity()));
    return ids.stream().distinct().map(trackId -> {
      Track track = byId.get(trackId);
      if (track == null) throw new BadRequestException("Track not found: " + trackId);
      return track;
    }).toList();
  }

  private static String blankToNull(String value) {
    return StringUtils.hasText(value) ? value.strip() : null;
  }
}
