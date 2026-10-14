package com.spotify.clone.storage;

import static org.hamcrest.Matchers.startsWith;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.content;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.header;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpHeaders;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.transaction.annotation.Transactional;

import com.spotify.clone.track.Track;
import com.spotify.clone.track.TrackRepository;

@SpringBootTest
@AutoConfigureMockMvc
@Transactional // roll back test data after each test
class MediaControllerTest {

  @Autowired MockMvc mvc;
  @Autowired FileStorageService storage;
  @Autowired TrackRepository trackRepository;

  @Test
  void streamsAudioWithRange() throws Exception {
    Path sample = Path.of(getClass().getResource("/audio/sample.mp3").toURI());
    String audioPath = storage.store(sample, MediaFolder.AUDIO, "mp3");
    try {
      Track track = trackRepository.save(new Track("Test", 3, audioPath));

      mvc.perform(get("/api/media/audio/{id}", track.getId()).header(HttpHeaders.RANGE, "bytes=0-99"))
          .andExpect(status().isPartialContent())
          .andExpect(header().string(HttpHeaders.CONTENT_RANGE, startsWith("bytes 0-99/")))
          .andExpect(content().contentType("audio/mpeg"));
    } finally {
      storage.delete(audioPath);
    }
  }

  @Test
  void streamsWholeAudioWithoutRange() throws Exception {
    Path sample = Path.of(getClass().getResource("/audio/sample.mp3").toURI());
    String audioPath = storage.store(sample, MediaFolder.AUDIO, "mp3");
    try {
      Track track = trackRepository.save(new Track("Test", 3, audioPath));

      mvc.perform(get("/api/media/audio/{id}", track.getId()))
          .andExpect(status().isOk())
          .andExpect(header().string(HttpHeaders.ACCEPT_RANGES, "bytes"));
    } finally {
      storage.delete(audioPath);
    }
  }

  /**
   * Spring Security's StrictHttpFirewall rejects "../" in the URL with 400 before it reaches the controller.
   * The second guard, LocalFileStorageService.resolve(), is covered by LocalFileStorageServiceTest.
   */
  @Test
  void blocksPathTraversal() throws Exception {
    mvc.perform(get("/api/media/images/../../application-local.yml"))
        .andExpect(status().is4xxClientError());
  }

  @Test
  void unknownTrackIs404() throws Exception {
    mvc.perform(get("/api/media/audio/999999")).andExpect(status().isNotFound());
  }
}
