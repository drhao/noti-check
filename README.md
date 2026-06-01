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

## 安裝（載入未封裝擴充功能）

1. 開啟 Chrome，網址列輸入 `chrome://extensions`。
2. 右上角開啟「**開發人員模式**」。
3. 點「**載入未封裝項目**」，選擇本資料夾 `noti-check/`。
4. 圖示會出現在工具列；側邊欄可從 Chrome 右上的側邊欄面板選單開啟。

## 更新內建備援資料

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
