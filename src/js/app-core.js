/**
 * App Core - Main application initialization and theme management
 * Part of the Qualia-NSS modular architecture
 */

// Early global stubs so inline onclick handlers don't error before initialization
// These are replaced with full implementations in other modules
window.setActiveNav = window.setActiveNav || function(){ /* no-op until initialized */ };
window.loadSpeakersSpl = window.loadSpeakersSpl || function(){ document.addEventListener('DOMContentLoaded', () => window.loadSpeakersSpl()); };
window.loadFilters = window.loadFilters || function(){ document.addEventListener('DOMContentLoaded', () => window.loadFilters()); };
window.loadCabinets = window.loadCabinets || function(){ document.addEventListener('DOMContentLoaded', () => window.loadCabinets()); };
window.load7bandLevelmeter = window.load7bandLevelmeter || function(){ document.addEventListener('DOMContentLoaded', () => window.load7bandLevelmeter()); };
// Back-compat alias
window.loadTests = window.loadTests || function(){ document.addEventListener('DOMContentLoaded', () => window.load7bandLevelmeter()); };
window.loadSpectrogram = window.loadSpectrogram || function(){ document.addEventListener('DOMContentLoaded', () => window.loadSpectrogram()); };
window.loadWiki = window.loadWiki || function(){ 
    console.log('Wiki stub called - waiting for navigation.js to load');
    if (window.loadModule && window.moduleHTML && window.moduleHTML.wiki) {
        window.loadModule('wiki');
    } else {
        setTimeout(() => window.loadWiki(), 100);
    }
};

// Main application initialization
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    // --- THEME MANAGEMENT ---

    // Function to apply the saved theme on load
    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
        }
    };

    // Function to toggle the theme
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