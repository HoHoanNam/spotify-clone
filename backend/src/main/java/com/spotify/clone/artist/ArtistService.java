package com.spotify.clone.artist;

import java.util.List;

import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.spotify.clone.album.AlbumRepository;
import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.dto.ArtistDetail;
import com.spotify.clone.artist.dto.ArtistForm;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.common.exception.ConflictException;
import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.library.FollowedArtistRepository;
import com.spotify.clone.storage.MediaFolder;
import com.spotify.clone.storage.MediaUploadService;
import com.spotify.clone.track.TrackRepository;
import com.spotify.clone.track.dto.TrackResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class ArtistService {

  private final ArtistRepository artistRepository;
  private final AlbumRepository albumRepository;
  private final TrackRepository trackRepository;
  private final MediaUploadService mediaUploadService;
  private final FollowedArtistRepository followedArtistRepository;

  @Transactional(readOnly = true)
  public PageResponse<ArtistSummary> list(String q, Pageable pageable) {
    var page = StringUtils.hasText(q)
        ? artistRepository.findByNameContainingIgnoreCase(q.strip(), pageable)
        : artistRepository.findAll(pageable);
    return PageResponse.from(page.map(ArtistSummary::from));
  }

  @Transactional(readOnly = true)
  public ArtistDetail get(Long id) {
    Artist artist = find(id);
    List<AlbumSummary> albums = albumRepository.findByArtistIdOrderByReleaseDateDesc(id).stream()
        .map(AlbumSummary::from).toList();
    List<TrackResponse> topTracks = trackRepository.findTopByArtist(id, PageRequest.of(0, 10)).stream()
        .map(TrackResponse::from).toList();
    // "Appears on": tracks where this artist is listed but is not the main artist
    List<TrackResponse> appearsOn = trackRepository.findFeaturing(id, PageRequest.of(0, 10)).stream()
        .map(TrackResponse::from).toList();
    return ArtistDetail.from(artist, followedArtistRepository.countByArtistId(id), albums, topTracks, appearsOn);
  }

  @Transactional
  public ArtistSummary create(ArtistForm form) {
    Artist artist = new Artist(form.name().strip());
    artist.setBio(StringUtils.hasText(form.bio()) ? form.bio().strip() : null);
    artist.setImagePath(mediaUploadService.storeImage(form.image(), MediaFolder.ARTIST_IMAGES));
    return ArtistSummary.from(artistRepository.save(artist));
  }

  @Transactional
  public ArtistSummary update(Long id, ArtistForm form) {
    Artist artist = find(id);
    artist.setName(form.name().strip());
    artist.setBio(StringUtils.hasText(form.bio()) ? form.bio().strip() : null);

    String newImage = mediaUploadService.storeImage(form.image(), MediaFolder.ARTIST_IMAGES);
    if (newImage != null || Boolean.TRUE.equals(form.removeImage())) {
      mediaUploadService.deleteAfterCommit(artist.getImagePath());
      artist.setImagePath(newImage);
    }
    return ArtistSummary.from(artist);
  }

  @Transactional
  public void delete(Long id) {
    Artist artist = find(id);
    if (albumRepository.existsByArtistId(id) || trackRepository.existsByArtist(id)) {
      throw new ConflictException("Artist still has albums or tracks");
    }
    mediaUploadService.deleteAfterCommit(artist.getImagePath());
    artistRepository.delete(artist);
  }

  private Artist find(Long id) {
    return artistRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Artist not found"));
  }
}
