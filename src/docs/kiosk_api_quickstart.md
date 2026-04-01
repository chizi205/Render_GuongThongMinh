# Kiosk API Quickstart

## 1) Login

POST /api/kiosk/auth/login
Body:

```json
{ "username": "KIOSK_CORNER_01", "password": "123456" }
```

## 2) Get categories for this kiosk

GET /api/kiosk/me/categories
Header:
Authorization: Bearer <access_token>

## 3) Get products by category

GET /api/kiosk/me/products?category_id=<uuid>
Header:
Authorization: Bearer <access_token>

## 4) Refresh access token

POST /api/kiosk/auth/refresh
Body:

```json
{ "refresh_token": "<refresh_token_from_login>" }
```

## 5) Upload ảnh body khi nhấn chụp ảnh

POST /api/kiosk/tryon/body
Body:

```json
{ "kiosk_id": "", "kiosk_account_id": "" }
```

Authorization: Bearer <access_token>
Content-Type: multipart/form-data
Tên ảnh đặt là bodyImage

## 6) Tạo ảnh

POST /api/kiosk/tryon/process

```json
{
  "kiosk_id": "",
  "kiosk_account_id": "",
  "body_image_id": "",
  "product_id": "",
  "variant_id": ""
}
```
Authorization: Bearer <access_token>
Content-Type: application/json