// Wiki Module - Vanilla JavaScript Implementation
class WikiModule {
    constructor() {
        console.log('WikiModule constructor called');
        this.currentPath = '';
        this.wikiStructure = [];
        this.searchResults = [];
        this.isSearching = false;
        
        // DOM elements
        this.container = null;
        this.sidebar = null;
        this.mainContent = null;
        this.breadcrumbs = null;
        this.contentArea = null;
        
        // Bind methods
        this.handleNavigation = this.handleNavigation.bind(this);
        this.handleSearch = this.handleSearch.bind(this);
        this.renderContent = this.renderContent.bind(this);
    }
    
    async init() {
        console.log('Initializing Wiki module...');
        
        try {
            // Load wiki structure
            await this.loadWikiStructure();
            
            // Create the main wiki container
            this.createWikiHTML();
            
            // Set up event listeners
            this.setupEventListeners();
            
            // Load initial content
            const initialPath = this.getPathFromURL();
            let targetPath = initialPath || 'README';
            
            // Handle special 'home' path
            if (targetPath === 'home') {
                targetPath = 'README';
            }
            
            await this.navigateToPage(targetPath);
            
            console.log('Wiki module initialized successfully');
        } catch (error) {
            console.error('Error initializing wiki module:', error);
            this.showError('Failed to initialize wiki module');
        }
    }
    
    destroy() {
        console.log('Destroying Wiki module...');
        
        // Clear references
        this.container = null;
        this.sidebar = null;
        this.mainContent = null;
        this.breadcrumbs = null;
        this.contentArea = null;
        
        console.log('Wiki module destroyed');
    }
    
    createWikiHTML() {
        const mainContent = document.getElementById('main-content');
        if (!mainContent) {
            throw new Error('Main content container not found');
        }
        
        mainContent.innerHTML = `
            <div class="wiki-container">
                <aside class="wiki-sidebar" id="wiki-sidebar">
                    <div class="wiki-sidebar-header">
                        <h2>📚 Wiki</h2>
                        <div class="wiki-search">
                            <input type="text" id="wiki-search-input" placeholder="Search wiki..." class="wiki-search-input">
                            <button type="button" id="wiki-search-btn" class="wiki-search-btn">🔍</button>
                        </div>
                    </div>
                    <nav class="wiki-nav" id="wiki-nav">
                        <div class="loading">Loading wiki structure...</div>
                    </nav>
                </aside>
                
                <main class="wiki-main" id="wiki-main">
                    <div class="wiki-breadcrumbs" id="wiki-breadcrumbs"></div>
                    <div class="wiki-content" id="wiki-content">
                        <div class="loading">Loading page...</div>
                    </div>
                </main>
            </div>
        `;
        
        // Store references
        this.container = mainContent.querySelector('.wiki-container');
        this.sidebar = document.getElementById('wiki-sidebar');
        this.mainContent = document.getElementById('wiki-main');
        this.breadcrumbs = document.getElementById('wiki-breadcrumbs');
        this.contentArea = document.getElementById('wiki-content');
    }
    
    async loadWikiStructure() {
        try {
            // First try to load from structure.json
            const response = await fetch('/src/wiki/public/structure.json');
            if (response.ok) {
                this.wikiStructure = await response.json();
            } else {
                // Fallback to default structure
                this.wikiStructure = this.getDefaultStructure();
            }
            
            this.renderSidebar();
        } catch (error) {
            console.error('Error loading wiki structure:', error);
            this.wikiStructure = this.getDefaultStructure();
            this.renderSidebar();
        }
    }
    
    getDefaultStructure() {
        return [
            { title: 'Home', path: 'README' },
            { title: 'API Documentation', path: 'API_README' },
            { 
                title: 'Architecture', 
                path: 'architecture',
                children: [
                    { title: 'Overview', path: 'architecture/overview' },
                ]
            },
            { 
                title: 'Manual', 
                path: 'manual',
                children: [
                    { title: 'Development', path: 'manual/development' },
                    { title: 'Getting Started', path: 'manual/getting-started' },
                ]
            }
        ];
    }
    
    renderSidebar() {
        const navContainer = document.getElementById('wiki-nav');
        if (!navContainer) return;
        
        let html = '<ul class="wiki-nav-list">';
        
        for (const item of this.wikiStructure) {
            html += this.renderNavItem(item);
        }
        
        html += '</ul>';
        navContainer.innerHTML = html;
    }
    
