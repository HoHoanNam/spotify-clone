package com.spotify.clone.storage;

import java.time.Duration;

import org.springframework.core.io.Resource;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.MediaTypeFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.track.Track;
import com.spotify.clone.track.TrackRepository;

import lombok.RequiredArgsConstructor;

@RestController
@RequestMapping("/api/media")
@RequiredArgsConstructor
public class MediaController {

  private final FileStorageService storage;
  private final TrackRepository trackRepository;

  @GetMapping("/audio/{trackId}")
  ResponseEntity<Resource> audio(@PathVariable Long trackId) {
    Track track = trackRepository.findById(trackId)
        .orElseThrow(() -> new ResourceNotFoundException("Track not found"));
    Resource file = storage.load(track.getAudioPath());
    return ResponseEntity.ok()
        .contentType(mediaTypeOf(file))
        .body(file);
  }

  @GetMapping("/images/{*path}")
  ResponseEntity<Resource> image(@PathVariable String path) {
    Resource file = storage.load("images" + path);          // {*path} giữ dấu "/" đầu: "/tracks/3f2a.jpg"
    return ResponseEntity.ok()
        .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
        .contentType(mediaTypeOf(file))
        .body(file);
  }

  private static MediaType mediaTypeOf(Resource file) {
    return MediaTypeFactory.getMediaType(file).orElse(MediaType.APPLICATION_OCTET_STREAM);
  }
}
