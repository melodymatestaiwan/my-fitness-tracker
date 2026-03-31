# UI 介面完整清單 - 個人健身追蹤器

> 本文件列出所有現有頁面的按鍵、表單元件、互動功能，供 UI 工程師重寫 UI 時參考。

---

## 全域導航列 (所有頁面共用)

| 元件 | 類型 | 說明 |
|------|------|------|
| 數據追蹤 | 導航連結 | → `index.html` |
| 今日課表 | 導航連結 | → `workout.html` |
| 飲食紀錄 | 導航連結 | → `diet.html` |
| 間歇性斷食 | 導航連結 | → `fasting.html` |
| 分享與成果 | 導航連結 | → `share.html` |

> **注意**: `workout.html` 和 `share.html` 的導航列少了部分連結（workout 少了 fasting 和 share；share 少了 fasting），建議重寫時統一為完整 5 頁導航。

---

## 頁面一：數據追蹤 (`index.html`)

### 資訊顯示區

| 區塊 | 元件 ID / 說明 | 功能 |
|------|---------------|------|
| 100天挑戰倒數 | `#countdown-container` | 顯示進度條、當前體重、減脂進度、挑戰天數 |
| 當前體重卡片 | `#dash-weight` | 顯示最新體重 + 近7日變動趨勢（綠色=下降，紅色=上升） |
| BMI 指數卡片 | `#dash-bmi` | 計算並顯示 BMI 值 + 狀態文字（正常/過重/肥胖） |
| 基礎代謝卡片 | `#dash-bmr` | 顯示 BMR (kcal) + 教練建議文字 |

### 表單：數據輸入

| 元件 | 類型 | ID | 說明 |
|------|------|----|------|
| 記錄日期 | `<input type="date">` | `#entry-date` | 預設為今天 |
| 紀錄時段 | `<input type="radio">` x2 | `name="time-of-day"` | 選項：早上 / 晚上（預設早上） |
| 體重 (kg) | `<input type="number">` | `#weight` | step=0.1，有上次輸入記憶 |
| 體脂 (%) | `<input type="number">` | `#bodyfat` | step=0.1，有上次輸入記憶 |
| 骨骼肌 (kg) | `<input type="number">` | `#muscle-mass` | step=0.1，有上次輸入記憶 |
| 新增今日紀錄 | `<button>` | — | 呼叫 `addData()`，儲存至雲端 |

### 圖表控制

| 按鈕 | ID | 功能 |
|------|----|------|
| 每日數據 | `#btn-daily` | 切換圖表為每日模式（預設啟用） |
| 每週平均 | `#btn-weekly` | 切換圖表為每週平均模式 |
| 每月平均 | `#btn-monthly` | 切換圖表為每月平均模式 |

### 圖表 (Chart.js)

| 圖表 | Canvas ID | 資料線 |
|------|-----------|--------|
| 體重趨勢 | `#weightChart` | 早上（橘色）/ 晚上（綠色） |
| 體脂趨勢 | `#bodyfatChart` | 早上（橘色）/ 晚上（綠色） |
| 骨骼肌趨勢 | `#muscleMassChart` | 早上（橘色）/ 晚上（綠色） |

### 原始數據表格

| 欄位 | 說明 |
|------|------|
| 日期 | 紀錄日期 |
| 時間 | 早上 / 晚上 |
| 體重(kg) | 數值 |
| 體脂(%) | 數值 |
| 骨骼肌(kg) | 數值 |
| 操作 | 包含「編輯」和「刪除」按鈕 |

| 按鈕 | 功能 |
|------|------|
| 編輯 | `editRawData(timestamp)` — 使用 `prompt()` 彈窗逐一修改體重、體脂、骨骼肌 |
| 刪除 | `deleteData(timestamp)` — `confirm()` 確認後刪除該筆紀錄 |

---

## 頁面二：今日課表 (`workout.html`)

### 行事曆區

| 元件 | ID | 功能 |
|------|----|------|
| 上一週 | `#prev-week-btn` | 往前一週 |
| 標題 | `#calendar-title` | 顯示「本週訓練紀錄 (MM/DD - MM/DD)」 |
| 下一週 | `#next-week-btn` | 往後一週 |
| 星期格子 | `.calendar-grid` | 7格，顯示日期 + 挑戰天數 + 完成狀態（綠勾✓ / 黃圈🟡） |

