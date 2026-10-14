# Module Admin

Trang `/admin` (chỉ `ROLE_ADMIN`) để quản lý kho nhạc và tài khoản. Backend chặn `/api/admin/**` trong `SecurityConfig`; `adminGuard` ở frontend chỉ ẩn giao diện, không phải lớp bảo vệ.

## 1. API

### Catalog (multipart/form-data)

| Method | Path | Field | Ghi chú |
|---|---|---|---|
| POST / PUT | `/api/admin/artists[/{id}]` | `name`, `bio?`, `image?`, `removeImage?` (PUT) | |
| DELETE | `/api/admin/artists/{id}` | — | 409 nếu nghệ sĩ còn album hoặc bài hát |
| POST / PUT | `/api/admin/albums[/{id}]` | `title`, `artistId`, `releaseDate?` (yyyy-MM-dd), `cover?`, `removeCover?` (PUT) | |
| DELETE | `/api/admin/albums/{id}` | — | các bài trong album thành single |
| POST | `/api/admin/tracks` | `title`, `artistIds` (lặp, theo thứ tự), `albumId?`, `trackNumber?`, `audio`, `cover?` | duration đọc từ file |
| PUT | `/api/admin/tracks/{id}` | như POST, `audio?` và `cover?` không bắt buộc, `removeCover?` | |
| DELETE | `/api/admin/tracks/{id}` | — | xoá file audio và ảnh sau khi commit |

Khi PUT: metadata được thay toàn bộ; file chỉ bị thay khi có gửi file mới; `remove…=true` thì xoá ảnh hiện tại.

### Người dùng & thống kê

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/api/admin/stats` | — | `{ users, artists, albums, tracks, playlists, totalPlays, topTracks }` |
| GET | `/api/admin/users?q&page&size` | — | `PageResponse<AdminUserView>`; `q` khớp tên hoặc email |
| PATCH | `/api/admin/users/{id}` | JSON `{ role?, enabled? }` | `AdminUserView` |

- Admin **không** đổi được role/trạng thái của chính mình (400), nên không thể vô tình khoá hết admin.
- Khoá tài khoản có hiệu lực **ngay ở request kế tiếp**: `JwtAuthenticationFilter` nạp lại user từ DB mỗi request và bỏ qua user `enabled = false`, nên token cũ cũng không dùng được nữa.

## 2. Frontend (`features/admin/`)

| Tab | Component | Nội dung |
|---|---|---|
| Dashboard | `admin-dashboard` | 6 thẻ số liệu + bảng "Most played" (phát được ngay) |
| Tracks | `admin-tracks` | Form upload / sửa (chọn nhiều nghệ sĩ có thứ tự, chip đầu là "main"); danh sách có ô lọc theo tên |
| Albums | `admin-albums` | Form tạo / sửa (ảnh bìa, ngày phát hành, xoá ảnh); danh sách có ô lọc |
| Artists | `admin-artists` | Form tạo / sửa (tiểu sử được nạp từ trang nghệ sĩ khi bấm sửa); danh sách có ô lọc |
| Users | `admin-users` | Bảng user: tìm kiếm, đổi role bằng select, bật/tắt tài khoản (có xác nhận); "Load more" |

- Ba form dùng chung thang khoảng cách: `gap-5` giữa các field, `mb-2` giữa nhãn và control, `gap-3` ở footer.
- Upload hiển thị % tiến trình (`withProgress` + `reportProgress`).
- Xoá dùng `ConfirmService` (dialog kiểu Spotify) thay cho `window.confirm`.

## 3. Test

- `AdminTrackControllerTest`, `AdminCatalogUpdateTest`: upload, sửa, đổi thứ tự nghệ sĩ, sửa album/nghệ sĩ.
- `AdminControllerTest`: khoá và nâng quyền user khác; không tự sửa chính mình; tìm user; thống kê; USER bị 403.

## 4. Hạn chế đã biết

- Danh sách trong form admin chỉ lấy 50 nghệ sĩ/album đầu (theo tên). Khi kho lớn cần thay `<select>` bằng ô tìm kiếm có gợi ý.
- Chưa có audit log ai đã sửa gì.
