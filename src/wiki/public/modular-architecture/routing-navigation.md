# Routing and Navigation System

## Overview

The Qualia-NSS routing and navigation system provides seamless module switching and URL state management without page reloads. The system uses **hash-based routing** for client-side navigation and maintains **application state** across module transitions.

## Architecture Components

### Router Manager
Central routing coordination and path resolution

### Navigation Manager  
State management and active module tracking

### URL State Management
Browser history integration and bookmarkable URLs

## Router Manager Implementation

### Core Routing Logic

```javascript
class RouterManager {
    constructor() {
        this.routes = new Map();
        this.currentRoute = null;
        this.context = 'file'; // 'file' or 'http'
        this.basePath = '';
    }
    
    // Route registration
    registerRoute(pattern, handler, options = {}) {
        this.routes.set(pattern, {
            handler,
            ...options
        });
    }
    
    // Navigation with history support
    async navigate(path, pushState = true, options = {}) {
        try {
            const route = this.resolveRoute(path);
            
            if (!route) {
                throw new Error(`Route not found: ${path}`);
            }
            
            // Execute route handler
            await this.executeRoute(route, options);
            
            // Update browser history
            if (pushState) {
                this.updateHistory(path);
            }
            
            // Update navigation state
            this.updateNavigationState(path);
            
        } catch (error) {
            console.error('Navigation error:', error);
            this.handleNavigationError(error, path);
        }
    }
}
```

### Route Resolution Patterns

```javascript
// Route pattern matching
resolveRoute(path) {
    const normalizedPath = this.normalizePath(path);
    
    // Exact match first
    if (this.routes.has(normalizedPath)) {
        return {
            handler: this.routes.get(normalizedPath).handler,
            params: {},
            path: normalizedPath
        };
    }
    
    // Pattern matching with parameters
    for (const [pattern, config] of this.routes) {
        const match = this.matchPattern(pattern, normalizedPath);
        if (match) {
            return {
                handler: config.handler,
                params: match.params,
                path: normalizedPath,
                pattern
            };
        }
    }
    
    return null;
}

// Pattern matching with parameter extraction
matchPattern(pattern, path) {
    const patternParts = pattern.split('/');
    const pathParts = path.split('/');
    
    if (patternParts.length !== pathParts.length) {
        return null;
    }
    
    const params = {};
    
    for (let i = 0; i < patternParts.length; i++) {
        const patternPart = patternParts[i];
        const pathPart = pathParts[i];
        
        if (patternPart.startsWith(':')) {
            // Parameter placeholder
            const paramName = patternPart.substring(1);
            params[paramName] = pathPart;
        } else if (patternPart !== pathPart) {
            // Literal mismatch
            return null;
        }
    }
    
    return { params };
}
```

## Navigation State Management

### Active Module Tracking

```javascript
class NavigationManager {
    constructor() {
        this.activeModule = null;
        this.previousModule = null;
        this.navigationHistory = [];
        this.eventBus = new EventTarget();
    }
    
    setActiveModule(moduleName, context = {}) {
        this.previousModule = this.activeModule;
        this.activeModule = moduleName;
        
        // Update navigation history
        this.addToHistory(moduleName, context);
        
        // Update UI state
        this.updateActiveStates();
        
        // Emit navigation event
        this.emitNavigationEvent('moduleChange', {
            previous: this.previousModule,
            current: this.activeModule,
            context
        });
    }
    
    updateActiveStates() {
        // Remove all active states
        document.querySelectorAll('.nav-link.active').forEach(link => {
            link.classList.remove('active');
        });
        
        // Add active state to current module
        const activeLink = document.querySelector(`[data-module="${this.activeModule}"]`);
        if (activeLink) {
            activeLink.classList.add('active');
        }
    }
}
```

### History Management

```javascript
// Browser history integration
class HistoryManager {
    constructor(router) {
        this.router = router;
        this.setupHistoryListeners();
    }
    
    setupHistoryListeners() {
        window.addEventListener('popstate', (event) => {
            const path = this.getCurrentPath();
            this.router.navigate(path, false);
        });
        
        window.addEventListener('hashchange', (event) => {
            const path = this.getPathFromHash();
            this.router.navigate(path, false);
        });
    }
    
    getCurrentPath() {
        const hash = window.location.hash;
        return hash ? hash.substring(1) : '';
    }
    
    updateHistory(path, state = {}) {
        const url = `#${path}`;
        history.pushState({ path, ...state }, '', url);
    }
}
```

## URL Structure and Patterns

### Supported URL Patterns

```javascript
// URL pattern examples
const routePatterns = {
    // Static routes
    '/': 'home',
    '/wiki': 'wiki-home',
    '/spectrogram': 'spectrogram-module',
    '/7band-meter': '7band-module',
    
    // Parameterized routes
    '/wiki/:page': 'wiki-page',
    '/module/:name': 'dynamic-module',
    '/module/:name/:action': 'module-action',
    
    // Nested routes
    '/wiki/:category/:page': 'wiki-nested-page',
    '/admin/:section/:item': 'admin-interface'
};

