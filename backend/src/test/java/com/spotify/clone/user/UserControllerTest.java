package com.spotify.clone.user;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.patch;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.auth.AppUserDetails;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class UserControllerTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository userRepository;
  @Autowired PasswordEncoder passwordEncoder;

  User user;
  RequestPostProcessor me;

  @BeforeEach
  void setUp() {
    user = userRepository.save(new User("Me", "me@test.local", passwordEncoder.encode("old-password")));
    me = user(AppUserDetails.from(user));
  }

  @Test
  void changesPasswordOnlyWithTheCurrentOne() throws Exception {
    mvc.perform(put("/api/me/password").with(me).contentType(MediaType.APPLICATION_JSON)
            .content("{\"currentPassword\":\"wrong\",\"newPassword\":\"new-password\"}"))
        .andExpect(status().isBadRequest());   // not 401: the client would log out

    mvc.perform(put("/api/me/password").with(me).contentType(MediaType.APPLICATION_JSON)
            .content("{\"currentPassword\":\"old-password\",\"newPassword\":\"new-password\"}"))
        .andExpect(status().isNoContent());

    mvc.perform(post("/api/auth/login").contentType(MediaType.APPLICATION_JSON)
            .content("{\"email\":\"me@test.local\",\"password\":\"new-password\"}"))
        .andExpect(status().isOk());
  }

  @Test
  void renamesAndRejectsEmptyAvatar() throws Exception {
    mvc.perform(patch("/api/me").with(me).contentType(MediaType.APPLICATION_JSON).content("{\"username\":\" New \"}"))
        .andExpect(jsonPath("$.username").value("New"));
    mvc.perform(multipart(HttpMethod.PUT, "/api/me/avatar").with(me)).andExpect(status().isBadRequest());
  }

  @Test
  void publicProfileShowsOnlyPublicPlaylists() throws Exception {
    mvc.perform(post("/api/playlists").with(me).contentType(MediaType.APPLICATION_JSON).content("{\"name\":\"Open\"}"));
    String json = mvc.perform(post("/api/playlists").with(me).contentType(MediaType.APPLICATION_JSON)
            .content("{\"name\":\"Hidden\"}"))
        .andReturn().getResponse().getContentAsString();
    long hiddenId = ((Number) com.jayway.jsonpath.JsonPath.read(json, "$.id")).longValue();
    mvc.perform(multipart(HttpMethod.PUT, "/api/playlists/{id}", hiddenId).with(me)
        .param("name", "Hidden").param("isPublic", "false"));

    mvc.perform(get("/api/users/{id}", user.getId()).with(me))
        .andExpect(jsonPath("$.username").value("Me"))
        .andExpect(jsonPath("$.email").doesNotExist())
        .andExpect(jsonPath("$.playlists", hasSize(1)))
        .andExpect(jsonPath("$.playlists[0].name").value("Open"));
  }
}
