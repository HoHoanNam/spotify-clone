# Phạm vi & lộ trình

Dự án chỉ tập trung vào **core feature** của Spotify, không làm full option.

## Core feature (giai đoạn 1)

| Nhóm | Nội dung |
|---|---|
| Auth | Đăng ký, đăng nhập (JWT), vai trò USER/ADMIN |
| Phát nhạc | Player: play/pause, next/prev, seek, volume, queue, shuffle, repeat; stream audio có Range |
| Thư viện nhạc | Duyệt bài hát/album/nghệ sĩ, trang chi tiết, tìm kiếm |
| Playlist & Like | CRUD playlist, thêm/bớt/sắp xếp bài, Liked Songs |
| Admin | Upload bài hát + ảnh bìa, quản lý nghệ sĩ/album |

## Mô hình dữ liệu dự kiến

`users` (V2) · `artists`, `albums`, `tracks`, `track_artists` (V3) · `playlists`, `playlist_tracks`, `liked_tracks`, `saved_albums`, `followed_artists`, `play_history` (V4). Chi tiết ở [docs/modules/](../modules/README.md).

## Các bước

- [x] Bước 0 — Dựng base dự án (backend, frontend, docs)
- [x] Bước 1 — Schema DB + Auth (JWT)
- [x] Bước 2 — Storage + Admin upload + Media streaming
- [x] Bước 3 — Catalog API (tracks/albums/artists/search)
- [x] Bước 4 — Playlist + Like API (kèm lưu album, follow nghệ sĩ, nghe gần đây)
- [x] Bước 5 — Frontend: auth pages, interceptor, guards
- [x] Bước 6 — Frontend: PlayerService + player bar (kèm queue, lưu phiên nghe)
- [x] Bước 7 — Frontend: Home/Search/detail, Playlist, Liked, Library, Profile, Settings, Admin (dashboard, users)

## Bước tiếp theo đề xuất

- [ ] Docker hoá (PostgreSQL + backend + frontend, volume cho `storage/`)
- [ ] Refresh token / thu hồi phiên khi đổi mật khẩu
- [ ] Tìm kiếm nhanh hơn với `pg_trgm`
- [ ] Test E2E (Playwright) cho luồng chính: đăng nhập → phát nhạc → tạo playlist

## Ngoài phạm vi (có thể làm sau)

Docker hoá, refresh token, signed URL cho media, podcast, lyrics, social/follow, gợi ý nhạc, realtime.
