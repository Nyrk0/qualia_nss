# Wiki Module Implementation Plan

**Version:** 1.1
**Date:** 2025-09-01

## 1. Objective

To integrate the project's GitHub Wiki directly into the Qualia-NSS web application as a new, dynamic "Wiki" module. This module will serve a dual purpose:

1.  **Primary (User Guide):** To guide users through the workflow of designing a Qualia NSS natural surround sound loudspeaker setup, following the logical progression of the tools in the main navbar.
2.  **Secondary (Developer Docs):** To provide a comprehensive technical reference for developers and contributors, accessible directly within the app.

## 2. Technical Approach: "Live Fetch" Module

This project will use a "Live Fetch" approach, where the application dynamically reads the content of the separate `qualia_nss.wiki` repository at runtime. This ensures the documentation is always synchronized without requiring complex symlinks, submodules, or build steps.

Clarification on endpoints used by the browser:

- Raw Markdown fetch (rendered client-side):
  - `https://raw.githubusercontent.com/wiki/{owner}/{mainRepo}/{path}.md`
  - Example: `https://raw.githubusercontent.com/wiki/Nyrk0/qualia_nss/Home.md`
  - Note: even though the wiki is a separate repository (`qualia_nss.wiki`), the raw endpoint uses the main repo name (`qualia_nss`).
- Directory listing for dynamic TOC (GitHub Contents API):
  - `https://api.github.com/repos/{owner}/{mainRepo}.wiki/contents/{dir}`
  - Example: `https://api.github.com/repos/Nyrk0/qualia_nss.wiki/contents/User-Guide`
  - This is where the `.wiki` repo name is used.

Additional notes:
- Image assets referenced relatively in Markdown are fetched from the raw wiki base: `https://raw.githubusercontent.com/wiki/{owner}/{mainRepo}/{relativePath}`.
- In-app navigation captures relative links ending with `.md` and loads them within the module; other relative links open on the GitHub wiki site in a new tab.

## 3. Wiki Repository Structure

To facilitate the dual-purpose documentation, the `qualia_nss.wiki` repository will be organized with the following directory structure:

```
qualia_nss.wiki/
├── User-Guide/
│   ├── 00-Introduction.md
│   ├── 01-Speakers-Analysis.md
│   └── ... (files for each step in the workflow)
├── Developer-Docs/
│   ├── Architecture-Overview.md
│   └── Module-API.md
└── Home.md
```

## 4. Application Implementation Steps

### Step 1: Create the "Wiki" Module

-   **Navigation:** If it not exists, add a "Wiki" link to the main navbar in `index.html`.
-   **Module Templates:** It it not exists, add new entries for the `wiki` module in `sidebar-manager.js` and `module-loader.js`.
-   **Routing:** Add a `loadWiki()` function in `navigation.js`, if it not exists.

### Step 2: Implement Dynamic Table of Contents (via GitHub API)

-   When the `wiki` module is loaded, its JavaScript will perform the following:
    1.  Call `GET https://api.github.com/repos/{owner}/{repo}.wiki/contents/User-Guide` and `.../Developer-Docs` to retrieve `.md` file listings (CORS-allowed).
    2.  Sort files by numeric prefix if present (`01-...`, `02-...`).
    3.  Generate the sidebar accordion HTML with links (`data-path`) targeting the raw Markdown URL.
    4.  Cache the TOC structure in `localStorage` with a short TTL (10 minutes) to mitigate unauthenticated rate limits (~60/hour per IP).

### Step 3: Implement Markdown Content Renderer (client-side)

-   **Event Handling:** An event listener will be attached to the sidebar links.
-   **File Fetching:** On click, fetch the raw Markdown from `raw.githubusercontent.com/wiki/{owner}/{mainRepo}/{path}.md`.
-   **Markdown-to-HTML:** Use Marked.js to parse Markdown. Then sanitize with DOMPurify before insertion to prevent XSS.
-   **Mermaid:** Convert fenced code blocks with language `mermaid` into `<div class="mermaid">…</div>` and run `mermaid.init()` after injection.
-   **Link & Image Rewriting:** Rewrite relative links and images to absolute wiki URLs so in-page navigation and assets resolve.
-   **Rendering:** Inject the sanitized HTML into `#wiki-content-container`.

