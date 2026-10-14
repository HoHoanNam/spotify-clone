package com.spotify.clone.user;

import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import com.spotify.clone.common.exception.BadRequestException;
import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.playlist.PlaylistService;
import com.spotify.clone.storage.MediaFolder;
import com.spotify.clone.storage.MediaUploadService;
import com.spotify.clone.user.dto.ChangePasswordRequest;
import com.spotify.clone.user.dto.UpdateProfileRequest;
import com.spotify.clone.user.dto.UserProfile;
import com.spotify.clone.user.dto.UserResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final MediaUploadService mediaUploadService;
  private final PlaylistService playlistService;

  @Transactional(readOnly = true)
  public UserResponse getById(Long id) {
    return UserResponse.from(find(id));
  }

  @Transactional(readOnly = true)
  public UserProfile profile(Long id) {
    User user = userRepository.findById(id)
        .filter(User::isEnabled)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
    return UserProfile.from(user, playlistService.listPublicByOwner(id));
  }

  @Transactional
  public UserResponse updateProfile(Long id, UpdateProfileRequest req) {
    User user = find(id);
    user.setUsername(req.username().strip());   // dirty checking tự UPDATE khi commit
    return UserResponse.from(user);
  }

  @Transactional
  public UserResponse updateAvatar(Long id, MultipartFile avatar) {
    if (avatar == null || avatar.isEmpty()) throw new BadRequestException("Choose an image");
    User user = find(id);
    String path = mediaUploadService.storeImage(avatar, MediaFolder.AVATARS);
    mediaUploadService.deleteAfterCommit(user.getAvatarPath());
    user.setAvatarPath(path);
    return UserResponse.from(user);
  }

  @Transactional
  public UserResponse removeAvatar(Long id) {
    User user = find(id);
    mediaUploadService.deleteAfterCommit(user.getAvatarPath());
    user.setAvatarPath(null);
    return UserResponse.from(user);
  }

  /**
   * 400 (not 401) for a wrong current password: the client treats 401 as "session expired" and logs out.
   * Tokens issued before the change stay valid until they expire (stateless JWT, ADR-0006).
   */
  @Transactional
  public void changePassword(Long id, ChangePasswordRequest req) {
    User user = find(id);
    if (!passwordEncoder.matches(req.currentPassword(), user.getPassword())) {
      throw new BadRequestException("Current password is incorrect");
    }
    user.setPassword(passwordEncoder.encode(req.newPassword()));
  }

  private User find(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}
