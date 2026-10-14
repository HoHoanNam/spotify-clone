package com.spotify.clone.track;

import static org.hamcrest.Matchers.greaterThan;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.util.List;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.mock.web.MockMultipartFile;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.artist.Artist;
import com.spotify.clone.artist.ArtistRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // rollback → MediaUploadService also deletes the stored file
class AdminTrackControllerTest {

  @Autowired MockMvc mvc;
  @Autowired TrackRepository trackRepository;
  @Autowired ArtistRepository artistRepository;

  @Test
  @WithMockUser(roles = "ADMIN")
  void uploadsTrackWithOrderedArtistsAndReadsDuration() throws Exception {
    Artist main = artistRepository.save(new Artist("Main"));
    Artist feat = artistRepository.save(new Artist("Feat"));

    mvc.perform(multipart("/api/admin/tracks")
            .file(new MockMultipartFile("audio", "sample.mp3", "audio/mpeg",
                getClass().getResourceAsStream("/audio/sample.mp3")))
            .param("title", "Test song")
            .param("artistIds", feat.getId().toString(), main.getId().toString()))
        .andExpect(status().isCreated())
        .andExpect(jsonPath("$.durationSec", greaterThan(0)))
        .andExpect(jsonPath("$.artists[0].name").value("Feat"))
        .andExpect(jsonPath("$.artists[1].name").value("Main"))
        .andExpect(jsonPath("$.coverUrl").doesNotExist());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void rejectsFakeAudio() throws Exception {
    Artist artist = artistRepository.save(new Artist("A"));
    mvc.perform(multipart("/api/admin/tracks")
            .file(new MockMultipartFile("audio", "fake.mp3", "audio/mpeg", "not audio".getBytes()))
            .param("title", "x")
            .param("artistIds", artist.getId().toString()))
        .andExpect(status().isBadRequest());
  }

  @Test
  @WithMockUser // role USER
  void forbidsNonAdmin() throws Exception {
    mvc.perform(multipart("/api/admin/tracks").param("title", "x")).andExpect(status().isForbidden());
  }

  @Test
  @WithMockUser(roles = "ADMIN")
  void updatesMetadataAndReordersArtists() throws Exception {
    Artist a = artistRepository.save(new Artist("A"));
    Artist b = artistRepository.save(new Artist("B"));
    Track track = new Track("Old", 3, "audio/missing.mp3");
    track.getArtists().addAll(List.of(a, b));
    track = trackRepository.saveAndFlush(track);

    mvc.perform(multipart(HttpMethod.PUT, "/api/admin/tracks/{id}", track.getId())
            .param("title", "New")
            .param("artistIds", b.getId().toString(), a.getId().toString()))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("New"))
        .andExpect(jsonPath("$.artists[0].name").value("B"))
        .andExpect(jsonPath("$.artists[1].name").value("A"));
  }
}
