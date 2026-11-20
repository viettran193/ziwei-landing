# Tử Vi Thiên Kỷ — Landing Page

Landing page chính thức giới thiệu bot Telegram **Tử Vi Thiên Kỷ** ([@TuViThienKy_bot](https://t.me/TuViThienKy_bot)).

## Chạy thử nghiệm / Development

Yêu cầu Node.js >= 18:

```bash
node server.mjs
```
Server chạy mặc định tại cổng `8088` (`http://localhost:8088`).

## Triển khai Production

- **Môi trường:** Đang chạy production dưới systemd service (`ziwei-landing.service`) trên VPS Oracle Cloud.
- **Reverse Proxy:** HTTPS qua Caddy service (`caddy.service`).
- **Domain dự kiến:** `https://tuvi.vietthy.click` (proxy tới `127.0.0.1:8088`).

## Cấu trúc thư mục

- `index.html`: Giao diện landing page đơn trang, tối ưu SEO/Open Graph.
- `server.mjs`: Node.js HTTP server tĩnh phục vụ landing page và ghi access log.
- `assets/`: Hình ảnh giao diện (`hero.webp`, `logo.webp`, `sample-chart.png`).
- `Caddyfile`: Cấu hình reverse proxy Caddy HTTPS.