### 訓練日切換 Tab

| 按鈕 | 功能 |
|------|------|
| 星期一 ~ 星期日 | 7 個 tab 按鈕，點擊切換對應星期的訓練內容，預設顯示今天 |

### 運動卡片 (每個運動項目一張)

| 元件 | 功能 |
|------|------|
| 運動名稱 | 標題，自訂項目會標示「(自訂)」橘色標籤 |
| 今日訓練總量 | 顯示 Volume（重量×次數加總，或時間加總） |
| 刪除自訂項目 `×` | 僅自訂項目顯示，`deleteCustomExercise()` |
| 教練提醒 | 部分預設項目有 💡 教練提醒文字 |
| 上次紀錄 | 顯示上一次做這個動作的日期和組數 |
| 今日紀錄列表 | 顯示每一組：「第N組 — Xkg x Y次」或「X分鐘」 |
| 刪除組數 `X` | 每組右側圓形紅色按鈕，`deleteSet()` |

#### 新增組數輸入

| 元件 | 類型 | 說明 |
|------|------|------|
| 重量(kg) | `<input type="number">` | 有上次輸入記憶 (localStorage) |
| 次數 | `<input type="number">` | 有上次輸入記憶 |
| 新增組數 | `<button>` | `addSet(dayKey, exerciseName, 'weight')` |
| 時間(分鐘) | `<input type="number">` | 僅自訂項目顯示 |
| 新增時間 | `<button>` | `addSet(dayKey, exerciseName, 'time')` |

#### 新增自訂項目

| 元件 | 類型 | 說明 |
|------|------|------|
| 輸入新的運動名稱 | `<input type="text">` | — |
| ✚ 新增自訂項目 | `<button>` | `addCustomExercise(dayKey)` |

### 歷史編輯按鈕

| 按鈕 | 功能 |
|------|------|
| 🖊️ 編輯歷史紀錄 | 開啟 Modal，`openHistoryEditor()` |

### 歷史編輯 Modal

| 元件 | 功能 |
|------|------|
| 關閉 `×` | `closeHistoryEditor()` |
| 選擇日期 | `<input type="date">` `#history-date-picker`，`onchange` 觸發載入該日資料 |
| 編輯表格 | 欄位：項目 / 類型 / 重量或時長 / 次數 / 操作 |
| 重量/時長輸入 | `<input type="number">`，即時更新 `editableLogs` |
| 次數輸入 | `<input type="number">`，即時更新 |
| 刪除組數 | `deleteHistorySet(index)` — 刪除單組紀錄 |
| 💾 儲存修改 | `saveEditedData()` — 儲存所有修改到雲端 |

---

## 頁面三：飲食紀錄 (`diet.html`)

### 日期導航

| 元件 | ID | 功能 |
|------|----|------|
| ‹ 上一天 | `#prev-day-btn` | 切換到前一天 |
| 日期標題 | `#date-title` | 顯示「今天 (低碳日)」或「YYYY/M/D (計畫名稱)」 |
| 返回今天 | `#back-to-today-btn` | 回到今日 |
| › 下一天 | `#next-day-btn` | 切換到後一天 |

### 巨量營養素摘要

| 顯示卡 | 說明 |
|--------|------|
| 蛋白質 (克) | 當前值 / 目標值 + 進度條（超標變色） |
| 碳水化合物 (克) | 當前值 / 目標值 + 進度條 |
| 脂肪 (克) | 當前值 / 目標值 + 進度條 |
| 總熱量 (大卡) | 當前值 / 目標值 + 進度條 |

> 目標值根據星期自動切換（低碳日 / 無碳日 / 高碳日）

### 常用食物區

| 元件 | 功能 |
|------|------|
| 常用食物按鈕群 | 點擊任一常用食物 → 自動填入名稱 + 營養素到表單 |
| 刪除常用 `x` | 每個按鈕右上角，`deleteFavoriteFood(index)` |

### 搜尋食物

| 元件 | 類型 | ID | 說明 |
|------|------|----|------|
| 搜尋輸入 | `<input type="text">` | `#food-search-input` | 載入資料庫後啟用 |
| 搜尋在地食物 | `<button>` | — | `searchLocalFood()` — 搜尋本地 tfda_db.json |
| 線上搜尋加工品 | `<button>` | — | `searchOnlineFood()` — 呼叫 FatSecret API |
| 搜尋結果列表 | `<ul>` | `#search-results` | 點擊結果項目 → 自動填入表單 |

