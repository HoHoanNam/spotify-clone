# Tài liệu dự án Spotify Clone

Thư mục này lưu lại **các quyết định kiến trúc** và **các thay đổi quan trọng** trong quá trình phát triển, để người mới (hoặc chính chúng ta sau vài tháng) hiểu được *vì sao* hệ thống trông như hiện tại.

| Tài liệu | Nội dung |
|---|---|
| [architecture/overview.md](architecture/overview.md) | Tổng quan kiến trúc, cấu trúc thư mục, quy ước code |
| [architecture/roadmap.md](architecture/roadmap.md) | Phạm vi core feature và lộ trình triển khai |
| [architecture/auth-flow.md](architecture/auth-flow.md) | Luồng thực thi Auth: khởi động, đăng ký, đăng nhập, request có token, xử lý lỗi |
| [development/setup.md](development/setup.md) | Hướng dẫn cài đặt và chạy dự án local |
| [adr/](adr/README.md) | Architecture Decision Records — mỗi quyết định kiến trúc một file |
| [CHANGELOG.md](CHANGELOG.md) | Nhật ký các thay đổi quan trọng theo thời gian |

## Khi nào cần cập nhật tài liệu?

- **Tạo ADR mới** khi đưa ra một quyết định khó đảo ngược hoặc ảnh hưởng nhiều module: chọn thư viện/công nghệ, thay đổi cách xác thực, thay đổi mô hình dữ liệu cốt lõi, cách lưu trữ file, cách deploy...
- **Ghi CHANGELOG** khi hoàn thành một feature, thay đổi API/schema, hoặc có breaking change.
- **Cập nhật overview/setup** khi cấu trúc thư mục, biến môi trường hoặc cách chạy dự án thay đổi.

ADR đã `Accepted` thì **không sửa nội dung quyết định**; nếu đổi ý, tạo ADR mới với trạng thái `Supersedes ADR-xxxx` và đánh dấu ADR cũ là `Superseded by ADR-yyyy`.
