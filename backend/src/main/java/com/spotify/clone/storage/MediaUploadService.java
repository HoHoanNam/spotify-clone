package com.spotify.clone.storage;

import java.nio.file.Path;
import java.util.function.IntConsumer;

import org.springframework.stereotype.Service;
import org.springframework.transaction.support.TransactionSynchronization;
import org.springframework.transaction.support.TransactionSynchronizationManager;
import org.springframework.web.multipart.MultipartFile;

import lombok.RequiredArgsConstructor;

/**
 * Stores uploaded files and keeps disk and DB consistent:
 * files written in a transaction are deleted if it rolls back; old files are deleted only after commit.
 * Every method must be called inside a @Transactional service method.
 */
@Service
@RequiredArgsConstructor
public class MediaUploadService {

  private final FileStorageService storage;
  private final AudioMetadataReader audioMetadataReader;

  public record StoredAudio(String path, int durationSec) {}

  public StoredAudio storeAudio(MultipartFile file) {
    String ext = Uploads.extensionOf(file, Uploads.AUDIO_EXT);
    Path temp = Uploads.toTempFile(file, ext);
    try {
      int duration = audioMetadataReader.readDurationSeconds(temp);   // fake file → 400 before anything is stored
      String path = storage.store(temp, MediaFolder.AUDIO, ext);
      deleteOnRollback(path);
      return new StoredAudio(path, duration);
    } finally {
      Uploads.deleteQuietly(temp);
    }
  }

  /** Optional image: returns null when no file was sent. */
  public String storeImage(MultipartFile file, MediaFolder folder) {
    if (file == null || file.isEmpty()) return null;
    String ext = Uploads.extensionOf(file, Uploads.IMAGE_EXT);
    Path temp = Uploads.toTempFile(file, ext);
    try {
      String path = storage.store(temp, folder, ext);
      deleteOnRollback(path);
      return path;
    } finally {
      Uploads.deleteQuietly(temp);
    }
  }

  public void deleteAfterCommit(String path) {
    if (path == null) return;
    afterCompletion(status -> {
      if (status == TransactionSynchronization.STATUS_COMMITTED) storage.delete(path);
    });
  }

  private void deleteOnRollback(String path) {
    afterCompletion(status -> {
      if (status != TransactionSynchronization.STATUS_COMMITTED) storage.delete(path);
    });
  }

  private void afterCompletion(IntConsumer action) {
    if (!TransactionSynchronizationManager.isSynchronizationActive()) {
      throw new IllegalStateException("MediaUploadService must be called inside a @Transactional method");
    }
    TransactionSynchronizationManager.registerSynchronization(new TransactionSynchronization() {
      @Override
      public void afterCompletion(int status) {
        action.accept(status);
      }
    });
  }
}
