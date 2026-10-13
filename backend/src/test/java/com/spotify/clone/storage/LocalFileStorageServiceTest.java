package com.spotify.clone.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatCode;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.config.AppProperties;

class LocalFileStorageServiceTest {

  @TempDir Path root;
  LocalFileStorageService storage;

  @BeforeEach
  void setUp() throws IOException {
    var props = new AppProperties(new AppProperties.Storage(root.toString()), null, null, null);
    storage = new LocalFileStorageService(props);
  }

  @Test
  void storesLoadsAndDeletes() throws IOException {
    Path source = Files.writeString(root.resolve("src.txt"), "hello");

    String path = storage.store(source, MediaFolder.TRACK_COVERS, "jpg");

    assertThat(path).startsWith("images/tracks/").endsWith(".jpg");
    assertThat(storage.load(path).getContentAsString(StandardCharsets.UTF_8)).isEqualTo("hello");

    storage.delete(path);
    assertThatThrownBy(() -> storage.load(path)).isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void rejectsPathTraversal() throws IOException {
    Files.writeString(root.getParent().resolve("secret.yml"), "password: x");

    assertThatThrownBy(() -> storage.load("../secret.yml"))
        .isInstanceOf(ResourceNotFoundException.class);
    assertThatThrownBy(() -> storage.load("images/../../secret.yml"))
        .isInstanceOf(ResourceNotFoundException.class);
  }

  @Test
  void deleteIgnoresMissingFile() {
    assertThatCode(() -> storage.delete("audio/not-there.mp3")).doesNotThrowAnyException();
    assertThatCode(() -> storage.delete(null)).doesNotThrowAnyException();
  }
}
