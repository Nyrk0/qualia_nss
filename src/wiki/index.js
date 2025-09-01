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
        
        // Phase 4: GitHub Raw URL integration
        this.githubConfig = {
            owner: 'Nyrk0',
            repo: 'qualia_nss',
            branch: 'main',
            baseUrl: 'https://raw.githubusercontent.com'
        };
        
        // Mermaid configuration
        this.mermaidInitialized = false;
        this.initializeMermaid();
    }

    initializeMermaid() {
        if (!this.mermaidInitialized) {
            if (typeof mermaid !== 'undefined') {
                mermaid.initialize({
                    startOnLoad: true,
                    theme: 'default',
                    securityLevel: 'loose',
                    flowchart: {
                        useMaxWidth: true,
                        htmlLabels: true,
                        curve: 'basis'
                    }
                });
                this.mermaidInitialized = true;
                console.log('🧜‍♀️ Mermaid initialized for wiki diagrams');
            } else {
                console.warn('⚠️ Mermaid.js not loaded, diagrams will not render');
            }
        }
    }

    async fetchGitHubContent(relativePath) {
        try {
            const url = `${this.githubConfig.baseUrl}/${this.githubConfig.owner}/${this.githubConfig.repo}/${this.githubConfig.branch}/${relativePath}`;
            console.log(`🌐 Fetching GitHub content: ${url}`);
            
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`GitHub fetch failed: ${response.status} ${response.statusText}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error(`❌ Failed to fetch GitHub content for ${relativePath}:`, error);
            throw error;
        }
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
        console.log('🔍 Building Wiki Table of Contents...');
        
        // Fetch directory structure
        const wikiStructure = await this.scanWikiDirectory();
        
        // Create accordion sections
        const homeHTML = this.createAccordionSection(
            'general', 
            '🏠 General', 
            wikiStructure.general
        );
        
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

        // Build the accordion
        this.tocContainer.innerHTML = `
            <div class="accordion" id="sidebarAccordion">
                ${homeHTML}
                ${userGuideHTML}
                ${devDocsHTML}
            </div>
        `;

        this.addEventListeners();
        console.log('✅ Wiki TOC built successfully');
    }


    createAccordionSection(id, title, files) {
        if (!files || files.length === 0) {
            return `
                <div class="accordion-item">
                    <h2 class="accordion-header">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}">
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
        
        // Generate document links with GitHub support
        const links = files.map(file => {
            const fileName = this.formatFileName(file.name || file);
            const relativePath = file.path || file;
            const isGitHub = file.isGitHub || false;
            const description = file.description || '';
            const icon = isGitHub ? '🌐' : '📄';
            
            return `
                <div class="form-check">
                    <a href="#" class="wiki-link" data-path="${relativePath}" data-name="${fileName}" data-is-github="${isGitHub}" title="${description}">
                        ${icon} ${fileName}
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
                    <button class="accordion-button ${buttonClass}" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-${id}" aria-expanded="${isExpanded}">
                        ${title}
                    </button>
                </h2>
                <div id="collapse-${id}" class="accordion-collapse collapse ${collapseClass}" data-bs-parent="#sidebarAccordion">
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
                const name = e.target.dataset.name;
                const isGitHub = e.target.dataset.isGithub === 'true';
                
                // Load content with GitHub support
                this.loadContent(path, name, isGitHub);

                // Update active state
                this.tocContainer.querySelectorAll('.wiki-link').forEach(link => link.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    async loadContent(path, fileName = null, isGitHub = false) {
        try {
            console.log(`📖 Loading wiki content: ${path}`);
            this.showLoading();
            
            let fileContent;
            
            if (isGitHub) {
                // Use GitHub Raw URL for Phase 4 documentation
                fileContent = await this.fetchGitHubContent(path);
            } else {
                // Use local fetch API for traditional wiki content
                const response = await fetch(path);
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                }
                fileContent = await response.text();
            }
            
            // IMMEDIATE FIX: Clean up literal \n sequences
            fileContent = fileContent
                .replace(/\\n\\n/g, '\n\n')  // Double newlines
                .replace(/\\n/g, '\n')       // Single newlines  
                .replace(/\\t/g, '\t')       // Tabs
                .replace(/\\r/g, '\r');      // Carriage returns
            
            this.currentPath = path;
            
            // Render markdown to HTML
            let htmlContent;
            if (window.marked) {
                window.marked.setOptions({
                    breaks: true,
                    gfm: true,
                    sanitize: false
                });
                htmlContent = window.marked.parse(fileContent);
                
                // Process Mermaid blocks after markdown rendering
                htmlContent = this.processMermaidBlocks(htmlContent);
            } else {
                console.warn('⚠️ marked.js not available, using plain text fallback');
                htmlContent = `
                    <div class="markdown-fallback">
                        <h3>📄 ${this.escapeHtml(fileName || 'Document')}</h3>
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
            
            // ✨ NEW: Generate hierarchical TOC from the rendered HTML content
            this.generateTOCFromContent();
            
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
        // Phase 4: Enhanced structure with GitHub integration for Phase 4 docs
        return {
            general: [
                { name: 'Welcome to Qualia-NSS', path: 'src/wiki/content/Home.md' }
            ],
            userGuide: [
                { name: 'Getting Started', path: 'src/wiki/content/User-Guide/01-Getting-Started.md' },
                { name: 'Understanding Filters', path: 'src/wiki/content/User-Guide/02-Understanding-Filters.md' }
            ],
            devDocs: [
                { name: 'Architecture Overview', path: 'src/wiki/content/Developer-Docs/01-Architecture-Overview.md' },
                // Phase 4 Documentation (GitHub Raw URLs)
                { 
                    name: 'Phase 4 Architecture', 
                    path: 'dev/st04-comb-filtering/PHASE-4-ARCHITECTURE.md',
                    isGitHub: true,
                    description: 'Real-World Audio Input Analysis Architecture with Mermaid diagrams'
                },
                { 
                    name: 'Phase 4 Implementation Plan', 
                    path: 'dev/st04-comb-filtering/IMPLEMENTATION_PLAN.md',
                    isGitHub: true,
                    description: 'Complete implementation roadmap for Phase 4 features'
                },
                { 
                    name: 'Phase 4 PRD', 
                    path: 'dev/st04-comb-filtering/comb-filtering-experiments-prd-md',
                    isGitHub: true,
                    description: 'Product Requirements Document with Phase 4 specifications'
                }
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
    
    processMermaidBlocks(htmlContent) {
        try {
            console.log('🧜‍♀️ Processing Mermaid blocks in content...');
            
            // Find pre blocks with language "mermaid" or code blocks with mermaid class
            const mermaidRegex = /<pre><code class="language-mermaid">([\s\S]*?)<\/code><\/pre>/gi;
            let processedContent = htmlContent;
            let matches = [];
            let match;
            
            while ((match = mermaidRegex.exec(htmlContent)) !== null) {
                matches.push({
                    fullMatch: match[0],
                    mermaidCode: match[1]
                });
            }
            
            console.log(`📋 Found ${matches.length} Mermaid blocks to process`);
            
            // Replace each mermaid code block with a proper mermaid div
            matches.forEach((matchData, index) => {
                const mermaidId = `mermaid-diagram-${index}`;
                const mermaidDiv = `<div class="mermaid" id="${mermaidId}">${this.escapeHtml(matchData.mermaidCode.trim())}</div>`;
                
                processedContent = processedContent.replace(matchData.fullMatch, mermaidDiv);
            });
            
            // If we processed any Mermaid blocks, initialize Mermaid rendering
            if (matches.length > 0 && this.mermaidInitialized) {
                // Delay Mermaid rendering to allow DOM insertion
                setTimeout(() => {
                    try {
                        if (typeof mermaid !== 'undefined') {
                            mermaid.init(undefined, '.mermaid');
                            console.log(`✅ Rendered ${matches.length} Mermaid diagrams`);
                        }
                    } catch (error) {
                        console.error('❌ Failed to render Mermaid diagrams:', error);
                    }
                }, 100);
            }
            
            return processedContent;
        } catch (error) {
            console.error('❌ Failed to process Mermaid blocks:', error);
            return htmlContent; // Return original content on error
        }
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
        
        // Style Mermaid diagrams
        content.querySelectorAll('.mermaid').forEach(diagram => {
            diagram.style.textAlign = 'center';
            diagram.style.margin = '20px 0';
        });
    }

    /**
     * Generate hierarchical TOC from rendered HTML content
     * This is the core DOM-based solution that replaces template literal parsing
     */
    generateTOCFromContent() {
        console.log('🏗️ Generating hierarchical TOC from DOM...');
        
        try {
            // Find the current active document link in the accordion
            const activeDocLink = this.tocContainer.querySelector('.wiki-link.active');
            if (!activeDocLink) {
                console.warn('⚠️ No active document link found for TOC generation');
                return;
            }

            // Get the accordion body that contains the active link
            const accordionBody = activeDocLink.closest('.accordion-body');
            if (!accordionBody) {
                console.warn('⚠️ Could not find accordion body for active link');
                return;
            }

            // Find all headings in the rendered content (h1-h4 for manageable hierarchy)
            const content = this.contentContainer.querySelector('.wiki-content');
            if (!content) {
                console.warn('⚠️ No wiki content found for TOC generation');
                return;
            }

            const headings = content.querySelectorAll('h1, h2, h3, h4');
            console.log(`📋 Found ${headings.length} headings for TOC`);

            if (headings.length === 0) {
                console.log('📄 No headings found - keeping simple document link');
                return;
            }

            // Clear existing content and rebuild with hierarchical TOC
            accordionBody.innerHTML = '';

            // Add the main document link back using DOM manipulation
            const mainDocLink = document.createElement('div');
            mainDocLink.className = 'form-check';
            
            const mainLink = document.createElement('a');
            mainLink.href = '#';
            mainLink.className = 'wiki-link active';
            mainLink.dataset.path = activeDocLink.dataset.path;
            mainLink.dataset.name = activeDocLink.dataset.name;
            mainLink.textContent = '📄 ' + activeDocLink.dataset.name;
            
            mainDocLink.appendChild(mainLink);
            accordionBody.appendChild(mainDocLink);

            // Generate unique IDs for headings and create TOC links using DOM
            headings.forEach((heading, index) => {
                // Generate unique ID for the heading
                const headingId = `heading-${index}`;
                heading.id = headingId;

                // Get heading level (1-4) and text
                const level = parseInt(heading.tagName.charAt(1));
                const headingText = heading.textContent.trim();
                
                // Calculate indentation based on heading level
                const indent = (level - 1) * 20; // 20px per level
                
                // Create TOC entry using DOM manipulation (no template literals)
                const tocItem = document.createElement('div');
                tocItem.className = 'form-check wiki-heading-item';
                tocItem.style.marginLeft = indent + 'px';
                
                const tocLink = document.createElement('a');
                tocLink.href = '#' + headingId;
                tocLink.className = 'wiki-link wiki-heading-link toc-level-' + level;
                tocLink.dataset.heading = headingId;
                tocLink.title = 'Jump to: ' + headingText;
                
                const tocText = document.createElement('small');
                tocText.textContent = this.getTOCPrefix(level) + headingText;
                
                tocLink.appendChild(tocText);
                tocItem.appendChild(tocLink);
                accordionBody.appendChild(tocItem);
            });

            // Add event listeners for heading navigation
            this.addTOCEventListeners();

            console.log(`✅ Hierarchical TOC generated with ${headings.length} sections`);

        } catch (error) {
            console.error('❌ Failed to generate TOC from content:', error);
            // Keep existing simple TOC on error
        }
    }

    /**
     * Get prefix symbol for TOC entries based on heading level
     */
    getTOCPrefix(level) {
        const prefixes = {
            1: '📋 ',      // Main sections
            2: '└─ ',      // Subsections  
            3: '  ├─ ',    // Sub-subsections
            4: '    └─ '   // Detailed sections
        };
        return prefixes[level] || '└─ ';
    }

    /**
     * Add event listeners for TOC heading navigation
     */
    addTOCEventListeners() {
        // Remove existing listeners to avoid duplicates
        const oldLinks = this.tocContainer.querySelectorAll('.wiki-heading-link');
        oldLinks.forEach(link => {
            link.replaceWith(link.cloneNode(true)); // Remove all listeners
        });

        // Add new listeners for heading links
        const headingLinks = this.tocContainer.querySelectorAll('.wiki-heading-link');
        headingLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                
                const targetId = link.getAttribute('href').substring(1); // Remove #
                const targetHeading = document.getElementById(targetId);
                
                if (targetHeading) {
                    // Smooth scroll to heading
                    targetHeading.scrollIntoView({ 
                        behavior: 'smooth', 
                        block: 'start',
                        inline: 'nearest'
                    });

                    // Visual feedback - highlight briefly
                    targetHeading.style.backgroundColor = 'var(--primary-color-translucent, rgba(40, 167, 69, 0.1))';
                    targetHeading.style.transition = 'background-color 0.3s ease';
                    setTimeout(() => {
                        targetHeading.style.backgroundColor = '';
                    }, 1500);

                    // Update active state in TOC
                    this.tocContainer.querySelectorAll('.wiki-heading-link').forEach(l => l.classList.remove('active'));
                    link.classList.add('active');

                    console.log(`🎯 Scrolled to heading: ${targetHeading.textContent.trim()}`);
                } else {
                    console.warn(`⚠️ Target heading not found: ${targetId}`);
                }
            });
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
