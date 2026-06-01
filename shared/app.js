// 共用 UI 控制器：popup 與側邊欄都掛載這支
import { loadDiseases, searchDiseases } from "./data.js";
import { buildList, buildDetail } from "./view.js";

const SOURCE_LABEL = {
  online: "線上最新",
  cache: "本地快取",
  bundled: "內建備援",
};

// 疾管署「傳染病病例定義」官方專頁
const CDC_DEFINE_URL =
  "https://www.cdc.gov.tw/Category/DiseaseDefine/ZW54U0FpVVhpVGR3UkViWm8rQkNwUT09";

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function cdcLink(text, cls) {
  const a = el("a", cls, text);
  a.href = CDC_DEFINE_URL;
  a.target = "_blank";
  a.rel = "noopener";
  return a;
}

function fmtTime(ts) {
  if (!ts) return "";
  const d = new Date(ts);
  const p = (n) => String(n).padStart(2, "0");
  return `${d.getMonth() + 1}/${d.getDate()} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

export async function mountApp(root, opts = {}) {
  let data = [];
  let meta = { source: "bundled", at: 0 };

  // --- 結構 ---
  const bar = el("div", "search-bar");
  const input = el("input", "search-input");
  input.type = "search";
  input.placeholder = "輸入疾病名稱，例如：登革熱、麻疹、Rabies…";
  input.autocomplete = "off";
  bar.appendChild(input);

  // popup 專用：一鍵把目前查詢帶到側邊欄開啟
  if (opts.showSidePanelButton) bar.appendChild(makeSidePanelButton(() => input.value.trim()));
  root.appendChild(bar);

  const status = el("div", "status-line");
  root.appendChild(status);

  const results = el("div", "results");
  root.appendChild(results);

  const disclaimer = el(
    "div",
    "disclaimer",
    "免責聲明：本工具係依據衛生福利部疾病管制署（CDC）網站公開資料彙整製作，僅供醫療人員查詢參考之用。內容可能因官方更新而未及時同步，本工具不保證其完整性、正確性與時效性。實際進行法定傳染病通報時，仍應以 "
  );
  disclaimer.appendChild(cdcLink("疾管署病例定義專頁", "disclaimer-link"));
  disclaimer.appendChild(document.createTextNode(" 公告之最新規定為準。"));
  root.appendChild(disclaimer);

  function renderStatus() {
    status.textContent = "";
    const tag = el("span", "src-" + meta.source, "資料：" + (SOURCE_LABEL[meta.source] || meta.source));
    status.appendChild(tag);
    if (meta.at) status.appendChild(el("span", "status-time", " · 更新 " + fmtTime(meta.at)));
    status.appendChild(el("span", "status-count", " · 共 " + data.length + " 種疾病"));
  }

  function showMessage(msg) {
    results.textContent = "";
    results.appendChild(el("div", "empty", msg));
  }

  function showDetail(d, fromList) {
    results.textContent = "";
    results.appendChild(buildDetail(d, fromList ? () => runSearch(input.value) : null));
    results.scrollTop = 0;
  }

  function runSearch(query) {
    const q = (query || "").trim();
    if (!q) {
      showMessage("輸入疾病名稱開始查詢。資料來源為衛福部疾管署，每日同步。");
      return;
    }
    const matches = searchDiseases(data, q);
    if (matches.length === 0) {
      results.textContent = "";
      const box = el("div", "empty");
      box.appendChild(
        el("p", "empty-text", `找不到「${q}」相符的法定傳染病。試試其他關鍵字或部分名稱。`)
      );
      box.appendChild(cdcLink("前往疾管署病例定義專頁查詢全部 ↗", "empty-link"));
      results.appendChild(box);
    } else if (matches.length === 1) {
      showDetail(matches[0], false);
    } else {
      results.textContent = "";
      results.appendChild(el("div", "list-hint", `符合 ${matches.length} 筆，點選查看完整定義：`));
      results.appendChild(buildList(matches, (d) => showDetail(d, true)));
      results.scrollTop = 0;
    }
  }

  // 防抖
  let timer = null;
  input.addEventListener("input", () => {
    clearTimeout(timer);
    timer = setTimeout(() => runSearch(input.value), 150);
  });

  // --- 載入資料 ---
  const first = await loadDiseases((newData, newMeta) => {
    data = newData;
    meta = newMeta;
    renderStatus();
    if (input.value.trim()) runSearch(input.value); // 背景更新後刷新目前結果
  });
  data = first.data;
  meta = first.meta;
  renderStatus();

  // --- 初始查詢（右鍵選單帶入）---
  const initial = await getInitialQuery();
  if (initial) {
    input.value = initial;
    runSearch(initial);
  } else {
    showMessage("輸入疾病名稱開始查詢。資料來源為衛福部疾管署，每日同步。");
  }
  input.focus();
}

// 建立「側邊欄開啟」按鈕。
// 重點：sidePanel.open() 必須在點擊手勢的同步鏈中呼叫，
// 所以在 popup 一載入就先把目前分頁的 id 快取起來，點擊時直接同步取用，
// 不能在 click 當下才 await chrome.tabs.query（會打斷手勢被擋下）。
function makeSidePanelButton(getQuery) {
  const btn = el("button", "sidepanel-btn", "側邊欄 ⤢");
  btn.title = "在側邊欄開啟（不擋住網頁）";

  let target = null; // { tabId, windowId }
  try {
    chrome.tabs.query({ active: true, currentWindow: true }).then((tabs) => {
      const t = tabs && tabs[0];
      if (t) target = { tabId: t.id, windowId: t.windowId };
    });
  } catch (e) {
    /* ignore */
  }

  btn.addEventListener("click", () => {
    const q = getQuery();
    let opening;
    if (target && target.tabId != null) opening = chrome.sidePanel.open({ tabId: target.tabId });
    else if (target && target.windowId != null) opening = chrome.sidePanel.open({ windowId: target.windowId });
    else opening = Promise.reject(new Error("找不到目前分頁"));

    opening
      .then(() => {
        if (q) chrome.storage.local.set({ pendingQuery: q });
        window.close(); // 關掉 popup，讓使用者看側邊欄
      })
      .catch((e) => console.warn("開啟側邊欄失敗", e));
  });

  return btn;
}

// 右鍵查詢會把選取文字寫進 storage，這裡取出並清掉
async function getInitialQuery() {
  try {
    const url = new URL(location.href);
    const q = url.searchParams.get("q");
    if (q) return q;
    const { pendingQuery } = await chrome.storage.local.get("pendingQuery");
    if (pendingQuery) {
      await chrome.storage.local.remove("pendingQuery");
      return pendingQuery;
    }
  } catch (e) {
    /* ignore */
  }
  return "";
}
