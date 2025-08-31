/**
 * @fileoverview Navigation module - handles navigation state and welcome page display
 * Part of the Qualia-NSS modular architecture
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ACTIVE STATE MANAGEMENT ---
    /**
     * Sets the active navigation element by removing 'active' class from all nav items
     * and adding it to the specified element
     * @param {Element} activeElement - The DOM element to mark as active
     */
    window.setActiveNav = (activeElement) => {
        // Remove active from all nav items
        document.querySelectorAll('.nav-link, .logo').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active to specified element
        if (activeElement) {
            activeElement.classList.add('active');
        }
    };
    
    // Set QUALIA logo as active on page load (landing page)
    const logo = document.querySelector('.logo');
    if (logo) {
        window.setActiveNav(logo);
    }

    /**
     * Helper function to set navbar active state based on module name
     * @param {string} moduleName - Name of the module ('speakers-spl', 'filters', etc.)
     */
    const setNavActiveForModule = (moduleName) => {
        try {
            const map = {
                'speakers-spl': '.navbar-nav .nav-link:nth-child(1)',
                'filters': '.navbar-nav .nav-link:nth-child(2)',
                'cabinets': '.navbar-nav .nav-link:nth-child(3)',
                '7band-levelmeter': '.navbar-nav .nav-link:nth-child(4)',
                'spectrogram': '.navbar-nav .nav-link:nth-child(5)'
            };
            const sel = map[moduleName];
            if (!sel) return;
            const el = document.querySelector(sel);
            if (el) window.setActiveNav(el);
        } catch(_) {}
    };

    // Make setNavActiveForModule globally available
    window.setNavActiveForModule = setNavActiveForModule;

    // --- WELCOME PAGE FUNCTION ---
    /**
     * Shows the welcome/home page and destroys any active module
     * Sets up home page layout with full-width content
     */
    window.showWelcome = () => {
        // Destroy current module if exists
        if (window.currentModule && window.currentModule.instance) {
            window.currentModule.instance.destroy();
            window.currentModule = null;
        }
        
        // Set up home page layout
        const contentWrapper = document.getElementById('content-wrapper');
        if (contentWrapper) {
            // Add home-page class for styling
            contentWrapper.classList.add('home-page');
            
            // Remove sidebar if it exists
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.remove();
            }
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            // Add full-width class for home page
            mainContent.classList.add('full-width');
            mainContent.innerHTML = `
                <h1>Welcome</h1>
                <p>QUALIA•NSS blueprint will be loaded here.</p>
            `;
        }
        
        // Set logo as active when showing welcome
        const logo = document.querySelector('.logo');
        window.setActiveNav(logo);
        // Set localStorage to remember home page
        try { localStorage.setItem('lastModule', '__HOME__'); } catch(_) {}
    };

    // --- MODULE NAVIGATION FUNCTIONS ---
    /**
     * Navigation wrapper functions that delegate to loadModule
     * These provide clean entry points for each module
     */
    
    /** Load Speakers module (redirects internally to speakers-spl) */
    window.loadSpeakers = () => window.loadModule('speakers-spl');

    /** Load Speakers SPL module */
    window.loadSpeakersSpl = () => window.loadModule('speakers-spl');
    /** Load Filters module */
    window.loadFilters = () => window.loadModule('filters');
    /** Load Cabinets module */
    window.loadCabinets = () => window.loadModule('cabinets');
    /** Load 7-band level meter module */
    window.load7bandLevelmeter = () => window.loadModule('7band-levelmeter');
    /** Back-compat alias for loadTests */
    window.loadTests = () => window.loadModule('7band-levelmeter');
    /** Load Spectrogram module */
    window.loadSpectrogram = () => window.loadModule('spectrogram');
    /** Load Wiki module */
    window.loadWiki = () => window.loadModule('wiki');

    // Auto-restore last opened module if available
    try {
        const last = localStorage.getItem('lastModule');
        if (last === '__HOME__') {
            window.showWelcome();
        } else if (last && window.moduleHTML && (last in window.moduleHTML)) {
            window.loadModule(last);
            // Ensure navbar reflects restored module immediately
            setTimeout(() => setNavActiveForModule(last), 0);
        } else {
            window.showWelcome();
        }
    } catch (_) {
        window.showWelcome();
    }

    console.log('Navigation initialized.');
});