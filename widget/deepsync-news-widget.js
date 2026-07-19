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

  // Content is auto-generated daily so there's no specific photo per
  // article — each category instead gets one representative, freely
  // licensed photo (Unsplash License — free for commercial use, no
  // attribution required) reused across all its cards.
  const CATEGORY_MEDIA = {
    "AI ACT": { image: "assets/images/news-wire/ai-act.jpg" },
    "EIC": { image: "assets/images/news-wire/eic.jpg" },
    "DIGITAL EUROPE": { image: "assets/images/news-wire/digital-europe.jpg" },
    "EIT": { image: "assets/images/news-wire/eit.jpg" },
    "DEEP TECH": { image: "assets/images/news-wire/deep-tech.jpg" },
    "HORIZON EUROPE": { image: "assets/images/news-wire/horizon-europe.jpg" },
  };
  const DEFAULT_MEDIA = { image: "assets/images/news-wire/digital-europe.jpg" };

  function injectStyles() {
    if (document.getElementById("dsnw-styles")) return;
    const style = document.createElement("style");
    style.id = "dsnw-styles";
    style.textContent = `
      .dsnw { color: var(--text, #1A1A2E); font-family: var(--font-main, 'Manrope', sans-serif); }
      .dsnw-top { border-bottom: 2px solid var(--border, #E5E9F2);
        padding: 0 0 16px; margin-bottom: 24px; display:flex; justify-content:space-between; align-items:center;
        font-family: var(--font-mono, 'Space Grotesk', sans-serif); font-size: 12px; letter-spacing: 1px;
        text-transform: uppercase; color: var(--muted, #5A6A85); }
      .dsnw-top .dsnw-label { color: var(--primary, #003399); font-weight:800; }
      .dsnw-filters { margin: 0 0 28px; display:flex; flex-wrap:wrap; gap:10px; }
      .dsnw-filter { font-family: var(--font-main, 'Manrope', sans-serif); font-size: 12px; font-weight: 700;
        border: 1.5px solid var(--border, #E5E9F2); border-radius: 8px; background: var(--white, #fff);
        color: var(--text, #1A1A2E); padding: 8px 16px; cursor:pointer; transition: all .2s ease; }
      .dsnw-filter:not(.active):hover { border-color: var(--primary, #003399); color: var(--primary, #003399); }
      .dsnw-filter.active { background: var(--navy, #0A1628); color: #fff; border-color: var(--navy, #0A1628); }
      .dsnw-carousel { position: relative; }
      .dsnw-track { display:flex; gap:24px; overflow-x:auto; scroll-snap-type:x mandatory;
        scroll-behavior:smooth; padding-bottom:4px; scrollbar-width:none; -ms-overflow-style:none; }
      .dsnw-track::-webkit-scrollbar { display:none; }
      .dsnw-card { scroll-snap-align:start; flex:0 0 calc(33.333% - 16px); min-width:250px;
        box-sizing:border-box; border:1px solid var(--border, #E5E9F2); border-radius: 20px;
        background: var(--white, #fff); box-shadow: 0 10px 30px rgba(10,22,40,0.05); overflow:hidden;
        display:flex; flex-direction:column; }
      .dsnw-card-media { height:140px; flex:0 0 auto; position:relative; overflow:hidden;
        background-size:cover; background-position:center; }
      .dsnw-card-media::after { content:""; position:absolute; inset:0;
        background: linear-gradient(180deg, rgba(10,22,40,0) 55%, rgba(10,22,40,0.35) 100%); }
      .dsnw-card-body { padding:22px 24px 24px; display:flex; flex-direction:column; flex:1; }
      @media (max-width: 900px) { .dsnw-card { flex:0 0 calc(50% - 12px); } }
      @media (max-width: 600px) { .dsnw-card { flex:0 0 85%; } }
      .dsnw-nav { display:flex; justify-content:flex-end; gap:10px; margin-top:20px; }
      .dsnw-nav-btn { width:40px; height:40px; border-radius: 50%; border:1.5px solid var(--border, #E5E9F2);
        background: var(--white, #fff); color: var(--navy, #0A1628); font-size:16px; cursor:pointer;
        transition: all .2s ease; }
      .dsnw-nav-btn:disabled { opacity:0.3; cursor:default; }
      .dsnw-nav-btn:not(:disabled):hover { background: var(--navy, #0A1628); color:#fff; border-color: var(--navy, #0A1628); }
      .dsnw-tag { display:inline-block; font-family: var(--font-mono, 'Space Grotesk', sans-serif); font-size: 11px;
        font-weight: 700; letter-spacing: 0.5px; color: var(--primary, #003399);
        background: rgba(0,51,153,0.08); padding: 4px 10px; border-radius: 6px; margin-right: 10px; }
      .dsnw-date { font-family: var(--font-mono, 'Space Grotesk', sans-serif); font-size: 11px; color: var(--muted, #5A6A85); }
      .dsnw-headline { font-family: var(--font-main, 'Manrope', sans-serif); font-size: 19px; font-weight: 800;
        margin: 14px 0 10px; line-height: 1.3; color: var(--navy, #0A1628); }
      .dsnw-body { font-size: 14px; line-height: 1.6; margin: 0 0 14px; color: var(--text, #1A1A2E); opacity: .85; }
      .dsnw-means { border-left: 3px solid var(--gold, #FFCC00); background: var(--bg, #F4F7FD);
        border-radius: 0 12px 12px 0; padding: 14px 16px; margin: 0 0 14px; }
      .dsnw-means-label { font-family: var(--font-mono, 'Space Grotesk', sans-serif); font-size: 11px;
        letter-spacing: 0.5px; color: var(--primary, #003399); font-weight:800; display:block; margin-bottom: 4px; }
      .dsnw-means-text { font-size: 13px; margin: 0; color: var(--text, #1A1A2E); }
      .dsnw-source { font-family: var(--font-main, 'Manrope', sans-serif); font-size: 13px; font-weight: 700;
        color: var(--primary, #003399); text-decoration: none; margin-top: auto; }
      .dsnw-source:hover { text-decoration: underline; }
      .dsnw-empty, .dsnw-error { font-family: var(--font-main, 'Manrope', sans-serif); font-size: 14px;
        color: var(--muted, #5A6A85); padding: 24px 0; }
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

    const carousel = document.createElement("div");
    carousel.className = "dsnw-carousel";

    const track = document.createElement("div");
    track.className = "dsnw-track";
    carousel.appendChild(track);

    const nav = document.createElement("div");
    nav.className = "dsnw-nav";
    const prevBtn = document.createElement("button");
    prevBtn.type = "button";
    prevBtn.className = "dsnw-nav-btn";
    prevBtn.setAttribute("aria-label", "Previous");
    prevBtn.textContent = "←";
    const nextBtn = document.createElement("button");
    nextBtn.type = "button";
    nextBtn.className = "dsnw-nav-btn";
    nextBtn.setAttribute("aria-label", "Next");
    nextBtn.textContent = "→";
    nav.appendChild(prevBtn);
    nav.appendChild(nextBtn);
    carousel.appendChild(nav);

    wrap.appendChild(carousel);

    function updateNavButtons() {
      const maxScroll = track.scrollWidth - track.clientWidth - 1;
      prevBtn.disabled = track.scrollLeft <= 0;
      nextBtn.disabled = maxScroll <= 0 || track.scrollLeft >= maxScroll;
    }

    prevBtn.addEventListener("click", () => {
      track.scrollBy({ left: -track.clientWidth, behavior: "smooth" });
    });
    nextBtn.addEventListener("click", () => {
      track.scrollBy({ left: track.clientWidth, behavior: "smooth" });
    });
    track.addEventListener("scroll", updateNavButtons);
    window.addEventListener("resize", updateNavButtons);

    function renderCards() {
      track.innerHTML = "";
      track.scrollLeft = 0;
      const items = (data.items || []).filter(
        (item) => activeCategory === "ALL" || item.category === activeCategory
      );
      if (items.length === 0) {
        track.innerHTML = `<p class="dsnw-empty">No items in this category yet.</p>`;
        nav.style.display = "none";
        return;
      }
      nav.style.display = "flex";
      items.forEach((item) => {
        const media = CATEGORY_MEDIA[item.category] || DEFAULT_MEDIA;
        const card = document.createElement("div");
        card.className = "dsnw-card";
        card.innerHTML = `
          <div class="dsnw-card-media" style="background-image:url('${escapeAttr(media.image)}')"></div>
          <div class="dsnw-card-body">
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
          </div>
        `;
        track.appendChild(card);
      });
      requestAnimationFrame(updateNavButtons);
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
