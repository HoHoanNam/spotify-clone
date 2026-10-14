package com.spotify.clone.album;

import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.user;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.multipart;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.jsonPath;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.http.HttpMethod;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;
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
class AdminCatalogUpdateTest {

  @Autowired MockMvc mvc;
  @Autowired ArtistRepository artistRepository;
  @Autowired AlbumRepository albumRepository;
  @Autowired TrackRepository trackRepository;
  @Autowired UserRepository userRepository;

  @Test
  @WithMockUser(roles = "ADMIN")
  void updatesAlbumAndArtist() throws Exception {
    Artist first = artistRepository.save(new Artist("First"));
    Artist second = artistRepository.save(new Artist("Second"));
    Album album = albumRepository.save(new Album("Old", first));

    mvc.perform(multipart(HttpMethod.PUT, "/api/admin/albums/{id}", album.getId())
            .param("title", "New").param("artistId", second.getId().toString()).param("releaseDate", "2024-05-01"))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.title").value("New"))
        .andExpect(jsonPath("$.artist.name").value("Second"))
        .andExpect(jsonPath("$.releaseDate").value("2024-05-01"));

    mvc.perform(multipart(HttpMethod.PUT, "/api/admin/artists/{id}", first.getId())
            .param("name", "Renamed").param("bio", "  "))
        .andExpect(status().isOk())
        .andExpect(jsonPath("$.name").value("Renamed"));
  }

  @Test
  void artistPageListsFeaturedTracksSeparately() throws Exception {
    Artist main = artistRepository.save(new Artist("Main"));
    Artist feat = artistRepository.save(new Artist("Feat"));
    Track track = new Track("Duet", 100, "audio/missing.mp3");
    track.getArtists().add(main);
    track.getArtists().add(feat);
    trackRepository.saveAndFlush(track);
    var viewer = user(AppUserDetails.from(userRepository.save(new User("V", "v@test.local", "x"))));

    mvc.perform(get("/api/artists/{id}", feat.getId()).with(viewer))
        .andExpect(jsonPath("$.appearsOn[0].title").value("Duet"));
    mvc.perform(get("/api/artists/{id}", main.getId()).with(viewer))
        .andExpect(jsonPath("$.appearsOn").isEmpty())
        .andExpect(jsonPath("$.topTracks[0].title").value("Duet"));
  }
}
