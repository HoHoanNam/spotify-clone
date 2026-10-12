# ADR-0004: Frontend Angular 22 standalone + signals + Tailwind v4

- **Trạng thái**: Accepted
- **Ngày**: 2026-10-12

## Bối cảnh

Tech stack được chỉ định là Angular. Giao diện cần giống Spotify (dark theme, layout sidebar + nội dung + player bar), nên cần một cách styling linh hoạt.

## Các phương án đã cân nhắc

1. **Tailwind CSS** — linh hoạt, dễ dựng UI tùy biến giống Spotify.
2. Angular Material — nhiều component sẵn nhưng phong cách Material khó "ép" thành Spotify.
3. SCSS thuần — tự do nhưng tốn công.

## Quyết định

- **Angular 22**, chỉ dùng **standalone components** (không NgModule), **signals** cho state, control flow mới (`@if`, `@for`), lazy-load route bằng `loadComponent`.
- **Tailwind CSS v4** qua `@tailwindcss/postcss`; design token (màu Spotify) khai báo bằng `@theme` trong `src/styles.css` → dùng như `bg-base`, `text-subdued`, `bg-accent`.
- Không SSR. Test bằng Vitest (mặc định của Angular CLI 22).
- Cấu trúc `src/app/`:
  - `core/` — service singleton, interceptor, guard, model API.
  - `layout/` — khung ứng dụng (`shell`, `sidebar`, `player-bar`).
  - `features/` — các trang, mỗi trang một thư mục, lazy-loaded.
  - `shared/` — component/pipe tái sử dụng (track list, card...).
- Dev server proxy `/api` → `http://localhost:8080` (`proxy.conf.json`), nên frontend luôn gọi đường dẫn tương đối `/api` (`environment.apiUrl`) và không cần CORS khi dev.

## Hệ quả

- State player (queue, bài hiện tại, tiến độ) quản lý bằng một service dùng signals, sống suốt vòng đời app nên nhạc không dừng khi chuyển trang.
- Không dùng NgRx ở giai đoạn này; cân nhắc lại nếu state trở nên phức tạp.
