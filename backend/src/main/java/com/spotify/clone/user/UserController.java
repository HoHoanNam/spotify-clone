package com.spotify.clone.user;

import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.spotify.clone.auth.AppUserDetails;
import com.spotify.clone.user.dto.ChangePasswordRequest;
import com.spotify.clone.user.dto.UpdateProfileRequest;
import com.spotify.clone.user.dto.UserProfile;
import com.spotify.clone.user.dto.UserResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping("/api/me")
  UserResponse me(@AuthenticationPrincipal AppUserDetails me) {
    return userService.getById(me.id());
  }

  @PatchMapping("/api/me")
  UserResponse updateProfile(@AuthenticationPrincipal AppUserDetails me,
                             @Valid @RequestBody UpdateProfileRequest req) {
    return userService.updateProfile(me.id(), req);
  }

  @PutMapping(value = "/api/me/avatar", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
  UserResponse updateAvatar(@AuthenticationPrincipal AppUserDetails me, @RequestParam MultipartFile avatar) {
    return userService.updateAvatar(me.id(), avatar);
  }

  @DeleteMapping("/api/me/avatar")
  UserResponse removeAvatar(@AuthenticationPrincipal AppUserDetails me) {
    return userService.removeAvatar(me.id());
  }

  @PutMapping("/api/me/password")
  @ResponseStatus(HttpStatus.NO_CONTENT)
  void changePassword(@AuthenticationPrincipal AppUserDetails me, @Valid @RequestBody ChangePasswordRequest req) {
    userService.changePassword(me.id(), req);
  }

  @GetMapping("/api/users/{id}")
  UserProfile profile(@PathVariable Long id) {
    return userService.profile(id);
  }
}
