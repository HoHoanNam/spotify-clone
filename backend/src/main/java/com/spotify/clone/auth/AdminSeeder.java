package com.spotify.clone.auth;

import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.util.StringUtils;

import com.spotify.clone.config.AppProperties;
import com.spotify.clone.user.Role;
import com.spotify.clone.user.User;
import com.spotify.clone.user.UserRepository;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;

@Slf4j
@Component
@RequiredArgsConstructor
public class AdminSeeder implements ApplicationRunner {

  private final AppProperties props;
  private final UserRepository userRepository;
  private final PasswordEncoder passwordEncoder;

  @Override
  @Transactional
  public void run(ApplicationArguments args) {
    var admin = props.admin();
    if (admin == null || !StringUtils.hasText(admin.email()) || !StringUtils.hasText(admin.password())) {
      return;
    }
    String email = User.normalizeEmail(admin.email());
    if (userRepository.existsByEmail(email)) {
      return;
    }
    User user = new User("Admin", email, passwordEncoder.encode(admin.password()));
    user.setRole(Role.ADMIN);
    userRepository.save(user);
    log.info("Seeded admin account {}", email);
  }
}

