// 資料載入與搜尋模組
// 策略：線上抓取 + 本地備援
//   1. 立即回傳「快取 → 本地打包」的資料，確保離線可用、瞬間顯示
//   2. 背景向 GitHub raw 抓取最新版，超過 TTL 才抓，抓到就更新快取
//   3. 抓到新資料會透過 onUpdate 回呼通知 UI 重新渲染

const RAW_URL =
  "https://raw.githubusercontent.com/drhao/notifiable_diseases/main/diseases.json";
const BUNDLED_URL = chrome.runtime.getURL("data/diseases.json");
const CACHE_KEY = "diseasesCache";
const CACHE_AT_KEY = "diseasesCachedAt";
const TTL_MS = 6 * 60 * 60 * 1000; // 6 小時

let memo = null; // 本次 session 已載入的資料

async function readCache() {
  try {
    const obj = await chrome.storage.local.get([CACHE_KEY, CACHE_AT_KEY]);
    if (Array.isArray(obj[CACHE_KEY]) && obj[CACHE_KEY].length) {
      return { data: obj[CACHE_KEY], at: obj[CACHE_AT_KEY] || 0 };
    }
  } catch (e) {
    console.warn("讀取快取失敗", e);
  }
  return null;
}

async function readBundled() {
  const res = await fetch(BUNDLED_URL);
  return res.json();
}

async function fetchRemote() {
  const res = await fetch(RAW_URL, { cache: "no-cache" });
  if (!res.ok) throw new Error("HTTP " + res.status);
  const data = await res.json();
  if (!Array.isArray(data) || !data.length) throw new Error("資料格式異常");
  return data;
}

// 取得資料來源標記，方便 UI 顯示「線上 / 快取 / 內建」
function metaFor(source, at) {
  return { source, at: at || 0 };
}

/**
 * 載入疾病資料。
 * @param {(data:Array, meta:object)=>void} onUpdate 背景抓到新版時回呼
 * @returns {Promise<{data:Array, meta:object}>} 第一筆可用資料（快取或內建）
 */
export async function loadDiseases(onUpdate) {
  if (memo) {
    maybeRefresh(onUpdate, memo.meta.at);
    return memo;
  }

  const cache = await readCache();
  let first;
  if (cache) {
    first = { data: cache.data, meta: metaFor("cache", cache.at) };
  } else {
    const bundled = await readBundled();
    first = { data: bundled, meta: metaFor("bundled", 0) };
  }
  memo = first;

  maybeRefresh(onUpdate, cache ? cache.at : 0);
  return first;
}

function maybeRefresh(onUpdate, cachedAt) {
  const stale = !cachedAt || Date.now() - cachedAt > TTL_MS;
  if (!stale) return;
  // 不 await，背景進行
  fetchRemote()
    .then(async (data) => {
      const at = Date.now();
      await chrome.storage.local.set({ [CACHE_KEY]: data, [CACHE_AT_KEY]: at });
      memo = { data, meta: metaFor("online", at) };
      if (typeof onUpdate === "function") onUpdate(data, memo.meta);
    })
    .catch((e) => console.warn("線上更新失敗，沿用既有資料", e));
}

// ---- 搜尋 ----

// 全形轉半形 + 去空白 + 小寫，讓搜尋更寬鬆
function normalize(s) {
  if (!s) return "";
  return s
    .replace(/[！-～]/g, (c) => String.fromCharCode(c.charCodeAt(0) - 0xfee0))
    .replace(/　/g, " ")
    .replace(/\s+/g, "")
    .toLowerCase();
}

// 從 content 抽出括號內英文名，作為可搜尋別名
function englishAlias(d) {
  const m = (d.content || "").match(/[（(]\s*([A-Za-z][A-Za-z0-9 ,.'/-]+)\s*[）)]/);
  return m ? m[1].trim() : "";
}

/**
 * 搜尋疾病，回傳排序後結果。
 * 比對範圍：中文名稱、英文別名、分類。名稱命中優先。
 */
export function searchDiseases(list, query) {
  const q = normalize(query);
  if (!q) return [];
  const scored = [];
  for (const d of list) {
    const name = normalize(d.name);
    const eng = normalize(englishAlias(d));
    const cat = normalize(d.source_category);
    let score = -1;
    if (name === q || eng === q) score = 100;
    else if (name.startsWith(q) || eng.startsWith(q)) score = 80;
    else if (name.includes(q) || eng.includes(q)) score = 60;
    else if (cat.includes(q)) score = 30;
    else if (normalize(d.content).includes(q)) score = 10;
    if (score >= 0) scored.push({ d, score });
  }
  scored.sort((a, b) => b.score - a.score || a.d.name.localeCompare(b.d.name, "zh-Hant"));
  return scored.map((s) => s.d);
}

export { englishAlias };
