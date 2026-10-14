package com.spotify.clone.admin;

import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.data.web.PageableDefault;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.admin.dto.AdminStats;
import com.spotify.clone.admin.dto.AdminUserView;
import com.spotify.clone.admin.dto.UpdateUserRequest;
import com.spotify.clone.auth.AppUserDetails;
import com.spotify.clone.common.web.PageResponse;

import lombok.RequiredArgsConstructor;

/** /api/admin/** already requires ROLE_ADMIN in SecurityConfig. */
@RestController
@RequestMapping("/api/admin")
@RequiredArgsConstructor
public class AdminController {

  private final AdminService adminService;

  @GetMapping("/stats")
  AdminStats stats() {
    return adminService.stats();
  }

  /** ?q= matches username or email. */
  @GetMapping("/users")
  PageResponse<AdminUserView> users(@RequestParam(required = false) String q,
      @PageableDefault(size = 20, sort = "createdAt", direction = Sort.Direction.DESC) Pageable pageable) {
    return adminService.users(q, pageable);
  }

  @PatchMapping("/users/{id}")
  AdminUserView updateUser(@AuthenticationPrincipal AppUserDetails me, @PathVariable Long id,
                           @RequestBody UpdateUserRequest req) {
    return adminService.updateUser(id, me.id(), req);
  }
}
