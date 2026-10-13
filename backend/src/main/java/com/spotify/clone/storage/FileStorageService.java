package com.spotify.clone.storage;

import java.nio.file.Path;

import org.springframework.core.io.Resource;

public interface FileStorageService {

  /** Copy file nguồn vào storage, trả về đường dẫn tương đối, ví dụ "images/tracks/3f2a...e1.jpg". */
  String store(Path source, MediaFolder folder, String extension);

  /** Ném ResourceNotFoundException nếu file không tồn tại. */
  Resource load(String relativePath);

  /** Không ném lỗi nếu file không tồn tại hoặc path null. */
  void delete(String relativePath);
}
