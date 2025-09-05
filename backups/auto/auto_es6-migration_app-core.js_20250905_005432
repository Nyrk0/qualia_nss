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
    
    // --- MOBILE PWA OPTIMIZATION ---
    // Encourage full-screen behavior on mobile browsers
    if ('serviceWorker' in navigator) {
        // Register service worker for PWA capabilities (future enhancement)
        // navigator.serviceWorker.register('/sw.js');
    }
    
    // Handle mobile browser UI optimization
    const optimizeMobileUI = () => {
        if (window.MobileDetection?.isIOS() || window.MobileDetection?.isAndroid()) {
            // Add scroll behavior to minimize browser chrome
            let lastScrollTop = 0;
            window.addEventListener('scroll', () => {
                const currentScroll = window.pageYOffset || document.documentElement.scrollTop;
                if (currentScroll > lastScrollTop && currentScroll > 50) {
                    // Scrolling down - encourage browser chrome to hide
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
                const now = (new Date()).getTime();
                if (now - lastTouchEnd <= 300) {
                    event.preventDefault();
                }
                lastTouchEnd = now;
            }, false);
        }
    };

    // --- ES6 MODULE SYSTEM INITIALIZATION (Phase 2) ---
    // Note: ES6 modules disabled until st02-modularization is fully implemented
    // Currently using vanilla JS approach for stability
    console.log('Using vanilla JS initialization (ES6 modules deferred to st02-modularization)');
    optimizeMobileUI();

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