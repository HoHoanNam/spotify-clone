package com.spotify.clone.playlist;

import static org.hamcrest.Matchers.hasSize;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.delete;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.post;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
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

import com.jayway.jsonpath.JsonPath;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional
class PlaylistControllerTest {

  @Autowired MockMvc mvc;
  @Autowired UserRepository userRepository;
  @Autowired ArtistRepository artistRepository;
  @Autowired TrackRepository trackRepository;

  RequestPostProcessor owner;
  RequestPostProcessor other;
  Track t1, t2, t3;

  @BeforeEach
  void setUp() {
    owner = user(AppUserDetails.from(userRepository.save(new User("Owner", "owner@test.local", "x"))));
    other = user(AppUserDetails.from(userRepository.save(new User("Other", "other@test.local", "x"))));
    Artist artist = artistRepository.save(new Artist("Artist"));
    t1 = track("One", artist);
    t2 = track("Two", artist);
    t3 = track("Three", artist);
  }

  private Track track(String title, Artist artist) {
    Track track = new Track(title, 100, "audio/missing.mp3");
    track.getArtists().add(artist);
    return trackRepository.save(track);
  }

  private long create(String body) throws Exception {
    String json = mvc.perform(post("/api/playlists").with(owner).contentType(MediaType.APPLICATION_JSON).content(body))
        .andExpect(status().isCreated())
        .andReturn().getResponse().getContentAsString();
    return ((Number) JsonPath.read(json, "$.id")).longValue();
  }

  @Test
  void createsWithDefaultNameAndInitialTracks() throws Exception {
    mvc.perform(post("/api/playlists").with(owner).contentType(MediaType.APPLICATION_JSON)
            .content("{\"trackIds\":[%d,%d]}".formatted(t1.getId(), t2.getId())))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.name").value("My Playlist #1"))
        .andExpect(jsonPath("$.trackCount").value(2))
        .andExpect(jsonPath("$.isPublic").value(true))
        .andExpect(jsonPath("$.owner.username").value("Owner"));
  }

  @Test
  void addsSkipsDuplicatesMovesAndRemoves() throws Exception {
    long id = create("{\"name\":\"Mix\"}");

    mvc.perform(post("/api/playlists/{id}/tracks", id).with(owner).contentType(MediaType.APPLICATION_JSON)
            .content("{\"trackIds\":[%d,%d,%d]}".formatted(t1.getId(), t2.getId(), t3.getId())))
        .andExpect(jsonPath("$.added").value(3));
    mvc.perform(post("/api/playlists/{id}/tracks", id).with(owner).contentType(MediaType.APPLICATION_JSON)
            .content("{\"trackIds\":[%d]}".formatted(t1.getId())))
        .andExpect(jsonPath("$.added").value(0));

    // drag "Three" to the top
    mvc.perform(post("/api/playlists/{id}/tracks/move", id).with(owner).contentType(MediaType.APPLICATION_JSON)
            .content("{\"from\":2,\"to\":0}"))
        .andExpect(status().isNoContent());
    mvc.perform(delete("/api/playlists/{id}/tracks/{trackId}", id, t1.getId()).with(owner))
        .andExpect(status().isNoContent());

    mvc.perform(get("/api/playlists/{id}", id).with(owner))
        .andExpect(jsonPath("$.items", hasSize(2)))
        .andExpect(jsonPath("$.items[0].track.title").value("Three"))
        .andExpect(jsonPath("$.items[1].track.title").value("Two"))
        .andExpect(jsonPath("$.totalDurationSec").value(200));
  }

  @Test
  void privatePlaylistIsHiddenAndPublicOneIsReadOnlyForOthers() throws Exception {
    long id = create("{\"name\":\"Mine\"}");

    mvc.perform(get("/api/playlists/{id}", id).with(other)).andExpect(status().isOk());
    mvc.perform(delete("/api/playlists/{id}", id).with(other)).andExpect(status().isForbidden());

    mvc.perform(multipart(HttpMethod.PUT, "/api/playlists/{id}", id).with(owner)
            .param("name", "Secret").param("isPublic", "false"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.isPublic").value(false));

    mvc.perform(get("/api/playlists/{id}", id).with(other)).andExpect(status().isNotFound());
    mvc.perform(get("/api/me/playlists").with(owner)).andExpect(jsonPath("$[0].name").value("Secret"));
  }

  @Test
  void rejectsUnknownTrackAndBadMove() throws Exception {
    long id = create("{}");
    mvc.perform(post("/api/playlists/{id}/tracks", id).with(owner).contentType(MediaType.APPLICATION_JSON)
            .content("{\"trackIds\":[999999]}"))
        .andExpect(status().isBadRequest());
    mvc.perform(post("/api/playlists/{id}/tracks/move", id).with(owner).contentType(MediaType.APPLICATION_JSON)
            .content("{\"from\":0,\"to\":1}"))
        .andExpect(status().isBadRequest());
  }
}
