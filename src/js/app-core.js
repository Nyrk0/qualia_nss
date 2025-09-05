/**
 * @fileoverview App Core - ES6+ application initialization and theme management
 * HYBRID ES6+ VERSION: Provides modern ES6+ patterns with backward compatibility
 * Part of st02-modularization Phase 1 migration
 * @author Qualia-NSS Development Team  
 * @version 2.0.0 - ES6+ Migration
 */

/**
 * Core application initialization and theme management
 * ES6+ class with static methods for modern architecture
 */
export class AppCore {
  
  /**
   * Early global function stubs to prevent ReferenceErrors
   * Creates safety stubs before navigation.js loads
   */
  static initializeGlobalStubs() {
    const globalFunctions = [
      'setActiveNav',
      'loadSpeakersSpl', 
      'loadFilters',
      'loadCabinets',
      'load7bandLevelmeter',
      'loadTests', // Back-compat alias
      'loadSpectrogram'
    ];
    
    globalFunctions.forEach(funcName => {
      window[funcName] = window[funcName] || (() => {
        if (document.readyState === 'loading') {
          document.addEventListener('DOMContentLoaded', () => window[funcName]());
        }
      });
    });
  }
  
  /**
   * Mobile PWA optimization for iOS and Android
   * Handles browser chrome optimization and touch behaviors
   */
  static optimizeMobileUI() {
    // Service worker registration (future PWA enhancement)
    if ('serviceWorker' in navigator) {
      // navigator.serviceWorker.register('/sw.js');
    }
    
    // Mobile-specific optimizations
    const isMobile = window.MobileDetection?.isIOS() || window.MobileDetection?.isAndroid();
    if (!isMobile) return;
    
    // Minimize browser chrome behavior
    let lastScrollTop = 0;
    window.addEventListener('scroll', () => {
      const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
      if (currentScroll > lastScrollTop && currentScroll > 50) {
        // Encourage browser chrome to hide
        document.body.style.transform = 'translateY(-1px)';
        setTimeout(() => {
          document.body.style.transform = '';
        }, 100);
      }
      lastScrollTop = currentScroll <= 0 ? 0 : currentScroll;
    }, { passive: true });
    
    // Prevent zoom on double tap
    let lastTouchEnd = 0;
    document.addEventListener('touchend', (event) => {
      const now = Date.now();
      if (now - lastTouchEnd <= 300) {
        event.preventDefault();
      }
      lastTouchEnd = now;
    }, false);
  }
  
  /**
   * Theme management system
   * Handles light/dark theme switching with localStorage persistence
   */
  static initializeThemeSystem() {
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;
    
    // Apply saved theme from localStorage
    const applySavedTheme = () => {
      const savedTheme = localStorage.getItem('theme');
      if (savedTheme === 'light') {
        body.classList.add('light-theme');
      }
    };
    
    // Toggle theme and persist preference
    const toggleTheme = () => {
      body.classList.toggle('light-theme');
      
      // Save preference to localStorage
      if (body.classList.contains('light-theme')) {
        localStorage.setItem('theme', 'light');
      } else {
        localStorage.removeItem('theme');
      }
    };
    
    // Attach event listener
    themeToggleButton?.addEventListener('click', toggleTheme);
    
    // Apply saved theme on initialization
    applySavedTheme();
  }
  
  /**
   * Main application initialization
   * Coordinates all core systems startup
   */
  static async init() {
    // Initialize global function stubs first (critical for preventing errors)
    this.initializeGlobalStubs();
    
    // Mobile optimizations
    this.optimizeMobileUI();
    
    // Theme system
    this.initializeThemeSystem();
    
    console.log('App core initialized (ES6+ mode).');
  }
}

// --- HYBRID COMPATIBILITY LAYER ---
// Maintains backward compatibility during migration
// TODO: Remove in Phase 4 after complete ES6+ migration

// Global registration for current module loader compatibility
window.AppCore = AppCore;

// Maintain existing initialization pattern
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Using ES6+ AppCore initialization with hybrid compatibility');
  await AppCore.init();
});

// Legacy global stubs (maintain existing behavior)
// These are replaced with full implementations when navigation.js loads
window.setActiveNav = window.setActiveNav || function(){ /* no-op until initialized */ };
window.loadSpeakersSpl = window.loadSpeakersSpl || function(){ document.addEventListener('DOMContentLoaded', () => window.loadSpeakersSpl()); };
window.loadFilters = window.loadFilters || function(){ document.addEventListener('DOMContentLoaded', () => window.loadFilters()); };
window.loadCabinets = window.loadCabinets || function(){ document.addEventListener('DOMContentLoaded', () => window.loadCabinets()); };
window.load7bandLevelmeter = window.load7bandLevelmeter || function(){ document.addEventListener('DOMContentLoaded', () => window.load7bandLevelmeter()); };
window.loadTests = window.loadTests || function(){ document.addEventListener('DOMContentLoaded', () => window.load7bandLevelmeter()); };
window.loadSpectrogram = window.loadSpectrogram || function(){ document.addEventListener('DOMContentLoaded', () => window.loadSpectrogram()); };