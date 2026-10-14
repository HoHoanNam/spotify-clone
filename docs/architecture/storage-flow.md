# Luồng hoạt động của Storage

Tài liệu này giải thích cách backend lưu, đọc và xoá file audio và ảnh. Quyết định thiết kế nằm ở [ADR-0007: Lưu file trên local disk, stream audio qua HTTP Range](../adr/0007-local-file-storage-streaming.md); tài liệu này mô tả cách quyết định đó được hiện thực hoá trong code.

Phần Storage không tự có endpoint nào. Nó được dùng bởi:

- **Admin upload** (nghệ sĩ, album, bài hát): lưu file → [mục 2](#2-luồng-lưu-file).
- **`MediaController`** (phát nhạc, hiển thị ảnh): đọc file → [mục 3](#3-luồng-đọc-file).
- **Admin xoá / thay ảnh**: xoá file → [mục 4](#4-luồng-xoá-file).

**Mục lục**

- [1. Vai trò của từng class](#1-vai-trò-của-từng-class)
- [2. Luồng lưu file](#2-luồng-lưu-file)
- [3. Luồng đọc file](#3-luồng-đọc-file)
- [4. Luồng xoá file](#4-luồng-xoá-file)
- [5. Thứ tự giữa DB và file](#5-thứ-tự-giữa-db-và-file)
- [6. Cấu hình](#6-cấu-hình)
- [7. Test](#7-test)
- [8. Hạn chế đã biết](#8-hạn-chế-đã-biết)

---

## 1. Vai trò của từng class

```
                  ┌──────────────────── storage/ ─────────────────────┐
MultipartFile ──▶ │ Uploads              kiểm tra đuôi, ghi file tạm   │
                  │ AudioMetadataReader  đọc duration, chặn file giả   │
                  │ MediaFolder          thư mục đích theo loại file   │
                  │ FileStorageService   interface: store/load/delete  │
                  │   └ LocalFileStorageService  lưu trên ổ đĩa        │
                  └───────────────────────────────────────────────────┘
                                   │ trả về "audio/3f2a...mp3"
                                   ▼
                     Track.audioPath / Album.coverPath ... (DB)
```

| Class | Trách nhiệm | Không làm gì |
|---|---|---|
| [Uploads](../../backend/src/main/java/com/spotify/clone/storage/Uploads.java) | Kiểm tra file rỗng, kiểm tra đuôi có trong danh sách cho phép, ghi `MultipartFile` ra file tạm | Không biết file sẽ được lưu ở đâu |
| [AudioMetadataReader](../../backend/src/main/java/com/spotify/clone/storage/AudioMetadataReader.java) | Đọc header của file audio để lấy số giây (jaudiotagger) | Không lưu file |
| [MediaFolder](../../backend/src/main/java/com/spotify/clone/storage/MediaFolder.java) | Quy định thư mục con: `audio`, `images/artists`, `images/albums`, `images/tracks`, `images/avatars` | — |
| [FileStorageService](../../backend/src/main/java/com/spotify/clone/storage/FileStorageService.java) | Hợp đồng chung: lưu file, đọc file, xoá file | Không phụ thuộc vào ổ đĩa hay S3 |
| [LocalFileStorageService](../../backend/src/main/java/com/spotify/clone/storage/LocalFileStorageService.java) | Cài đặt hợp đồng trên ổ đĩa, sinh tên UUID, chặn path traversal | Không kiểm tra loại file |

Mỗi class chỉ làm một việc. Khi chuyển sang MinIO/S3, chỉ cần viết thêm một class `S3FileStorageService` cài đặt `FileStorageService`; các class khác và dữ liệu trong DB giữ nguyên.

Cấu trúc thư mục trên đĩa:

```
backend/storage/                 (gitignored, cấu hình bằng app.storage.root)
├─ audio/          3f2a...e1.mp3
└─ images/
   ├─ artists/
   ├─ albums/
   ├─ tracks/
   └─ avatars/
```

Mọi ảnh đều nằm dưới `images/`, nên `MediaController` chỉ cần một endpoint `/api/media/images/**` cho tất cả các loại ảnh.

---

## 2. Luồng lưu file

Ví dụ khi admin upload một bài hát:

```
1. Uploads.extensionOf(audio, AUDIO_EXT)       "Song.MP3"  → "mp3"   (sai đuôi / rỗng → 400)
2. Uploads.toTempFile(audio, "mp3")            → %TEMP%/upload-123.mp3
3. audioMetadataReader.readDurationSeconds()   → 185                   (file giả → 400)
4. storage.store(temp, AUDIO, "mp3")           → copy vào storage/audio/3f2a...e1.mp3
                                                  trả về "audio/3f2a...e1.mp3"
5. new Track(title, 185, "audio/3f2a...e1.mp3") → save DB
6. finally: Uploads.deleteQuietly(temp)        xoá file tạm dù thành công hay lỗi
```

Upload ảnh đi theo cùng luồng nhưng bỏ bước 3, và dùng `IMAGE_EXT` cùng `MediaFolder` tương ứng.

### 2.1 Kiểm tra đuôi file

```java
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
```

- Danh sách cho phép: audio `mp3`, `m4a`, `ogg`; ảnh `jpg`, `jpeg`, `png`, `webp`.
- Tên file gốc từ client **chỉ dùng để lấy phần đuôi** sau khi đã kiểm tra. Tên lưu trên đĩa luôn là UUID.

### 2.2 Vì sao phải ghi ra file tạm

- `MultipartFile` chỉ là luồng dữ liệu của request, không phải file nằm sẵn trên đĩa.
- jaudiotagger cần một `File` thật và nhận dạng định dạng theo **đuôi file**, nên file tạm phải có đúng đuôi (`upload-123.mp3`).

### 2.3 Vì sao đọc duration trước khi lưu

```java
public int readDurationSeconds(Path file) {
  try {
    AudioFile audio = AudioFileIO.read(file.toFile());
    int seconds = audio.getAudioHeader().getTrackLength();
    if (seconds <= 0) throw new BadRequestException("Audio file has no duration");
    return seconds;
  } catch (BadRequestException e) {
    throw e;
  } catch (Exception e) {
    throw new BadRequestException("Invalid or unsupported audio file");
  }
}
```

- Duration do backend đọc từ file, không nhận từ client, nên luôn đúng với file thật.
- Đây cũng là lớp chặn file giả: một file `.exe` đổi tên thành `.mp3` sẽ không có header audio hợp lệ và bị từ chối với 400.
- Vì bước này đứng trước bước lưu, file giả không bao giờ được ghi vào storage, nên không phải dọn dẹp gì.

### 2.4 Bên trong `store()`

```java
String relative = folder.path() + "/" + UUID.randomUUID() + "." + extension;  // "audio/3f2a...mp3"
Path target = resolve(relative);                                                // D:\...\storage\audio\3f2a...mp3
Files.createDirectories(target.getParent());                                    // tạo thư mục nếu chưa có
Files.copy(source, target);
return relative;                                                                // DB chỉ lưu phần này
```

- **Tên UUID:** không trùng tên, và tên file gốc của người dùng (có thể chứa `../` hoặc ký tự lạ) không bao giờ xuất hiện trên đĩa.
- **Đường dẫn tương đối:** DB lưu `audio/3f2a...mp3`, không lưu `D:\NAM\...`. Khi đổi `STORAGE_ROOT`, chuyển sang Docker hay sang S3, dữ liệu trong DB vẫn dùng được.

---

## 3. Luồng đọc file

```
GET /api/media/images/tracks/3f2a.jpg
  → storage.load("images/tracks/3f2a.jpg")
      → resolve(): root + path → normalize → còn nằm trong root?
          không → ResourceNotFoundException (404)
      → file có tồn tại không?  không → 404
      → trả về FileSystemResource (Spring tự stream ra response)
```

### 3.1 Chặn path traversal

```java
private Path resolve(String relativePath) {
  Path path = root.resolve(relativePath).normalize();
  if (!path.startsWith(root)) {
    throw new ResourceNotFoundException("File not found");
  }
  return path;
}
```

| Input | Sau `normalize()` | Kết quả |
|---|---|---|
| `images/tracks/a.jpg` | `D:\...\storage\images\tracks\a.jpg` | Nằm trong root → cho phép |
| `../application-local.yml` | `D:\...\backend\application-local.yml` | Ra ngoài root → 404 |
| `images/../../x` | `D:\...\backend\x` | Ra ngoài root → 404 |

- `Path.startsWith` so sánh theo **từng đoạn thư mục**, không so sánh chuỗi ký tự. Vì vậy `storage-evil` không bị coi là nằm trong `storage`.
- Lỗi trả về là 404 thay vì 400 để người ngoài không biết đường dẫn đó có hợp lệ hay không.
- `resolve()` được dùng cho cả `store`, `load` và `delete`, nên không có đường nào đi vòng qua bước kiểm tra này.
- Với request HTTP, còn một lớp chặn đứng trước: `StrictHttpFirewall` của Spring Security từ chối URL chứa `../` với **400** trước khi tới controller. `resolve()` vẫn cần thiết cho các đường dẫn đến từ nguồn khác (DB, code nội bộ) và khi đổi cấu hình firewall.

### 3.2 Phát audio và hiển thị ảnh

`MediaController` (Bước 5 trong roadmap) gọi `storage.load(...)` và trả về `ResponseEntity<Resource>`:

- **Audio** đi qua `GET /api/media/audio/{trackId}`: controller tìm `Track` theo id rồi đọc `audioPath`. Đường dẫn file thật không bao giờ lộ ra ngoài.
- **Ảnh** đi qua `GET /api/media/images/{*path}`, với cache 30 ngày. An toàn vì tên UUID không bao giờ đổi nội dung.
- **HTTP Range** được Spring MVC xử lý tự động khi controller trả về `Resource`: request có header `Range` nhận `206 Partial Content` kèm `Content-Range`. Thẻ `<audio>` dựa vào cơ chế này để tua nhạc.
- `/api/media/**` không cần đăng nhập, vì `<audio src>` không gửi được header `Authorization` (ADR-0007).
- URL trả về cho frontend luôn được ghép qua `MediaUrls`:
  - `MediaUrls.image("images/tracks/a.jpg")` → `/api/media/images/tracks/a.jpg`
  - `MediaUrls.audio(1)` → `/api/media/audio/1`

---

## 4. Luồng xoá file

```java
public void delete(String relativePath) {
  if (relativePath == null) return;                    // ảnh không bắt buộc → có thể null
  try {
    Files.deleteIfExists(resolve(relativePath));
  } catch (IOException e) {
    log.warn("Cannot delete file {}", relativePath, e); // không làm hỏng request
  }
}
```

Xoá file là việc dọn dẹp phụ. Nếu file đang bị khoá (ví dụ Windows giữ file khi có người đang nghe), việc xoá bản ghi trong DB vẫn phải thành công; lúc đó chỉ còn lại một file rác, không gây lỗi.

---

## 5. Thứ tự giữa DB và file

File và DB là hai hệ thống riêng: transaction của DB không thể rollback một file đã ghi xuống đĩa. Vì vậy thứ tự thao tác được chọn sao cho khi có lỗi, hậu quả xấu nhất chỉ là một file rác, không bao giờ là bản ghi trỏ tới file không tồn tại.

| Thao tác | Thứ tự | Nếu có lỗi |
|---|---|---|
| **Upload** | Ghi file → lưu DB | DB lỗi → xoá file vừa ghi (bắt exception, và đăng ký `TransactionSynchronization` để xoá khi transaction rollback) |
| **Xoá** | Xoá bản ghi DB → xoá file **sau khi commit** (`afterCommit`) | DB lỗi → file vẫn còn nguyên, bản ghi vẫn hợp lệ |
| **Thay ảnh** | Ghi ảnh mới → cập nhật DB → xoá ảnh cũ sau khi commit | Kết hợp hai trường hợp trên |

---

## 6. Cấu hình

| Cấu hình | Mặc định | Ý nghĩa |
|---|---|---|
| `app.storage.root` (`STORAGE_ROOT`) | `./storage` | Thư mục gốc, tính từ thư mục chạy app. Log khởi động in ra đường dẫn tuyệt đối: `File storage root: ...` |
| `spring.servlet.multipart.max-file-size` | `50MB` | File lớn hơn → `MaxUploadSizeExceededException` → 413 |
| `spring.servlet.multipart.max-request-size` | `60MB` | Tổng kích thước một request (audio + ảnh) |
| `logging.level.org.jaudiotagger` | `WARN` | jaudiotagger log rất nhiều ở mức INFO |

`backend/.gitignore` chứa `/storage/` (có dấu `/` ở đầu) để chỉ bỏ qua thư mục dữ liệu `backend/storage/`. Nếu viết `storage/` không có dấu `/`, git sẽ bỏ qua **mọi** thư mục tên `storage`, kể cả package code `com/spotify/clone/storage/`.

---

## 7. Test

| Test | Kiểm chứng |
|---|---|
| `LocalFileStorageServiceTest.storesLoadsAndDeletes` | Đường dẫn trả về đúng dạng `images/tracks/<uuid>.jpg`; đọc lại đúng nội dung; xoá xong thì đọc lại báo 404 |
| `LocalFileStorageServiceTest.rejectsPathTraversal` | `../secret.yml` và `images/../../secret.yml` đều bị chặn, dù file đó thật sự tồn tại |
| `LocalFileStorageServiceTest.deleteIgnoresMissingFile` | Xoá file không tồn tại hoặc path `null` không ném lỗi |
| `AudioMetadataReaderTest.rejectsFakeMp3` | File văn bản đổi đuôi thành `.mp3` bị từ chối |
| `AudioMetadataReaderTest.readsDurationOfRealFile` | Đọc được duration của `src/test/resources/audio/sample.mp3` |
| `MediaControllerTest.streamsAudioWithRange` | Header `Range: bytes=0-99` → 206, `Content-Range: bytes 0-99/...`, `audio/mpeg` |
| `MediaControllerTest.streamsWholeAudioWithoutRange` | Không có Range → 200 kèm `Accept-Ranges: bytes` |
| `MediaControllerTest.blocksPathTraversal` | URL chứa `../` bị chặn (4xx) |
| `MediaControllerTest.unknownTrackIs404` | Track không tồn tại → 404 |

`sample.mp3` là 3 giây im lặng, tạo bằng ffmpeg nên không vướng bản quyền:

```bash
ffmpeg -f lavfi -i anullsrc=r=44100:cl=mono -t 3 -q:a 9 src/test/resources/audio/sample.mp3
```

Test của `LocalFileStorageService` và `AudioMetadataReader` không cần DB và không khởi động Spring nên chạy rất nhanh. `MediaControllerTest` khởi động Spring và cần DB (dữ liệu được rollback sau mỗi test). Chạy tất cả bằng `mvnw test`.

---

## 8. Hạn chế đã biết

- **Ảnh chỉ được kiểm tra theo đuôi file.** Audio có thêm lớp kiểm tra nội dung (jaudiotagger), còn ảnh thì chưa. Chấp nhận được vì chỉ admin mới upload được; có thể bổ sung kiểm tra bằng `ImageIO` sau này.
- **Media không yêu cầu đăng nhập.** Ai có URL đều tải được file. Nâng cấp sau bằng signed URL có thời hạn (ADR-0007).
- **Chỉ chạy được một instance.** File nằm trên ổ đĩa của máy chạy app. Khi chạy nhiều instance hoặc trong Docker cần volume dùng chung, hoặc chuyển sang object storage (MinIO/S3).
- **File mồ côi vẫn có thể xuất hiện** nếu app bị tắt đột ngột giữa lúc ghi file và lúc commit DB. Có thể viết một job dọn dẹp định kỳ, so sánh file trên đĩa với các đường dẫn trong DB.
