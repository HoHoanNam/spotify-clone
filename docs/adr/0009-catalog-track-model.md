# ADR-0009: Mô hình bài hát: nhiều nghệ sĩ có thứ tự, duration đọc ở backend, ảnh bìa fallback về album

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-13

## Bối cảnh

Một bài hát thường có nghệ sĩ chính và nghệ sĩ hợp tác ("A, B"); thứ tự hiển thị có ý nghĩa. Thời lượng bài phải chính xác để hiển thị và tính tổng thời lượng album/playlist. Không phải bài nào cũng có ảnh riêng: single thường có ảnh riêng, còn bài trong album dùng ảnh album.

## Các phương án đã cân nhắc

1. **Một cột `artist_id` trên `tracks`**: đơn giản nhưng không biểu diễn được bài có nhiều nghệ sĩ.
2. **Bảng nối `track_artists` không có thứ tự**: thứ tự hiển thị bị phụ thuộc vào thứ tự đọc từ DB.
3. **Bảng nối có cột `position`** (chọn): `@ManyToMany` + `@OrderColumn(name = "position")`.
4. Client tự gửi duration: dễ sai hoặc bị giả mạo.

## Quyết định

- `track_artists(track_id, artist_id, position)`, khoá chính `(track_id, position)` khớp với cách Hibernate quản lý `@OrderColumn`; `position = 0` là nghệ sĩ chính.
- `UNIQUE (track_id, artist_id) DEFERRABLE INITIALLY DEFERRED`: chặn một nghệ sĩ bị thêm hai lần. Dạng *deferred* vì khi đổi thứ tự, Hibernate ghi lại `artist_id` từng dòng nên giữa transaction có lúc trùng tạm thời; ràng buộc được kiểm tra lúc commit.
- Album chỉ có **một** nghệ sĩ chính (`albums.artist_id`).
- **Duration do backend đọc** bằng jaudiotagger khi upload. Nếu không đọc được file, request trả 400, nên file giả đổi đuôi `.mp3` cũng bị chặn luôn.
- `tracks.cover_path` không bắt buộc; `Track.effectiveCoverPath()` trả ảnh riêng hoặc ảnh album.
- Trang nghệ sĩ có thêm mục **"Appears on"**: bài có nghệ sĩ đó ở `position > 0` (JPQL `index(a) > 0`).

## Hệ quả

- Tích cực: hiển thị "A, B" đúng thứ tự; tìm được mọi bài có một nghệ sĩ (kể cả bài hợp tác); duration đáng tin.
- Tiêu cực: mỗi bài cần thêm query nạp nghệ sĩ. Đã giảm N+1 bằng `hibernate.default_batch_fetch_size: 50`.
- Không xoá được nghệ sĩ còn album/bài hát (FK RESTRICT → 409), admin phải xoá hoặc chuyển nội dung trước.
