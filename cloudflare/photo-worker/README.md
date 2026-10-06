# 照片上傳服務（Cloudflare R2 + Worker）

網頁把照片傳給這個 Worker，Worker 先驗證 Firebase 登入憑證，再存進 R2。
R2 的金鑰只存在 Cloudflare，不會出現在網頁程式碼裡。

## 一次性設定

需要一個 Cloudflare 帳號（免費方案即可，R2 免費 10GB、無流量費）。

1. 在電腦上安裝 Node.js 後，於這個資料夾執行：

   ```bash
   cd cloudflare/photo-worker
   npx wrangler login                          # 開啟瀏覽器登入 Cloudflare
   npx wrangler r2 bucket create fitness-photos
   npx wrangler deploy
   ```

   第一次使用 R2 時，Cloudflare 會要求在後台啟用 R2（免費方案也需要填付款資料，但 10GB 內不收費）。

2. `deploy` 完成後會顯示網址，例如 `https://fitness-photos.<你的帳號>.workers.dev`。

3. 到 GitHub 專案 **Settings → Secrets and variables → Actions → Variables**，
   新增變數 `PHOTO_API_URL`，值填上一步的網址（結尾不要加 `/`）。

4. 重新部署網站（推送到 `main` 或在 Actions 重新執行部署）。

沒有設定 `PHOTO_API_URL` 時，照片會壓縮後存在 Firestore（總共約十幾張就會到 1MB 上限）。

## 本機開發

建立專案根目錄的 `.env.local`：

```
VITE_PHOTO_API_URL=https://fitness-photos.<你的帳號>.workers.dev
```

## API

| 方法 | 路徑 | 說明 |
|------|------|------|
| POST | `/upload` | 上傳圖片（JPEG/PNG/WebP，≤5MB），需 `Authorization: Bearer <Firebase ID token>`，回傳 `{ url }` |
| GET | `/photos/<key>` | 讀取圖片；網址含隨機 ID，無法被猜到 |
| DELETE | `/photos/<key>` | 刪除圖片，只能刪除自己的 |