## 5. Advantages of this Plan

-   **Always Synchronized:** The documentation displayed in the app is a live view of the wiki repository.
-   **Clean Architecture:** The app and wiki codebases remain completely separate and decoupled.
-   **No Build Step:** The integration works seamlessly with the project's existing static-serving model.
-   **Excellent UX:** Users and developers can access all necessary documentation without ever leaving the application interface.

## TO-DO:

The Home.md file is not a simple list and it do not serve as a dynamic table of contents. Instead, it is a home document introducing the user to the wiki. It must be fetched from the GitHub wiki repository and rendered as HTML into the wiki's content container when the wiki module is loaded.

Given the user's strict "NO STATIC CONTENT" rule, the wiki's TOC sidebar must be generated dynamically from the GitHub wiki repository using the GitHub Contents API.

   1. Use GitHub Contents API to build dynamic TOC from actual wiki directories:
      - `GET https://api.github.com/repos/{owner}/{repo}.wiki/contents/User-Guide`
      - `GET https://api.github.com/repos/{owner}/{repo}.wiki/contents/Developer-Docs`
      - Parse directory listings to build TOC structure.
      - Sort files by numeric prefix if present.
   2. Fallbacks:
      - If directories are empty, show only "General/Home".
      - Handle API rate limits gracefully.
   3. Caching:
      - Cache parsed TOC in `localStorage` for 24h; on load, serve cached immediately and revalidate in background.
   4. Content fetching remains via RAW wiki URLs for pages and images.
   5. Integrate Marked.js + DOMPurify pipeline. Sanitize before injecting into `#wiki-content-container`.
   6. Mermaid pipeline: identify mermaid blocks, wrap into `<div class="mermaid">`, then call `mermaid.init()`.
   7. Rewrite relative links and image sources in rendered HTML:
        - Relative `.md` links: handled in-app to keep SPA flow.
        - Other relative anchors: open to `https://github.com/{owner}/{mainRepo}/wiki/{path}` in new tab.
        - Relative images: rewritten to the raw wiki base.
   8. Maintain the SPA shell contract:
         - Sidebar: insert accordion into `#sidebar-content` with inner `#wiki-toc-container`.
      - Main: inject content into `#wiki-content-container`.
   9. Load initial page from live wiki: `Home.md`.

## 5. App Shell Integration Requirements

- Use the Advanced Module Layout containers as defined in `dev/st00-wireframe/APP_SHELL_WIREFRAME.md`:
  - Sidebar structure provided by `src/js/sidebar-manager.js` with `#sidebar-canvas` → `#sidebar-content` → `#wiki-toc-container`.
  - Main content area provides `#wiki-content-container` (via `src/js/module-loader.js`).
- The wiki module JavaScript (`src/wiki/index.js`) must target those IDs.

Global dependencies (loaded in `index.html`):
- Marked: `https://cdn.jsdelivr.net/npm/marked/marked.min.js`
- DOMPurify: `https://cdn.jsdelivr.net/npm/dompurify/dist/purify.min.js`
- Mermaid: `https://cdn.jsdelivr.net/npm/mermaid/dist/mermaid.min.js`

## 6. Security and Reliability

- Sanitize all rendered Markdown with DOMPurify before inserting into the DOM.
- Mermaid `securityLevel` currently set to `loose` to allow HTML labels; consider tightening after audit of diagrams.
- Handle fetch errors, 404s, and CORS gracefully; show meaningful alerts and console diagnostics.
- Consider a basic retry/backoff for transient failures; respect API rate limit responses.

## 7. Rate Limits and Caching

