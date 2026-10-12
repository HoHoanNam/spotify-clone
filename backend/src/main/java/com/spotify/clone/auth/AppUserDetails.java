package com.spotify.clone.auth;

import java.util.Collection;
import java.util.List;

import org.springframework.security.core.GrantedAuthority;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetails;

import com.spotify.clone.user.Role;
import com.spotify.clone.user.User;

public record AppUserDetails(  
  Long id, 
  String email, 
  String password, 
  Role role, 
  boolean enabled
) implements UserDetails {
    public static AppUserDetails from(User u) {
      return new AppUserDetails(
        u.getId(), 
        u.getEmail(), 
        u.getPassword(), 
        u.getRole(), 
        u.isEnabled());
    }

    @Override 
    public Collection<? extends GrantedAuthority> getAuthorities() {
      return List.of(new SimpleGrantedAuthority("ROLE_" + role.name()));
    }

    @Override 
    public String toString() {
      return "AppUserDetails[id=" + id + ", email=" + email + ", role=" + role + "]";
    }

    @Override public String getUsername() { return email; }
    @Override public String getPassword() { return password; }
    @Override public boolean isEnabled() { return enabled; }
}
