(function () {
  const STORAGE_KEY = "deepsyncConsent";

  function injectStyles() {
    if (document.getElementById("deepsync-cookie-consent-style")) return;
    const style = document.createElement("style");
    style.id = "deepsync-cookie-consent-style";
    style.textContent = `
      .deepsync-cookie-banner { position: fixed; left: 16px; right: 16px; bottom: 16px; z-index: 9999; display: flex; flex-wrap: wrap; align-items: center; gap: 16px; max-width: 900px; margin: 0 auto; padding: 18px 22px; border-radius: 16px; background: var(--navy, #0A1628); color: #fff; box-shadow: 0 20px 50px rgba(3,15,31,.35); font-family: var(--font-main, 'Manrope', sans-serif); }
      .deepsync-cookie-banner p { flex: 1 1 320px; margin: 0; font-size: 13.5px; line-height: 1.55; color: rgba(255,255,255,.82); }
      .deepsync-cookie-banner a { color: var(--gold, #FFCC00); text-decoration: underline; }
      .deepsync-cookie-actions { display: flex; flex: 0 0 auto; gap: 10px; }
      .deepsync-cookie-actions button { padding: 10px 16px; border-radius: 10px; border: 1px solid transparent; font-family: inherit; font-size: 13px; font-weight: 700; cursor: pointer; }
      .deepsync-cookie-accept { background: var(--gold, #FFCC00); color: var(--navy, #0A1628); }
      .deepsync-cookie-decline { background: transparent; border-color: rgba(255,255,255,.3); color: #fff; }
      @media (max-width: 560px) { .deepsync-cookie-banner { flex-direction: column; align-items: stretch; } .deepsync-cookie-actions { justify-content: stretch; } .deepsync-cookie-actions button { flex: 1; } }
    `;
    document.head.appendChild(style);
  }

  function loadAnalytics() {
    if (typeof window.deepsyncLoadAnalytics === "function") window.deepsyncLoadAnalytics();
  }

  function showBanner() {
    if (document.querySelector(".deepsync-cookie-banner")) return;
    injectStyles();
    const banner = document.createElement("div");
    banner.className = "deepsync-cookie-banner";
    banner.setAttribute("role", "dialog");
    banner.setAttribute("aria-label", "Cookie consent");
    banner.innerHTML = `
      <p>We use Google Analytics cookies to understand how the site is used. They are only set if you accept. See our <a href="/privacy/">Privacy Policy</a>.</p>
      <div class="deepsync-cookie-actions">
        <button type="button" class="deepsync-cookie-decline">Decline</button>
        <button type="button" class="deepsync-cookie-accept">Accept</button>
      </div>`;
    document.body.appendChild(banner);
    banner.querySelector(".deepsync-cookie-accept").addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, "granted");
      banner.remove();
      loadAnalytics();
    });
    banner.querySelector(".deepsync-cookie-decline").addEventListener("click", () => {
      localStorage.setItem(STORAGE_KEY, "denied");
      banner.remove();
    });
  }

  window.deepsyncOpenCookieSettings = function () {
    localStorage.removeItem(STORAGE_KEY);
    showBanner();
  };

  function init() {
    const choice = localStorage.getItem(STORAGE_KEY);
    if (choice === "granted") loadAnalytics();
    else if (choice !== "denied") showBanner();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
