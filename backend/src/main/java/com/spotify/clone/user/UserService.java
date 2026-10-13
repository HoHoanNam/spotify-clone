package com.spotify.clone.user;

import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.user.dto.UpdateProfileRequest;
import com.spotify.clone.user.dto.UserResponse;

import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class UserService {

  private final UserRepository userRepository;

  @Transactional(readOnly = true)
  public UserResponse getById(Long id) {
    return UserResponse.from(find(id));
  }

  @Transactional
  public UserResponse updateProfile(Long id, UpdateProfileRequest req) {
    User user = find(id);
    user.setUsername(req.username().strip());   // dirty checking tự UPDATE khi commit
    return UserResponse.from(user);
  }

  private User find(Long id) {
    return userRepository.findById(id)
        .orElseThrow(() -> new ResourceNotFoundException("User not found"));
  }
}

