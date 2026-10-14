# Module Thư viện: Liked Songs, lưu album, follow nghệ sĩ, nghe gần đây

"Your Library" của người dùng. Quyết định thiết kế: [ADR-0011](../adr/0011-library-client-state.md).

## 1. Mô hình dữ liệu (V4)

| Bảng | Khoá chính | Ghi chú |
|---|---|---|
| `liked_tracks` | `(user_id, track_id)` | `created_at` = thời điểm like ("Date added") |
| `saved_albums` | `(user_id, album_id)` | |
| `followed_artists` | `(user_id, artist_id)` | dùng để tính `followers` của nghệ sĩ |
| `play_history` | `id` | mỗi lần nghe được tính là một dòng (append-only) |

Mọi bảng đều `ON DELETE CASCADE` theo user và theo nội dung: xoá bài hát thì nó tự biến mất khỏi Liked Songs và lịch sử.

Entity: `LikedTrack`, `SavedAlbum`, `FollowedArtist` dùng `@IdClass` (record `Key`) và có `@ManyToOne` chỉ đọc (`insertable = false, updatable = false`) tới nội dung để map ra DTO.

## 2. API

| Method | Path | Trả về |
|---|---|---|
| GET | `/api/me/library` | `{ likedTrackIds, savedAlbumIds, followedArtistIds }` |
| GET | `/api/me/tracks?page&size` | `PageResponse<{ track, addedAt }>`, like mới nhất trước |
| PUT / DELETE | `/api/me/tracks/{trackId}` | 204 |
| GET | `/api/me/albums` | `AlbumSummary[]` |
| PUT / DELETE | `/api/me/albums/{albumId}` | 204 |
| GET | `/api/me/following` | `ArtistSummary[]` |
| PUT / DELETE | `/api/me/following/{artistId}` | 204 |
| GET | `/api/me/recently-played?limit=20` | `TrackResponse[]` (không trùng, mới nhất trước, `limit` 1–50) |

- `PUT` là **idempotent** (`INSERT … ON CONFLICT DO NOTHING`), `DELETE` thứ không tồn tại vẫn trả 204.
- `PUT` với id không tồn tại → 404. Service kiểm tra trước, để không rơi vào lỗi khoá ngoại.
- Lịch sử được ghi trong `POST /api/tracks/{id}/play` (xem [catalog.md](catalog.md)). Câu truy vấn "nghe gần đây": `GROUP BY track_id ORDER BY max(played_at) DESC LIMIT n`.

## 3. Frontend

### LibraryStore (`core/library/library.store.ts`)

- Tải `/me/library`, `/me/albums`, `/me/following`, `/me/playlists` song song khi user đăng nhập (effect theo `user.id`), và xoá khi đăng xuất.
- `isLiked(id)`, `isSaved(id)`, `isFollowing(id)` đọc từ signal: **mọi** nút tim trên màn hình cập nhật cùng lúc.
- `toggleLike / toggleSaveAlbum / toggleFollow`: đổi state trước, gửi request sau, hoàn tác và hiện toast lỗi nếu thất bại.
- `likeAll(ids)`: khi thả bài vào "Liked Songs" ở sidebar.

### Giao diện

| Nơi | Thành phần |
|---|---|
| Mọi danh sách bài | `shared/like-button` (tim hiện khi hover; luôn hiện và màu xanh nếu đã like) |
| Player bar | tim cạnh tên bài đang phát; phím tắt **L** |
| Album | nút ⊕ / ✓ "Save to Your Library" |
| Nghệ sĩ | nút "Follow / Following"; số follower được điều chỉnh tại chỗ ngay sau khi bấm |
| Sidebar / `/collection` | `layout/library-panel`: Liked Songs ghim trên cùng, playlist, album đã lưu, nghệ sĩ đã follow; chip lọc Playlists / Albums / Artists; ô tìm trong thư viện; biểu tượng loa ở mục đang phát; thả bài vào playlist hoặc Liked Songs |
| `/collection/tracks` | `features/collection/liked-songs`: header gradient tím, cột "Date added", cuộn vô hạn. Bỏ like thì dòng biến mất ngay |
| Home | lưới truy cập nhanh và hàng "Recently played" |

`/collection` là trang "Your Library" toàn màn hình cho điện thoại (sidebar bị ẩn dưới breakpoint `md`), mở từ thanh tab dưới cùng.

## 4. Test

`LibraryControllerTest`: like idempotent và xuất hiện trong `/me/library` và `/me/tracks`; like bài không tồn tại → 404; follow làm tăng `followers`; "recently played" không trùng và đúng thứ tự.

## 5. Hạn chế đã biết

- Hai tab trình duyệt không tự đồng bộ trạng thái like cho tới khi tải lại.
- `play_history` không bị dọn; cần job xoá bản ghi cũ khi dữ liệu lớn.
- Chưa sắp xếp thư viện theo "Recents / Alphabetical" như Spotify; playlist xếp theo ngày tạo.
