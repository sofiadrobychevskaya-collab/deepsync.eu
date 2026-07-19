(function () {
  const PROGRAMMES = ["ALL", "HORIZON EUROPE", "DIGITAL EUROPE", "EIC"];

  function esc(value) {
    return String(value || "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function daysUntil(deadline) {
    return Math.max(0, Math.ceil((new Date(deadline).getTime() - Date.now()) / 86400000));
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
      .dscr-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:14px; }
      .dscr-card { display:flex; flex-direction:column; min-height:290px; padding:24px; border:1px solid #e0e5ec; border-radius:22px; background:white; box-shadow:0 10px 30px rgba(15,31,55,.04); }
      .dscr-meta { display:flex; align-items:center; justify-content:space-between; gap:12px; margin-bottom:20px; }
      .dscr-programme { color:var(--primary,#003399); font-size:10px; font-weight:850; letter-spacing:.08em; }
      .dscr-days { padding:6px 9px; border-radius:999px; background:#eef3ff; color:var(--primary,#003399); font-size:10px; font-weight:800; }
      .dscr-card h3 { margin:0 0 10px; color:var(--navy,#0A1628); font-size:20px; line-height:1.3; }
      .dscr-sector { margin:0 0 16px; color:var(--muted,#5A6A85); font-size:12px; font-weight:700; }
      .dscr-summary { margin:0 0 20px; color:#39465a; font-size:14px; line-height:1.6; }
      .dscr-facts { display:grid; grid-template-columns:1fr 1fr; gap:10px; margin-top:auto; padding-top:16px; border-top:1px solid #edf0f4; }
      .dscr-fact small { display:block; margin-bottom:4px; color:var(--muted,#5A6A85); font-size:9px; font-weight:800; letter-spacing:.08em; text-transform:uppercase; }
      .dscr-fact strong { color:var(--navy,#0A1628); font-size:12px; }
      .dscr-link { display:inline-flex; margin-top:18px; color:var(--primary,#003399); font-size:12px; font-weight:800; text-decoration:none; }
      .dscr-empty { padding:30px; border-radius:18px; background:white; color:var(--muted,#5A6A85); }
      .dscr-footer { display:flex; align-items:center; justify-content:space-between; gap:20px; margin-top:22px; color:var(--muted,#5A6A85); font-size:11px; }
      .dscr-linkedin { color:#0A66C2; font-weight:800; text-decoration:none; }
      @media(max-width:760px){ .dscr-head{align-items:flex-start;flex-direction:column}.dscr-grid{grid-template-columns:1fr}.dscr-card{min-height:0}.dscr-footer{align-items:flex-start;flex-direction:column} }
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
          <span class="dscr-updated">Verified: ${esc(new Date(data.generated_at).toLocaleDateString('en-GB',{day:'numeric',month:'short',year:'numeric'}))}</span>
        </div>
        <div class="dscr-filters" role="group" aria-label="Filter funding calls"></div>
        <div class="dscr-grid"></div>
        <div class="dscr-footer"><span>Data is checked against official EU sources. Always verify conditions before applying.</span><a class="dscr-linkedin" href="https://www.linkedin.com/company/deepsync-eu/" target="_blank" rel="noopener">Get new-call alerts on LinkedIn ↗</a></div>
      </div>`;
    const filters = container.querySelector('.dscr-filters');
    const grid = container.querySelector('.dscr-grid');

    function draw() {
      const calls = validCalls.filter(call => active === 'ALL' || call.programme === active);
      grid.innerHTML = calls.length ? calls.map(call => `
        <article class="dscr-card">
          <div class="dscr-meta"><span class="dscr-programme">${esc(call.programme)} · ${esc(call.type)}</span><span class="dscr-days">${daysUntil(call.deadline)} days left</span></div>
          <h3>${esc(call.title)}</h3>
          <p class="dscr-sector">${esc(call.sector)}</p>
          <p class="dscr-summary">${esc(call.summary)}</p>
          <div class="dscr-facts"><div class="dscr-fact"><small>Budget</small><strong>${esc(call.budget)}</strong></div><div class="dscr-fact"><small>Deadline</small><strong>${esc(call.deadline_label)}</strong></div></div>
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
