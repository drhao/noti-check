// Service worker：右鍵選單 → 把選取文字帶進側邊欄查詢
const MENU_ID = "noti-check-lookup";

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: MENU_ID,
    title: '在側邊欄查詢病例定義：「%s」',
    contexts: ["selection"],
  });
});

chrome.contextMenus.onClicked.addListener((info, tab) => {
  if (info.menuItemId !== MENU_ID) return;
  const q = (info.selectionText || "").trim();
  if (!q) return;

  // 關鍵：sidePanel.open() 必須在使用者手勢的同步鏈中呼叫，
  // 任何 await 都會打斷手勢而被瀏覽器擋下，所以先開、後寫 storage。
  const opening =
    tab && tab.id != null
      ? chrome.sidePanel.open({ tabId: tab.id })
      : tab && tab.windowId != null
      ? chrome.sidePanel.open({ windowId: tab.windowId })
      : Promise.reject(new Error("no tab"));

  opening
    .catch((e) => console.warn("開啟側邊欄失敗（可能需使用者手動開啟）", e))
    .finally(() => chrome.storage.local.set({ pendingQuery: q }));
});
