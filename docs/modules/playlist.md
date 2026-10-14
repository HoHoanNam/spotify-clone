# Module Playlist

Người dùng tạo playlist, thêm/xoá/sắp xếp bài, đổi tên, mô tả, ảnh và chế độ public/private. Quyết định thiết kế: [ADR-0010](../adr/0010-playlist-ordering.md).

## 1. Mô hình dữ liệu (V4)

```
users 1 ── n playlists 1 ── n playlist_tracks n ── 1 tracks
```

| Bảng | Cột chính | Ghi chú |
|---|---|---|
| `playlists` | `owner_id`, `name` (≤100), `description` (≤300), `cover_path`, `is_public` | xoá user → xoá playlist (CASCADE) |
| `playlist_tracks` | `playlist_id`, `track_id`, `position`, `added_at` | `UNIQUE (playlist_id, track_id)`; xoá bài hát → tự rời mọi playlist |

## 2. API

| Method | Path | Body | Trả về | Quyền |
|---|---|---|---|---|
| GET | `/api/me/playlists` | — | `PlaylistSummary[]` (của tôi, mới nhất trước) | đăng nhập |
| GET | `/api/playlists?q&page&size` | — | `PageResponse<PlaylistSummary>` (chỉ public) | đăng nhập |
| POST | `/api/playlists` | JSON `{ name?, description?, trackIds? }` | 201 `PlaylistSummary` | đăng nhập |
| GET | `/api/playlists/{id}` | — | `PlaylistDetail` | chủ sở hữu, hoặc bất kỳ ai nếu public |
| PUT | `/api/playlists/{id}` | multipart `name, description?, isPublic?, cover?, removeCover?` | `PlaylistSummary` | chủ sở hữu |
| DELETE | `/api/playlists/{id}` | — | 204 | chủ sở hữu |
| POST | `/api/playlists/{id}/tracks` | JSON `{ trackIds: [...] }` (≤200) | `{ added, playlist }` | chủ sở hữu |
| DELETE | `/api/playlists/{id}/tracks/{trackId}` | — | 204 | chủ sở hữu |
| POST | `/api/playlists/{id}/tracks/move` | JSON `{ from, to }` (0-based) | 204 | chủ sở hữu |

- `name` để trống → "My Playlist #n" (n = số playlist hiện có + 1), giống nút "+" của Spotify.
- `trackIds` khi tạo cho phép "Add to playlist → New playlist" chỉ cần **một** request.
- Bài đã có trong playlist bị bỏ qua; `added = 0` nghĩa là "Already in …".
- `images`: `[cover]` nếu có ảnh riêng; nếu không, tối đa 4 ảnh bìa khác nhau của các bài đầu tiên; `[]` khi playlist rỗng.
- Mã lỗi: playlist private của người khác → **404** (không lộ là nó tồn tại); sửa playlist public của người khác → **403**; `move` ngoài phạm vi hoặc `trackId` không tồn tại → **400**.

## 3. Backend

```
PlaylistController ─▶ PlaylistService ─▶ Playlist (aggregate) ─▶ PlaylistTrack
                          │                   add / remove / move → renumber()
                          ├─ findVisible(id, userId)   404 nếu private và không phải chủ
                          └─ findOwned(id, userId)     403 nếu không phải chủ
```

- `Playlist.entries` là `@OneToMany(cascade = ALL, orphanRemoval = true) @OrderBy("position")`. Xoá một entry khỏi list sẽ DELETE dòng tương ứng; `renumber()` đặt lại `position` 0..n-1, dirty checking chỉ UPDATE các dòng đã đổi.
- Thứ tự các bài trong `trackIds` được giữ nguyên (`findAllById` không đảm bảo thứ tự, nên service dựng lại thứ tự từ danh sách id).
- Ảnh bìa đi qua `MediaUploadService`, giống admin: ảnh mới bị xoá nếu transaction rollback, ảnh cũ chỉ bị xoá sau khi commit ([storage-flow.md](../architecture/storage-flow.md)). Thư mục: `images/playlists/`.

## 4. Frontend

| Thành phần | Vai trò |
|---|---|
| `features/playlist/playlist-page` | Trang `/playlist/:id` |
| `features/playlist/playlist-edit-dialog` | Dialog "Edit details": ảnh (chọn/xoá, xem trước), tên, mô tả, Public |
| `core/api/playlist.service` | HTTP |
| `core/library/library.store` | Danh sách playlist của tôi (sidebar), `createPlaylist`, `addToPlaylist`, `upsertPlaylist` |

Trên trang playlist, **chủ sở hữu** có thể:

- Bấm vào ảnh hoặc tên để mở "Edit details".
- **Kéo-thả** dòng để sắp xếp lại. Thứ tự đổi ngay trên UI, sau đó mới gọi `move`; nếu lỗi thì tải lại playlist.
- Xoá bài bằng menu "…" → "Remove from this playlist".
- Tìm và thêm bài ở cuối trang ("Let's find something for your playlist"). Ô này tự mở khi playlist rỗng, và kết quả bỏ qua các bài đã có.
- Menu "…" ở header: Add to queue, Add to playlist, Edit details, Make public/private, Delete (có dialog xác nhận).

Người khác chỉ xem và phát được. Có ba cách thêm bài vào playlist:

1. Menu bài hát → "Add to playlist" → chọn playlist hoặc "New playlist".
2. **Kéo một dòng bài hát thả vào playlist ở sidebar** "Your Library".
3. Ô tìm kiếm ở cuối trang playlist.

## 5. Test

`PlaylistControllerTest`: tên mặc định và bài ban đầu; thêm bỏ qua trùng, move, remove, tổng thời lượng; private bị ẩn (404) với người khác, public chỉ đọc (403); `trackId` lạ và `move` sai phạm vi → 400.

## 6. Hạn chế đã biết

- Không cho một bài xuất hiện hai lần trong cùng playlist.
- Không có playlist cộng tác (nhiều người cùng sửa) và không có "follow" playlist của người khác.
- Hai tab cùng sửa một playlist: tab sau ghi đè thứ tự theo chỉ số của nó; tải lại để thấy bản mới nhất.
