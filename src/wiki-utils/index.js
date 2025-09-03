/* moved from src/wiki/index.js */
/**
 * WikiModule - Dynamic documentation system for Qualia-NSS
 * Implements a "Live Fetch" approach using local PHP TOC + GitHub Raw URLs.
 * Content loads into #main-content .module-content for proper app shell integration.
 * @author Qualia-NSS Development Team  
 * @version 3.4.0 - Fixed: Mermaid diagram rendering by removing HTML escaping + improved DOMPurify config
 */
class WikiModule {
    constructor() {
        this.tocContainer = document.getElementById('wiki-toc-container');
        this.contentContainer = document.querySelector('#main-content .module-content');
        this.currentPath = null;
        this.rateLimitBannerShown = false;

        // Configuration for GitHub Wiki endpoints
        // Raw markdown uses the main repo name
        this.githubConfig = {
            owner: 'Nyrk0',
            mainRepo: 'qualia_nss',
            rawBaseUrl: 'https://raw.githubusercontent.com/wiki/Nyrk0/qualia_nss/'
        };

        this.initializeMermaid();
    }

    initializeMermaid() {
        if (typeof mermaid !== 'undefined') {
            mermaid.initialize({
                startOnLoad: true,
                theme: 'default',
                securityLevel: 'loose'
            });
            console.log('🧜‍♀️ Mermaid initialized for wiki diagrams');
        } else {
            console.warn('⚠️ Mermaid.js not loaded, diagrams will not render');
        }
    }

    /**
     * Fetches a page from the GitHub wiki and returns status + text for rate-limit handling.
     * @param {string} pagePath - e.g., 'Home.md' or 'User-Guide/01-Getting-Started.md'.
     * @returns {Promise<{ok:boolean,status:number,text:string}>}
     */
    async fetchGitHubContent(pagePath) {
        const url = `${this.githubConfig.rawBaseUrl}${pagePath}`;
        console.log(`🌐 Fetching GitHub content: ${url}`);
        try {
            const response = await fetch(url);
            const text = await response.text();
            return { ok: response.ok, status: response.status, text };
        } catch (error) {
            console.error(`❌ Failed to fetch GitHub content for ${pagePath}:`, error);
            return { ok: false, status: 0, text: '' };
        }
    }

    async init() {
        console.log('📚 Initializing Wiki Module...');
        if (!this.tocContainer || !this.contentContainer) {
            console.error('❌ Wiki module containers not found in DOM');
            console.error('Expected: #wiki-toc-container and #main-content .module-content');
            return;
        }

        try {
            await this.buildTOC();
            await this.loadInitialPage();
            this.registerServiceWorker();
            this.revalidateTOCInBackground();
            console.log('✅ Wiki Module initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Wiki Module:', error);
            this.showError('Failed to initialize wiki module. See console for details.');
        }
    }

    /**
     * Builds the Table of Contents from GitHub Contents API with 10min cache.
     */
    async buildTOC() {
        console.log('🔍 Building Wiki Table of Contents...');
        const sections = await this.getWikiTOC();

        const sectionsHTML = sections.map(sec => this.createAccordionSection(sec.id, sec.title, sec.files)).join('');

        this.tocContainer.innerHTML = `
            <div class="accordion" id="sidebarAccordion">
                ${sectionsHTML}
            </div>
        `;

        this.addEventListeners();
        console.log('✅ Wiki TOC built successfully');
    }
    