    renderNavItem(item) {
        const hasChildren = item.children && item.children.length > 0;
        const isActive = this.currentPath === item.path;
        
        let html = `<li class="wiki-nav-item ${hasChildren ? 'has-children' : ''}">`;
        
        if (hasChildren) {
            html += `
                <div class="wiki-nav-toggle" data-path="${item.path}">
                    <span class="wiki-nav-toggle-icon">▶</span>
                    <span class="wiki-nav-title">${item.title}</span>
                </div>
            `;
        }
        
        html += `
            <a href="#" class="wiki-nav-link ${isActive ? 'active' : ''}" data-path="${item.path}">
                ${hasChildren ? '' : item.title}
            </a>
        `;
        
        if (hasChildren) {
            html += '<ul class="wiki-nav-submenu">';
            for (const child of item.children) {
                html += this.renderNavItem(child);
            }
            html += '</ul>';
        }
        
        html += '</li>';
        return html;
    }
    
    setupEventListeners() {
        // Navigation clicks
        this.container.addEventListener('click', (e) => {
            if (e.target.matches('.wiki-nav-link')) {
                e.preventDefault();
                const path = e.target.dataset.path;
                this.navigateToPage(path);
            }
            
            if (e.target.matches('.wiki-nav-toggle, .wiki-nav-toggle *')) {
                const toggle = e.target.closest('.wiki-nav-toggle');
                const submenu = toggle.nextElementSibling?.nextElementSibling;
                if (submenu?.classList.contains('wiki-nav-submenu')) {
                    const icon = toggle.querySelector('.wiki-nav-toggle-icon');
                    if (submenu.style.display === 'none' || !submenu.style.display) {
                        submenu.style.display = 'block';
                        icon.textContent = '▼';
                    } else {
                        submenu.style.display = 'none';
                        icon.textContent = '▶';
                    }
                }
            }
        });
        
        // Search functionality
        const searchBtn = document.getElementById('wiki-search-btn');
        const searchInput = document.getElementById('wiki-search-input');
        
        if (searchBtn) {
            searchBtn.addEventListener('click', this.handleSearch);
        }
        
        if (searchInput) {
            searchInput.addEventListener('keypress', (e) => {
                if (e.key === 'Enter') {
                    this.handleSearch();
                }
            });
        }
    }
    
    async navigateToPage(path) {
        try {
            // Handle special paths
            if (path === 'home') {
                path = 'README';
            }
            
            this.currentPath = path;
            
            // Update active states
            this.updateActiveStates();
            
            // Update breadcrumbs
            this.updateBreadcrumbs(path);
            
            // Load and display content
            const content = await this.loadPageContent(path);
            this.renderContent(content);
            
        } catch (error) {
            console.error('Error navigating to page:', error);
            this.showError(`Failed to load page: ${path}`);
        }
    }
    
    async loadPageContent(path) {
        try {
            const normalizedPath = path ? path.replace(/^\/+|\/+$/g, '') : 'README';
            const response = await fetch(`/src/wiki/public/${normalizedPath}.md`);
            
            if (!response.ok) {
                if (response.status === 404) {
                    return `# Page Not Found\n\nThe requested page "${path}" does not exist.\n\n[Return to Home](#README)`;
                }
                throw new Error(`HTTP error! status: ${response.status}`);
            }
            
            return await response.text();
        } catch (error) {
            console.error('Error loading wiki page:', error);
            return `# Error Loading Page\n\nThere was an error loading the requested page.\n\n\`\`\`\n${error.message}\n\`\`\`\n\n[Return to Home](#README)`;
        }
    }
    
    renderContent(markdownContent) {
        if (!this.contentArea) return;
        
        // Simple markdown-to-HTML conversion
        let html = this.convertMarkdownToHTML(markdownContent);
        this.contentArea.innerHTML = html;
        
        // Make internal links work with navigation
        this.setupInternalLinks();
    }
    
