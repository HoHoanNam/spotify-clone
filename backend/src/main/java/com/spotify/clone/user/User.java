package com.spotify.clone.user;

import java.util.Locale;

import com.spotify.clone.common.persistence.BaseEntity;

import jakarta.persistence.*;
import lombok.AccessLevel;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor(access = AccessLevel.PROTECTED)
public class User extends BaseEntity {
  @Column(nullable = false, length = 100)
  private String username;

  @Column(nullable = false, unique = true)
  private String email;

  @Column(nullable = false, length = 100)
  private String password;

  @Column(name = "avatar_path")
  private String avatarPath;

  @Enumerated(EnumType.STRING)
  @Column(nullable = false)
  private Role role = Role.USER;

  @Column(nullable = false)
  private boolean enabled = true;

  public User(String username, String email, String password) {
    this.username = username;
    this.email = normalizeEmail(email);
    this.password = password;
  }

  public void setEmail(String email) {
    this.email = normalizeEmail(email);
  }

  public static String normalizeEmail(String email) {
    return email == null ? null : email.strip().toLowerCase(Locale.ROOT);
  }
}
