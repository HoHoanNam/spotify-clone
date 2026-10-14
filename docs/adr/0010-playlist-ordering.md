# ADR-0010: Playlist là aggregate, thứ tự lưu bằng `position` liên tục 0..n-1

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-14

## Bối cảnh

Playlist cần: thêm bài vào cuối, xoá bài, **kéo-thả để đổi thứ tự**, hiển thị "Date added". Một bài chỉ nên có một lần trong playlist (Spotify cho trùng nhưng cảnh báo; để đơn giản ta không cho trùng).

## Các phương án đã cân nhắc

1. **`@ManyToMany` + `@OrderColumn`** như `track_artists`: không có chỗ cho `added_at`; khó truy vấn theo bài.
2. **Thứ tự kiểu "rank" thưa** (1000, 2000, 1500…) hoặc chuỗi LexoRank: di chuyển một bài chỉ ghi một dòng, nhưng phức tạp và cần "cân bằng lại" định kỳ.
3. **Entity `PlaylistTrack` với `position` liên tục 0..n-1** (chọn): mỗi thay đổi đánh số lại toàn bộ trong bộ nhớ; dirty checking chỉ UPDATE các dòng thực sự đổi.

## Quyết định

- Bảng `playlist_tracks(id, playlist_id, track_id, position, added_at)`, `UNIQUE (playlist_id, track_id)`, index `(playlist_id, position)`. **Không** đặt unique trên `position`, để việc đánh số lại không vi phạm ràng buộc giữa chừng.
- `Playlist` là **aggregate root**: `@OneToMany(mappedBy, cascade = ALL, orphanRemoval = true) @OrderBy("position")`. Mọi thay đổi đi qua `Playlist.add / remove / move`, và các method này luôn gọi `renumber()`.
- API di chuyển: `POST /api/playlists/{id}/tracks/move {from, to}` (chỉ số 0-based), đúng với thao tác kéo một dòng.
- Thêm bài: bài đã có thì bỏ qua; response trả `added` để client báo "Added to X" hoặc "Already in X".
- Quyền: playlist **private** trả 404 với người khác (không lộ là nó tồn tại); playlist **public** ai đăng nhập cũng đọc được, nhưng chỉ chủ sở hữu được sửa (403).
- Ảnh playlist: ảnh riêng nếu có, không thì ghép 4 ảnh bìa đầu tiên (mosaic) như Spotify (`Playlist.coverPaths()`).

## Hệ quả

- Tích cực: code đơn giản, dễ kiểm chứng; luôn đọc được thứ tự bằng `ORDER BY position`.
- Tiêu cực: di chuyển một bài trong playlist n bài có thể UPDATE tới n dòng. Với playlist cá nhân (vài trăm bài) là chấp nhận được.
- `updated_at` của playlist không đổi khi chỉ thay đổi danh sách bài (`@UpdateTimestamp` chỉ chạy khi cột của chính bảng `playlists` đổi).
