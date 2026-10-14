package com.spotify.clone.playlist;

import java.util.List;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.ModelAttribute;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.auth.AppUserDetails;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.playlist.dto.AddTracksRequest;
import com.spotify.clone.playlist.dto.AddTracksResponse;
import com.spotify.clone.playlist.dto.CreatePlaylistRequest;
import com.spotify.clone.playlist.dto.MoveTrackRequest;
import com.spotify.clone.playlist.dto.PlaylistDetail;
import com.spotify.clone.playlist.dto.PlaylistSummary;
import com.spotify.clone.playlist.dto.UpdatePlaylistForm;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class PlaylistController {

  private final PlaylistService playlistService;

  /** The caller's own playlists (public and private) for the library sidebar. */
  @GetMapping("/api/me/playlists")
  List<PlaylistSummary> mine(@AuthenticationPrincipal AppUserDetails me) {
    return playlistService.listMine(me.id());
  }

  /** Public playlists of every user; ?q= filters by name. */
  @GetMapping("/api/playlists")
  PageResponse<PlaylistSummary> list(@RequestParam(required = false) String q,
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    return playlistService.listPublic(q, pageable);
  }

  @PostMapping("/api/playlists")
  @ResponseStatus(HttpStatus.CREATED)
  PlaylistSummary create(@AuthenticationPrincipal AppUserDetails me, @Valid @RequestBody CreatePlaylistRequest req) {
    return playlistService.create(me.id(), req);
  }

  @GetMapping("/api/playlists/{id}")
  PlaylistDetail get(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id) {
    return playlistService.get(id, me.id());
  }

  @PutMapping(value = "/api/playlists/{id}", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  PlaylistSummary update(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id,
                         @Valid @ModelAttribute UpdatePlaylistForm form) {
    return playlistService.update(id, me.id(), form);
  }

  @DeleteMapping("/api/playlists/{id}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void delete(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id) {
    playlistService.delete(id, me.id());
  }

  @PostMapping("/api/playlists/{id}/tracks")
  AddTracksResponse addTracks(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id,
                              @Valid @RequestBody AddTracksRequest req) {
    return playlistService.addTracks(id, me.id(), req.trackIds());
  }

  @DeleteMapping("/api/playlists/{id}/tracks/{trackId}")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void removeTrack(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id, @PathVariable Long trackId) {
    playlistService.removeTrack(id, me.id(), trackId);
  }

  @PostMapping("/api/playlists/{id}/tracks/move")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void moveTrack(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id,
                 @Valid @RequestBody MoveTrackRequest req) {
    playlistService.moveTrack(id, me.id(), req.from(), req.to());
  }
}
