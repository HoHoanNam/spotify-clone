package com.spotify.clone.admin.dto;

import com.spotify.clone.user.Role;

/** PATCH semantics: null fields are left unchanged. */
public record UpdateUserRequest(Role role, Boolean enabled) {}
