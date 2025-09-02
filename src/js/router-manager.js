/**
 * Router Manager - Centralized path resolution for modular architecture
 * Part of the Qualia-NSS modular architecture
 */

class RouterManager {
    constructor() {
        this.baseUrl = this.detectBaseUrl();
        this.moduleBasePath = 'src/';
        this.componentBasePath = 'src/components/';
        this.wikiBasePath = 'src/wiki/public/';
        this.isFileProtocol = window.location.protocol === 'file:';
        this.currentRoute = null;
        this.routes = new Map();
        
        // Initialize default routes
        this.initializeRoutes();
        
        // Handle browser navigation
        window.addEventListener('popstate', this.handlePopState.bind(this));
        
        console.log('RouterManager initialized with baseUrl:', this.baseUrl);
        console.log('File protocol detected:', this.isFileProtocol);
    }

    /**
     * Detect the base URL for the application
     * Handles file://, http://localhost, and production contexts
     */
    detectBaseUrl() {
        const location = window.location;
        
        // For file:// protocol, use the directory containing index.html
        if (location.protocol === 'file:') {
            const pathParts = location.pathname.split('/');
            pathParts.pop(); // Remove index.html or current file
            return location.protocol + '//' + pathParts.join('/') + '/';
        }
        
        // For http/https, use the origin + pathname up to the app root
        // Assumes app is at domain root or in a subdirectory
        const pathname = location.pathname;
        const appRoot = pathname.endsWith('/') ? pathname : pathname + '/';
        return location.origin + appRoot;
    }

    /**
     * Resolve a path relative to the application base
     * @param {string} relativePath - The relative path to resolve
     * @param {string} context - Context for resolution ('root', 'module', 'component')
     * @returns {string} - Resolved absolute or properly relative path
     */
    resolvePath(relativePath, context = 'root') {
        // Remove leading './' or '../' patterns
        const cleanPath = this.normalizePath(relativePath);
        
        switch (context) {
            case 'module':
                return this.moduleBasePath + cleanPath;
            case 'component':
                return this.componentBasePath + cleanPath;
            case 'root':
            default:
                return cleanPath;
        }
    }

    /**
     * Resolve module-specific file paths
     * @param {string} moduleName - Name of the module
     * @param {string} fileName - File to load (e.g., 'index.html', 'script.js')
     * @returns {string} - Resolved module file path
     */
    resolveModulePath(moduleName, fileName) {
        return this.resolvePath(`${moduleName}/${fileName}`, 'module');
    }

    /**
     * Resolve component script paths
     * @param {string} componentPath - Component path (e.g., 'tone-control/tone-control.js')
     * @returns {string} - Resolved component path
     */
    resolveComponentPath(componentPath) {
        return this.resolvePath(componentPath, 'component');
    }