- Unauthenticated GitHub API limit is ~60 requests/hour per IP. TOC requires 2 requests (User-Guide, Developer-Docs).
- Cache TOC results in `localStorage` with a 24-hour TTL; revalidate in background (see Strategy A).
- Raw content is CDN-cached by GitHub; allow for short propagation delay after wiki updates.

### Strategy A (Current): Enhanced Live-Fetch with Robust Caching

- __TOC cache__: `localStorage` key `wiki_toc_cache_v1` with 24h TTL; on load, serve cached immediately and fire a background refresh to update if stale.
- __Per-page cache__: Store sanitized HTML per page key `wiki:html:{path}` and optional `wiki:etag:{path}` when available. On navigation:
  - If cached HTML exists, render immediately.
  - Fetch raw Markdown in background; if changed, update caches and re-render silently.
- __Stale-While-Revalidate__: Prefer cached content first, then update in background.
- __Service Worker (SW)__: Add a small SW to cache TOC, raw MD, and wiki images.
  - TOC: stale-while-revalidate strategy.
  - Raw MD: cache-first with background update.
  - Images: cache-first.
- __Rate-limit handling__: On 403 (API limit), display a non-blocking banner and use cached content; retry after backoff.
- __Optional PAT support__: Advanced users may paste a GitHub Personal Access Token (scoped minimally to public repos). Store locally (not in code) and add `Authorization: token ...` header to boost limits. This is optional and off by default.

Rationale: preserves “no static content” policy while delivering near-instant UX and resilience.

## 8. Testing Phase (Standalone Harness)

- Validate libraries and rendering using a standalone page:
  - File: `dev/st05-repo-wiki/MERMAID-TEST.html`
  - Loads Marked.js, DOMPurify, and Mermaid via CDN.
  - UI allows fetching an arbitrary wiki Markdown path (default: `Home.md`).
  - Pipeline: fetch raw → parse (Marked) → transform Mermaid blocks → sanitize (DOMPurify) → render → `mermaid.init()`.
  - Rewrites links/images for correctness in the harness.


## 9. Mermaid Integration

Mermaid diagrams are supported in Markdown by converting fenced code blocks with language `mermaid` into `<div class="mermaid">…</div>` during the render step, then invoking `mermaid.init()` after insertion. This avoids custom Marked renderers and keeps the integration simple and robust.

More information: https://mermaid.js.org/integrations/markedjs.html
https://github.blog/developer-skills/github/include-diagrams-markdown-files-mermaid/
https://github.com/mermaid-js/mermaid/issues/2066

## 10. Minimalist UI Styling (Current Direction)

- Wiki content uses full available width; no max-width cap.
- Sidebar TOC has no shadows; flattened backgrounds and minimal borders.
- Active/hover indication via a simple left border and primary color only.
- Images render without drop-shadows.

## 11. Implementation Status (as of 2025-09-02)

- [x] Module wiring: `sidebar-manager.js` and `module-loader.js` inject `#wiki-toc-container` and `#wiki-content-container`.
- [x] Dynamic TOC via GitHub Contents API with localStorage cache (10min TTL per PRD).
- [x] Raw Markdown fetch via `raw.githubusercontent.com/wiki/...`.
- [x] Marked parsing + DOMPurify sanitization.
- [x] Mermaid block conversion and rendering.
- [x] Link/image rewriting rules implemented.
- [x] Global CDNs added in `index.html` for Marked, DOMPurify, Mermaid.
- [x] Minimalist styling applied to wiki module.
- [x] Standalone harness (`MERMAID-TEST.html`) implemented and validated.
- [x] **PHP TOC Generator**: `src/wiki-utils/generate-toc.php` fully functional.
- [x] **Docker Development Environment**: Local PHP 8.1 + Apache + MariaDB server.
- [x] **Complete Integration**: All wiki components verified working together.

**AUDIT COMPLETED (2025-09-02)**: Full wiki module setup is functional and production-ready.

