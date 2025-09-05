/**
 * @fileoverview UI Utils - ES6+ Common UI utilities and effects
 * HYBRID ES6+ VERSION: Provides modern ES6+ patterns with backward compatibility
 * Part of st02-modularization Phase 1 migration
 * @author Qualia-NSS Development Team
 * @version 2.0.0 - ES6+ Migration
 */

/**
 * UI Utilities class providing scroll effects and sidebar management
 * ES6+ class with static methods for modern architecture
 */
export class UIUtils {
  
  /**
   * Initialize scroll fade effect for a single container
   * @param {string} containerSelector - CSS selector for the scroll container
   */
  static initializeScrollFade(containerSelector) {
    const container = document.querySelector(containerSelector);

    if (!container) {
      console.error(`Scroll-fade container with selector "${containerSelector}" not found.`);
      return;
    }

    console.log('Initializing scroll-fade for:', containerSelector, container);

    const handleScroll = () => {
      const scrollEndTolerance = 2;
      const showTopFade = container.scrollTop > 0;
      const showBottomFade = container.scrollTop < (container.scrollHeight - container.clientHeight - scrollEndTolerance);
      
      container.classList.toggle('show-top-fade', showTopFade);
      container.classList.toggle('show-bottom-fade', showBottomFade);
    };

    container.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    handleScroll();
  }

  /**
   * Initialize scroll fade with separate scroll and target containers
   * @param {string} scrollContainerSelector - CSS selector for scroll monitoring
   * @param {string} targetContainerSelector - CSS selector for fade application
   */
  static initializeScrollFadeFixed(scrollContainerSelector, targetContainerSelector) {
    const scrollContainer = document.querySelector(scrollContainerSelector);
    const targetContainer = document.querySelector(targetContainerSelector);

    if (!scrollContainer) {
      console.error(`Scroll container with selector "${scrollContainerSelector}" not found.`);
      return;
    }
    if (!targetContainer) {
      console.error(`Target container with selector "${targetContainerSelector}" not found.`);
      return;
    }

    console.log('Initializing fixed scroll-fade - monitoring:', scrollContainerSelector, 'applying to:', targetContainerSelector);

    const handleScroll = () => {
      const scrollEndTolerance = 2;
      const showTopFade = scrollContainer.scrollTop > 0;
      const showBottomFade = scrollContainer.scrollTop < (scrollContainer.scrollHeight - scrollContainer.clientHeight - scrollEndTolerance);
      
      // Apply fade classes to target container (sidebar), not scroll container
      targetContainer.classList.toggle('show-top-fade', showTopFade);
      targetContainer.classList.toggle('show-bottom-fade', showBottomFade);
    };

    scrollContainer.addEventListener('scroll', handleScroll);
    window.addEventListener('resize', handleScroll);
    
    // Initial check with multiple attempts to ensure content is loaded
    handleScroll();
    setTimeout(handleScroll, 100);
    setTimeout(handleScroll, 300);
    setTimeout(handleScroll, 500);
    
    // Watch for content changes (accordion expand/collapse)
    const observer = new MutationObserver(() => {
      setTimeout(handleScroll, 50);
    });
    observer.observe(scrollContainer, {
      childList: true,
      subtree: true,
      attributes: true,
      attributeFilter: ['class', 'style']
    });
  }

  /**
   * Sidebar visibility management
   * Shows sidebar by adding CSS class
   */
  static showSidebar() {
    const contentWrapper = document.getElementById('content-wrapper');
    if (contentWrapper) {
      contentWrapper.classList.add('with-sidebar');
    }
  }

  /**
   * Sidebar visibility management
   * Hides sidebar by removing CSS class
   */
  static hideSidebar() {
    const contentWrapper = document.getElementById('content-wrapper');
    if (contentWrapper) {
      contentWrapper.classList.remove('with-sidebar');
    }
  }

  /**
   * Initialize workflow item click handlers
   * Sets up event listeners for workflow navigation
   */
  static initializeWorkflowHandlers() {
    const workflowItems = document.querySelectorAll('.workflow-item');
    workflowItems.forEach((item) => {
      item.addEventListener('click', () => {
        console.log(`Clicked on workflow item: ${item.querySelector('.item-text').textContent}`);
        // Add navigation logic here
      });
    });
  }

  /**
   * Main initialization method
   * Coordinates all UI utility systems
   */
  static async init() {
    // Initialize workflow handlers
    this.initializeWorkflowHandlers();
    
    console.log('UI utilities initialized (ES6+ mode).');
  }
}

// --- HYBRID COMPATIBILITY LAYER ---
// Maintains backward compatibility during migration
// TODO: Remove in Phase 4 after complete ES6+ migration

// Global registration for current module loader compatibility
window.UIUtils = UIUtils;

// Maintain existing initialization pattern
document.addEventListener('DOMContentLoaded', async () => {
  console.log('Using ES6+ UIUtils initialization with hybrid compatibility');
  await UIUtils.init();
});

// Legacy global functions (maintain existing behavior)
window.initializeScrollFade = (containerSelector) => UIUtils.initializeScrollFade(containerSelector);
window.initializeScrollFadeFixed = (scrollSelector, targetSelector) => UIUtils.initializeScrollFadeFixed(scrollSelector, targetSelector);
window.showSidebar = () => UIUtils.showSidebar();
window.hideSidebar = () => UIUtils.hideSidebar();