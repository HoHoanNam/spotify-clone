package com.spotify.clone.library;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.album.dto.AlbumSummary;
import com.spotify.clone.artist.dto.ArtistSummary;
import com.spotify.clone.auth.AppUserDetails;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.library.dto.LibraryIds;
import com.spotify.clone.library.dto.LikedTrackItem;
import com.spotify.clone.track.dto.TrackResponse;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;

/** "Your Library" endpoints, modelled on Spotify's Web API (/me/tracks, /me/albums, /me/following). */
@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class LibraryController {

  private final LibraryService libraryService;

  @GetMapping("/library")
  LibraryIds ids(@AuthenticationPrincipal AppUserDetails me) {
    return libraryService.ids(me.id());
  }

  @GetMapping("/tracks")
  PageResponse<LikedTrackItem> likedTracks(@AuthenticationPrincipal AppUserDetails me,
                                           @PageableDefault(size = 50) Pageable pageable) {
    return libraryService.likedTracks(me.id(), pageable);
  }

  @PutMapping("/tracks/{trackId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void like(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long trackId) {
    libraryService.likeTrack(me.id(), trackId);
  }

  @DeleteMapping("/tracks/{trackId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void unlike(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long trackId) {
    libraryService.unlikeTrack(me.id(), trackId);
  }

  @GetMapping("/albums")
  List<AlbumSummary> savedAlbums(@AuthenticationPrincipal AppUserDetails me) {
    return libraryService.savedAlbums(me.id());
  }

  @PutMapping("/albums/{albumId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void saveAlbum(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long albumId) {
    libraryService.saveAlbum(me.id(), albumId);
  }

  @DeleteMapping("/albums/{albumId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void removeAlbum(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long albumId) {
    libraryService.removeAlbum(me.id(), albumId);
  }

  @GetMapping("/following")
  List<ArtistSummary> following(@AuthenticationPrincipal AppUserDetails me) {
    return libraryService.followedArtists(me.id());
  }

  @PutMapping("/following/{artistId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void follow(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long artistId) {
    libraryService.followArtist(me.id(), artistId);
  }

  @DeleteMapping("/following/{artistId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void unfollow(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long artistId) {
    libraryService.unfollowArtist(me.id(), artistId);
  }

  @GetMapping("/recently-played")
  List<TrackResponse> recentlyPlayed(@AuthenticationPrincipal AppUserDetails me,
                                     @RequestParam(defaultValue = "20") @Min(1) @Max(50) int limit) {
    return libraryService.recentlyPlayed(me.id(), limit);
  }
}
