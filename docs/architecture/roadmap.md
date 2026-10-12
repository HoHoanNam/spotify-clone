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

`users`, `artists`, `albums`, `tracks`, `playlists`, `playlist_tracks`, `liked_tracks` — chi tiết sẽ được chốt trong migration và ADR khi triển khai.

## Các bước

- [x] Bước 0 — Dựng base dự án (backend, frontend, docs)
- [ ] Bước 1 — Schema DB + Auth (JWT)
- [ ] Bước 2 — Storage + Admin upload + Media streaming
- [ ] Bước 3 — Catalog API (tracks/albums/artists/search)
- [ ] Bước 4 — Playlist + Like API
- [ ] Bước 5 — Frontend: auth pages, interceptor, guards
- [ ] Bước 6 — Frontend: PlayerService + player bar
- [ ] Bước 7 — Frontend: Home/Search/detail, Playlist, Liked, Admin

## Ngoài phạm vi (có thể làm sau)

Docker hoá, refresh token, signed URL cho media, podcast, lyrics, social/follow, gợi ý nhạc, realtime.
