# ADR-0005: PostgreSQL local + Flyway migration

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Bối cảnh

Dữ liệu có quan hệ rõ ràng (user, artist, album, track, playlist, like). Máy phát triển đã cài sẵn PostgreSQL (bản 18, chạy như Windows service). Docker sẽ được đưa vào ở giai đoạn sau.

## Quyết định

- **PostgreSQL** cài trực tiếp trên máy ở giai đoạn đầu, database `spotify_clone`.
- Kết nối cấu hình qua biến môi trường `DB_URL`, `DB_USERNAME`, `DB_PASSWORD` hoặc file `backend/application-local.yml` (gitignored).
- Schema quản lý hoàn toàn bằng **Flyway** (`backend/src/main/resources/db/migration`). Quy ước: `V<n>__<mo_ta>.sql`, không sửa migration đã chạy; mọi thay đổi schema là một migration mới.
- Hibernate `ddl-auto=validate`.

## Hệ quả

- Chuyển sang Docker sau này chỉ cần đổi `DB_URL`; Flyway sẽ dựng lại schema từ đầu.
- Tìm kiếm ban đầu dùng `ILIKE`; nếu cần tìm kiếm tốt hơn có thể dùng `pg_trgm`/full-text search của PostgreSQL (sẽ có ADR riêng).
