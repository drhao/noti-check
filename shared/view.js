// 渲染模組：把疾病資料畫成 DOM（一律用 textContent，避免注入）
import { englishAlias } from "./data.js";

// 完整全欄並列的欄位順序與標題
const FIELDS = [
  { key: "通報定義", label: "通報定義", emphasis: true },
  { key: "臨床條件", label: "臨床條件" },
  { key: "檢驗條件", label: "檢驗條件" },
  { key: "流行病學條件", label: "流行病學條件" },
  { key: "疾病分類", label: "疾病分類（病例分級）" },
  { key: "檢體採檢送驗事項", label: "檢體採檢送驗事項" },
];

function el(tag, cls, text) {
  const n = document.createElement(tag);
  if (cls) n.className = cls;
  if (text != null) n.textContent = text;
  return n;
}

function hasValue(v) {
  return v && String(v).trim() && String(v).trim().toUpperCase() !== "NA";
}

// 搜尋結果清單（多筆時顯示，點擊帶出詳情）
export function buildList(diseases, onSelect) {
  const wrap = el("ul", "result-list");
  diseases.forEach((d) => {
    const li = el("li", "result-item");
    const btn = el("button", "result-btn");
    const name = el("span", "result-name", d.name);
    btn.appendChild(name);
    const eng = englishAlias(d);
    if (eng) btn.appendChild(el("span", "result-eng", eng));
    if (d.source_category) btn.appendChild(el("span", "badge", d.source_category));
    btn.addEventListener("click", () => onSelect(d));
    li.appendChild(btn);
    wrap.appendChild(li);
  });
  return wrap;
}

// 單一疾病的完整詳情
export function buildDetail(d, onBack) {
  const root = el("div", "detail");

  const head = el("div", "detail-head");
  if (onBack) {
    const back = el("button", "back-btn", "← 返回清單");
    back.addEventListener("click", onBack);
    head.appendChild(back);
  }
  const titleRow = el("div", "title-row");
  titleRow.appendChild(el("h2", "disease-name", d.name));
  const eng = englishAlias(d);
  if (eng) titleRow.appendChild(el("span", "disease-eng", eng));
  head.appendChild(titleRow);

  const meta = el("div", "detail-meta");
  if (d.source_category) meta.appendChild(el("span", "badge", d.source_category));
  if (d.last_pdf_update)
    meta.appendChild(el("span", "meta-text", "PDF 更新：" + d.last_pdf_update));
  head.appendChild(meta);
  root.appendChild(head);

  const pdfUrl = d.actual_pdf_url || d.url;

  FIELDS.forEach((f) => {
    // 檢體採檢送驗事項一律改為「開啟原始 PDF」連結（內文多為「請參閱手冊」之制式文字）
    if (f.key === "檢體採檢送驗事項") {
      if (!pdfUrl) return;
      const sec = el("section", "field");
      sec.appendChild(el("h3", "field-label", f.label));
      const a = el("a", "field-link", "點此開啟原始 PDF 查看 ↗");
      a.href = pdfUrl;
      a.target = "_blank";
      a.rel = "noopener";
      sec.appendChild(a);
      root.appendChild(sec);
      return;
    }
    const v = d[f.key];
    if (!hasValue(v)) return;
    const sec = el("section", "field" + (f.emphasis ? " field-emphasis" : ""));
    sec.appendChild(el("h3", "field-label", f.label));
    sec.appendChild(el("p", "field-body", String(v).trim()));
    root.appendChild(sec);
  });

  const link = d.actual_pdf_url || d.url;
  if (link) {
    const a = el("a", "pdf-link", "開啟 CDC 原始 PDF ↗");
    a.href = link;
    a.target = "_blank";
    a.rel = "noopener";
    root.appendChild(a);
  }
  return root;
}
