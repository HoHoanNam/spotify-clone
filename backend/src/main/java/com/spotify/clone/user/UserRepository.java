package com.spotify.clone.user;

import java.util.Optional;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;

public interface UserRepository extends JpaRepository<User, Long> {
  Optional<User> findByEmail(String email);

  default Optional<User> findByEmailNormalized(String email) {
    return findByEmail(User.normalizeEmail(email));
  }
  
  boolean existsByEmail(String email);

  @Query("""
      select u from User u
      where lower(u.username) like lower(concat('%', :q, '%')) or u.email like lower(concat('%', :q, '%'))""")
  Page<User> search(String q, Pageable pageable);
}
