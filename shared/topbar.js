(function () {
  const nav = document.querySelector("[data-unified-topbar]");
  if (!nav) return;

  const navBtn = nav.querySelector("[data-nav-btn]");
  const navDropdown = nav.querySelector("[data-nav-dropdown]");
  const menuBtn = nav.querySelector("[data-topbar-menu-btn]");
  const menuDropdown = nav.querySelector("[data-topbar-dropdown]");

  const closeTopics = () => {
    if (!navBtn || !navDropdown) return;
    navDropdown.classList.remove("is-open");
    navBtn.setAttribute("aria-expanded", "false");
  };

  const closeMenu = () => {
    if (!menuBtn || !menuDropdown) return;
    menuDropdown.classList.remove("is-open");
    menuBtn.setAttribute("aria-expanded", "false");
  };

  if (navBtn && navDropdown) {
    navBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = navDropdown.classList.toggle("is-open");
      navBtn.setAttribute("aria-expanded", String(isOpen));
      closeMenu();
    });
  }

  if (menuBtn && menuDropdown) {
    menuBtn.addEventListener("click", (event) => {
      event.stopPropagation();
      const isOpen = menuDropdown.classList.toggle("is-open");
      menuBtn.setAttribute("aria-expanded", String(isOpen));
      closeTopics();
    });
  }

  nav.querySelector("[data-topbar-prev-chapter]")?.addEventListener("click", () => {
    globalThis.dispatchEvent(new CustomEvent("tutorial:navigate-chapter", { detail: { step: -1 } }));
  });

  nav.querySelector("[data-topbar-next-chapter]")?.addEventListener("click", () => {
    globalThis.dispatchEvent(new CustomEvent("tutorial:navigate-chapter", { detail: { step: 1 } }));
  });

  nav.querySelector("[data-print]")?.addEventListener("click", () => {
    globalThis.print();
    closeMenu();
  });

  const topbarChapterNav = nav.querySelector("[data-topbar-chapter-nav]");
  const topbarPrev = nav.querySelector("[data-topbar-prev-chapter]");
  const topbarNext = nav.querySelector("[data-topbar-next-chapter]");
  const sidebarControls = document.querySelector("[data-chapter-controls]");
  const sidebarPrev = document.querySelector("[data-prev-chapter]");
  const sidebarNext = document.querySelector("[data-next-chapter]");

  if (topbarChapterNav && sidebarControls && sidebarPrev && sidebarNext && topbarPrev && topbarNext) {
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
  }

  document.addEventListener("click", (event) => {
    if (!nav.querySelector("[data-nav-menu]")?.contains(event.target)) {
      closeTopics();
    }

    if (!nav.querySelector("[data-topbar-menu]")?.contains(event.target)) {
      closeMenu();
    }
  });

  document.addEventListener("keydown", (event) => {
    if (event.key !== "Escape") return;
    closeTopics();
    closeMenu();
  });
})();