    /**
     * Normalize path by removing redundant ./ and ../ segments
     * @param {string} path - Path to normalize
     * @returns {string} - Normalized path
     */
    normalizePath(path) {
        if (!path) return '';
        // Remove leading './' or '/'
        let normalized = path.replace(/^[\.\/]+/, '');
        
        // Handle '../' by removing them (since we're resolving from base)
        normalized = normalized.replace(/^\.\.\//, '');
        
        return normalized;
    }

    /**
     * Create an absolute URL for fetch operations
     * @param {string} relativePath - The relative path
     * @param {string} context - Context for resolution
     * @returns {string} - Absolute URL for fetch
     */
    createFetchUrl(relativePath, context = 'root') {
        const resolvedPath = this.resolvePath(relativePath, context);
        
        // For file:// protocol, return the resolved path as-is
        if (window.location.protocol === 'file:') {
            return this.baseUrl + resolvedPath;
        }
        
        // For http/https, return relative path (more reliable for various hosting)
        return resolvedPath;
    }

    /**
     * Process HTML content to fix script src paths
     * @param {string} html - HTML content with potentially broken paths
     * @param {string} sourceContext - Where the HTML came from ('module', 'component')
     * @returns {string} - HTML with corrected paths
     */
    processHtmlPaths(html, sourceContext = 'module') {
        // Fix script src paths
        html = html.replace(
            /src=['"](\.\.\/)*([^'"]+)['"]/g,
            (match, dots, path) => {
                // Determine if it's a component path
                if (path.includes('src/components/')) {
                    // Extract just the component part
                    const componentPath = path.replace(/.*lib\/components\//, '');
                    const resolvedPath = this.resolveComponentPath(componentPath);
                    return `src="${resolvedPath}"`;
                }
                
                // Handle other paths (modules, assets, etc.)
                const resolvedPath = this.resolvePath(path, 'root');
                return `src="${resolvedPath}"`;
            }
        );

        return html;
    }

    /**
     * Check if fetch operations will work in current context
     * @returns {boolean} - True if fetch is safe to use
     */
    canUseFetch() {
        // In file:// protocol, fetch() fails due to CORS restrictions
        return !this.isFileProtocol;
    }

    /**
     * Get loading strategy based on protocol context
     * @returns {string} - 'fetch' for http contexts, 'inline' for file contexts
     */
    getLoadingStrategy() {
        return this.canUseFetch() ? 'fetch' : 'inline';
    }

    /**
     * Initialize default routes
     */
    initializeRoutes() {
        // Main module routes
        this.addRoute('^#/wiki(/.*)?$', this.handleWikiRoute.bind(this));
        this.addRoute('^#/([^/]+)(/.*)?$', this.handleModuleRoute.bind(this));
        
        // Default route
        this.addRoute('^/$', () => window.showWelcome());
    }
    
    /**
     * Add a new route
     * @param {string} pattern - Route pattern (regex as string)
     * @param {Function} handler - Route handler function
     */
    addRoute(pattern, handler) {
        this.routes.set(new RegExp(pattern), handler);
    }
    
    /**
     * Handle browser back/forward navigation
     */
    handlePopState() {
        this.navigate(window.location.hash || '#/', false);
    }
    
    /**
     * Navigate to a new route
     * @param {string} path - Path to navigate to
     * @param {boolean} updateHistory - Whether to update browser history
     */
    navigate(path, updateHistory = true) {
        if (!path.startsWith('#')) {
            path = '#' + path;
        }
        
        if (updateHistory) {
            window.history.pushState({}, '', path);
        }
        
        this.resolveRoute(path);
    }
    
    /**
     * Resolve the current route
     * @param {string} path - Path to resolve
     */
    resolveRoute(path) {
        if (!path) path = window.location.hash || '#';
        
        for (const [pattern, handler] of this.routes) {
            const match = path.match(pattern);
            if (match) {
                handler(match);
                return true;
            }
        }
        
        console.warn('No route found for path:', path);
        return false;
    }
    
    /**
     * Handle wiki routes
     * @param {Array} match - Route match result
     */
    handleWikiRoute(match) {
        const wikiPath = match[1] || ''; // The part after /wiki/
        console.log('Wiki route:', wikiPath);
        
        // Load wiki module if not already loaded
        if (window.currentModule !== 'wiki') {
            window.loadWiki();
        }
        
        // Trigger wiki content loading
        if (window.wikiApp && typeof window.wikiApp.loadPage === 'function') {
            window.wikiApp.loadPage(wikiPath);
        }
    }
    
    /**
     * Handle module routes
     * @param {Array} match - Route match result
     */
    handleModuleRoute(match) {
        const moduleName = match[1];
        const subPath = match[2] || '';
        
        console.log(`Module route: ${moduleName}, subpath: ${subPath}`);
        
        // Dispatch to appropriate module loader
        const loaders = {
            'speakers': () => window.loadSpeakersSpl(),
            'filters': () => window.loadFilters(),
            'cabinets': () => window.loadCabinets(),
            'spectrogram': () => window.loadSpectrogram()
        };
        
        if (loaders[moduleName]) {
            loaders[moduleName]();
        }
    }
    
    /**
     * Get the current module name from URL or state
     * @returns {string|null} - Current module name
     */
    getCurrentModule() {
        const hash = window.location.hash.substring(1);
        if (hash.startsWith('/wiki')) {
            return 'wiki';
        }
        
        const match = hash.match(/^\/([^/]+)/);
        return match ? match[1] : null;
    }
}

// Create global router instance
document.addEventListener('DOMContentLoaded', () => {
    if (!window.router) {
        window.router = new RouterManager();
        console.log('Global router instance created');
    }
});

// Export for module use
window.RouterManager = RouterManager;