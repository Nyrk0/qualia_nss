/**
 * @fileoverview Configuration Management
 * Centralized configuration for Qualia-NSS application
 * Part of ES6 modules migration - Phase 1
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

/**
 * Application configuration object
 * @namespace Config
 */
export const Config = {
  /**
   * Application metadata
   */
  app: {
    name: 'Qualia-NSS',
    version: '1.0.0',
    description: 'Professional Audio Analysis Suite',
    author: 'Qualia-NSS Development Team'
  },

  /**
   * Audio processing configuration
   */
  audio: {
    sampleRate: 44100,
    bufferSize: 2048,
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -90,
    maxDecibels: -10,
    
    // Frequency ranges
    frequencies: {
      min: 20,
      max: 20000,
      bands: {
        subBass: { min: 20, max: 60, color: '#8b0000' },
        bass: { min: 60, max: 250, color: '#dc143c' },
        lowMid: { min: 250, max: 500, color: '#ff6347' },
        midrange: { min: 500, max: 2000, color: '#ff8c00' },
        upperMid: { min: 2000, max: 4000, color: '#32cd32' },
        presence: { min: 4000, max: 6000, color: '#1e90ff' },
        brilliance: { min: 6000, max: 20000, color: '#9370db' }
      }
    }
  },

  /**
   * UI configuration
   */
  ui: {
    theme: {
      default: 'dark',
      available: ['dark', 'light'],
      storageKey: 'qualiaTheme'
    },
    
    breakpoints: {
      mobile: 768,
      tablet: 1024,
      desktop: 1200
    },
    
    animations: {
      duration: 200,
      easing: 'ease-out'
    },

    components: {
      toneControl: {
        defaultFrequency: 1000,
        colormap: 'qualia7band',
        snapTolerance: 0.005
      }
    }
  },

  /**
   * Development configuration
   */
  development: {
    debug: false,
    verbose: false,
    showPerformanceMetrics: false,
    enableHotReload: false
  },

  /**
   * Module configuration
   */
  modules: {
    autoLoad: false,
    lazy: true,
    preload: [],
    
    available: [
      'speakers-spl',
      'filters', 
      'cabinets',
      '7band-levelmeter',
      'spectrogram'
    ],

    paths: {
      base: '/src/modules/',
      components: '/src/components/',
      utils: '/src/utils/',
      core: '/src/core/'
    }
  },

  /**
   * Performance configuration
   */
  performance: {
    enableWebWorkers: true,
    maxConcurrentProcesses: 4,
    cacheSize: 50,
    debounceDelay: 16 // ~60fps
  }
};

/**
 * Configuration manager for runtime config changes
 * @class ConfigManager
 */
export class ConfigManager {
  /**
   * Singleton instance
   * @private
   * @static
   */
  static _instance = null;

  /**
   * Get singleton instance
   * @static
   * @returns {ConfigManager} Config manager instance
   */
  static getInstance() {
    if (!ConfigManager._instance) {
      ConfigManager._instance = new ConfigManager();
    }
    return ConfigManager._instance;
  }

  /**
   * Create config manager
   * @private
   */
  constructor() {
    if (ConfigManager._instance) {
      return ConfigManager._instance;
    }

    this.config = { ...Config }; // Deep copy would be better for production
    this.observers = new Set();
    
    ConfigManager._instance = this;
  }

  /**
   * Get configuration value
   * @param {string} path - Dot notation path (e.g., 'audio.sampleRate')
   * @param {*} defaultValue - Default value if path not found
   * @returns {*} Configuration value
   */
  get(path, defaultValue = null) {
    const keys = path.split('.');
    let current = this.config;

    for (const key of keys) {
      if (current && typeof current === 'object' && key in current) {
        current = current[key];
      } else {
        return defaultValue;
      }
    }

    return current;
  }

  /**
   * Set configuration value
   * @param {string} path - Dot notation path
   * @param {*} value - Value to set
   * @returns {boolean} Success status
   */
  set(path, value) {
    const keys = path.split('.');
    const lastKey = keys.pop();
    let current = this.config;

    // Navigate to parent object
    for (const key of keys) {
      if (!current[key] || typeof current[key] !== 'object') {
        current[key] = {};
      }
      current = current[key];
    }

    const oldValue = current[lastKey];
    current[lastKey] = value;

    // Notify observers
    this._notifyObservers(path, value, oldValue);

    return true;
  }

  /**
   * Get entire configuration object
   * @returns {Object} Full configuration
   */
  getAll() {
    return { ...this.config };
  }

  /**
   * Add configuration change observer
   * @param {Function} callback - Callback function (path, newValue, oldValue) => void
   */
  addObserver(callback) {
    if (typeof callback === 'function') {
      this.observers.add(callback);
    }
  }

  /**
   * Remove configuration change observer
   * @param {Function} callback - Callback function to remove
   */
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  /**
   * Notify observers of configuration changes
   * @private
   * @param {string} path - Changed path
   * @param {*} newValue - New value
   * @param {*} oldValue - Previous value
   */
  _notifyObservers(path, newValue, oldValue) {
    this.observers.forEach(callback => {
      try {
        callback(path, newValue, oldValue);
      } catch (error) {
        console.error('Config observer error:', error);
      }
    });
  }

  /**
   * Load configuration from localStorage
   * @param {string} [key='qualiaConfig'] - Storage key
   */
  loadFromStorage(key = 'qualiaConfig') {
    try {
      const stored = localStorage.getItem(key);
      if (stored) {
        const parsed = JSON.parse(stored);
        Object.assign(this.config, parsed);
        console.log('Configuration loaded from storage');
      }
    } catch (error) {
      console.warn('Could not load configuration from storage:', error);
    }
  }

  /**
   * Save configuration to localStorage
   * @param {string} [key='qualiaConfig'] - Storage key
   */
  saveToStorage(key = 'qualiaConfig') {
    try {
      localStorage.setItem(key, JSON.stringify(this.config));
      console.log('Configuration saved to storage');
    } catch (error) {
      console.warn('Could not save configuration to storage:', error);
    }
  }
}

// Maintain global compatibility during migration
if (typeof window !== 'undefined') {
  window.Config = Config;
  window.ConfigManager = ConfigManager;
}

// Default export
export default Config;