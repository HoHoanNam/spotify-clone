package com.spotify.clone.storage;

import java.io.IOException;
import java.io.UncheckedIOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.util.UUID;

import org.springframework.core.io.FileSystemResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;

import com.spotify.clone.common.exception.ResourceNotFoundException;
import com.spotify.clone.config.AppProperties;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class LocalFileStorageService implements FileStorageService {

  private final Path root;

  public LocalFileStorageService(AppProperties props) throws IOException {
    this.root = Path.of(props.storage().root()).toAbsolutePath().normalize();
    Files.createDirectories(root);
    log.info("File storage root: {}", root);
  }

  @Override
  public String store(Path source, MediaFolder folder, String extension) {
    String relative = folder.path() + "/" + UUID.randomUUID() + "." + extension;
    Path target = resolve(relative);
    try {
      Files.createDirectories(target.getParent());
      Files.copy(source, target);
    } catch (IOException e) {
      throw new UncheckedIOException("Cannot store file", e);
    }
    return relative;
  }

  @Override
  public Resource load(String relativePath) {
    Path file = resolve(relativePath);
    if (!Files.isRegularFile(file)) {
      throw new ResourceNotFoundException("File not found");
    }
    return new FileSystemResource(file);
  }

  @Override
  public void delete(String relativePath) {
    if (relativePath == null) return;
    try {
      Files.deleteIfExists(resolve(relativePath));
    } catch (IOException e) {
      log.warn("Cannot delete file {}", relativePath, e);   // không làm hỏng request vì file rác
    }
  }

  /** Chặn path traversal: đường dẫn sau khi chuẩn hoá phải nằm trong root. */
  private Path resolve(String relativePath) {
    Path path = root.resolve(relativePath).normalize();
    if (!path.startsWith(root)) {
      throw new ResourceNotFoundException("File not found");
    }
    return path;
  }
}
