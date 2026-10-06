# 後端服務（Cloudflare Worker）：照片 + AI 教練

- **照片**：網頁把照片傳給 Worker，Worker 驗證 Firebase 登入憑證後存進 R2。
- **AI 教練**：網頁把近況摘要與對話傳給 Worker，Worker 透過 OpenRouter 呼叫模型產生建議。

金鑰只存在 Cloudflare，不會出現在網頁程式碼裡。

## 一次性設定

需要一個 Cloudflare 帳號（免費方案即可，R2 免費 10GB、無流量費）。

1. 在電腦上安裝 Node.js 後，於這個資料夾執行：

   ```bash
   cd cloudflare/photo-worker
   npm install
   npx wrangler login                          # 開啟瀏覽器登入 Cloudflare
   npx wrangler r2 bucket create fitness-photos
   npx wrangler secret put OPENROUTER_API_KEY  # 貼上 OpenRouter 金鑰（AI 教練用，可之後再設）
   npx wrangler deploy
   ```

   第一次使用 R2 時，Cloudflare 會要求在後台啟用 R2（免費方案也需要填付款資料，但 10GB 內不收費）。

2. `deploy` 完成後會顯示網址，例如 `https://fitness-photos.<你的帳號>.workers.dev`。

3. 到 GitHub 專案 **Settings → Secrets and variables → Actions → Variables**，
   新增變數 `PHOTO_API_URL`，值填上一步的網址（結尾不要加 `/`）。

4. 重新部署網站（推送到 `main` 或在 Actions 重新執行部署）。

OpenRouter 金鑰到 https://openrouter.ai/keys 申請。預設使用免費模型 `nvidia/nemotron-3-ultra-550b-a55b:free`，
免費模型有每日次數限制，且部分免費模型需要在 OpenRouter 的 Privacy 設定允許資料被供應商使用才能呼叫。模型與每人每天問答次數在 `wrangler.toml` 的 `COACH_MODEL`、`COACH_DAILY_LIMIT` 調整。

沒有設定 `PHOTO_API_URL` 時，AI 教練對話不會出現（訓練頁的加重量建議不受影響）；，照片會壓縮後存在 Firestore（總共約十幾張就會到 1MB 上限）。

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
| POST | `/coach` | AI 教練，body `{ messages, context }`，需登入，回傳 `{ reply }`；每人每天有次數上限 |
