/**
 * @fileoverview Component Registry - Centralized ES6 component management
 * Part of Phase 2: Component System Modernization
 * @author Qualia-NSS Development Team  
 * @version 1.0.0
 */

import { Config } from './config.js';

/**
 * Centralized component registry for ES6 module loading
 * Maintains compatibility with global loading patterns while
 * enabling modern import/export workflows
 */
class ComponentRegistry {
  constructor() {
    this.components = new Map();
    this.loadPromises = new Map();
    this.observers = new Set();
    
    // Track loading state
    this.loadingComponents = new Set();
    this.loadedComponents = new Set();
    this.failedComponents = new Set();
  }
  
  /**
   * Register a component with the registry
   * @param {string} name - Component name
   * @param {Object} config - Component configuration
   * @param {string} config.path - ES6 module path
   * @param {string} config.globalName - Global fallback name
   * @param {Array<string>} config.dependencies - Component dependencies
   */
  register(name, config) {
    const componentConfig = {
      name,
      path: config.path,
      globalName: config.globalName || name,
      dependencies: config.dependencies || [],
      loaded: false,
      instance: null,
      ...config
    };
    
    this.components.set(name, componentConfig);
    this._notifyObservers('registered', { name, config: componentConfig });
  }
  
  /**
   * Load a component using ES6 imports with global fallback
   * @param {string} name - Component name
   * @returns {Promise<Object>} - Component exports
   */
  async load(name) {
    const config = this.components.get(name);
    if (!config) {
      throw new Error(`Component '${name}' not registered`);
    }
    
    // Return cached promise if already loading
    if (this.loadPromises.has(name)) {
      return this.loadPromises.get(name);
    }
    
    // Load dependencies first
    await this._loadDependencies(config.dependencies);
    
    // Create loading promise
    const loadPromise = this._loadComponent(config);
    this.loadPromises.set(name, loadPromise);
    
    try {
      const result = await loadPromise;
      config.loaded = true;
      config.instance = result;
      this.loadedComponents.add(name);
      this._notifyObservers('loaded', { name, exports: result });
      return result;
    } catch (error) {
      this.failedComponents.add(name);
      this._notifyObservers('failed', { name, error });
      throw error;
    } finally {
      this.loadingComponents.delete(name);
    }
  }
  
  /**
   * Get a loaded component
   * @param {string} name - Component name
   * @returns {Object|null} - Component exports or null if not loaded
   */
  get(name) {
    const config = this.components.get(name);
    return config?.instance || null;
  }
  
  /**
   * Check if a component is loaded
   * @param {string} name - Component name
   * @returns {boolean}
   */
  isLoaded(name) {
    return this.loadedComponents.has(name);
  }
  
  /**
   * Check if a component is currently loading
   * @param {string} name - Component name
   * @returns {boolean}
   */
  isLoading(name) {
    return this.loadingComponents.has(name);
  }
  
  /**
   * Add observer for component lifecycle events
   * @param {Function} callback - Observer callback
   */
  addObserver(callback) {
    this.observers.add(callback);
  }
  
  /**
   * Remove observer
   * @param {Function} callback - Observer callback
   */
  removeObserver(callback) {
    this.observers.delete(callback);
  }
  
  /**
   * Get registry status
   * @returns {Object} - Status information
   */
  getStatus() {
    return {
      total: this.components.size,
      loaded: this.loadedComponents.size,
      loading: this.loadingComponents.size,
      failed: this.failedComponents.size,
      components: Array.from(this.components.keys())
    };
  }
  
  // Private methods
  
  async _loadDependencies(dependencies) {
    if (!dependencies.length) return;
    
    const loadPromises = dependencies.map(dep => {
      if (this.isLoaded(dep)) return Promise.resolve();
      return this.load(dep);
    });
    
    await Promise.all(loadPromises);
  }
  
  async _loadComponent(config) {
    this.loadingComponents.add(config.name);
    
    try {
      // Try ES6 import first
      if (Config.features?.es6Modules) {
        try {
          const module = await import(config.path);
          console.log(`✓ ES6 loaded: ${config.name}`, module);
          return module;
        } catch (importError) {
          console.warn(`ES6 import failed for ${config.name}, falling back to global:`, importError);
        }
      }
      
      // Fallback to global loading (existing behavior)
      return await this._loadViaScript(config);
      
    } catch (error) {
      console.error(`Failed to load component ${config.name}:`, error);
      throw error;
    }
  }
  
  async _loadViaScript(config) {
    return new Promise((resolve, reject) => {
      // Check if already globally available
      if (config.globalName && window[config.globalName]) {
        resolve({ [config.globalName]: window[config.globalName] });
        return;
      }
      
      // Load via script tag
      const script = document.createElement('script');
      script.src = config.path;
      script.onload = () => {
        if (config.globalName && window[config.globalName]) {
          resolve({ [config.globalName]: window[config.globalName] });
        } else {
          resolve({}); // Generic success for side-effect scripts
        }
        script.remove();
      };
      script.onerror = () => {
        reject(new Error(`Failed to load script: ${config.path}`));
        script.remove();
      };
      document.head.appendChild(script);
    });
  }
  
  _notifyObservers(event, data) {
    for (const observer of this.observers) {
      try {
        observer(event, data);
      } catch (error) {
        console.error('Component registry observer error:', error);
      }
    }
  }
}

// Singleton instance
let instance = null;

/**
 * Get the singleton component registry instance
 * @returns {ComponentRegistry}
 */
export function getComponentRegistry() {
  if (!instance) {
    instance = new ComponentRegistry();
    
    // Register built-in components
    instance.register('tone-control', {
      path: '/src/components/tone-control/tone-control.js',
      globalName: 'ToneControl'
    });
  }
  return instance;
}

// ES6 exports
export { ComponentRegistry };

// Global compatibility
if (typeof window !== 'undefined') {
  window.ComponentRegistry = ComponentRegistry;
  window.getComponentRegistry = getComponentRegistry;
}