package com.spotify.clone.album;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.spotify.clone.album.dto.AlbumDetail;
import com.spotify.clone.album.dto.AlbumForm;
import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.Artist;
import com.spotify.clone.artist.ArtistRepository;
import com.spotify.clone.common.exception.BadRequestException;
import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.storage.MediaFolder;
import com.spotify.clone.storage.MediaUploadService;
import com.spotify.clone.track.TrackRepository;
import com.spotify.clone.track.dto.TrackResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AlbumService {

  private final AlbumRepository albumRepository;
  private final ArtistRepository artistRepository;
  private final TrackRepository trackRepository;
  private final MediaUploadService mediaUploadService;

  @Transactional(readOnly = true)
  public PageResponse<AlbumSummary> list(String q, Pageable pageable) {
    var page = StringUtils.hasText(q)
        ? albumRepository.findByTitleContainingIgnoreCase(q.strip(), pageable)
        : albumRepository.findAll(pageable);
    return PageResponse.from(page.map(AlbumSummary::from));
  }

  @Transactional(readOnly = true)
  public AlbumDetail get(Long id) {
    Album album = find(id);
    List<TrackResponse> tracks = trackRepository.findByAlbumIdOrderByTrackNumberAsc(id).stream()
        .map(TrackResponse::from).toList();
    return AlbumDetail.from(album, tracks);
  }

  @Transactional
  public AlbumSummary create(AlbumForm form) {
    Artist artist = artistRepository.findById(form.artistId())
        .orElseThrow(() -> new BadRequestException("Artist not found: " + form.artistId()));
    Album album = new Album(form.title().strip(), artist);
    album.setReleaseDate(form.releaseDate());
    album.setCoverPath(mediaUploadService.storeImage(form.cover(), MediaFolder.ALBUM_COVERS));
    return AlbumSummary.from(albumRepository.save(album));
  }

  @Transactional
  public AlbumSummary update(Long id, AlbumForm form) {
    Album album = find(id);
    Artist artist = artistRepository.findById(form.artistId())
        .orElseThrow(() -> new BadRequestException("Artist not found: " + form.artistId()));
    album.setTitle(form.title().strip());
    album.setArtist(artist);
    album.setReleaseDate(form.releaseDate());

    String newCover = mediaUploadService.storeImage(form.cover(), MediaFolder.ALBUM_COVERS);
    if (newCover != null || Boolean.TRUE.equals(form.removeCover())) {
      mediaUploadService.deleteAfterCommit(album.getCoverPath());
      album.setCoverPath(newCover);
    }
    return AlbumSummary.from(album);
  }

  /** Tracks of the album become singles (FK ON DELETE SET NULL). */
  @Transactional
  public void delete(Long id) {
    Album album = find(id);
    mediaUploadService.deleteAfterCommit(album.getCoverPath());
    albumRepository.delete(album);
  }

  private Album find(Long id) {
    return albumRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Album not found"));
  }
}
