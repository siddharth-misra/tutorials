const fs = require("fs");
const path = require("path");
const { tutorials } = require("./tutorials.config");

const templatePath = path.join(__dirname, "topbar.html");

const escapeHtml = (value) => String(value)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;");

const toHref = (hrefFromRoot, depth) => `${depth}${hrefFromRoot}`;

const renderThemeToggle = () => `    <button class="atlas-topbar__theme-btn" type="button" aria-label="Toggle dark mode" data-theme-toggle>
      <svg class="atlas-topbar__theme-icon atlas-topbar__theme-icon--sun" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="4" stroke="currentColor" stroke-width="1.8"/>
        <path d="M12 2v2M12 20v2M4.22 4.22l1.42 1.42M18.36 18.36l1.42 1.42M2 12h2M20 12h2M4.22 19.78l1.42-1.42M18.36 5.64l1.42-1.42" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>
      </svg>
      <svg class="atlas-topbar__theme-icon atlas-topbar__theme-icon--moon" width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>
      </svg>
    </button>`;

const renderReaderControls = () => `    <div class="atlas-topbar__chapter-nav" data-topbar-chapter-nav hidden>
      <button class="atlas-topbar__chapter-btn" type="button" aria-label="Previous chapter" data-topbar-prev-chapter disabled>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true"><path d="M6 1L1 6l5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
      <button class="atlas-topbar__chapter-btn" type="button" aria-label="Next chapter" data-topbar-next-chapter>
        <svg width="7" height="12" viewBox="0 0 7 12" fill="none" aria-hidden="true"><path d="M1 1l5 5-5 5" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/></svg>
      </button>
    </div>
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
    </div>`;

const renderTopbar = ({
  current = "home",
  depth = "./",
  isReader = false,
} = {}) => {
  const template = fs.readFileSync(templatePath, "utf8");
  const homeHref = `${depth}index.html`;
  const currentTopic = tutorials.find((tutorial) => tutorial.key === current);
  const navLabel = currentTopic ? currentTopic.label : "Topics";
  const topicLinks = tutorials.map((tutorial) => {
    const isCurrent = tutorial.key === current;
    const currentClass = isCurrent ? " is-current" : "";
    const ariaCurrent = isCurrent ? ' aria-current="page"' : "";
    return `        <a class="atlas-topbar__nav-item${currentClass}" href="${toHref(tutorial.hrefFromRoot, depth)}" data-topic-link${ariaCurrent}>${escapeHtml(tutorial.label)}</a>`;
  }).join("\n");

  return template
    .replaceAll("{{CURRENT_KEY}}", escapeHtml(current))
    .replaceAll("{{HOME_HREF}}", homeHref)
    .replaceAll("{{NAV_ACTIVE_CLASS}}", currentTopic ? " is-active" : "")
    .replaceAll("{{NAV_LABEL}}", escapeHtml(navLabel))
    .replaceAll("{{TOPIC_LINKS}}", topicLinks)
    .replaceAll("{{THEME_TOGGLE}}", renderThemeToggle())
    .replaceAll("{{READER_CONTROLS}}", isReader ? renderReaderControls() : "");
};

const applyTopbar = (html, options) => {
  const topbar = renderTopbar(options);
  const markedTopbar = /<!-- BEGIN_SHARED_TOPBAR -->[\s\S]*?<!-- END_SHARED_TOPBAR -->/;
  const injectedTopbar = /[ \t]*<nav class="atlas-topbar"[\s\S]*?<\/nav>\s*/;

  let nextHtml = html;
  nextHtml = nextHtml.replace(/<body([^>]*)>/, (match, attrs) => {
    const classMatch = attrs.match(/\bclass="([^"]*)"/);
    if (!classMatch) {
      return `<body class="has-atlas-topbar"${attrs}>`;
    }

    const classes = classMatch[1].split(/\s+/).filter(Boolean);
    if (!classes.includes("has-atlas-topbar")) {
      classes.push("has-atlas-topbar");
    }

    return `<body${attrs.replace(classMatch[0], `class="${classes.join(" ")}"`)}>`;
  });

  if (markedTopbar.test(nextHtml)) {
    return nextHtml.replace(markedTopbar, topbar);
  }

  if (injectedTopbar.test(nextHtml)) {
    return nextHtml.replace(injectedTopbar, `\n${topbar}\n`);
  }

  return nextHtml.replace(
    /(<div class="(?:app-shell|shell)">)\s*/,
    `$1\n    ${topbar}\n`
  );
};

module.exports = { applyTopbar, renderTopbar };
