package com.spotify.clone.admin;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.spotify.clone.admin.dto.AdminStats;
import com.spotify.clone.admin.dto.AdminUserView;
import com.spotify.clone.admin.dto.UpdateUserRequest;
import com.spotify.clone.album.AlbumRepository;
import com.spotify.clone.artist.ArtistRepository;
import com.spotify.clone.common.exception.BadRequestException;
import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.common.web.PageResponse;
import com.spotify.clone.playlist.PlaylistRepository;
import com.spotify.clone.track.Track;
import com.spotify.clone.track.TrackRepository;
import com.spotify.clone.track.dto.TrackResponse;
import com.spotify.clone.user.User;
import com.spotify.clone.user.UserRepository;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AdminService {

  private final UserRepository userRepository;
  private final ArtistRepository artistRepository;
  private final AlbumRepository albumRepository;
  private final TrackRepository trackRepository;
  private final PlaylistRepository playlistRepository;

  @Transactional(readOnly = true)
  public AdminStats stats() {
    var top = trackRepository.findAll(PageRequest.of(0, 5, Sort.by(Sort.Direction.DESC, Track::getPlayCount)))
        .map(TrackResponse::from).getContent();
    return new AdminStats(userRepository.count(), artistRepository.count(), albumRepository.count(),
        trackRepository.count(), playlistRepository.count(), trackRepository.sumPlayCount(), top);
  }

  @Transactional(readOnly = true)
  public PageResponse<AdminUserView> users(String q, Pageable pageable) {
    Page<User> page = StringUtils.hasText(q)
        ? userRepository.search(q.strip(), pageable)
        : userRepository.findAll(pageable);
    return PageResponse.from(page.map(AdminUserView::from));
  }

  /**
   * Role / enabled changes apply on the user's next request: JwtAuthenticationFilter reloads the user
   * every time, so a disabled account is locked out immediately even with a valid token.
   * An admin cannot change their own account, so the last admin can never lock everyone out.
   */
  @Transactional
  public AdminUserView updateUser(Long id, Long currentAdminId, UpdateUserRequest req) {
    if (id.equals(currentAdminId)) {
      throw new BadRequestException("You cannot change your own role or status");
    }
    User user = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("User not found"));
    if (req.role() != null) user.setRole(req.role());
    if (req.enabled() != null) user.setEnabled(req.enabled());
    return AdminUserView.from(user);
  }
}
