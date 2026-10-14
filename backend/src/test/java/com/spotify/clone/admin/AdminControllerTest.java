package com.spotify.clone.admin;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.MediaType;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.auth.AppUserDetails;
import com.spotify.clone.user.Role;
import com.spotify.clone.user.User;
import com.spotify.clone.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class AdminControllerTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository userRepository;

  User admin;
  User member;
  RequestPostProcessor asAdmin;

  @BeforeEach
  void setUp() {
    admin = new User("Boss", "boss@test.local", "x");
    admin.setRole(Role.ADMIN);
    admin = userRepository.save(admin);
    member = userRepository.save(new User("Member", "member@test.local", "x"));
    asAdmin = user(AppUserDetails.from(admin));
  }

  @Test
  void disablesAndPromotesOtherUsers() throws Exception {
    mvc.perform(patch("/api/admin/users/{id}", member.getId()).with(asAdmin)
            .contentType(MediaType.APPLICATION_JSON).content("{\"enabled\":false,\"role\":\"ADMIN\"}"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.enabled").value(false))
        .andExpect(jsonPath("$.role").value("ADMIN"));
  }

  @Test
  void cannotChangeOwnAccount() throws Exception {
    mvc.perform(patch("/api/admin/users/{id}", admin.getId()).with(asAdmin)
            .contentType(MediaType.APPLICATION_JSON).content("{\"role\":\"USER\"}"))
        .andExpect(status().isBadRequest());
  }

  @Test
  void searchesUsersAndReturnsStats() throws Exception {
    mvc.perform(get("/api/admin/users").param("q", "member@").with(asAdmin))
        .andExpect(jsonPath("$.content[0].username").value("Member"));
    mvc.perform(get("/api/admin/stats").with(asAdmin))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.users").isNumber());
  }

  @Test
  void forbidsMembers() throws Exception {
    mvc.perform(get("/api/admin/stats").with(user(AppUserDetails.from(member)))).andExpect(status().isForbidden());
  }
}