Open items / Future enhancements:
- [ ] Evaluate tightening Mermaid `securityLevel` if diagrams do not need HTML labels.
- [ ] Add active TOC highlighting synced to current page.
- [ ] Optional: remember scroll position per page.
- [ ] Consider implementing Strategy C (pre-render pipeline) for production optimization.

## 12. Future Improvement: Strategy C — Pre-render + Sync (Scheduled)

Goal: Highest performance and zero external dependency at runtime by serving static HTML generated from the wiki.

Proposed pipeline:
- __Trigger__: On push to `qualia_nss.wiki` or nightly.
- __Build__: GitHub Action runs Node script to:
  - Clone wiki repo.
  - Convert `.md` → sanitized HTML using Marked + DOMPurify.
  - Render Mermaid diagrams server-side (e.g., mermaid CLI/headless or pre-wrap and let client render if CLI unavailable).
  - Emit `/wiki/html/{path}.html` and a manifest `manifest.json` for TOC.
- __Publish__: Sync to server `/wiki/html/` via SFTP/rsync (reusing patterns from existing workflows).
- __App integration__: Add optional fallback: if GitHub fetch fails or rate-limited, load from `/wiki/html/{path}.html`.

Notes:
- This adjusts the "no static content" policy for documentation only. It is optional and can coexist with Strategy A as a failover.

## 13. Docker Development Environment Setup

**Date Added**: 2025-09-02  
**Purpose**: Enables local PHP execution for `src/wiki-utils/generate-toc.php` and full wiki development.

### Dockerfile Configuration
```dockerfile
# Use official PHP 8.1 image with Apache (HTTPD) pre-installed
FROM php:8.1-apache

# Install system dependencies for MariaDB
RUN apt-get update && apt-get install -y \
    gnupg2 \
    wget \
    curl \
    lsb-release \
    && rm -rf /var/lib/apt/lists/*

# Install MariaDB Server (latest available version)
RUN apt-get update && apt-get install -y \
    mariadb-server \
    mariadb-client \
    && rm -rf /var/lib/apt/lists/*

# Install PHP extensions for MySQL connectivity
RUN docker-php-ext-install mysqli pdo_mysql

# Enable Apache modules if needed (mod_rewrite is useful for many apps)
RUN a2enmod rewrite

# Set working directory
WORKDIR /var/www/html

# Copy your application code into the container (we'll mount it via volumes later)
COPY . /var/www/html

# Set proper permissions
RUN chown -R www-data:www-data /var/www/html \
    && chmod -R 755 /var/www/html

# Expose ports 80 (Apache) and 3306 (MariaDB)
EXPOSE 80 3306
```

### Quick Start Commands
```bash
# Build and run the development environment
docker build -t qualia-nss .
docker run -d --name qualia-nss -p 8080:80 -p 3306:3306 qualia-nss

# Test PHP TOC generator
docker exec qualia-nss php /var/www/html/src/wiki-utils/generate-toc.php

# Access application
# Web: http://localhost:8080
# Database: localhost:3306
```

### Environment Specifications
- **PHP**: 8.1.33 (matches production)
- **Apache**: 2.4.65 with mod_rewrite enabled  
- **MariaDB**: 11.8.2
- **Platform**: Debian Trixie (ARM64/AMD64 compatible)

### Key Benefits
1. **Local PHP Execution**: Enables `generate-toc.php` to run server-side
2. **Complete Integration**: All wiki components functional in development
3. **Production Parity**: Same PHP version as hosting environment
4. **Database Ready**: MariaDB available for future features

### Common Troubleshooting
- **Internal Server Error**: Check `.htaccess` for `<Directory>` directives (not allowed in `.htaccess`)
- **Port Conflicts**: Use different ports if 8080/3306 are occupied
- **Volume Mounting**: Files are live-mounted from host project directory

**Documentation Reference**: See `dev_deployment/dev_local_docker.md` for comprehensive setup guide.