    convertMarkdownToHTML(markdown) {
        let html = markdown;
        
        // Headers
        html = html.replace(/^### (.*$)/gim, '<h3>$1</h3>');
        html = html.replace(/^## (.*$)/gim, '<h2>$1</h2>');
        html = html.replace(/^# (.*$)/gim, '<h1>$1</h1>');
        
        // Code blocks
        html = html.replace(/```([^`]*)```/gs, '<pre><code>$1</code></pre>');
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2">$1</a>');
        
        // Bold and italic
        html = html.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*([^*]+)\*/g, '<em>$1</em>');
        
        // Line breaks and paragraphs
        html = html.split('\n\n').map(paragraph => {
            paragraph = paragraph.trim();
            if (paragraph && !paragraph.startsWith('<h') && !paragraph.startsWith('<pre') && !paragraph.startsWith('<ul') && !paragraph.startsWith('<ol')) {
                return `<p>${paragraph.replace(/\n/g, '<br>')}</p>`;
            }
            return paragraph.replace(/\n/g, '<br>');
        }).join('\n\n');
        
        return html;
    }
    
    setupInternalLinks() {
        const links = this.contentArea.querySelectorAll('a[href^="#"]');
        links.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const path = link.getAttribute('href').substring(1);
                this.navigateToPage(path);
            });
        });
    }
    
    updateActiveStates() {
        // Remove all active states
        const activeLinks = this.sidebar.querySelectorAll('.wiki-nav-link.active');
        activeLinks.forEach(link => link.classList.remove('active'));
        
        // Add active state to current page
        const currentLink = this.sidebar.querySelector(`[data-path="${this.currentPath}"]`);
        if (currentLink) {
            currentLink.classList.add('active');
        }
    }
    
    updateBreadcrumbs(path) {
        if (!this.breadcrumbs) return;
        
        const crumbs = this.generateBreadcrumbs(path);
        let html = '<nav class="breadcrumb">';
        
        crumbs.forEach((crumb, index) => {
            if (index === crumbs.length - 1) {
                html += `<span class="breadcrumb-current">${crumb.title}</span>`;
            } else {
                html += `<a href="#" class="breadcrumb-link" data-path="${crumb.path}">${crumb.title}</a> / `;
            }
        });
        
        html += '</nav>';
        this.breadcrumbs.innerHTML = html;
        
        // Add click handlers for breadcrumb links
        this.breadcrumbs.querySelectorAll('.breadcrumb-link').forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                this.navigateToPage(link.dataset.path);
            });
        });
    }
    
    generateBreadcrumbs(path) {
        const crumbs = [{ title: 'Home', path: 'README' }];
        
        if (path && path !== 'README') {
            const parts = path.split('/');
            let currentPath = '';
            
            for (const part of parts) {
                currentPath += (currentPath ? '/' : '') + part;
                const item = this.findItemByPath(currentPath, this.wikiStructure);
                crumbs.push({
                    title: item?.title || part,
                    path: currentPath
                });
            }
        }
        
        return crumbs;
    }
    
    findItemByPath(path, structure) {
        for (const item of structure) {
            if (item.path === path) {
                return item;
            }
            if (item.children) {
                const found = this.findItemByPath(path, item.children);
                if (found) return found;
            }
        }
        return null;
    }
    
    handleNavigation(e) {
        e.preventDefault();
        const path = e.target.dataset.path;
        this.navigateToPage(path);
    }
    
    async handleSearch() {
        const searchInput = document.getElementById('wiki-search-input');
        const query = searchInput?.value.trim();
        
        if (!query) return;
        
        console.log('Searching wiki for:', query);
        this.showSearchResults(query, []);
    }
    
    showSearchResults(query, results) {
        this.contentArea.innerHTML = `
            <div class="wiki-search-results">
                <h2>Search Results for "${query}"</h2>
                ${results.length > 0 ? 
                    '<ul>' + results.map(result => `<li><a href="#" data-path="${result.path}">${result.title}</a></li>`).join('') + '</ul>' :
                    '<p>Search functionality coming soon!</p>'
                }
            </div>
        `;
    }
    
    showError(message) {
        if (this.contentArea) {
            this.contentArea.innerHTML = `
                <div class="wiki-error">
                    <h2>Error</h2>
                    <p>${message}</p>
                    <button onclick="location.reload()" class="btn btn-primary">Reload Page</button>
                </div>
            `;
        }
    }
    
    getPathFromURL() {
        const hash = window.location.hash;
        const wikiMatch = hash.match(/#\/wiki\/(.+)/);
        return wikiMatch ? wikiMatch[1] : '';
    }
}

// Global exposure for module system
window.WikiModule = WikiModule;
console.log('WikiModule class defined and exposed globally');