### 新增食物表單

| 元件 | 類型 | ID | 說明 |
|------|------|----|------|
| 食物名稱 | `<input type="text">` | `#food-name` | — |
| 蛋白質(g) | `<input type="number">` | `#protein` | — |
| 碳水(g) | `<input type="number">` | `#carbs` | — |
| 脂肪(g) | `<input type="number">` | `#fat` | — |
| 份數 | `<input type="number">` | `#servings` | 預設 1，step=0.1 |
| 餐別 | `<select>` | `#meal-type` | 早餐 / 午餐 / 晚餐 / 點心 |
| 新增 | `<button>` | `#add-diet-btn` | `addDietLog()` — 新增到當日紀錄 |
| ⭐ 存為常用 | `<button>` | `#save-favorite-btn` | `saveFavoriteFood()` — 存入常用食物 |

### 紀錄列表

| 區塊 | 說明 |
|------|------|
| 餐別分組 | 按早餐/午餐/晚餐/點心分組顯示 |
| 餐別標題 | 顯示餐別名稱 + 該餐總熱量 |
| 總計行 | 每餐的蛋白質/碳水/脂肪/熱量小計 |
| 食物項目行 | 名稱 / 蛋白質 / 碳水 / 脂肪 / 熱量 |
| 刪除 | 每項食物右側，`deleteDietLog(index)` |

---

## 頁面四：間歇性斷食 (`fasting.html`)

### 斷食模式選擇

| 按鈕 | data-mode | 說明 |
|------|-----------|------|
| 16:8 | `16:8` | 16小時斷食 / 8小時進食（預設） |
| 18:6 | `18:6` | 18小時斷食 / 6小時進食 |
| 20:4 | `20:4` | 20小時斷食 / 4小時進食 |
| 14:10 | `14:10` | 14小時斷食 / 10小時進食 |

> 斷食進行中無法切換模式

### 計時器顯示

| 元件 | ID | 說明 |
|------|----|------|
| 圓形進度環 | `#progress-ring` (SVG) | 根據斷食進度填充，達標後變綠色 |
| 倒數時間 | `#countdown-timer` | 格式 HH:MM:SS |
| 狀態文字 | `#fasting-status-label` | 「準備開始」/「距離目標還有...」/「已達標！超時：」 |
| 起訖時間 | `#time-info` | 顯示開始和目標結束時間 |

### 控制按鈕

| 按鈕 | ID | 功能 |
|------|----|------|
| 開始斷食 | `#start-btn` | `startFasting()` — 開始計時，隱藏自身 |
| 結束/放縱 | `#stop-btn` | `stopFasting()` — confirm 後結束，計入歷史 |
| 調整時間 | — | `editTime()` — prompt 彈窗修改斷食開始時間 |

### 資訊卡片

| 卡片 | ID | 說明 |
|------|----|------|
| 目標斷食 | `#goal-target-display` | 顯示「16 小時」等 |
| 本週達成 | `#weekly-success-display` | 顯示本週達標次數 |

### AI 教練功能

| 元件 | 類型 | ID | 說明 |
|------|------|----|------|
| 目標輸入 | `<input type="text">` | `#fasting-goal-input` | 輸入今日斷食目標（如：專注、燃脂） |
| ✨ 教練策略 | `<button>` | `#motivation-btn` | `getMotivation()` — 呼叫 Gemini API 生成激勵 + 策略 |
| 策略顯示區 | `<div>` | `#motivation-box` | 顯示 AI 回覆 |
| ✨ 獲取破戒建議 | `<button>` | `#advice-btn` | `getFastingAdvice()` — 呼叫 Gemini API 生成飲食建議 |
| 建議顯示區 | `<div>` | `#advice-box` | 顯示 AI 回覆 |

### 歷史斷食紀錄

| 欄位 | 說明 |
|------|------|
| 日期 | 斷食日期 + 模式 |
| 時長 | X.X 小時 + 達標/未達標標籤 |
| 刪除 | `deleteHistory(index)` |

---

## 頁面五：分享與成果 (`share.html`)

### 日期控制

| 元件 | 功能 |
|------|------|
| ‹ 上一天 | `changeDate(-1)` |
| 日期顯示 | `#current-date-display` — 格式 `YYYY-MM-DD (Day.)` |
| › 下一天 | `changeDate(1)` |

