# Module Tài khoản & hồ sơ

Người dùng tự quản lý tài khoản của mình: tên hiển thị, ảnh đại diện, mật khẩu. Ngoài ra mỗi người có một trang hồ sơ công khai. Đăng ký và đăng nhập: [auth-flow.md](../architecture/auth-flow.md).

## 1. API

| Method | Path | Body | Trả về |
|---|---|---|---|
| GET | `/api/me` | — | `UserResponse` (có email, role) |
| PATCH | `/api/me` | JSON `{ username }` | `UserResponse` |
| PUT | `/api/me/avatar` | multipart `avatar` (jpg/png/webp) | `UserResponse` |
| DELETE | `/api/me/avatar` | — | `UserResponse` |
| PUT | `/api/me/password` | JSON `{ currentPassword, newPassword }` (8–72 ký tự) | 204 |
| GET | `/api/users/{id}` | — | `UserProfile { id, username, avatarUrl, playlists }` |

- Sai mật khẩu hiện tại → **400**, cố ý không dùng 401: client coi mọi 401 là "phiên hết hạn" và sẽ tự đăng xuất.
- Đổi mật khẩu **không** vô hiệu hoá token cũ (JWT stateless, [ADR-0006](../adr/0006-stateless-jwt-auth.md)); token cũ hết hạn theo `app.jwt.access-token-ttl`.
- Ảnh đại diện lưu ở `images/avatars/`; ảnh cũ bị xoá sau khi commit (`MediaUploadService`).
- `/api/users/{id}` chỉ trả **playlist public**, không có email; user bị khoá → 404.

## 2. Frontend

| Route | Component | Nội dung |
|---|---|---|
| `/settings` | `features/settings/settings-page` | Ảnh đại diện (hover → "Choose photo", nút "Remove photo"), tên hiển thị, đổi mật khẩu (kiểm tra độ dài và "nhập lại" khớp nhau) |
| `/user/:id` | `features/profile/profile-page` | Ảnh tròn, tên, số playlist public; nếu là chính mình: nút "Edit profile" và mục "Following" (chỉ mình thấy) |

- `AccountService` gọi API rồi cập nhật `AuthService.setUser(user)`, nên avatar và tên ở top bar đổi ngay.
- Menu tài khoản ở top bar: Profile, Settings, Keyboard shortcuts, Admin (nếu là admin), Log out.

## 3. Test

`UserControllerTest`: đổi mật khẩu sai → 400, đúng → 204 và đăng nhập được bằng mật khẩu mới; đổi tên (có `strip`); upload avatar rỗng → 400; hồ sơ công khai không có email và chỉ có playlist public.

## 4. Hạn chế đã biết

- Chưa đổi được email và chưa có "quên mật khẩu" (cần gửi mail).
- Chưa thu hồi được phiên đăng nhập khác khi đổi mật khẩu (cần refresh token / token version).
