package com.spotify.clone.user;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);

  default Optional<User> findByEmailNormalized(String email) {
    return findByEmail(User.normalizeEmail(email));
  }
  
  boolean existsByEmail(String email);
}
