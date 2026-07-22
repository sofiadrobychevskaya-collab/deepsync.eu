(function () {
  const PROGRAMMES = ["ALL", "HORIZON EUROPE", "DIGITAL EUROPE", "EIC", "EIT", "CASCADE FUNDING"];

  function esc(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function daysUntil(deadline) {
    return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
  }

  function csvCell(value) {
    return `"${String(value == null ? "" : value).replace(/"/g, '""')}"`;
  }

  function exportCsv(calls) {
    const headers = ["Programme", "Type", "Sector", "Best for", "Title", "Budget", "Deadline", "Days left", "Remaining cut-offs", "Summary", "Official link"];
    const rows = calls.map(call => [
      call.programme, call.type, call.sector, (call.audiences || []).join(" · "), call.title, call.budget,
      call.deadline_label, daysUntil(call.deadline), (call.cutoffs || []).join(" · "), call.summary, call.source_url
    ]);
    const csv = [headers, ...rows].map(row => row.map(csvCell).join(",")).join("\r\n");
    const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `deepsync-eu-funding-radar-${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    link.remove();
    URL.revokeObjectURL(url);
  }

  function injectStyles() {
    if (document.getElementById("dscr-styles")) return;
    const style = document.createElement("style");
    style.id = "dscr-styles";
    style.textContent = `
      .dscr { font-family:var(--font-main,'Manrope',sans-serif); }
      .dscr-head { display:flex; align-items:end; justify-content:space-between; gap:24px; margin-bottom:28px; }
      .dscr-head h2 { margin:10px 0 8px; color:var(--navy,#0A1628); font-size:clamp(30px,5vw,46px); }
      .dscr-head p { max-width:650px; margin:0; color:var(--muted,#5A6A85); line-height:1.6; }
      .dscr-updated { flex:0 0 auto; color:var(--muted,#5A6A85); font-size:11px; }
      .dscr-filters { display:flex; gap:8px; margin-bottom:20px; overflow-x:auto; scrollbar-width:none; }
      .dscr-filter { flex:0 0 auto; padding:9px 14px; border:1px solid #dfe4eb; border-radius:999px; background:white; color:var(--muted,#5A6A85); font:700 11px var(--font-main,'Manrope',sans-serif); cursor:pointer; }
      .dscr-filter.active { border-color:var(--navy,#0A1628); background:var(--navy,#0A1628); color:white; }
      .dscr-sector-row { display:flex; align-items:center; gap:8px; margin:-6px 0 22px; overflow-x:auto; scrollbar-width:none; }
      .dscr-audience-row { display:flex; align-items:center; gap:8px; margin:-10px 0 22px; overflow-x:auto; scrollbar-width:none; }
      .dscr-sector-label { flex:0 0 auto; margin-right:3px; color:var(--muted,#5A6A85); font-size:10px; font-weight:850; letter-spacing:.08em; text-transform:uppercase; }
      .dscr-sector-filter { flex:0 0 auto; padding:7px 11px; border:0; border-radius:7px; background:#e7ebf2; color:var(--muted,#5A6A85); font:750 10px var(--font-main,'Manrope',sans-serif); cursor:pointer; }
      .dscr-sector-filter.active { background:var(--primary,#003399); color:white; }
      .dscr-audience-filter { flex:0 0 auto; padding:7px 11px; border:1px solid #dfe4eb; border-radius:7px; background:white; color:var(--muted,#5A6A85); font:750 10px var(--font-main,'Manrope',sans-serif); cursor:pointer; }
      .dscr-audience-filter.active { border-color:var(--navy,#0A1628); background:var(--navy,#0A1628); color:white; }
      .dscr-grid { display:grid; grid-template-rows:repeat(2,auto); grid-auto-flow:column; grid-auto-columns:calc(50% - 6px); gap:12px; overflow-x:auto; scroll-snap-type:x mandatory; scroll-behavior:smooth; padding:1px 1px 8px; scrollbar-width:none; }
      .dscr-grid::-webkit-scrollbar { display:none; }
      .dscr-card { display:flex; flex-direction:column; padding:14px 16px; border:1px solid #e0e5ec; border-radius:14px; background:white; box-shadow:0 10px 30px rgba(15,31,55,.04); }
      .dscr-card { scroll-snap-align:start; }
      .dscr-meta { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:9px; }
      .dscr-programme { color:var(--primary,#003399); font-size:9.5px; font-weight:850; letter-spacing:.08em; }
      .dscr-days { padding:5px 8px; border-radius:999px; background:#eef3ff; color:var(--primary,#003399); font-size:9.5px; font-weight:800; }
      .dscr-card h3 { margin:0 0 6px; color:var(--navy,#0A1628); font-size:15px; line-height:1.28; }
      .dscr-sector { margin:0 0 8px; color:var(--muted,#5A6A85); font-size:11px; font-weight:700; }
      .dscr-for { margin:-4px 0 8px; color:#39465a; font-size:10.5px; line-height:1.4; }
      .dscr-for strong { color:var(--navy,#0A1628); }
      .dscr-summary { display:-webkit-box; -webkit-box-orient:vertical; -webkit-line-clamp:2; overflow:hidden; margin:0 0 12px; color:#39465a; font-size:12.5px; line-height:1.5; }
      .dscr-facts { display:grid; grid-template-columns:1fr 1fr; gap:8px; padding-top:10px; border-top:1px solid #edf0f4; }
      .dscr-fact small { display:block; margin-bottom:3px; color:var(--muted,#5A6A85); font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
      .dscr-fact strong { color:var(--navy,#0A1628); font-size:11.5px; }
      .dscr-cutoffs { grid-column:1/-1; margin:2px 0 0; overflow:hidden; color:var(--muted,#5A6A85); font-size:10.5px; line-height:1.45; white-space:nowrap; text-overflow:ellipsis; }
      .dscr-head-meta { display:flex; flex-direction:column; align-items:flex-end; gap:8px; flex:0 0 auto; }
      .dscr-export { padding:9px 14px; border:1px solid #dfe4eb; border-radius:999px; background:white; color:var(--navy,#0A1628); font:750 11px var(--font-main,'Manrope',sans-serif); cursor:pointer; white-space:nowrap; }
      .dscr-export:hover { border-color:var(--navy,#0A1628); }
      .dscr-link { display:inline-flex; margin-top:12px; color:var(--primary,#003399); font-size:11.5px; font-weight:800; text-decoration:none; }
      .dscr-empty { padding:30px; border-radius:18px; background:white; color:var(--muted,#5A6A85); }
      .dscr-controls { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-top:18px; }
      .dscr-arrows { display:flex; gap:8px; }
      .dscr-arrow { width:42px; height:42px; border:1px solid #dfe4eb; border-radius:50%; background:white; color:var(--navy,#0A1628); font-size:18px; cursor:pointer; }
      .dscr-footer { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-top:20px; padding-top:20px; border-top:1px solid #dfe4eb; color:var(--muted,#5A6A85); font-size:11px; }
      .dscr-linkedin { display:inline-flex; padding:11px 15px; border-radius:10px; background:#0A66C2; color:white; font-weight:800; text-decoration:none; }
      @media(max-width:760px){ .dscr-head{align-items:flex-start;flex-direction:column}.dscr-grid{grid-template-rows:1fr;grid-auto-columns:88%}.dscr-card{min-height:0}.dscr-footer{align-items:flex-start;flex-direction:column} }
    `;
    document.head.appendChild(style);
  }

  function render(container, data) {
    let active = "ALL";
    const validCalls = (data.calls || [])
      .filter(call => new Date(call.deadline).getTime() >= Date.now())
      .sort((a, b) => new Date(a.deadline) - new Date(b.deadline));
    container.innerHTML = `
      <div class="dscr">
        <div class="dscr-head">
          <div><span class="db-tag">LIVE EU CALLS</span><h2>EU Funding Radar</h2><p>Open opportunities, translated into plain language. Start with the deadline, budget and what the Commission is actually looking to fund.</p></div>
          <div class="dscr-head-meta">
            <span class="dscr-updated">Verified: ${esc(new Date(data.generated_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}))}</span>
            <button type="button" class="dscr-export">Export to Excel ↓</button>
          </div>
        </div>
        <div class="dscr-filters" role="group" aria-label="Filter funding calls"></div>
        <div class="dscr-sector-row" role="group" aria-label="Filter calls by sector"></div>
        <div class="dscr-audience-row" role="group" aria-label="Filter calls by applicant type"></div>
        <div class="dscr-grid"></div>
        <div class="dscr-controls"><span class="dscr-updated">Showing two rows · use arrows for more calls</span><div class="dscr-arrows"><button type="button" class="dscr-arrow dscr-prev" aria-label="Previous calls">←</button><button type="button" class="dscr-arrow dscr-next" aria-label="Next calls">→</button></div></div>
        <div class="dscr-footer"><span>Data is checked against official EU sources. Always verify conditions before applying.</span><a class="dscr-linkedin" href="https://www.linkedin.com/company/deepsync-eu/" target="_blank" rel="noopener">Follow all new calls on LinkedIn →</a></div>
      </div>`;
    const filters = container.querySelector('.dscr-filters');
    const sectorFilters = container.querySelector('.dscr-sector-row');
    const audienceFilters = container.querySelector('.dscr-audience-row');
    const grid = container.querySelector('.dscr-grid');
    let activeSector = 'ALL';
    let activeAudience = 'ALL';
    const prev = container.querySelector('.dscr-prev');
    const next = container.querySelector('.dscr-next');
    prev.addEventListener('click', () => grid.scrollBy({ left: -grid.clientWidth, behavior: 'smooth' }));
    next.addEventListener('click', () => grid.scrollBy({ left: grid.clientWidth, behavior: 'smooth' }));
    container.querySelector('.dscr-export').addEventListener('click', () => exportCsv(validCalls));

    function draw() {
      const calls = validCalls.filter(call => {
        const programmeMatch = active === 'ALL' || (call.categories || [call.programme]).includes(active);
        const sectorMatch = activeSector === 'ALL' || (call.sector_tags || []).includes(activeSector);
        const audienceMatch = activeAudience === 'ALL' || (call.audiences || []).includes(activeAudience);
        return programmeMatch && sectorMatch && audienceMatch;
      });
      grid.innerHTML = calls.length ? calls.map(call => `
        <article class="dscr-card">
          <div class="dscr-meta"><span class="dscr-programme">${esc(call.programme)} · ${esc(call.type)}</span><span class="dscr-days">${daysUntil(call.deadline)} days left</span></div>
          <h3>${esc(call.title)}</h3>
          <p class="dscr-sector">${esc(call.sector)}</p>
          ${call.audiences?.length ? `<p class="dscr-for"><strong>Best for:</strong> ${call.audiences.map(esc).join(' · ')}</p>` : ''}
          <p class="dscr-summary">${esc(call.summary)}</p>
          <div class="dscr-facts"><div class="dscr-fact"><small>Budget</small><strong>${esc(call.budget)}</strong></div><div class="dscr-fact"><small>${call.cutoffs?.length > 1 ? 'Next cut-off' : 'Deadline'}</small><strong>${esc(call.deadline_label)}</strong></div>${call.cutoffs?.length > 1 ? `<p class="dscr-cutoffs"><strong>Remaining 2026 cut-offs:</strong> ${call.cutoffs.map(esc).join(' · ')}</p>` : ''}</div>
          <a class="dscr-link" href="${esc(call.source_url)}" target="_blank" rel="noopener">View official call →</a>
        </article>`).join('') : '<p class="dscr-empty">No open calls in this programme right now.</p>';
    }

    PROGRAMMES.forEach(programme => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dscr-filter' + (programme === active ? ' active' : '');
      button.textContent = programme === 'ALL' ? 'All calls' : programme;
      button.addEventListener('click', () => {
        active = programme;
        filters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
        draw();
      });
      filters.appendChild(button);
    });
    const sectors = [...new Set(validCalls.flatMap(call => call.sector_tags || []))].sort();
    ['ALL', ...sectors].forEach(sector => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dscr-sector-filter' + (sector === 'ALL' ? ' active' : '');
      button.textContent = sector === 'ALL' ? 'All sectors' : sector;
      button.addEventListener('click', () => {
        activeSector = sector;
        sectorFilters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
        draw();
      });
      sectorFilters.appendChild(button);
    });
    sectorFilters.insertAdjacentHTML('afterbegin', '<span class="dscr-sector-label">Sector</span>');
    const audiences = [...new Set(validCalls.flatMap(call => call.audiences || []))].sort();
    ['ALL', ...audiences].forEach(audience => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'dscr-audience-filter' + (audience === 'ALL' ? ' active' : '');
      button.textContent = audience === 'ALL' ? 'Everyone' : audience;
      button.addEventListener('click', () => {
        activeAudience = audience;
        audienceFilters.querySelectorAll('button').forEach(item => item.classList.toggle('active', item === button));
        draw();
      });
      audienceFilters.appendChild(button);
    });
    audienceFilters.insertAdjacentHTML('afterbegin', '<span class="dscr-sector-label">For</span>');
    draw();
  }

  function init() {
    const container = document.getElementById('deepsync-call-radar');
    if (!container) return;
    injectStyles();
    fetch(container.dataset.src || '/data/calls.json', { cache: 'no-store' })
      .then(response => { if (!response.ok) throw new Error('HTTP ' + response.status); return response.json(); })
      .then(data => render(container, data))
      .catch(() => { container.innerHTML = '<p class="dscr-empty">The funding radar is being refreshed. Please check again shortly.</p>'; });
  }

  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init);
  else init();
})();
