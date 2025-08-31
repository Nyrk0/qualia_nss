/**
 * WikiModule - Dynamic documentation system for Qualia-NSS
 * Implements the "Live Fetch" approach from implementation-plan.md
 * @author Qualia-NSS Development Team
 * @version 2.0.0
 */
class WikiModule {
    constructor() {
        this.tocContainer = null;
        this.contentContainer = null;
        this.wikiBasePath = 'src/wiki/content';
        this.currentPath = null;
    }

    async init() {
        console.log('📚 Initializing Wiki Module...');
        
        // Get containers after DOM is ready
        this.tocContainer = document.getElementById('wiki-toc-container');
        this.contentContainer = document.getElementById('wiki-content-container');
        
        if (!this.tocContainer || !this.contentContainer) {
            console.error('❌ Wiki module containers not found in DOM');
            return;
        }

        try {
            await this.buildTOC();
            await this.loadInitialPage();
            console.log('✅ Wiki Module initialized successfully');
        } catch (error) {
            console.error('❌ Failed to initialize Wiki Module:', error);
            this.showError('Failed to initialize wiki module');
        }
    }

    async buildTOC() {
        try {
            console.log('🔍 Building Wiki Table of Contents...');
            
            // Fetch directory structure using proper file system approach
            const wikiStructure = await this.scanWikiDirectory();
            
            const userGuideHTML = this.createAccordionSection(
                'userGuide', 
                '👤 User Guide', 
                wikiStructure.userGuide
            );
            
            const devDocsHTML = this.createAccordionSection(
                'devDocs', 
                '🛠️ Developer Documentation', 
                wikiStructure.devDocs
            );
            
            const homeHTML = this.createAccordionSection(
                'general', 
                '🏠 General', 
                wikiStructure.general
            );

            this.tocContainer.innerHTML = `
                <div class="accordion" id="sidebarAccordion">
                    ${homeHTML}
                    ${userGuideHTML}
                    ${devDocsHTML}
                </div>
            `;

            this.addEventListeners();
            console.log('✅ Wiki TOC built successfully');
        } catch (error) {
            console.error('❌ Failed to build Wiki TOC:', error);
            this.showError('Error loading documentation index');
        }
    }

    createAccordionSection(id, title, files) {
        if (!files || files.length === 0) {
            return `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="false">
                            ${title} <span class="badge">0</span>
                        </button>
                    </h2>
                    <div id="collapse-${id}" class="accordion-collapse collapse">
                        <div class="accordion-body">
                            <p class="text-muted">No documents available</p>
                        </div>
                    </div>
                </div>
            `;
        }
        
        const links = files.map(file => {
            const fileName = this.formatFileName(file.name || file);
            const relativePath = file.path || file;
            return `
                <div class="form-check">
                    <a href="#" class="wiki-link" data-path="${relativePath}" data-name="${fileName}">
                        📄 ${fileName}
                    </a>
                </div>
            `;
        }).join('');

        const isExpanded = id === 'general' ? 'true' : 'false';
        const collapseClass = id === 'general' ? 'show' : '';
        const buttonClass = id === 'general' ? '' : 'collapsed';

        return `
            <div class="accordion-item">
                <h2 class="accordion-header" id="heading-${id}">
                    <button class="accordion-button ${buttonClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="${isExpanded}" aria-controls="collapse-${id}">
                        ${title}
                    </button>
                </h2>
                <div id="collapse-${id}" class="accordion-collapse collapse ${collapseClass}" aria-labelledby="heading-${id}" data-bs-parent="#sidebarAccordion">
                    <div class="accordion-body">
                        ${links}
                    </div>
                </div>
            </div>
        `;
    }

