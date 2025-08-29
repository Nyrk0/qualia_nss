/**
 * Initializes a custom scroll-fading effect on a given container element - WIREFRAME SPECIFICATION
 * Status: ✅ IMPLEMENTED in src/js/ui-utils.js with modular integration
 * 
 * This specification has been implemented and enhanced in the modular architecture:
 * - Location: src/js/ui-utils.js (lines 9-31, globally available as window.initializeScrollFade)
 * - Integration: Automatically called by module-loader.js for sidebar scroll-fade-containers
 * - Usage: initializeScrollFade('#sidebar .scroll-fade-container') for proper targeting
 * 
 * This function should be called after the DOM is loaded.
 * It listens for scroll events on the container and toggles CSS classes
 * to show or hide the ::before and ::after pseudo-elements defined in the CSS.
 *
 * @param {string} containerSelector A CSS selector for the container element.
 */
function initializeScrollFade(containerSelector) {
  const container = document.querySelector(containerSelector);

  if (!container) {
    console.error(`Scroll-fade container with selector "${containerSelector}" not found.`);
    return;
  }

  const handleScroll = () => {
    // A small tolerance (in pixels) to prevent the bottom fade from flickering
    // when the scroll position is extremely close to the end.
    const scrollEndTolerance = 2;

    // Condition to show the top fade: True if scrolled down even a little.
    const showTopFade = container.scrollTop > 0;
    container.classList.toggle('show-top-fade', showTopFade);

    // Condition to show the bottom fade: True if the current scroll position is less
    // than the maximum possible scroll position.
    const showBottomFade = container.scrollTop < (container.scrollHeight - container.clientHeight - scrollEndTolerance);
    container.classList.toggle('show-bottom-fade', showBottomFade);
  };

  // Attach the event listener to the container.
  container.addEventListener('scroll', handleScroll);

  // Also listen for window resize events, as this can change the container's
  // scroll height and whether the scrollbar is active.
  window.addEventListener('resize', handleScroll);

  // Perform an initial check when the function is called, in case the
  // container is already scrollable on page load.
  handleScroll();
}

/*
// --- Example Usage ---
// ORIGINAL WIREFRAME EXAMPLE:
document.addEventListener('DOMContentLoaded', () => {
  initializeScrollFade('#sidebar');
});

// CURRENT IMPLEMENTATION:
// Function is automatically loaded via src/js/ui-utils.js and made globally available
// Module-loader.js automatically calls: initializeScrollFade('#sidebar .scroll-fade-container')
// for proper targeting of accordion containers within sidebar

// IMPLEMENTATION STATUS: ✅ COMPLETED with modular integration
// 
// Current Implementation Features:
// 1. Global Availability: window.initializeScrollFade (accessible from any module)
// 2. Automatic Integration: Called by module-loader.js when modules load
// 3. Proper Targeting: Uses '#sidebar .scroll-fade-container' instead of '#sidebar'
// 4. Enhanced Selector: Targets accordion within sidebar for complex layouts
// 
// Integration Points:
// - Function: src/js/ui-utils.js (DOMContentLoaded wrapper, globally exported)
// - Auto-call: src/js/module-loader.js (line 153, during module loading)
// - Target: .scroll-fade-container class within sidebar (accordion containers)
// 
// Test Status: ✅ Working with spectrogram module advanced accordion sidebar
*/
