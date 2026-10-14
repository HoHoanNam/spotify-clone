# Changelog

Ghi lại các thay đổi quan trọng (feature hoàn thành, thay đổi API/schema, breaking change, nâng cấp phụ thuộc lớn). Mục mới nhất ở trên cùng.

Định dạng mỗi mục: `## YYYY-MM-DD — Tiêu đề` rồi các nhóm **Added / Changed / Fixed / Removed**, liên kết ADR nếu có.

## 2026-10-14 — Playlist, thư viện, tài khoản, admin mở rộng và nâng cấp UX

### Added
- **Schema V4** (`V4__create_library.sql`): `playlists`, `playlist_tracks`, `liked_tracks`, `saved_albums`, `followed_artists`, `play_history`.
- **Playlist** ([ADR-0010](adr/0010-playlist-ordering.md), [module](modules/playlist.md)): CRUD, ảnh bìa hoặc mosaic 4 ảnh, public/private, thêm (bỏ qua trùng) / xoá / di chuyển bài; `GET /api/me/playlists`, `GET /api/playlists?q`.
- **Thư viện** ([ADR-0011](adr/0011-library-client-state.md), [module](modules/library.md)): Liked Songs, lưu album, follow nghệ sĩ (idempotent `PUT`/`DELETE`), `GET /api/me/library`, "Recently played".
- **Tài khoản** ([module](modules/account.md)): upload/xoá avatar, đổi mật khẩu, hồ sơ công khai `GET /api/users/{id}`.
- **Admin** ([module](modules/admin.md)): sửa album và nghệ sĩ (`PUT`), quản lý user (`GET/PATCH /api/admin/users`), thống kê `GET /api/admin/stats`.
- Catalog: lọc `?q=` cho `/api/tracks|albums|artists`, `?sort=playCount,desc`, `followers` và `appearsOn` trong `ArtistDetail`, `playlists` trong kết quả tìm kiếm.
- Frontend, trang mới: Playlist (+ dialog Edit details), Liked Songs, Your Library (`/collection`), "Show all" (`/section/:kind`), Profile, Settings; admin có thêm Dashboard và Users.
- Frontend, UX ([module](modules/frontend-ui.md)): context menu bài hát, Add to queue + panel Queue, kéo-thả để sắp xếp playlist và thả bài vào playlist/Liked Songs ở sidebar, phím tắt (`?` để xem), ghi nhớ phiên nghe sau khi tải lại trang, cuộn vô hạn, Recent searches, dialog xác nhận thay `window.confirm`, thanh tab cho điện thoại, nút back/forward.
- ADR-0009 (mô hình bài hát), ADR-0010, ADR-0011; thư mục `docs/modules/`.

### Changed
- `POST /api/tracks/{id}/play` ghi thêm lịch sử nghe của user.
- `SearchResponse` có thêm `playlists`.
- `AlbumForm` / `ArtistForm` dùng chung cho POST và PUT (`removeCover` / `removeImage`).
- `TrackRepository.incrementPlayCount` dùng `clearAutomatically = true`.
- `CatalogService` (frontend) nhận object `ListQuery { page, size, q, sort }` thay cho tham số vị trí.

### Tests
- Backend: thêm `PlaylistControllerTest`, `LibraryControllerTest`, `UserControllerTest`, `AdminControllerTest`, `AdminCatalogUpdateTest` (tổng 31 test).
- Frontend: thêm test manual queue và khôi phục phiên cho `PlayerService` (tổng 18 test).

## 2026-10-13 — Auth, storage, catalog và giao diện chính

### Added
- Schema V2 (`users`), V3 (`artists`, `albums`, `tracks`, `track_artists`) — [ADR-0009](adr/0009-catalog-track-model.md).
- Auth JWT, `/api/me`, seed tài khoản admin ([auth-flow.md](architecture/auth-flow.md)).
- Storage local, stream audio có Range, `MediaUploadService` đồng bộ file với transaction ([storage-flow.md](architecture/storage-flow.md)).
- Catalog API, tìm kiếm, admin upload/sửa/xoá bài hát; frontend: đăng nhập/đăng ký, Home, Search, Album, Artist, Admin, player bar.

## 2026-10-12 — Khởi tạo base dự án

### Added
- Monorepo `backend/` + `frontend/` + `docs/` ([ADR-0002](adr/0002-monorepo-structure.md)).
- Backend Spring Boot 4.1.1 / Java 21 tạo từ Spring Initializr, thêm springdoc-openapi 3.1.1 và jjwt 0.13.0 ([ADR-0003](adr/0003-backend-spring-boot.md)).
  - `SecurityConfig` stateless (chưa có JWT filter), CORS cho `http://localhost:4200`, BCrypt `PasswordEncoder`.
  - `AppProperties` (prefix `app`: storage, cors, jwt), `OpenApiConfig` với Bearer auth.
  - `GlobalExceptionHandler` trả Problem Details, `PageResponse<T>`, `GET /api/health`.
  - Flyway `V1__baseline.sql` (schema rỗng).
  - Cấu hình riêng máy qua `application-local.yml` (gitignored).
- Frontend Angular 22 + Tailwind v4 ([ADR-0004](adr/0004-frontend-angular-tailwind.md)).
  - Layout shell tĩnh: sidebar, vùng nội dung, player bar placeholder; trang Home placeholder.
  - Design token màu Spotify trong `styles.css`, proxy `/api` → `:8080`, `environment.apiUrl`.
- Thư mục tài liệu: ADR 0001–0008, tổng quan kiến trúc, roadmap, hướng dẫn setup.

### Notes
- Spring Initializr trả `bootVersion=4.1.1.RELEASE` nhưng artifact trên Maven Central là `4.1.1` → đã sửa trong `pom.xml`.
- Spring Boot 4 đổi `server.error.include-stacktrace` thành `spring.web.error.include-stacktrace`.
