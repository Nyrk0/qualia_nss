/**
 * @fileoverview App Core - main application initialization and theme management
 * Provides early global function stubs to prevent ReferenceErrors before module loading
 * and handles theme persistence with localStorage
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

/**
 * Early global function stubs to prevent ReferenceErrors during page load
 * These are replaced with full implementations when navigation.js loads
 * Critical for preventing onclick handler failures in index.html
 */
window.setActiveNav = window.setActiveNav || function(){ /* no-op until initialized */ };
window.loadSpeakersSpl = window.loadSpeakersSpl || function(){ document.addEventListener('DOMContentLoaded', () => window.loadSpeakersSpl()); };
window.loadFilters = window.loadFilters || function(){ document.addEventListener('DOMContentLoaded', () => window.loadFilters()); };
window.loadCabinets = window.loadCabinets || function(){ document.addEventListener('DOMContentLoaded', () => window.loadCabinets()); };
window.load7bandLevelmeter = window.load7bandLevelmeter || function(){ document.addEventListener('DOMContentLoaded', () => window.load7bandLevelmeter()); };
// Back-compat alias
window.loadTests = window.loadTests || function(){ document.addEventListener('DOMContentLoaded', () => window.load7bandLevelmeter()); };
window.loadSpectrogram = window.loadSpectrogram || function(){ document.addEventListener('DOMContentLoaded', () => window.loadSpectrogram()); };

// Main application initialization
document.addEventListener('DOMContentLoaded', async () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;
    
    // --- ES6 MODULE SYSTEM INITIALIZATION (Phase 2) ---
    try {
        // Try to initialize Phase 1 ES6 modules first
        if (window.Config?.features?.es6Modules) {
            const { MobileDetection } = await import('/src/utils/mobile-detection.js');
            const { ThemeManager } = await import('/src/core/theme-manager.js');
            const { getComponentRegistry } = await import('/src/core/component-registry.js');
            
            console.log('✓ Phase 2: ES6 modules loaded successfully');
            console.log('- MobileDetection:', MobileDetection);
            console.log('- ThemeManager:', ThemeManager);
            console.log('- ComponentRegistry:', getComponentRegistry());
        }
    } catch (error) {
        console.log('ES6 modules not available, using vanilla JS fallback:', error);
    }

    // --- THEME MANAGEMENT ---

    /**
     * Applies the saved theme from localStorage on page load
     * Default theme is dark; only applies 'light-theme' class if explicitly saved
     */
    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
        }
    };

    /**
     * Toggles between light and dark themes and persists preference to localStorage
     * Adds/removes 'light-theme' class on body element
     */
    const toggleTheme = () => {
        body.classList.toggle('light-theme');
        // Save the new theme preference
        if (body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
        }
    };

    // Attach event listener to the theme toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }

    // Apply the theme when the page loads
    applySavedTheme();

    console.log('App core initialized.');
});