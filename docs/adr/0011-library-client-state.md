# ADR-0011: Thư viện người dùng: bảng nối idempotent + tập id giữ ở client, cập nhật lạc quan

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-14

## Bối cảnh

Nút tim (Liked Songs), nút lưu album và nút Follow nghệ sĩ xuất hiện trên **mọi** danh sách bài hát, trang album/nghệ sĩ và player bar. Mỗi nút cần biết trạng thái hiện tại và phải phản hồi ngay khi bấm.

## Các phương án đã cân nhắc

1. **Backend trả `liked: boolean` trong từng `TrackResponse`**: phải truyền user vào mọi query catalog; cache khó; trạng thái cũ khi cùng bài xuất hiện ở hai nơi trên màn hình.
2. **Endpoint "contains" theo lô** (`GET /me/tracks/contains?ids=…`) như Spotify Web API: mỗi trang thêm một request, code client phức tạp hơn.
3. **Tải một lần toàn bộ id đã like / lưu / follow** (chọn): `GET /api/me/library` → `{ likedTrackIds, savedAlbumIds, followedArtistIds }`, giữ trong `LibraryStore` (signals).

## Quyết định

- Backend: ba bảng nối `liked_tracks`, `saved_albums`, `followed_artists` với khoá chính `(user_id, …_id)`. Thêm bằng `INSERT … ON CONFLICT DO NOTHING`, xoá bằng `DELETE`, nên **idempotent**: `PUT` hai lần chỉ tạo một dòng, `DELETE` thứ không tồn tại vẫn 204. Double click hay request bị gửi lại không bao giờ báo lỗi.
- API theo kiểu Spotify Web API: `PUT/DELETE /api/me/tracks/{id}`, `/api/me/albums/{id}`, `/api/me/following/{artistId}`.
- Frontend: `LibraryStore` tải dữ liệu khi user đăng nhập và xoá khi đăng xuất. Mỗi lần bấm sẽ **cập nhật UI trước**, gửi request sau, và **hoàn tác + báo lỗi** nếu request thất bại (optimistic update).
- Lịch sử nghe (`play_history`) là bảng append-only; "Recently played" lấy các bài khác nhau theo `max(played_at)`.

## Hệ quả

- Tích cực: mọi nút tim trên màn hình đồng bộ ngay lập tức; catalog API vẫn không phụ thuộc user (dễ cache về sau).
- Tiêu cực: payload `/me/library` lớn dần theo số lượng like (vài nghìn id ≈ vài chục KB, chấp nhận được). Hai tab trình duyệt không tự đồng bộ cho đến khi tải lại.
- `play_history` tăng không giới hạn; khi cần thì thêm job dọn bản ghi cũ hoặc giới hạn N bản ghi mỗi user.