    /**
     * Returns TOC sections from GitHub Contents API with caching
     */
    async getWikiTOC() {
        const cacheKey = 'wiki_toc_cache_v2_contents_api';
        const ttlMs = 10 * 60 * 1000; // 10 minutes as per PRD
        try {
            const cached = localStorage.getItem(cacheKey);
            if (cached) {
                const obj = JSON.parse(cached);
                if (obj && (Date.now() - obj.time) < ttlMs && Array.isArray(obj.data)) {
                    return obj.data;
                }
            }
        } catch (_) {}

        // Build fresh from GitHub Contents API
        const sections = await this.fetchWikiDirectories();
        try { localStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data: sections })); } catch(_) {}
        return sections;
    }

    /**
     * Fetches TOC from local PHP generator (working solution)
     */
    async fetchWikiDirectories() {
        const url = '/src/wiki-utils/generate-toc.php';
        console.log(`🔧 Fetching TOC from PHP generator: ${url}`);
        
        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`PHP TOC generator failed: ${response.status}`);
            }
            
            const data = await response.json();
            if (!data.ok || !data.manifest) {
                throw new Error('Invalid TOC response');
            }
            
            const sections = [];
            
            // Skip General section - no standalone Home page needed
            
            // User Guide section
            if (data.manifest.userGuide && data.manifest.userGuide.length > 0) {
                sections.push({
                    id: 'user-guide',
                    title: 'User Guide', 
                    files: data.manifest.userGuide.map(file => ({
                        name: this.formatFileName(file.name),
                        path: file.path
                    }))
                });
            }
            
            // Developer Docs section
            if (data.manifest.devDocs && data.manifest.devDocs.length > 0) {
                sections.push({
                    id: 'developer-docs',
                    title: 'Developer Docs',
                    files: data.manifest.devDocs.map(file => ({
                        name: this.formatFileName(file.name),
                        path: file.path
                    }))
                });
            }
            
            return sections;
            
        } catch (error) {
            console.error('Failed to fetch TOC from PHP generator:', error);
            // Fallback to minimal structure
            return [
                {
                    id: 'user-guide',
                    title: 'User Guide',
                    files: [{ name: 'Getting Started', path: 'User-Guide/01-Getting-Started.md' }]
                }
            ];
        }
    }

    // Using local PHP TOC generator + GitHub Raw URLs for content

    /** Background TOC revalidation using PHP generator */
    async revalidateTOCInBackground() {
        const cacheKey = 'wiki_toc_cache_v2_contents_api';
        try {
            const freshSections = await this.fetchWikiDirectories();
            const cachedStr = localStorage.getItem(cacheKey);
            const freshStr = JSON.stringify(freshSections);
            if (cachedStr !== null) {
                const cachedObj = JSON.parse(cachedStr);
                const prevStr = JSON.stringify(cachedObj.data);
                if (prevStr !== freshStr) {
                    localStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data: freshSections }));
                    const active = this.tocContainer.querySelector('.wiki-link.active');
                    await this.buildTOC();
                    if (active) {
                        const path = active.getAttribute('data-path');
                        const newActive = this.tocContainer.querySelector(`.wiki-link[data-path="${path}"]`);
                        if (newActive) newActive.classList.add('active');
                    }
                }
            } else {
                localStorage.setItem(cacheKey, JSON.stringify({ time: Date.now(), data: freshSections }));
            }
        } catch (e) {
            console.warn('TOC background revalidation failed:', e);
        }
    }

    // TOC sourced from GitHub Contents API as per PRD

    createAccordionSection(id, title, files) {
        if (!files || files.length === 0) return '';

        const links = files.map(file => {
            const fileName = this.formatFileName(file.name);
            return `
                <div class="form-check">
                    <a href="#" class="wiki-link" data-path="${file.path}" data-name="${fileName}" title="Load ${fileName}">
                        ${fileName}
                    </a>
                </div>
            `;
        }).join('');

        const isExpanded = id === 'user-guide';
        const collapseClass = isExpanded ? 'show' : '';
        const buttonClass = isExpanded ? '' : 'collapsed';

        return `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${id}">
                    <button class="accordion-button ${buttonClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="${isExpanded}">
                        ${title}
                    </button>
                </h2>
                <div id="collapse-${id}" class="accordion-collapse collapse ${collapseClass}" data-bs-parent="#sidebarAccordion">
                    <div class="accordion-body">${links}</div>
                </div>
            </div>
        `;
    }

    addEventListeners() {
        // Listen on the parent sidebar container to catch both TOC links and home link
        const sidebarContent = document.getElementById('sidebar-content');
        if (sidebarContent) {
            sidebarContent.addEventListener('click', e => {
                if (e.target.classList.contains('wiki-link')) {
                    e.preventDefault();
                    const path = e.target.dataset.path;
                    const name = e.target.dataset.name;
                    this.loadContent(path, name);

                    this.tocContainer.querySelectorAll('.wiki-link').forEach(link => link.classList.remove('active'));
                    e.target.classList.add('active');
                }
                
                // Handle "Our Wiki For You" title clicks
                if (e.target.classList.contains('wiki-home-link')) {
                    e.preventDefault();
                    const path = e.target.dataset.path;
                    const name = e.target.dataset.name;
                    this.loadContent(path, name);

                    // Remove all active states when going back to home
                    this.tocContainer.querySelectorAll('.wiki-link').forEach(link => link.classList.remove('active'));
                }
            });
        } else {
            // Fallback to original listener if sidebar-content not found
            this.tocContainer.addEventListener('click', e => {
                if (e.target.classList.contains('wiki-link')) {
                    e.preventDefault();
                    const path = e.target.dataset.path;
                    const name = e.target.dataset.name;
                    this.loadContent(path, name);

                    this.tocContainer.querySelectorAll('.wiki-link').forEach(link => link.classList.remove('active'));
                    e.target.classList.add('active');
                }
            });
        }
    }

    async loadContent(path, fileName) {
        try {
            console.log(`📖 Loading wiki content: ${path}`);
            this.currentPath = path;

            // Try cached HTML first for instant render (SWR)
            const cacheKeyHtml = `wiki:html:${path}`;
            const cachedHtml = localStorage.getItem(cacheKeyHtml);
            if (cachedHtml) {
                const breadcrumb = this.createBreadcrumb(path, fileName);
                this.contentContainer.innerHTML = `${breadcrumb}<div class="wiki-content">${cachedHtml}</div>`;
                this.rewriteLinksAndImages();
                this.enhanceContent();
                this.renderMermaid();
            } else {
                this.showLoading();
            }

            // Fetch latest in background (or foreground if no cache)
            const res = await this.fetchGitHubContent(path);
            if (!res.ok) {
                if (cachedHtml) {
                    if (res.status === 403) this.showBanner('GitHub rate limit reached. Showing cached content.', 'warning');
                    else this.showBanner('Unable to refresh content from GitHub. Showing cached content.', 'warning');
                    return; // keep cached view
                }
                throw new Error(`GitHub fetch failed: ${res.status}`);
            }

            let htmlContent;
            if (window.marked) {
                htmlContent = window.marked.parse(res.text);
                htmlContent = this.processMermaidBlocks(htmlContent);
                if (window.DOMPurify) {
                    htmlContent = window.DOMPurify.sanitize(htmlContent, { 
                        ADD_ATTR: ['target','rel','data-processed'],
                        ADD_TAGS: ['div'],
                        ALLOW_DATA_ATTR: false
                    });
                }
            } else {
                htmlContent = `<pre>${this.escapeHtml(res.text)}</pre>`;
            }

            // Update DOM (even if cached existed, we refresh silently)
            const breadcrumb = this.createBreadcrumb(path, fileName);
            this.contentContainer.innerHTML = `${breadcrumb}<div class="wiki-content">${htmlContent}</div>`;
            this.rewriteLinksAndImages();
            this.enhanceContent();
            this.renderMermaid();

            // Cache sanitized HTML for fast future loads
            try { localStorage.setItem(cacheKeyHtml, htmlContent); } catch (_) {}

            console.log(`✅ Wiki content loaded: ${path}`);
        } catch (error) {
            console.error(`❌ Failed to load content for ${path}:`, error);
            this.showError(`Failed to load document: ${error.message}`);
        }
    }

    async loadInitialPage() {
        console.log('🏠 Loading initial wiki page...');
        await this.loadContent('Home.md', 'Home');
        // Don't activate any TOC link for Home.md since it's not in the sidebar
        // Home.md serves as the main landing page when wiki is first opened
    }

    formatFileName(fileName) {
        return fileName
            .replace(/\.md$/, '')
            .replace(/^\d+-/, '')
            .replace(/[-_]/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());
    }

    createBreadcrumb(path, fileName) {
        const pathParts = path.split('/');
        const section = pathParts.length > 1 ? pathParts[0].replace(/-/g, ' ') : 'General';
        
        return `
            <nav class="wiki-breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">📚 Wiki</li>
                    <li class="breadcrumb-item">${section}</li>
                    <li class="breadcrumb-item active">${fileName}</li>
                </ol>
            </nav>
        `;
    }

    showLoading() {
        this.contentContainer.innerHTML = '<div class="wiki-loading"><div class="spinner-border"></div><p>Loading...</p></div>';
    }

    showError(message) {
        this.contentContainer.innerHTML = `
            <div class="alert alert-danger">
                <h4>📚 Wiki Error</h4>
                <p>${message}</p>
            </div>
        `;
    }

    showBanner(message, type = 'warning') {
        if (this.rateLimitBannerShown && type === 'warning') return;
        const banner = document.createElement('div');
        banner.className = `alert alert-${type} py-2 my-2`;
        banner.textContent = message;
        this.contentContainer.prepend(banner);
        if (type === 'warning') this.rateLimitBannerShown = true;
        setTimeout(() => banner.remove(), 8000);
    }

    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    processMermaidBlocks(htmlContent) {
        const regex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi;
        return htmlContent.replace(regex, (match, mermaidCode) => {
            // Don't escape Mermaid code - it needs to be raw for Mermaid.js to parse
            const cleanCode = mermaidCode.trim();
            return `<div class="mermaid">${cleanCode}</div>`;
        });
    }
    
    rewriteLinksAndImages() {
        const container = this.contentContainer;
        if (!container) return;
        const rawBase = this.githubConfig.rawBaseUrl;

        // Intercept relative .md links to load within the module
        container.querySelectorAll('a[href]').forEach(a => {
            const href = a.getAttribute('href');
            if (!href) return;
            if (/^(https?:)?\//i.test(href)) {
                // external link
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
                return;
            }
            if (href.startsWith('#')) return; // in-page anchor
            if (/\.md(#.*)?$/i.test(href)) {
                // Route inside app
                a.addEventListener('click', (e) => {
                    e.preventDefault();
                    const path = href.replace(/^\.?\/?/, '');
                    const name = this.formatFileName(path.split('/').pop());
                    this.loadContent(path, name);
                });
            } else {
                // Non-md relative link -> open on GitHub wiki page in new tab
                a.setAttribute('href', `https://github.com/${this.githubConfig.owner}/${this.githubConfig.mainRepo}/wiki/${href}`);
                a.setAttribute('target', '_blank');
                a.setAttribute('rel', 'noopener noreferrer');
            }
        });

        // Fix relative image sources to raw wiki URLs
        container.querySelectorAll('img[src]').forEach(img => {
            const src = img.getAttribute('src');
            if (!src) return;
            if (/^(https?:)?\//i.test(src)) return; // already absolute
            img.setAttribute('src', rawBase + src.replace(/^\.?\/?/, ''));
        });
    }
    
    renderMermaid() {
        if (typeof mermaid !== 'undefined') {
            try {
                // Find all unprocessed mermaid divs in the content container
                const mermaidDivs = this.contentContainer.querySelectorAll('.mermaid:not([data-processed])');
                if (mermaidDivs.length > 0) {
                    console.log(`🧜‍♀️ Rendering ${mermaidDivs.length} Mermaid diagrams`);
                    mermaid.init(undefined, mermaidDivs);
                }
            } catch (e) {
                console.error("Mermaid rendering error:", e);
            }
        } else {
            console.warn("⚠️ Mermaid.js not available for rendering");
        }
    }

    enhanceContent() {
        // Future enhancements can go here
    }

    destroy() {
        console.log('🗑️ Wiki module destroyed');
        this.currentPath = null;
    }

    registerServiceWorker() {
        try {
            if ('serviceWorker' in navigator) {
                navigator.serviceWorker.register('/src/wiki-utils/wiki-sw.js', { scope: '/src/wiki-utils/' }).then(() => {
                    console.log('📝 Wiki service worker registered');
                }).catch((error) => {
                    console.log('📝 Service worker registration failed (optional):', error);
                });
            }
        } catch (_) {
            console.log('📝 Service worker not available');
        }
    }
}

window.WikiModule = WikiModule; 
