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
            
            const userGuideHTML = await this.createAccordionSection(
                'userGuide', 
                '👤 User Guide', 
                wikiStructure.userGuide
            );
            
            const devDocsHTML = await this.createAccordionSection(
                'devDocs', 
                '🛠️ Developer Documentation', 
                wikiStructure.devDocs
            );
            
            const homeHTML = await this.createAccordionSection(
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

    // Extract headings from markdown content to build hierarchical TOC
    extractHeadings(content) {
        const headings = [];
        const lines = content.split('\n');
        
        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            const match = line.match(/^(#{1,6})\s+(.+)/);
            
            if (match) {
                const level = match[1].length;
                const text = match[2].trim();
                const id = text.toLowerCase()
                    .replace(/[^\w\s-]/g, '') // Remove special chars
                    .replace(/\s+/g, '-')     // Replace spaces with hyphens
                    .replace(/-+/g, '-');     // Collapse multiple hyphens
                
                headings.push({
                    level,
                    text,
                    id,
                    line: i + 1
                });
            }
        }
        
        return headings;
    }

    async createAccordionSection(id, title, files) {
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
        
        // Generate hierarchical TOC by loading each file's content
        let links = '';
        
        for (const file of files) {
            const fileName = this.formatFileName(file.name || file);
            const relativePath = file.path || file;
            
            // Add main document link
            links += `
                <div class="form-check">
                    <a href="#" class="wiki-link" data-path="${relativePath}" data-name="${fileName}">
                        📄 ${fileName}
                    </a>
                </div>
            `;
            
            // Load file content to extract headings for detailed TOC (like GitHub wiki)
            try {
                const response = await fetch(`/${file.path || file}`);
                if (response.ok) {
                    const content = await response.text();
                    const headings = this.extractHeadings(content);
                    
                    // Generate heading links for hierarchical navigation (skip H1 - usually the title)
                    const subHeadings = headings.filter(h => h.level > 1 && h.level <= 4); // H2, H3, H4
                    
                    if (subHeadings.length > 0) {
                        const subLinks = subHeadings.map(heading => {
                            const indent = (heading.level - 2) * 20; // Indent based on level
                            const prefix = '└'.repeat(Math.max(1, heading.level - 2)) + ' ';
                            
                            return `
                                <div class="form-check wiki-heading-item" style="margin-left: ${indent}px; opacity: 0.85;">
                                    <a href="#" class="wiki-link wiki-heading-link" 
                                       data-path="${relativePath}" 
                                       data-heading="${heading.id}" 
                                       data-name="${heading.text}"
                                       title="Jump to: ${heading.text}">
                                        <small>${prefix}${heading.text}</small>
                                    </a>
                                </div>
                            `;
                        }).join('');
                        
                        links += subLinks;
                    }
                }
            } catch (error) {
                console.warn(`Could not load content for TOC generation: ${file.path || file}`, error);
                // Continue with just the main document link
            }
        }

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
                const heading = e.target.dataset.heading;
                
                // Load content and scroll to heading if specified
                this.loadContent(path, null, heading);

                // Update active state
                this.tocContainer.querySelectorAll('.wiki-link').forEach(link => link.classList.remove('active'));
                e.target.classList.add('active');
            }
        });
    }

    async loadContent(path, fileName = null, targetHeading = null) {
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
            
            // Scroll to specific heading if requested (like GitHub wiki)
            if (targetHeading) {
                setTimeout(() => {
                    const headingElement = document.getElementById(targetHeading) || 
                                         document.querySelector(`[id="${targetHeading}"]`) ||
                                         document.querySelector(`h1:contains("${targetHeading}"), h2:contains("${targetHeading}"), h3:contains("${targetHeading}"), h4:contains("${targetHeading}")`);
                    
                    if (headingElement) {
                        headingElement.scrollIntoView({ 
                            behavior: 'smooth', 
                            block: 'start',
                            inline: 'nearest'
                        });
                        // Highlight the target heading briefly
                        headingElement.style.backgroundColor = 'var(--primary-color-translucent, rgba(40, 167, 69, 0.1))';
                        headingElement.style.transition = 'background-color 0.3s ease';
                        setTimeout(() => {
                            headingElement.style.backgroundColor = '';
                        }, 2000);
                        console.log(`🎯 Scrolled to heading: ${targetHeading}`);
                    } else {
                        console.warn(`⚠️ Heading not found: ${targetHeading}`);
                    }
                }, 300); // Wait for content to render
            }
            
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
