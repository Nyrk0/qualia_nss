/**
 * Navigation - Handles navigation state and welcome page
 * Part of the Qualia-NSS modular architecture
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- ACTIVE STATE MANAGEMENT ---
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

    // Helper: set navbar active based on module name
    const setNavActiveForModule = (moduleName) => {
        try {
            const map = {
                'speakers-spl': '.navbar-nav .nav-link:nth-child(1)',
                'filters': '.navbar-nav .nav-link:nth-child(2)',
                'cabinets': '.navbar-nav .nav-link:nth-child(3)',
                'tests': '.navbar-nav .nav-link:nth-child(4)',
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
    };

    // --- MODULE NAVIGATION FUNCTIONS ---
    // Load Speakers module (redirects internally to speakers-spl)
    window.loadSpeakers = () => window.loadModule('speakers-spl');

    window.loadSpeakersSpl = () => window.loadModule('speakers-spl');
    window.loadFilters = () => window.loadModule('filters');
    window.loadCabinets = () => window.loadModule('cabinets');
    window.loadTests = () => window.loadModule('tests');
    window.loadSpectrogram = () => window.loadModule('spectrogram');

    // Auto-restore last opened module if available
    try {
        const last = localStorage.getItem('lastModule');
        if (last && window.moduleHTML && (last in window.moduleHTML)) {
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