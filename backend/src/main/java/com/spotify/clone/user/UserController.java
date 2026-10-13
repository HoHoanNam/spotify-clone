package com.spotify.clone.user;

import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.auth.AppUserDetails;
import com.spotify.clone.user.dto.UpdateProfileRequest;
import com.spotify.clone.user.dto.UserResponse;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/me")
@RequiredArgsConstructor
public class UserController {

  private final UserService userService;

  @GetMapping
  UserResponse me(@AuthenticationPrincipal AppUserDetails me) {
    return userService.getById(me.id());
  }

  @PatchMapping
  UserResponse updateProfile(@AuthenticationPrincipal AppUserDetails me,
                             @Valid @RequestBody UpdateProfileRequest req) {
    return userService.updateProfile(me.id(), req);
  }
}
