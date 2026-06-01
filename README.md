# 法定傳染病通報定義小幫手

一個 Chrome 擴充功能（Manifest V3），讓你順手查詢台灣法定傳染病的**通報定義**、臨床／檢驗／流行病學條件與病例分類。資料取自衛福部疾管署，並透過 [drhao/notifiable_diseases](https://github.com/drhao/notifiable_diseases) 每日同步。

## 功能

- **工具列彈出視窗（popup）**：點右上角圖示，輸入疾病名稱即時查詢。
- **側邊欄（side panel）**：釘在瀏覽器側邊，看病歷／網頁時對照不擋內容。
- **選取文字右鍵查詢**：在任何網頁選取疾病名稱 → 右鍵「在側邊欄查詢通報定義」→ 直接帶出。
- **完整全欄並列**：通報定義（強調）、臨床條件、檢驗條件、流行病學條件、疾病分類（可能／極可能／確定病例）、檢體採檢送驗事項，並附 CDC 原始 PDF 連結。
- **搜尋寬鬆**：支援中文名稱、括號內英文名（如 `Rabies`）、分類（如 `第一類`）、部分關鍵字與內文比對；全形／半形通用。

## 資料策略（線上抓取 + 本地備援）

1. 開啟時先用**本地快取**或**內建 `data/diseases.json`** 立即顯示，確保離線可用。
2. 背景每 6 小時向 GitHub raw 抓取最新版（`raw.githubusercontent.com/drhao/notifiable_diseases/main/diseases.json`），抓到就更新快取並即時刷新畫面。
3. 狀態列會標示資料來源：**線上最新／本地快取／內建備援**與更新時間。

## 安裝

> ⚠️ Chrome **無法**直接用 GitHub 網址一鍵安裝未上架的擴充功能。請先把這個 repo 下載到電腦，再用「載入未封裝項目」載入。整個過程約 2 分鐘、不需要寫程式。

### 第 1 步：把 repo 下載到電腦

任選一種方式：

**方式 A — 下載 ZIP（最簡單，不用裝 git）**

1. 開啟本專案頁面：<https://github.com/drhao/noti-check>
2. 點綠色的「**`<> Code`**」按鈕 → 「**Download ZIP**」。
3. 到「下載」資料夾，**解壓縮**那個 ZIP（雙擊即可），會得到一個 `noti-check-main` 資料夾。
4. 記住這個資料夾的位置（例如 `下載/noti-check-main`）。**之後不要刪除或搬移它**——Chrome 會一直從這個位置讀取擴充功能。

**方式 B — 用 git 複製（之後更新比較方便）**

```bash
git clone https://github.com/drhao/noti-check.git
```

會在目前目錄產生 `noti-check` 資料夾。

### 第 2 步：在 Chrome 載入

1. 開啟 Chrome，網址列輸入 `chrome://extensions` 後按 Enter。
2. 打開右上角的「**開發人員模式 / Developer mode**」開關。
3. 點左上角「**載入未封裝項目 / Load unpacked**」。
4. 選擇第 1 步解壓縮／複製出來的資料夾（裡面要看得到 `manifest.json` 的那一層，例如 `noti-check-main` 或 `noti-check`），按「選擇」。
5. 工具列會出現「報」字圖示即代表安裝完成。

### 第 3 步：開始使用

- **點工具列圖示** → 彈出視窗輸入疾病名稱查詢。
- 視窗右上的「**側邊欄 ⤢**」可把查詢移到側邊欄常駐。
- 在任何網頁**選取疾病名稱 → 右鍵** →「在側邊欄查詢通報定義」。

> 找不到圖示？點工具列的拼圖（擴充功能）圖示，把本擴充功能旁的圖釘點亮即可固定到工具列。

## 更新到最新版

擴充功能的**資料**會每日線上自動同步，不需處理。若要更新**程式本身**（介面/功能）：

- 方式 A（ZIP）：重新下載 ZIP、解壓縮覆蓋原資料夾。
- 方式 B（git）：在資料夾內執行 `git pull`。

更新後到 `chrome://extensions`，在本擴充功能卡片上點**重新整理（↻ / Reload）**即可生效。

## 更新內建備援資料（維護者用）

線上抓取已會自動更新；若要同步更新打包的離線備援：

```bash
cp ../notifiable_diseases/diseases.json data/diseases.json
```

## 檔案結構

```
manifest.json          擴充功能設定（MV3）
background.js           service worker：右鍵選單 → 開側邊欄帶入查詢
data/diseases.json      內建備援資料（72 種疾病）
shared/
  data.js               資料載入（快取/備援/線上）與搜尋
  view.js               疾病詳情渲染（純 textContent，防注入）
  app.js                共用 UI 控制器（popup 與側邊欄共用）
  styles.css            樣式
popup/                  工具列彈出視窗
sidepanel/              側邊欄
icons/                  16/48/128 圖示
```

## 注意

- 本工具僅供醫療人員快速查閱參考，實際通報請以疾管署最新公告為準。
- 線上更新需要網路；無網路時自動使用快取或內建資料。
