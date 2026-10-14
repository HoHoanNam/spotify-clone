package com.spotify.clone.library;

import static org.hamcrest.Matchers.contains;
import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.put;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.request.RequestPostProcessor;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.artist.Artist;
import com.spotify.clone.artist.ArtistRepository;
import com.spotify.clone.auth.AppUserDetails;
import com.spotify.clone.track.Track;
import com.spotify.clone.track.TrackRepository;
import com.spotify.clone.user.User;
import com.spotify.clone.user.UserRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class LibraryControllerTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository userRepository;
  @Autowired ArtistRepository artistRepository;
  @Autowired TrackRepository trackRepository;

  RequestPostProcessor me;
  Artist artist;
  Track a, b;

  @BeforeEach
  void setUp() {
    me = user(AppUserDetails.from(userRepository.save(new User("Me", "me@test.local", "x"))));
    artist = artistRepository.save(new Artist("Artist"));
    a = track("A");
    b = track("B");
  }

  private Track track(String title) {
    Track track = new Track(title, 100, "audio/missing.mp3");
    track.getArtists().add(artist);
    return trackRepository.save(track);
  }

  @Test
  void likeIsIdempotentAndShowsUpInLibrary() throws Exception {
    mvc.perform(put("/api/me/tracks/{id}", a.getId()).with(me)).andExpect(status().isNoContent());
    mvc.perform(put("/api/me/tracks/{id}", a.getId()).with(me)).andExpect(status().isNoContent());

    mvc.perform(get("/api/me/library").with(me))
        .andExpect(jsonPath("$.likedTrackIds", contains(a.getId().intValue())));
    mvc.perform(get("/api/me/tracks").with(me))
        .andExpect(jsonPath("$.content", hasSize(1)))
        .andExpect(jsonPath("$.content[0].track.title").value("A"));

    mvc.perform(delete("/api/me/tracks/{id}", a.getId()).with(me)).andExpect(status().isNoContent());
    mvc.perform(get("/api/me/library").with(me)).andExpect(jsonPath("$.likedTrackIds", hasSize(0)));
  }

  @Test
  void likingUnknownTrackIs404() throws Exception {
    mvc.perform(put("/api/me/tracks/{id}", 999999).with(me)).andExpect(status().isNotFound());
  }

  @Test
  void followingCountsTowardsArtistFollowers() throws Exception {
    mvc.perform(put("/api/me/following/{id}", artist.getId()).with(me)).andExpect(status().isNoContent());
    mvc.perform(get("/api/artists/{id}", artist.getId()).with(me)).andExpect(jsonPath("$.followers").value(1));
    mvc.perform(get("/api/me/following").with(me)).andExpect(jsonPath("$[0].name").value("Artist"));
  }

  @Test
  void recentlyPlayedIsDistinctAndNewestFirst() throws Exception {
    mvc.perform(post("/api/tracks/{id}/play", a.getId()).with(me)).andExpect(status().isNoContent());
    mvc.perform(post("/api/tracks/{id}/play", b.getId()).with(me));
    mvc.perform(post("/api/tracks/{id}/play", a.getId()).with(me));

    mvc.perform(get("/api/me/recently-played").with(me))
        .andExpect(jsonPath("$", hasSize(2)))
        .andExpect(jsonPath("$[0].title").value("A"))
        .andExpect(jsonPath("$[1].title").value("B"))
        .andExpect(jsonPath("$[0].playCount").value(2));
  }
}
