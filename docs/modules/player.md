# Module Player

Chỉ có ở frontend. Một `PlayerService` duy nhất bọc một thẻ `HTMLAudioElement` và sống suốt vòng đời app, nên nhạc không bị ngắt khi chuyển trang. Audio được stream từ `/api/media/audio/{id}` qua HTTP Range ([ADR-0007](../adr/0007-local-file-storage-streaming.md)).

## 1. Trạng thái

```
context (album / playlist / …)     _queue  [t0 t1 t2 t3]   _order [0 1 2 3] hoặc [2 0 3 1] khi shuffle
                                                                 ▲ _position
manual queue ("Add to queue")      _manual [q0 q1]          phát trước phần còn lại của context
current = _fromManual ?? _queue[_order[_position]]
```

- **Context**: danh sách vừa bấm phát, kèm `PlayContext { label, link }` để panel Queue hiện "Next from: <tên>" và sidebar hiện biểu tượng loa ở đúng mục.
- **Manual queue**: menu bài hát → "Add to queue". `next()` lấy bài manual trước; khi một bài manual đang phát, `_position` của context được giữ nguyên, nên hết bài manual thì phát tiếp bài kế của context. `previous()` khi đang phát bài manual sẽ quay về bài context trước đó.
- Thêm vào queue khi chưa phát gì thì phát luôn.

## 2. Điều khiển

| Hành động | Hành vi |
|---|---|
| Previous | sau 3 giây đầu: tua về 0; nếu không thì về bài trước |
| Shuffle | giữ bài đang phát ở đầu, xáo trộn phần còn lại; tắt shuffle thì quay về thứ tự gốc tại đúng bài đang phát |
| Repeat | off → all → one |
| Volume | lưu ở `localStorage` |
| Media Session | phím media của hệ điều hành / màn hình khoá |

## 3. Lưu & khôi phục phiên nghe

- `persist()` ghi `{ owner, queue, order, position, manual, context, shuffle, repeat, time }` vào `localStorage` (`spotify-clone.player`) khi:
  - trạng thái hàng đợi thay đổi (qua effect);
  - player tạm dừng;
  - mỗi 5 giây khi đang phát;
  - trước khi đóng trang (`beforeunload`).
- `Shell` gọi `restore(userId)` sau khi đăng nhập: nạp lại hàng đợi, **tạm dừng** đúng ở giây đã nghe (tua khi `loadedmetadata`), giống Spotify. Trạng thái của user khác trên cùng trình duyệt bị bỏ qua.
- Đăng xuất làm `Shell` bị huỷ, kéo theo `reset()`: dừng nhạc và xoá state trong bộ nhớ. Bản đã lưu được giữ lại cho lần đăng nhập sau của chính user đó.

## 4. Đếm lượt nghe

Một lượt nghe được tính **một lần** khi bài phát qua 30 giây, hoặc khi phát hết (với bài ngắn hơn 30 giây). Lúc đó player gọi `POST /api/tracks/{id}/play`, để vừa tăng `play_count` vừa ghi "Recently played". Lượt nghe không được đếm ở endpoint stream, vì một lần nghe tạo ra nhiều request Range.

## 5. Giao diện

| Thành phần | Nội dung |
|---|---|
| `layout/player-bar` | ảnh, tên (link tới album), nghệ sĩ, tim; shuffle / prev / play / next / repeat; thanh tua; nút Queue; âm lượng |
| `layout/queue-panel` | cột phải: "Now playing", "Next in queue" (xoá từng bài, "Clear queue", bấm để nhảy tới), "Next from: …" (bấm để nhảy tới) |
| `player/list-player.service` | nút play trên card: tải album / nghệ sĩ / playlist rồi phát; bấm lại để tạm dừng |

Phím tắt: xem [frontend-ui.md](frontend-ui.md#4-phím-tắt).

## 6. Test

`player.service.spec.ts` (Vitest, `FakeAudio` thay `HTMLAudioElement`): chuyển bài, repeat, previous, shuffle, đếm lượt nghe một lần, toggle cùng danh sách, manual queue phát trước rồi tiếp context, previous từ bài manual, queue khi chưa phát gì, nhảy trong queue, khôi phục phiên theo đúng user.
