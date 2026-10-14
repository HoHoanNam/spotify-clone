# Tổng quan kiến trúc

```
┌──────────────────────┐   /api (proxy khi dev)   ┌───────────────────────────┐
│  Angular SPA          │ ───────────────────────▶ │  Spring Boot API (:8080)   │
│  (:4200)              │   JWT Bearer token       │  Security · JPA · Flyway   │
│  layout / features    │ ◀─────────────────────── │                           │
│  <audio> ← Range req  │                          └──────┬──────────────┬─────┘
└──────────────────────┘                                  │              │
                                                    PostgreSQL     Local disk
                                                  (spotify_clone)  (storage/audio, images)
```

## Cấu trúc thư mục

```
spotify/
├─ backend/                         Spring Boot (Maven)
│  ├─ src/main/java/com/spotify/clone/
│  │  ├─ config/                    SecurityConfig, OpenApiConfig, AppProperties
│  │  ├─ common/                    exception/, web/ (PageResponse, HealthController)
│  │  ├─ auth/ user/                đăng ký/đăng nhập (JWT), tài khoản, hồ sơ công khai
│  │  ├─ storage/                   lưu file, stream audio (Range), MediaUploadService
│  │  ├─ artist/ album/ track/      catalog + Admin*Controller (CRUD)
│  │  ├─ search/                    tìm kiếm gộp 4 loại
│  │  ├─ playlist/                  playlist (aggregate) + thứ tự bài
│  │  ├─ library/                   liked tracks, saved albums, followed artists, play history
│  │  └─ admin/                     thống kê, quản lý user
│  ├─ src/main/resources/
│  │  ├─ application.yml            cấu hình chung, đọc biến môi trường
│  │  ├─ application-dev.yml        profile dev (mặc định)
│  │  └─ db/migration/              Flyway migrations
│  └─ application-local.example.yml mẫu cấu hình riêng máy
├─ frontend/                        Angular 22 + Tailwind v4
│  ├─ src/app/
│  │  ├─ core/                      models (hợp đồng API), api/, auth/, library/ (LibraryStore), util/ (loadable, PagedList)
│  │  ├─ player/                    PlayerService (một <audio> dùng chung cả app), ListPlayerService
│  │  ├─ layout/                    shell, topbar, sidebar, library-panel, player-bar, queue-panel, shortcuts-dialog
│  │  ├─ features/                  auth, home, search, section, album, artist, playlist, collection,
│  │  │                             profile, settings, admin, not-found (lazy-loaded)
│  │  └─ shared/                    track-list, track-menu, menu/ (context menu), dialog/ (modal, confirm),
│  │                                media-card, shelf, like-button, playlist-cover, infinite-scroll, pipes, toast
│  ├─ src/environments/             apiUrl theo môi trường
│  └─ proxy.conf.json               /api → localhost:8080
└─ docs/                            tài liệu, ADR, changelog
```

## Quy ước chính

- Backend: package-by-feature ([ADR-0003](../adr/0003-backend-spring-boot.md)); DTO là `record`; lỗi theo Problem Details ([ADR-0008](../adr/0008-api-conventions.md)).
- Frontend: standalone component, signals, lazy route ([ADR-0004](../adr/0004-frontend-angular-tailwind.md)).
- Frontend, tổ chức file của một component:
  - `name.ts` + `name.html` (dùng `templateUrl`) — **không viết template inline** trong `@Component`.
  - `name.css` (dùng `styleUrl`) **chỉ khi** component có CSS riêng mà Tailwind utility không diễn đạt gọn được (ví dụ `player-bar.css`: style cho thanh trượt `input[type=range]`; `track-list.css`: animation cột sóng "đang phát"). Component chỉ dùng class Tailwind thì không cần file CSS.
  - Style dùng ở nhiều component (`.field`, `.btn-primary`, `.btn-outline`, `.btn-icon`) và design token (`@theme`) đặt trong `src/styles.css`, trong `@layer components` để utility của Tailwind vẫn ghi đè được.
  - Style của component được Angular đóng gói (emulated encapsulation), kể cả tên `@keyframes`, nên không lo trùng tên giữa các component.
- Frontend, trạng thái: dữ liệu của trang tải bằng `loadable()` + `toSignal`; danh sách dài dùng `PagedList` + `appInfiniteScroll`; trạng thái dùng chung toàn app (thư viện, player, layout) nằm trong service `providedIn: 'root'` với signals.
- Tài liệu theo module: [docs/modules/](../modules/README.md).
- Schema chỉ thay đổi qua Flyway migration ([ADR-0005](../adr/0005-postgresql-flyway.md)).