// Route registration example
router.registerRoute('/', () => loadHomeModule());
router.registerRoute('/spectrogram', () => loadSpectrogramModule());
router.registerRoute('/wiki/:page', (params) => loadWikiPage(params.page));
router.registerRoute('/module/:name/:action', (params) => {
    loadModule(params.name, params.action);
});
```

### URL State Persistence

```javascript
// State serialization for URLs
class URLStateManager {
    constructor() {
        this.stateSerializers = new Map();
    }
    
    registerStateSerializer(moduleName, serializer) {
        this.stateSerializers.set(moduleName, serializer);
    }
    
    serializeState(moduleName, state) {
        const serializer = this.stateSerializers.get(moduleName);
        if (serializer) {
            return serializer.serialize(state);
        }
        return {};
    }
    
    deserializeState(moduleName, urlParams) {
        const serializer = this.stateSerializers.get(moduleName);
        if (serializer) {
            return serializer.deserialize(urlParams);
        }
        return {};
    }
}

// Example: Spectrogram state serialization
const spectrogramStateSerializer = {
    serialize(state) {
        return {
            fftSize: state.fftSize,
            smoothing: state.smoothingTimeConstant,
            gain: state.gain
        };
    },
    
    deserialize(params) {
        return {
            fftSize: parseInt(params.fftSize) || 2048,
            smoothingTimeConstant: parseFloat(params.smoothing) || 0.8,
            gain: parseFloat(params.gain) || 1.0
        };
    }
};
```

## Module Loading Strategies

### Context-Aware Loading

```javascript
// Hybrid loading strategy based on context
class ModuleLoadingStrategy {
    constructor(router) {
        this.router = router;
        this.context = this.detectContext();
    }
    
    detectContext() {
        return window.location.protocol === 'file:' ? 'file' : 'http';
    }
    
    async loadModule(moduleName) {
        if (this.context === 'http') {
            return this.loadModuleHTTP(moduleName);
        } else {
            return this.loadModuleFile(moduleName);
        }
    }
    
    async loadModuleHTTP(moduleName) {
        // HTTP context - use fetch for fragments
        const fragmentUrl = this.router.createFetchUrl(`${moduleName}/index.html`, 'module');
        
        try {
            const response = await fetch(fragmentUrl);
            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }
            
            const html = await response.text();
            return this.processHTMLFragment(html, moduleName);
        } catch (error) {
            console.warn('HTTP loading failed, falling back to inline:', error);
            return this.loadModuleFile(moduleName);
        }
    }
    
    loadModuleFile(moduleName) {
        // File context - use inline templates
        const template = window.moduleHTML[moduleName];
        if (!template) {
            throw new Error(`Module template not found: ${moduleName}`);
        }
        
        return this.processInlineTemplate(template, moduleName);
    }
}
```

### Fragment Processing

```javascript
// HTML fragment processing
processHTMLFragment(html, moduleName) {
    // Fix relative paths for module context
    const processedHTML = this.router.processHtmlPaths(html, 'module');
    
    // Inject into main content
    const mainContent = document.getElementById('main-content');
    mainContent.innerHTML = processedHTML;
    
    // Load associated script
    return this.loadModuleScript(moduleName);
}

// Path processing for different contexts
processHtmlPaths(html, context) {
    if (context === 'module') {
        // Fix script and asset paths for module context
        return html.replace(
            /src="(?!http|\/)/g, 
            `src="src/${this.currentModule}/`
        );
    }
    return html;
}
```

## Navigation Events and Hooks

### Event System

```javascript
// Navigation event types
const NavigationEvents = {
    BEFORE_NAVIGATE: 'beforeNavigate',
    NAVIGATE_START: 'navigateStart',
    NAVIGATE_SUCCESS: 'navigateSuccess',
    NAVIGATE_ERROR: 'navigateError',
    MODULE_CHANGE: 'moduleChange',
    ROUTE_CHANGE: 'routeChange'
};

// Event emission pattern
class NavigationEventEmitter {
    constructor() {
        this.eventBus = new EventTarget();
    }
    
    emit(eventType, data) {
        const event = new CustomEvent(eventType, {
            detail: data,
            cancelable: eventType === NavigationEvents.BEFORE_NAVIGATE
        });
        
        return this.eventBus.dispatchEvent(event);
    }
    
    on(eventType, handler) {
        this.eventBus.addEventListener(eventType, handler);
    }
    
