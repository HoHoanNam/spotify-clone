# Cài đặt & chạy local

## Yêu cầu

| Công cụ | Phiên bản đã dùng |
|---|---|
| JDK | 21 (Temurin) |
| Maven | 3.9+ (hoặc dùng `./mvnw`) |
| Node.js | 24 (npm 11) |
| PostgreSQL | 18 (cài trực tiếp trên máy) |

## 1. Database

Tạo database (bằng pgAdmin hoặc psql):

```sql
CREATE DATABASE spotify_clone;
```

## 2. Backend

```bash
cd backend
cp application-local.example.yml application-local.yml   # rồi điền mật khẩu PostgreSQL của bạn
./mvnw spring-boot:run        # Windows: mvnw.cmd spring-boot:run
```

- Health check: http://localhost:8080/api/health
- Swagger UI: http://localhost:8080/swagger-ui.html

Có thể thay file local bằng biến môi trường:

| Biến | Mặc định | Ý nghĩa |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/spotify_clone` | JDBC URL |
| `DB_USERNAME` / `DB_PASSWORD` | `postgres` / `postgres` | Tài khoản DB |
| `SERVER_PORT` | `8080` | Cổng API |
| `STORAGE_ROOT` | `./storage` | Thư mục lưu audio/ảnh |
| `CORS_ALLOWED_ORIGINS` | `http://localhost:4200` | Origin được phép |
| `JWT_SECRET` | (giá trị dev) | Khoá HMAC Base64 ≥ 256 bit — **bắt buộc đổi ngoài dev** |
| `JWT_ACCESS_TTL` | `24h` | Thời hạn access token |

## 3. Frontend

```bash
cd frontend
npm install
npm start                     # http://localhost:4200, /api được proxy sang :8080
```

## Kiểm tra

```bash
cd backend && ./mvnw test     # cần DB đang chạy
cd frontend && npx ng test --watch=false && npx ng build
```
