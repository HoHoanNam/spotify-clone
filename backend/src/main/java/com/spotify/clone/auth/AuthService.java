package com.spotify.clone.auth;

import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;

import com.spotify.clone.auth.dto.AuthResponse;
import com.spotify.clone.auth.dto.LoginRequest;
import com.spotify.clone.auth.dto.RegisterRequest;
import com.spotify.clone.common.exception.ConflictException;
import com.spotify.clone.user.User;
import com.spotify.clone.user.UserRepository;
import com.spotify.clone.user.dto.UserResponse;

import org.springframework.transaction.annotation.Transactional;
import lombok.RequiredArgsConstructor;

@Service
@RequiredArgsConstructor
public class AuthService {
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;
  private final AuthenticationManager authenticationManager;
  private final JwtService jwtService;

  @Transactional
  public AuthResponse register(RegisterRequest req) {
    String email = User.normalizeEmail(req.email());
    if (userRepository.existsByEmail(email)) {
      throw new ConflictException("Email is already registered");
    }
    User user = new User(req.username().strip(), email, passwordEncoder.encode(req.password()));
    try {
      user = userRepository.saveAndFlush(user);   // flush để lỗi trùng email (race) nổ ra ngay tại đây
    } catch (DataIntegrityViolationException ex) {
      throw new ConflictException("Email is already registered");
    }
    return issueToken(user);
  }

  public AuthResponse login(LoginRequest req) {
    Authentication auth = authenticationManager.authenticate(
        UsernamePasswordAuthenticationToken.unauthenticated(req.email(), req.password()));
    AppUserDetails principal = (AppUserDetails) auth.getPrincipal();
    User user = userRepository.findById(principal.id()).orElseThrow();
    return issueToken(user);
  }

  private AuthResponse issueToken(User user) {
    return AuthResponse.bearer(jwtService.generateToken(user), jwtService.getTtl(), UserResponse.from(user));
  }
}

