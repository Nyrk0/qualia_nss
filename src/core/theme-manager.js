/**
 * @fileoverview Theme Manager
 * Centralized theme management for Qualia-NSS
 * Part of ES6 modules migration - Phase 1
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

import { MobileDetection } from '../utils/mobile-detection.js';

/**
 * Theme management system for Qualia-NSS
 * @class ThemeManager
 */
export class ThemeManager {
  /**
   * Singleton instance
   * @private
   * @static
   */
  static _instance = null;

  /**
   * Get singleton instance
   * @static
   * @returns {ThemeManager} Theme manager instance
   */
  static getInstance() {
    if (!ThemeManager._instance) {
      ThemeManager._instance = new ThemeManager();
    }
    return ThemeManager._instance;
  }

  /**
   * Create theme manager instance
   * @private
   */
  constructor() {
    if (ThemeManager._instance) {
      return ThemeManager._instance;
    }

    this.currentTheme = 'dark'; // Default theme
    this.themes = new Map();
    this.observers = new Set();
    this.deviceInfo = MobileDetection.getDeviceType();
    
    this._initializeThemes();
    this._loadSavedTheme();

    ThemeManager._instance = this;
  }

  /**
   * Initialize default themes
   * @private
   */
  _initializeThemes() {
    // Dark theme (default)
    this.themes.set('dark', {
      name: 'dark',
      displayName: 'Dark Theme',
      cssClass: '', // No class needed - default
      variables: {
        '--bg-color': '#121212',
        '--text-color': '#e0e0e0',
        '--panel-bg-color': '#1e1e1e',
        '--panel-border-color': '#333',
        '--accent-color': '#0088ff',
        '--accent-hover-color': '#3399ff',
        '--muted-text-color': '#888',
        '--neutral-text-color': '#aaa'
      }
    });

    // Light theme
    this.themes.set('light', {
      name: 'light',
      displayName: 'Light Theme', 
      cssClass: 'light-theme',
      variables: {
        '--bg-color': '#f4f4f9',
        '--text-color': '#333333',
        '--panel-bg-color': '#ffffff',
        '--panel-border-color': '#dddddd',
        '--accent-color': '#0088ff',
        '--accent-hover-color': '#3399ff',
        '--muted-text-color': '#666',
        '--neutral-text-color': '#777'
      }
    });
  }

  /**
   * Load saved theme from localStorage
   * @private
   */
  _loadSavedTheme() {
    try {
      const saved = localStorage.getItem('qualiaTheme');
      if (saved && this.themes.has(saved)) {
        this.setTheme(saved, false); // Don't save again
      }
    } catch (error) {
      console.warn('Could not load saved theme:', error);
    }
  }

  /**
   * Set active theme
   * @param {string} themeName - Name of theme to activate
   * @param {boolean} [save=true] - Whether to save to localStorage
   * @returns {boolean} Success status
   */
  setTheme(themeName, save = true) {
    const theme = this.themes.get(themeName);
    if (!theme) {
      console.warn(`Theme '${themeName}' not found`);
      return false;
    }

    const previousTheme = this.currentTheme;
    this.currentTheme = themeName;

    // Apply CSS class
    document.body.className = document.body.className
      .replace(/light-theme|dark-theme/g, '')
      .trim();
    
    if (theme.cssClass) {
      document.body.classList.add(theme.cssClass);
    }

    // Apply CSS variables
    const root = document.documentElement;
    Object.entries(theme.variables).forEach(([property, value]) => {
      root.style.setProperty(property, value);
    });

    // Save to localStorage
    if (save) {
      try {
        localStorage.setItem('qualiaTheme', themeName);
      } catch (error) {
        console.warn('Could not save theme preference:', error);
      }
    }

    // Notify observers
    this._notifyObservers(theme, previousTheme);

    console.log(`Theme changed from '${previousTheme}' to '${themeName}'`);
    return true;
  }

  /**
   * Get current theme
   * @returns {string} Current theme name
   */
  getCurrentTheme() {
    return this.currentTheme;
  }

  /**
   * Get theme information
   * @param {string} [themeName] - Theme name (current if not specified)
   * @returns {Object|null} Theme object or null if not found
   */
  getTheme(themeName = this.currentTheme) {
    return this.themes.get(themeName) || null;
  }

  /**
   * Get all available themes
   * @returns {Array<Object>} Array of theme objects
   */
  getAvailableThemes() {
    return Array.from(this.themes.values());
  }

  /**
   * Toggle between light and dark themes
   * @returns {string} New theme name
   */
  toggleTheme() {
    const newTheme = this.currentTheme === 'dark' ? 'light' : 'dark';
    this.setTheme(newTheme);
    return newTheme;
  }

  /**
   * Add theme change observer
   * @param {Function} callback - Callback function (newTheme, oldTheme) => void
   */
  addObserver(callback) {
    if (typeof callback === 'function') {
      this.observers.add(callback);
    }
  }

  /**
   * Remove theme change observer
   * @param {Function} callback - Callback function to remove
   */
  removeObserver(callback) {
    this.observers.delete(callback);
  }

  /**
   * Notify all observers of theme change
   * @private
   * @param {Object} newTheme - New theme object
   * @param {string} oldThemeName - Previous theme name
   */
  _notifyObservers(newTheme, oldThemeName) {
    this.observers.forEach(callback => {
      try {
        callback(newTheme, oldThemeName);
      } catch (error) {
        console.error('Theme observer error:', error);
      }
    });
  }

  /**
   * Get device-appropriate theme recommendation
   * @returns {string} Recommended theme name
   */
  getDeviceRecommendedTheme() {
    // Check system preference if available
    if (window.matchMedia && window.matchMedia('(prefers-color-scheme: light)').matches) {
      return 'light';
    }
    
    // Default to dark for audio applications (easier on eyes)
    return 'dark';
  }

  /**
   * Initialize theme system
   * @static
   * @returns {Promise<ThemeManager>} Initialized theme manager
   */
  static async init() {
    const manager = ThemeManager.getInstance();
    
    // Apply device-appropriate theme if none saved
    if (!localStorage.getItem('qualiaTheme')) {
      const recommended = manager.getDeviceRecommendedTheme();
      manager.setTheme(recommended);
    }

    return manager;
  }
}

// Maintain global compatibility during migration
if (typeof window !== 'undefined') {
  window.ThemeManager = ThemeManager;
}

// Default export
export default ThemeManager;