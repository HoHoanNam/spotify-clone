# ADR-0007: Lưu file trên local disk, stream audio qua HTTP Range

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Bối cảnh

Admin upload file audio (mp3/m4a/ogg) và ảnh bìa. Người dùng cần nghe nhạc và tua (seek) được trong trình duyệt bằng thẻ `<audio>`.

## Quyết định

- File lưu trên **local disk** tại `app.storage.root` (mặc định `backend/storage/`, gitignored), chia `audio/` và `images/`. Tên file sinh bằng UUID; DB chỉ lưu đường dẫn tương đối.
- Truy cập file qua một `FileStorageService` (interface) để có thể thay bằng MinIO/S3 sau này mà không đổi code nghiệp vụ.
- Endpoint stream audio hỗ trợ **HTTP Range** (`206 Partial Content`, header `Accept-Ranges`, `Content-Range`) để trình duyệt seek được.
- Giới hạn upload: 50MB/file (`spring.servlet.multipart.max-file-size`).
- `/api/media/**` để **public** vì `<audio src>` không gửi được header `Authorization`.

## Hệ quả

- Ai có URL đều nghe được file — chấp nhận cho giai đoạn học tập. Nâng cấp sau: signed URL có hạn dùng.
- Khi chạy nhiều instance hoặc trong Docker cần volume dùng chung hoặc chuyển sang object storage.