### 下載按鈕群

| 按鈕 | 功能 |
|------|------|
| 下載第一張圖 | `downloadImage('capture-area-1', '百日計畫')` — 百日計畫圖 |
| 下載第二張圖 | `downloadImage('capture-area-2', '飲食紀錄')` — 飲食紀錄圖 |
| 下載第三張圖 | `downloadImage('capture-area-3', '訓練紀錄')` — 訓練紀錄圖 |

> 使用 html2canvas 庫擷取指定區域為 PNG 圖片，檔名格式 `{前綴}_{日期}.png`

### 分享圖片內容（3張 1080x1350px 圖）

| 圖片 | ID | 內容 |
|------|----|------|
| 圖一：百日計畫 | `#capture-area-1` | 百日減脂計畫標題 / 第N天 / 起始體重 / 今日體重 |
| 圖二：飲食紀錄 | `#capture-area-2` | 星期 + 日期 / 飲食計畫名稱 / 蛋白質、碳水、脂肪攝取 vs 目標 / 總熱量 |
| 圖三：今日運動 | `#capture-area-3` | 星期 + 日期 / 各運動名稱 + 重量 + 組數 or 時長 |

---

## 技術架構摘要

### 前端技術

| 項目 | 說明 |
|------|------|
| 框架 | 無框架，純 HTML + inline `<script>` + inline `<style>` |
| CSS 設計系統 | `design-system.css` — CSS Variables、glassmorphism、dark OLED 主題 |
| 主色調 | 橘色 `#F97316`（主色）、綠色 `#22C55E`（成功）、紅色 `#EF4444`（危險） |
| 字體 | Barlow (內文) + Barlow Condensed (標題)；share.html 用 Noto Serif TC |
| 圖表庫 | Chart.js + chartjs-adapter-date-fns |
| 截圖庫 | html2canvas (僅 share.html) |
| AI 服務 | Google Gemini API (僅 fasting.html) |

### 後端 API

| 端點 | 方法 | 功能 |
|------|------|------|
| `/api/getData?key=X` | GET | 從 Vercel KV 讀取指定 key 的資料 |
| `/api/setData` | POST | 寫入 `{ key, value }` 到 Vercel KV |
| `/api/getAllData` | GET | 一次取回 fitnessData + workoutLog + dietLog + favoriteFoods |
| `/api/search?food=X` | GET | FatSecret API 食物搜尋 (OAuth 1.0a) |
| `/api/openfoodfacts?food=X` | GET | Open Food Facts API 食物搜尋 |

### 資料結構 (Vercel KV Keys)

| Key | 類型 | 說明 |
|-----|------|------|
| `fitnessData` | `Array<{date, time, weight, bodyfat, muscleMass, timestamp}>` | 體重/體脂/骨骼肌紀錄 |
| `workoutLog` | `Object{[dayOfWeek]: {[exerciseName]: {[dateKey]: Array<Set>}}}` | 訓練紀錄，巢狀物件 |
| `dietLog` | `Object{[dateKey]: Array<{name, protein, carbs, fat, meal}>}` | 每日飲食紀錄 |
| `favoriteFoods` | `Array<{name, protein, carbs, fat}>` | 常用食物清單 |
| `fastingData` | `Object{fastingState, fastingHistory}` | 斷食狀態與歷史 |

### 本地儲存 (localStorage)

| Key | 用途 |
|-----|------|
| `lastFitnessInputs` | 記憶上次體重/體脂/骨骼肌輸入值 |
| `lastWorkoutInputs` | 記憶每個運動上次的重量/次數輸入值 |

---

## 已知 UX 問題（重寫時建議改善）

1. **編輯使用 `prompt()` 彈窗** — index.html 的編輯紀錄和 fasting.html 的調整時間都使用瀏覽器原生 prompt，建議改為表單 Modal
2. **導航不一致** — workout.html 少了 fasting 和 share 連結；share.html 少了 fasting 連結
3. **share.html 風格不一致** — 使用獨立樣式系統，未使用 design-system.css
4. **無 RWD 完善處理** — 部分頁面在手機端排版可能有問題（如 share.html 的 1080px 固定寬度）
5. **無 loading state** — 資料載入時僅有文字提示，無 skeleton / spinner
6. **無錯誤邊界** — API 失敗時僅 alert，無 UI 級別的錯誤處理
