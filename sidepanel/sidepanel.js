import { mountApp } from "../shared/app.js";

mountApp(document.getElementById("app"));

// 側邊欄常駐，右鍵查詢後若已開啟需即時更新關鍵字
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === "local" && changes.pendingQuery && changes.pendingQuery.newValue) {
    const q = changes.pendingQuery.newValue;
    const input = document.querySelector(".search-input");
    if (input) {
      input.value = q;
      input.dispatchEvent(new Event("input", { bubbles: true }));
      chrome.storage.local.remove("pendingQuery");
    }
  }
});
