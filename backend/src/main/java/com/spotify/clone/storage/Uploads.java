package com.spotify.clone.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.Locale;
import java.util.Set;

import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import com.spotify.clone.common.exception.BadRequestException;

public final class Uploads {

  public static final Set<String> AUDIO_EXT = Set.of("mp3", "m4a", "ogg");
  public static final Set<String> IMAGE_EXT = Set.of("jpg", "jpeg", "png", "webp");

  private Uploads() {}

  /** Đuôi file (lowercase) nếu nằm trong danh sách cho phép; ngược lại 400. */
  public static String extensionOf(MultipartFile file, Set<String> allowed) {
    if (file == null || file.isEmpty()) {
      throw new BadRequestException("File is empty");
    }
    String ext = StringUtils.getFilenameExtension(file.getOriginalFilename());
    ext = ext == null ? "" : ext.toLowerCase(Locale.ROOT);
    if (!allowed.contains(ext)) {
      throw new BadRequestException("Unsupported file type: ." + ext);
    }
    return ext;
  }

  /** Ghi MultipartFile ra file tạm có đuôi (jaudiotagger nhận dạng định dạng theo đuôi). */
  public static Path toTempFile(MultipartFile file, String extension) {
    try {
      Path temp = Files.createTempFile("upload-", "." + extension);
      file.transferTo(temp);
      return temp;
    } catch (IOException e) {
      throw new UncheckedIOException("Cannot read upload", e);
    }
  }

  public static void deleteQuietly(Path path) {
    try {
      if (path != null) Files.deleteIfExists(path);
    } catch (IOException ignored) {
      // file tạm, hệ điều hành sẽ dọn
    }
  }
}
