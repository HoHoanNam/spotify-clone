package com.spotify.clone.track;

import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.function.Function;
import java.util.stream.Collectors;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.album.Album;
import com.spotify.clone.album.AlbumRepository;
import com.spotify.clone.artist.Artist;
import com.spotify.clone.artist.ArtistRepository;
import com.spotify.clone.common.exception.BadRequestException;
import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.storage.MediaFolder;
import com.spotify.clone.storage.MediaUploadService;
import com.spotify.clone.storage.MediaUploadService.StoredAudio;
import com.spotify.clone.track.dto.CreateTrackForm;
import com.spotify.clone.track.dto.TrackResponse;
import com.spotify.clone.track.dto.UpdateTrackForm;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class TrackService {

  private final TrackRepository trackRepository;
  private final ArtistRepository artistRepository;
  private final AlbumRepository albumRepository;
  private final MediaUploadService mediaUploadService;

  @Transactional(readOnly = true)
  public PageResponse<TrackResponse> list(Pageable pageable) {
    return PageResponse.from(trackRepository.findAll(pageable).map(TrackResponse::from));
  }

  @Transactional(readOnly = true)
  public TrackResponse get(Long id) {
    return TrackResponse.from(find(id));
  }

  @Transactional
  public TrackResponse create(CreateTrackForm form) {
    // Validate references first: a bad id fails before any file is written
    List<Artist> artists = loadArtistsInOrder(form.artistIds());
    Album album = form.albumId() == null ? null : albumRepository.findById(form.albumId())
        .orElseThrow(() -> new BadRequestException("Album not found: " + form.albumId()));

    StoredAudio audio = mediaUploadService.storeAudio(form.audio());
    Track track = new Track(form.title().strip(), audio.durationSec(), audio.path());
    track.setAlbum(album);
    track.setTrackNumber(form.trackNumber());
    track.setCoverPath(mediaUploadService.storeImage(form.cover(), MediaFolder.TRACK_COVERS));
    track.getArtists().addAll(artists);
    return TrackResponse.from(trackRepository.save(track));
  }

  @Transactional
  public TrackResponse update(Long id, UpdateTrackForm form) {
    Track track = find(id);
    // Validate references before touching any file
    List<Artist> artists = loadArtistsInOrder(form.artistIds());
    Album album = form.albumId() == null ? null : albumRepository.findById(form.albumId())
        .orElseThrow(() -> new BadRequestException("Album not found: " + form.albumId()));

    track.setTitle(form.title().strip());
    track.setAlbum(album);
    track.setTrackNumber(form.trackNumber());
    track.getArtists().clear();
    track.getArtists().addAll(artists);   // @OrderColumn rewrites positions; the DEFERRABLE unique allows reordering

    if (form.audio() != null && !form.audio().isEmpty()) {
      StoredAudio audio = mediaUploadService.storeAudio(form.audio());
      mediaUploadService.deleteAfterCommit(track.getAudioPath());
      track.setAudioPath(audio.path());
      track.setDurationSec(audio.durationSec());
    }

    String newCover = mediaUploadService.storeImage(form.cover(), MediaFolder.TRACK_COVERS);
    if (newCover != null || Boolean.TRUE.equals(form.removeCover())) {
      mediaUploadService.deleteAfterCommit(track.getCoverPath());
      track.setCoverPath(newCover);        // null → falls back to the album cover
    }
    return TrackResponse.from(track);      // dirty checking issues the UPDATE on commit
  }

  @Transactional
  public void delete(Long id) {
    Track track = find(id);
    mediaUploadService.deleteAfterCommit(track.getAudioPath());
    mediaUploadService.deleteAfterCommit(track.getCoverPath());
    trackRepository.delete(track);
  }

  @Transactional
  public void recordPlay(Long id) {
    if (trackRepository.incrementPlayCount(id) == 0) {
      throw new ResourceNotFoundException("Track not found");
    }
  }

  /** findAllById does not keep the requested order, so rebuild it from the ids. */
  private List<Artist> loadArtistsInOrder(List<Long> ids) {
    if (new HashSet<>(ids).size() != ids.size()) {
      throw new BadRequestException("The same artist is listed twice");
    }
    Map<Long, Artist> byId = artistRepository.findAllById(ids).stream()
        .collect(Collectors.toMap(Artist::getId, Function.identity()));
    return ids.stream().map(id -> {
      Artist artist = byId.get(id);
      if (artist == null) throw new BadRequestException("Artist not found: " + id);
      return artist;
    }).toList();
  }

  private Track find(Long id) {
    return trackRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Track not found"));
  }
}