    addEventListeners() {
        this.tocContainer.addEventListener('click', e => {
            if (e.target.classList.contains('wiki-link')) {
                e.preventDefault();
                const path = e.target.dataset.path;
                this.loadContent(path);

                // Update active state
                this.tocContainer.querySelectorAll('.wiki-link').forEach(link => link.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    async loadContent(path, fileName = null) {
        try {
            console.log(`📖 Loading wiki content: ${path}`);
            this.showLoading();
            
            // Use fetch API for file loading (works in HTTP context)
            const response = await fetch(`/${path}`);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const fileContent = await response.text();
            this.currentPath = path;
            
            // Render markdown to HTML
            let htmlContent;
            if (window.marked) {
                // Configure marked for better rendering
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false
                });
                htmlContent = window.marked.parse(fileContent);
            } else {
                console.warn('⚠️ marked.js not available, using plain text fallback');
                htmlContent = `
                    <div class="markdown-fallback">
                        <h3>📄 ${fileName || 'Document'}</h3>
                        <pre class="markdown-source">${this.escapeHtml(fileContent)}</pre>
                        <p class="text-muted">Note: Markdown rendering library not available.</p>
                    </div>
                `;
            }
            
            // Add navigation breadcrumbs
            const breadcrumb = this.createBreadcrumb(path, fileName);
            
            this.contentContainer.innerHTML = `
                ${breadcrumb}
                <div class="wiki-content">
                    ${htmlContent}
                </div>
            `;
            
            // Enhance rendered content
            this.enhanceContent();
            
            console.log(`✅ Wiki content loaded: ${path}`);
        } catch (error) {
            console.error(`❌ Failed to load content for ${path}:`, error);
            this.showError(`Failed to load document: ${error.message}`);
        }
    }

    async loadInitialPage() {
        console.log('🏠 Loading initial wiki page...');
        // Load the Home.md file by default
        const homePath = 'src/wiki/content/Home.md';
        await this.loadContent(homePath, 'Welcome');
    }

    // New helper methods
    
    async scanWikiDirectory() {
        // Return the current documentation structure
        // This would ideally scan the directory dynamically in a full implementation
        return {
            general: [
                { name: 'Welcome to Qualia-NSS', path: 'src/wiki/content/Home.md' }
            ],
            userGuide: [
                { name: 'Getting Started', path: 'src/wiki/content/User-Guide/01-Getting-Started.md' },
                { name: 'Understanding Filters', path: 'src/wiki/content/User-Guide/02-Understanding-Filters.md' }
            ],
            devDocs: [
                { name: 'Architecture Overview', path: 'src/wiki/content/Developer-Docs/01-Architecture-Overview.md' }
            ]
        };
    }
    
    formatFileName(fileName) {
        return fileName
            .replace(/\.md$/, '')           // Remove .md extension
            .replace(/^\d+-/, '')          // Remove number prefix (e.g., "01-")
            .replace(/[-_]/g, ' ')         // Replace dashes/underscores with spaces
            .replace(/\b\w/g, l => l.toUpperCase()); // Capitalize words
    }
    
    createBreadcrumb(path, fileName) {
        const pathParts = path.split('/');
        const section = pathParts.includes('User-Guide') ? 'User Guide' : 
                       pathParts.includes('Developer-Docs') ? 'Developer Documentation' : 
                       'General';
        
        return `
            <nav class="wiki-breadcrumb">
                <ol class="breadcrumb">
                    <li class="breadcrumb-item">📚 Wiki</li>
                    <li class="breadcrumb-item">${section}</li>
                    <li class="breadcrumb-item active">${fileName || 'Document'}</li>
                </ol>
            </nav>
        `;
    }
    
    showLoading() {
        this.contentContainer.innerHTML = `
            <div class="wiki-loading">
                <div class="spinner-border" role="status">
                    <span class="visually-hidden">Loading...</span>
                </div>
                <p class="mt-2">Loading documentation...</p>
            </div>
        `;
    }
    
    showError(message) {
        this.contentContainer.innerHTML = `
            <div class="alert alert-danger" role="alert">
                <h4 class="alert-heading">📚 Wiki Error</h4>
                <p>${message}</p>
                <hr>
                <p class="mb-0">Please check the console for more details or contact support.</p>
            </div>
        `;
    }
    
    escapeHtml(text) {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
    
    enhanceContent() {
        // Add syntax highlighting, link processing, etc.
        const content = this.contentContainer.querySelector('.wiki-content');
        if (!content) return;
        
        // Add classes to elements for better styling
        content.querySelectorAll('h1, h2, h3, h4, h5, h6').forEach(heading => {
            heading.classList.add('wiki-heading');
        });
        
        content.querySelectorAll('code').forEach(code => {
            code.classList.add('wiki-code');
        });
        
        content.querySelectorAll('pre').forEach(pre => {
            pre.classList.add('wiki-code-block');
        });
    }
    
    destroy() {
        console.log('🗑️ Wiki module destroyed');
        this.currentPath = null;
        this.tocContainer = null;
        this.contentContainer = null;
    }
}

window.WikiModule = WikiModule;
