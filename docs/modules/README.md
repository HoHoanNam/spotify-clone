# Tài liệu theo module

Mỗi module có một file mô tả: nó làm gì, API, mô hình dữ liệu, luồng chính ở backend và frontend, test, và hạn chế đã biết. Quyết định kiến trúc (vì sao chọn cách này) nằm ở [ADR](../adr/README.md).

| Module | Backend | Frontend | Tài liệu |
|---|---|---|---|
| Auth | `auth/`, `user/` | `core/auth/`, `features/auth/` | [auth-flow.md](../architecture/auth-flow.md) |
| Storage & media | `storage/` | `shared/cover-image` | [storage-flow.md](../architecture/storage-flow.md) |
| Catalog (bài hát, album, nghệ sĩ, tìm kiếm) | `track/`, `album/`, `artist/`, `search/` | `features/home, search, album, artist, section` | [catalog.md](catalog.md) |
| Playlist | `playlist/` | `features/playlist/` | [playlist.md](playlist.md) |
| Thư viện (Liked Songs, lưu album, follow, nghe gần đây) | `library/` | `core/library/`, `features/collection/`, `layout/library-panel` | [library.md](library.md) |
| Tài khoản & hồ sơ | `user/` | `features/settings/`, `features/profile/` | [account.md](account.md) |
| Admin | `admin/`, `Admin*Controller` | `features/admin/` | [admin.md](admin.md) |
| Player | — | `player/`, `layout/player-bar`, `layout/queue-panel` | [player.md](player.md) |
| Giao diện dùng chung (menu, dialog, phím tắt, kéo-thả…) | — | `shared/`, `layout/` | [frontend-ui.md](frontend-ui.md) |

Quy ước chung của API: [ADR-0008](../adr/0008-api-conventions.md). Mọi endpoint (trừ `/api/auth/**`, `/api/media/**`, `/api/health`) đều cần header `Authorization: Bearer <token>`; `/api/admin/**` cần thêm `ROLE_ADMIN`.
