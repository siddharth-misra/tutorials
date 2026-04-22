(function () {
  const pagePath = globalThis.location?.pathname || "";
  const isHomePage = pagePath.endsWith("/index.html") || pagePath.endsWith("/");
  const isSystemDesignPage = pagePath.endsWith("/system-design/systemdesign.html");
  const isAgenticAiPage = pagePath.endsWith("/agentic-system/agentic-ai.html");

  let pageConfig = null;

  if (isHomePage) {
    pageConfig = {
      current: "home",
      title: null,
      isReader: false,
      homeHref: "./index.html",
    };
  } else if (isSystemDesignPage) {
    pageConfig = {
      current: "system-design",
      title: "System Design",
      isReader: true,
      homeHref: "../index.html",
    };
  } else if (isAgenticAiPage) {
    pageConfig = {
      current: "agentic-ai",
      title: "Agentic AI",
      isReader: true,
      homeHref: "../index.html",
    };
  }

  if (!pageConfig) return;

  const host = document.querySelector(".shell, .app-shell");
  if (!host || host.querySelector("[data-unified-topbar]")) return;

  const styleId = "tutorial-atlas-topbar-style";
  if (!document.getElementById(styleId)) {
    const style = document.createElement("style");
    style.id = styleId;
    style.textContent = `
      .atlas-topbar {
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        z-index: 100;
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 24px;
        border-bottom: 1px solid rgba(101, 61, 42, 0.14);
        background: rgba(255, 251, 245, 0.92);
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        box-shadow: 0 4px 24px rgba(42, 24, 16, 0.1);
      }

      body {
        padding-top: 68px;
      }

      .atlas-topbar__left {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        min-width: 0;
      }

      .atlas-topbar__center {
        display: flex;
        align-items: center;
        justify-content: center;
        flex: 1;
        min-width: 0;
      }

      .atlas-topbar__right {
        display: flex;
        align-items: center;
        justify-content: flex-end;
        flex: 1;
      }

      .atlas-topbar__brand {
        color: var(--clay-deep, var(--accent, #7f3519));
        font: 700 0.88rem/1 var(--font-ui, "Avenir Next", "Segoe UI", sans-serif);
        letter-spacing: 0.18em;
        text-decoration: none;
        text-transform: uppercase;
        white-space: nowrap;
        flex-shrink: 0;
      }

      .atlas-topbar__sep {
        display: block;
        width: 1px;
        height: 22px;
        background: rgba(101, 61, 42, 0.18);
        flex-shrink: 0;
      }

      /* ── Topics nav dropdown ── */
      .atlas-topbar__nav-menu {
        position: relative;
      }

      .atlas-topbar__nav-btn {
        display: inline-flex;
        align-items: center;
        gap: 6px;
        min-height: 34px;
        padding: 6px 12px 6px 14px;
        border: 1px solid rgba(127, 53, 25, 0.12);
        border-radius: 999px;
        background: rgba(255, 255, 255, 0.42);
        color: var(--ink, #211915);
        font: 600 0.88rem/1 var(--font-ui, "Avenir Next", "Segoe UI", sans-serif);
        cursor: pointer;
        transition: transform 160ms ease, background 160ms ease, border-color 160ms ease, color 160ms ease;
      }

      .atlas-topbar__nav-btn:hover {
        transform: translateY(-1px);
        background: rgba(255, 255, 255, 0.76);
        border-color: rgba(127, 53, 25, 0.26);
      }

      .atlas-topbar__nav-btn.is-active {
        background: linear-gradient(135deg, var(--clay, var(--accent, #a8502f)) 0%, var(--clay-deep, var(--accent, #7f3519)) 100%);
        border-color: transparent;
        color: #fff9f2;
        box-shadow: 0 8px 20px rgba(127, 53, 25, 0.22);
      }

      .atlas-topbar__nav-btn svg {
        flex-shrink: 0;
        opacity: 0.7;
        transition: transform 200ms ease;
      }

      .atlas-topbar__nav-btn[aria-expanded="true"] svg {
        transform: rotate(180deg);
      }

      .atlas-topbar__nav-dropdown {
        position: absolute;
        top: calc(100% + 10px);
        left: 0;
        min-width: 200px;
        padding: 6px;
        border: 1px solid rgba(101, 61, 42, 0.14);
        border-radius: 16px;
        background: rgba(255, 251, 245, 0.97);
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        box-shadow: 0 16px 40px rgba(42, 24, 16, 0.14);
        z-index: 200;
        transform-origin: top left;
        transform: scale(0.94) translateY(-6px);
        opacity: 0;
        pointer-events: none;
        transition: transform 160ms ease, opacity 160ms ease;
      }

      .atlas-topbar__nav-dropdown.is-open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      .atlas-topbar__nav-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 9px 14px;
        border-radius: 10px;
        color: var(--ink, #211915);
        font: 500 0.92rem/1.2 var(--font-ui, "Avenir Next", "Segoe UI", sans-serif);
        text-decoration: none;
        transition: background 120ms ease, color 120ms ease;
      }

      .atlas-topbar__nav-item:hover {
        background: rgba(168, 80, 47, 0.08);
        color: var(--clay-deep, #7f3519);
        text-decoration: none;
      }

      .atlas-topbar__nav-item.is-current {
        background: rgba(168, 80, 47, 0.12);
        color: var(--clay-deep, #7f3519);
        font-weight: 700;
      }

      .atlas-topbar__title {
        margin: 0;
        color: var(--ink, #211915);
        font: 700 1rem/1.1 var(--font-display, var(--font-ui, "Avenir Next", "Segoe UI", sans-serif));
        letter-spacing: -0.01em;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

      /* ── View-options hamburger ── */
      .atlas-topbar__menu {
        position: relative;
      }

      .atlas-topbar__menu-btn {
        display: flex;
        flex-direction: column;
        justify-content: center;
        align-items: center;
        gap: 5px;
        width: 38px;
        height: 38px;
        padding: 0;
        border: 1px solid rgba(127, 53, 25, 0.14);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.42);
        cursor: pointer;
        transition: background 160ms ease, border-color 160ms ease;
      }

      .atlas-topbar__menu-btn:hover,
      .atlas-topbar__menu-btn[aria-expanded="true"] {
        background: rgba(255, 255, 255, 0.82);
        border-color: rgba(127, 53, 25, 0.28);
      }

      .atlas-topbar__menu-btn span {
        display: block;
        width: 16px;
        height: 2px;
        border-radius: 2px;
        background: var(--ink, #211915);
        transition: transform 200ms ease, opacity 200ms ease;
      }

      .atlas-topbar__dropdown {
        position: absolute;
        top: calc(100% + 10px);
        right: 0;
        min-width: 188px;
        padding: 6px;
        border: 1px solid rgba(101, 61, 42, 0.14);
        border-radius: 16px;
        background: rgba(255, 251, 245, 0.97);
        -webkit-backdrop-filter: blur(20px);
        backdrop-filter: blur(20px);
        box-shadow: 0 16px 40px rgba(42, 24, 16, 0.14);
        z-index: 200;
        transform-origin: top right;
        transform: scale(0.94) translateY(-6px);
        opacity: 0;
        pointer-events: none;
        transition: transform 160ms ease, opacity 160ms ease;
      }

      .atlas-topbar__dropdown.is-open {
        transform: scale(1) translateY(0);
        opacity: 1;
        pointer-events: auto;
      }

      .atlas-topbar__dropdown-item {
        display: flex;
        align-items: center;
        width: 100%;
        padding: 9px 14px;
        border: none;
        border-radius: 10px;
        background: transparent;
        color: var(--ink, #211915);
        font: 500 0.92rem/1.2 var(--font-ui, "Avenir Next", "Segoe UI", sans-serif);
        text-align: left;
        cursor: pointer;
        transition: background 120ms ease, color 120ms ease;
      }

      .atlas-topbar__dropdown-item:hover {
        background: rgba(168, 80, 47, 0.08);
        color: var(--clay-deep, #7f3519);
      }

      .atlas-topbar__dropdown-item.is-active {
        background: rgba(168, 80, 47, 0.12);
        color: var(--clay-deep, #7f3519);
        font-weight: 700;
      }

      .atlas-topbar__dropdown-divider {
        margin: 5px 8px;
        border: none;
        border-top: 1px solid rgba(101, 61, 42, 0.12);
      }

      @media (max-width: 720px) {
        .atlas-topbar {
          padding: 10px 14px;
          gap: 8px;
        }

        .atlas-topbar__sep {
          display: none;
        }

        .atlas-topbar__center {
          display: none;
        }
      }

      /* ── Chapter navigation buttons ── */
      .atlas-topbar__chapter-nav {
        display: flex;
        align-items: center;
        gap: 4px;
        margin-right: 6px;
      }

      .atlas-topbar__chapter-btn {
        display: flex;
        align-items: center;
        justify-content: center;
        width: 34px;
        height: 34px;
        padding: 0;
        border: 1px solid rgba(127, 53, 25, 0.14);
        border-radius: 10px;
        background: rgba(255, 255, 255, 0.42);
        color: var(--ink, #211915);
        cursor: pointer;
        transition: background 160ms ease, border-color 160ms ease, opacity 160ms ease;
      }

      .atlas-topbar__chapter-btn:hover:not(:disabled) {
        background: rgba(255, 255, 255, 0.82);
        border-color: rgba(127, 53, 25, 0.28);
      }

      .atlas-topbar__chapter-btn:disabled {
        opacity: 0.32;
        cursor: default;
      }

      @media print {
        .atlas-topbar {
          display: none !important;
        }
      }

      /* ── Scroll-offset fix: keep anchor targets clear of fixed topbar ── */
      h1, h2, h3, h4 {
        scroll-margin-top: 92px;
      }

      /* ── Sticky sidebar: shift down so topbar doesn't cover it ── */
      .sidebar {
        top: 92px;
        max-height: calc(100vh - 116px);
      }
    `;
    document.head.append(style);
  }

  // Derive base so links work from any page depth (home = "./", reader = "../")
  const base = pageConfig.homeHref.replace("index.html", "");

  const topicLinks = [
    {
      key: "system-design",
      href: `${base}system-design/systemdesign.html`,
      label: "System Design",
    },
    {
      key: "agentic-ai",
      href: `${base}agentic-system/agentic-ai.html`,
      label: "Agentic AI",
    },
  ];

  const currentTopic = topicLinks.find((l) => l.key === pageConfig.current);
  const navBtnLabel = currentTopic ? currentTopic.label : "Topics";
  const navBtnActiveClass = currentTopic ? " is-active" : "";

  const navItemsMarkup = topicLinks
    .map((link) => {
      const isCurrent = link.key === pageConfig.current;
      return `<a class="atlas-topbar__nav-item${isCurrent ? " is-current" : ""}" href="${link.href}"${isCurrent ? ' aria-current="page"' : ""}>${link.label}</a>`;
    })
    .join("");

  const topicsDropdownMarkup = `
    <div class="atlas-topbar__nav-menu" data-nav-menu>
      <button class="atlas-topbar__nav-btn${navBtnActiveClass}" type="button" aria-label="Tutorial topics" aria-expanded="false" aria-haspopup="true" data-nav-btn>
        ${navBtnLabel}
        <svg width="10" height="6" viewBox="0 0 10 6" fill="none" aria-hidden="true">
          <path d="M1 1l4 4 4-4" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      </button>
      <div class="atlas-topbar__nav-dropdown" data-nav-dropdown>
        ${navItemsMarkup}
      </div>
    </div>
  `;

  const titleMarkup = pageConfig.isReader
    ? `<h1 class="atlas-topbar__title">${pageConfig.title}</h1>`
    : "";

  const chapterNavMarkup = pageConfig.isReader
    ? `
        <div class="atlas-topbar__chapter-nav" data-topbar-chapter-nav hidden>
          <button class="atlas-topbar__chapter-btn" type="button" aria-label="Previous chapter" data-topbar-prev-chapter disabled>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true"><path d="M6 1L1 6l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
          <button class="atlas-topbar__chapter-btn" type="button" aria-label="Next chapter" data-topbar-next-chapter>
            <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
          </button>
        </div>
      `
    : "";

  const menuMarkup = pageConfig.isReader
    ? `
        <div class="atlas-topbar__menu" data-topbar-menu>
          <button class="atlas-topbar__menu-btn" type="button" aria-label="View options" aria-expanded="false" aria-haspopup="true" data-topbar-menu-btn>
            <span></span>
            <span></span>
            <span></span>
          </button>
          <div class="atlas-topbar__dropdown" data-topbar-dropdown>
            <button class="atlas-topbar__dropdown-item" type="button" data-view-mode="continuous">Single Page</button>
            <button class="atlas-topbar__dropdown-item" type="button" data-view-mode="chapter">Chapter Wise</button>
            <hr class="atlas-topbar__dropdown-divider" />
            <button class="atlas-topbar__dropdown-item" type="button" data-print>Print / Save PDF</button>
          </div>
        </div>
      `
    : "";

  const nav = document.createElement("nav");
  nav.className = "atlas-topbar";
  nav.dataset.unifiedTopbar = pageConfig.current;
  nav.setAttribute("aria-label", "Tutorials navigation");

  nav.innerHTML = `
    <div class="atlas-topbar__left">
      <a class="atlas-topbar__brand" href="${pageConfig.homeHref}">Tutorials</a>
    </div>
    <div class="atlas-topbar__center">
      ${topicsDropdownMarkup}
    </div>
    <div class="atlas-topbar__right">
      ${chapterNavMarkup}
      ${menuMarkup}
    </div>
  `;

  host.insertBefore(nav, host.firstChild);

  // ── Topics dropdown toggle ──
  const navBtn = nav.querySelector("[data-nav-btn]");
  const navDropdown = nav.querySelector("[data-nav-dropdown]");

  navBtn.addEventListener("click", (e) => {
    e.stopPropagation();
    const isOpen = navDropdown.classList.toggle("is-open");
    navBtn.setAttribute("aria-expanded", String(isOpen));
  });

  // ── Chapter nav: delegate to sidebar buttons + mirror state ──
  if (pageConfig.isReader) {
    const topbarChapterNav = nav.querySelector("[data-topbar-chapter-nav]");
    const topbarPrev = nav.querySelector("[data-topbar-prev-chapter]");
    const topbarNext = nav.querySelector("[data-topbar-next-chapter]");
    const sidebarControls = document.querySelector("[data-chapter-controls]");
    const sidebarPrev = document.querySelector("[data-prev-chapter]");
    const sidebarNext = document.querySelector("[data-next-chapter]");

    if (topbarChapterNav && sidebarControls && sidebarPrev && sidebarNext) {
      const syncVisibility = () => {
        topbarChapterNav.hidden = sidebarControls.hidden;
      };
      const syncState = () => {
        topbarPrev.disabled = sidebarPrev.disabled;
        topbarNext.disabled = sidebarNext.disabled;
      };

      syncVisibility();
      syncState();

      new MutationObserver(syncVisibility).observe(sidebarControls, { attributes: true, attributeFilter: ["hidden"] });
      new MutationObserver(syncState).observe(sidebarPrev, { attributes: true, attributeFilter: ["disabled"] });
      new MutationObserver(syncState).observe(sidebarNext, { attributes: true, attributeFilter: ["disabled"] });

      topbarPrev.addEventListener("click", () => sidebarPrev.click());
      topbarNext.addEventListener("click", () => sidebarNext.click());
    }
  }

  // ── View-options dropdown toggle (reader pages only) ──
  if (pageConfig.isReader) {
    const menuBtn = nav.querySelector("[data-topbar-menu-btn]");
    const dropdown = nav.querySelector("[data-topbar-dropdown]");

    menuBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      const isOpen = dropdown.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      navDropdown.classList.remove("is-open");
      navBtn.setAttribute("aria-expanded", "false");
    });

    document.addEventListener("click", (e) => {
      if (!nav.querySelector("[data-topbar-menu]").contains(e.target)) {
        dropdown.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
      }
      if (!nav.querySelector("[data-nav-menu]").contains(e.target)) {
        navDropdown.classList.remove("is-open");
        navBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        dropdown.classList.remove("is-open");
        menuBtn.setAttribute("aria-expanded", "false");
        navDropdown.classList.remove("is-open");
        navBtn.setAttribute("aria-expanded", "false");
      }
    });
  } else {
    document.addEventListener("click", (e) => {
      if (!nav.querySelector("[data-nav-menu]").contains(e.target)) {
        navDropdown.classList.remove("is-open");
        navBtn.setAttribute("aria-expanded", "false");
      }
    });

    document.addEventListener("keydown", (e) => {
      if (e.key === "Escape") {
        navDropdown.classList.remove("is-open");
        navBtn.setAttribute("aria-expanded", "false");
      }
    });
  }
})();