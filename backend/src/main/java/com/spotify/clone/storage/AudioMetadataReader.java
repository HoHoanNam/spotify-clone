package com.spotify.clone.storage;

import java.nio.file.Path;

import org.jaudiotagger.audio.AudioFile;
import org.jaudiotagger.audio.AudioFileIO;
import org.springframework.stereotype.Component;

import com.spotify.clone.common.exception.BadRequestException;

@Component
public class AudioMetadataReader {

  /**
   * Thời lượng (giây). File không đọc được → 400.
   * Đồng thời là bước chặn file giả mạo: đổi tên .exe thành .mp3 sẽ không đọc được header.
   */
  public int readDurationSeconds(Path file) {
    try {
      AudioFile audio = AudioFileIO.read(file.toFile());
      int seconds = audio.getAudioHeader().getTrackLength();
      if (seconds <= 0) {
        throw new BadRequestException("Audio file has no duration");
      }
      return seconds;
    } catch (BadRequestException e) {
      throw e;
    } catch (Exception e) {   // CannotReadException, InvalidAudioFrameException, TagException, IOException...
      throw new BadRequestException("Invalid or unsupported audio file");
    }
  }
}