    off(eventType, handler) {
        this.eventBus.removeEventListener(eventType, handler);
    }
}
```

### Navigation Guards

```javascript
// Navigation guard system
class NavigationGuards {
    constructor() {
        this.guards = new Map();
    }
    
    registerGuard(pattern, guard) {
        this.guards.set(pattern, guard);
    }
    
    async checkGuards(fromRoute, toRoute) {
        for (const [pattern, guard] of this.guards) {
            if (this.matchesPattern(pattern, toRoute.path)) {
                const result = await guard(fromRoute, toRoute);
                if (result === false) {
                    return false;
                }
            }
        }
        return true;
    }
}

// Example navigation guard
router.registerGuard('/admin/*', async (from, to) => {
    if (!user.isAuthenticated()) {
        router.navigate('/login');
        return false;
    }
    return true;
});
```

## Error Handling and Fallbacks

### Route Error Handling

```javascript
// Comprehensive error handling
class RouterErrorHandler {
    constructor(router) {
        this.router = router;
        this.fallbackRoutes = new Map();
    }
    
    handleNavigationError(error, path) {
        console.error('Navigation error:', error);
        
        // Try fallback route
        const fallback = this.findFallbackRoute(path);
        if (fallback) {
            return this.router.navigate(fallback, false);
        }
        
        // Show error page
        this.showErrorPage(error, path);
    }
    
    findFallbackRoute(path) {
        // Check for parent route
        const parentPath = path.split('/').slice(0, -1).join('/');
        if (parentPath && this.router.routes.has(parentPath)) {
            return parentPath;
        }
        
        // Default fallback
        return '/';
    }
    
    showErrorPage(error, path) {
        const errorHTML = `
            <div class="error-page">
                <h2>Navigation Error</h2>
                <p>Failed to load: ${path}</p>
                <p>Error: ${error.message}</p>
                <button onclick="history.back()">Go Back</button>
                <button onclick="location.hash='/'">Home</button>
            </div>
        `;
        
        document.getElementById('main-content').innerHTML = errorHTML;
    }
}
```

## Performance Optimizations

### Route Caching

```javascript
// Route result caching
class RouteCacheManager {
    constructor() {
        this.cache = new Map();
        this.maxCacheSize = 10;
    }
    
    getCachedRoute(path) {
        const cached = this.cache.get(path);
        if (cached && !this.isExpired(cached)) {
            return cached.result;
        }
        return null;
    }
    
    setCachedRoute(path, result) {
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
        
        this.cache.set(path, {
            result,
            timestamp: Date.now()
        });
    }
}
```

### Preloading Strategies

```javascript
// Route preloading
class RoutePreloader {
    constructor(router) {
        this.router = router;
        this.preloadQueue = new Set();
    }
    
    preloadRoute(path) {
        if (this.preloadQueue.has(path)) {
            return;
        }
        
        this.preloadQueue.add(path);
        
        // Preload in background
        requestIdleCallback(() => {
            this.loadRouteInBackground(path);
        });
    }
    
    async loadRouteInBackground(path) {
        try {
            const route = this.router.resolveRoute(path);
            if (route) {
                await route.handler();
            }
        } catch (error) {
            console.warn('Preload failed:', path, error);
        } finally {
            this.preloadQueue.delete(path);
        }
    }
}
```

## Integration Examples

### Module Registration

```javascript
// Complete module registration example
async function registerSpectrogramModule() {
    // Register route
    router.registerRoute('/spectrogram', async () => {
        const module = await moduleLoader.loadModule('spectrogram');
        await module.init();
        return module;
    });
    
    // Register navigation
    navigation.registerModule('spectrogram', {
        title: '3D Spectrogram',
        icon: 'bi-soundwave',
        path: '/spectrogram'
    });
    
    // Register state serialization
    urlState.registerStateSerializer('spectrogram', spectrogramStateSerializer);
}
```

### Usage in Application

```javascript
// Application navigation usage
document.addEventListener('DOMContentLoaded', async () => {
    // Initialize routing system
    await router.init();
    await navigation.init();
    
    // Handle initial navigation
    const initialPath = router.getCurrentPath() || '/';
    await router.navigate(initialPath, false);
    
    // Set up navigation links
    document.querySelectorAll('[data-navigate]').forEach(link => {
        link.addEventListener('click', (e) => {
            e.preventDefault();
            const path = link.getAttribute('data-navigate');
            router.navigate(path);
        });
    });
});
```

## Related Documentation

- [JavaScript Module Architecture](javascript-modules.md)
- [CSS Module Architecture](css-modules.md)
- [API Reference - Router Manager](../api-reference/javascript-api/router-manager.md)
- [API Reference - Navigation](../api-reference/javascript-api/navigation.md)

---

*The routing and navigation system provides the foundation for seamless user experience in Qualia-NSS, enabling complex audio analysis workflows without page reloads or state loss.*