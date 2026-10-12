# ADR-0006: Xác thực stateless bằng JWT

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Bối cảnh

Frontend là SPA tách rời backend. Cần đăng ký/đăng nhập và phân quyền 2 vai trò: `USER` và `ADMIN` (admin upload nhạc).

## Quyết định

- Spring Security **stateless** (không session, tắt CSRF/form login/http basic).
- Đăng nhập trả về **JWT access token** (HMAC-SHA256, thư viện jjwt), TTL mặc định 24h (`app.jwt.access-token-ttl`), secret cấu hình qua `JWT_SECRET`.
- Frontend lưu token, gắn header `Authorization: Bearer <token>` bằng HTTP interceptor; nhận 401 thì đăng xuất.
- Phân quyền: `/api/admin/**` yêu cầu `ROLE_ADMIN`; `@EnableMethodSecurity` cho kiểm tra chi tiết (ví dụ chủ sở hữu playlist).
- Mật khẩu băm bằng BCrypt.
- Endpoint công khai: `/api/auth/**`, `/api/media/**` (xem ADR-0007), `/api/health`, Swagger.

## Hệ quả

- Đơn giản, không cần lưu session phía server.
- Chưa có refresh token và không thu hồi được token trước khi hết hạn — chấp nhận ở giai đoạn đầu; bổ sung refresh token sau (ADR mới).
