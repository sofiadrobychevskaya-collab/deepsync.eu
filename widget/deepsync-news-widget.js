/**
 * Deep-Sync News Wire — embeddable widget
 *
 * Usage: put this on any page of your site —
 *
 *   <div id="deepsync-news-wire" data-src="/data/news.json"></div>
 *   <script src="/widget/deepsync-news-widget.js"></script>
 *
 * data-src is optional (defaults to "/data/news.json", i.e. the file this
 * repo's GitHub Action keeps updated). No build step, no dependencies —
 * just fetch + render.
 */
(function () {
  const CATEGORIES = [
    "ALL",
    "AI ACT",
    "EIC",
    "DIGITAL EUROPE",
    "EIT",
    "DEEP TECH",
    "HORIZON EUROPE",
  ];

  function injectStyles() {
    if (document.getElementById("dsnw-styles")) return;
    const style = document.createElement("style");
    style.id = "dsnw-styles";
    style.textContent = `
      .dsnw { background:#f2ede1; color:#1c1a16; font-family: Georgia, 'Times New Roman', serif;
        padding: 32px 24px; border: 1px solid #c9c0a8; }
      .dsnw-top { border-top: 3px double #1c1a16; border-bottom: 1px solid #1c1a16;
        padding: 6px 0; display:flex; justify-content:space-between; align-items:center;
        font-family: 'Courier New', monospace; font-size: 12px; letter-spacing: 1px; }
      .dsnw-top .dsnw-label { color:#b5502d; font-weight:bold; }
      .dsnw-filters { margin: 20px 0; display:flex; flex-wrap:wrap; gap:8px; }
      .dsnw-filter { font-family:'Courier New', monospace; font-size: 11px; letter-spacing: 1px;
        border: 1px solid #8a806a; background: transparent; color:#1c1a16; padding: 6px 12px;
        cursor:pointer; }
      .dsnw-filter.active { background:#1c1a16; color:#f2ede1; border-color:#1c1a16; }
      .dsnw-card { border-bottom: 1px solid #c9c0a8; padding: 20px 0; }
      .dsnw-tag { display:inline-block; font-family:'Courier New', monospace; font-size: 11px;
        letter-spacing: 1px; border: 1px solid #8a806a; padding: 3px 8px; margin-right: 10px; }
      .dsnw-date { font-family:'Courier New', monospace; font-size: 11px; color:#5c5647; }
      .dsnw-headline { font-size: 22px; font-weight: bold; margin: 10px 0 8px; line-height: 1.25; }
      .dsnw-body { font-size: 15px; line-height: 1.55; margin: 0 0 12px; }
      .dsnw-means { border-left: 3px solid #b5502d; background:#faf7ee; padding: 12px 16px; margin: 0 0 12px; }
      .dsnw-means-label { font-family:'Courier New', monospace; font-size: 11px; letter-spacing: 1px;
        color:#b5502d; font-weight:bold; display:block; margin-bottom: 4px; }
      .dsnw-means-text { font-style: italic; font-size: 14px; margin: 0; }
      .dsnw-source { font-family:'Courier New', monospace; font-size: 12px; color:#b5502d;
        text-decoration: underline; }
      .dsnw-empty, .dsnw-error { font-family:'Courier New', monospace; font-size: 13px; padding: 20px 0; }
    `;
    document.head.appendChild(style);
  }

  function render(container, data) {
    let activeCategory = "ALL";
    const generatedAt = data.generated_at
      ? new Date(data.generated_at).toUTCString().slice(0, 16)
      : "";

    const wrap = document.createElement("div");
    wrap.className = "dsnw";

    const top = document.createElement("div");
    top.className = "dsnw-top";
    top.innerHTML = `<span class="dsnw-label">DEEP-SYNC WIRE</span><span>${generatedAt}</span>`;
    wrap.appendChild(top);

    const filters = document.createElement("div");
    filters.className = "dsnw-filters";
    CATEGORIES.forEach((cat) => {
      const btn = document.createElement("button");
      btn.className = "dsnw-filter" + (cat === "ALL" ? " active" : "");
      btn.textContent = cat;
      btn.addEventListener("click", () => {
        activeCategory = cat;
        [...filters.children].forEach((b) => b.classList.toggle("active", b === btn));
        renderCards();
      });
      filters.appendChild(btn);
    });
    wrap.appendChild(filters);

    const cardsHost = document.createElement("div");
    wrap.appendChild(cardsHost);

    function renderCards() {
      cardsHost.innerHTML = "";
      const items = (data.items || []).filter(
        (item) => activeCategory === "ALL" || item.category === activeCategory
      );
      if (items.length === 0) {
        cardsHost.innerHTML = `<p class="dsnw-empty">No items in this category yet.</p>`;
        return;
      }
      items.forEach((item) => {
        const card = document.createElement("div");
        card.className = "dsnw-card";
        card.innerHTML = `
          <span class="dsnw-tag">${escapeHtml(item.category || "")}</span>
          <span class="dsnw-date">${escapeHtml(item.date_label || "")}</span>
          <div class="dsnw-headline">${escapeHtml(item.headline || "")}</div>
          <p class="dsnw-body">${escapeHtml(item.body || "")}</p>
          ${
            item.what_it_means
              ? `<div class="dsnw-means">
                   <span class="dsnw-means-label">WHAT IT MEANS</span>
                   <p class="dsnw-means-text">${escapeHtml(item.what_it_means)}</p>
                 </div>`
              : ""
          }
          ${
            item.source_url
              ? `<a class="dsnw-source" href="${escapeAttr(item.source_url)}" target="_blank" rel="noopener">
                   Read: ${escapeHtml(item.source_name || "source")} →
                 </a>`
              : ""
          }
        `;
        cardsHost.appendChild(card);
      });
    }

    renderCards();
    container.innerHTML = "";
    container.appendChild(wrap);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
  }
  function escapeAttr(str) {
    return String(str).replace(/"/g, "&quot;");
  }

  function init() {
    const container = document.getElementById("deepsync-news-wire");
    if (!container) return;
    injectStyles();
    const src = container.dataset.src || "/data/news.json";
    container.innerHTML = `<p class="dsnw-empty">Loading news wire…</p>`;
    fetch(src, { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("HTTP " + res.status);
        return res.json();
      })
      .then((data) => render(container, data))
      .catch((err) => {
        container.innerHTML = `<p class="dsnw-error">Couldn't load the news wire (${escapeHtml(
          err.message
        )}).</p>`;
      });
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();
