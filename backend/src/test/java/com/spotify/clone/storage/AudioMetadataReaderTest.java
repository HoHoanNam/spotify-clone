package com.spotify.clone.storage;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;

import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;

import com.spotify.clone.common.exception.BadRequestException;

class AudioMetadataReaderTest {

  AudioMetadataReader reader = new AudioMetadataReader();

  @Test
  void rejectsFakeMp3(@TempDir Path dir) throws IOException {
    Path fake = Files.writeString(dir.resolve("fake.mp3"), "not really audio");

    assertThatThrownBy(() -> reader.readDurationSeconds(fake))
        .isInstanceOf(BadRequestException.class);
  }

  @Test
  void readsDurationOfRealFile() throws Exception {
    // Đặt một file mp3 ngắn (vài giây, không bản quyền) vào src/test/resources/audio/sample.mp3
    Path sample = Path.of(getClass().getResource("/audio/sample.mp3").toURI());

    assertThat(reader.readDurationSeconds(sample)).isPositive();
  }
}
