/**
 * @fileoverview Home Module - ES6+ home page management
 * HYBRID ES6+ VERSION: Modern ES6+ module for home page functionality
 * Part of st02-modularization Phase 2 - HomeModule integration
 * @author Qualia-NSS Development Team
 * @version 2.0.0 - ES6+ HomeModule Implementation
 */

/**
 * Home Module class providing welcome page functionality
 * ES6+ module with static methods and template management
 */
export class HomeModule {
  
  /**
   * Initialize home module functionality
   * Sets up status checks and welcome page features
   */
  static async init() {
    console.log('Initializing HomeModule (ES6+ mode)...');
    
    // Initialize status checks after content is loaded
    this.initializeStatusChecks();
    
    // Initialize feature card animations
    this.initializeFeatureAnimations();
    
    console.log('HomeModule initialized successfully.');
  }
  
  /**
   * Initialize status dashboard checks
   * Updates WebGL and microphone status badges
   */
  static initializeStatusChecks() {
    // WebGL capability check
    const webglStatus = document.getElementById('webgl-status');
    if (webglStatus) {
      const canvas = document.createElement('canvas');
      const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
      
      if (gl) {
        webglStatus.innerHTML = '<i class="bi bi-gpu-card me-1"></i>WebGL 2.0 Ready';
        webglStatus.classList.add('active');
      } else {
        webglStatus.innerHTML = '<i class="bi bi-gpu-card me-1"></i>WebGL Limited';
        webglStatus.style.color = 'var(--danger-color)';
      }
    }
    
    // Microphone availability check
    const micStatus = document.getElementById('mic-status');
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia && micStatus) {
      micStatus.innerHTML = '<i class="bi bi-mic me-1"></i>Microphone Available';
      micStatus.classList.add('active');
    }
  }
  
  /**
   * Initialize feature card animations
   * Adds staggered fade-in animations for feature cards
   */
  static initializeFeatureAnimations() {
    setTimeout(() => {
      const featureCards = document.querySelectorAll('.feature-card');
      featureCards.forEach((card, index) => {
        setTimeout(() => {
          card.style.opacity = '1';
          card.style.transform = 'translateY(0)';
        }, index * 100);
      });
    }, 300);
  }
  
  /**
   * Get home module HTML template
   * Returns the welcome page template content
   * @returns {Promise<string>} HTML template string
   */
  static async getTemplate() {
    // Template is loaded from welcome.html via module loader
    // This method provides template access for programmatic use
    const response = await fetch('/src/home/templates/welcome.html');
    if (!response.ok) {
      throw new Error(`Failed to load home template: ${response.status}`);
    }
    return await response.text();
  }
  
  /**
   * Render home module content
   * Loads template and initializes module functionality
   * @param {HTMLElement} container - Target container element
   */
  static async render(container) {
    try {
      const template = await this.getTemplate();
      container.innerHTML = template;
      
      // Initialize module after content is loaded
      await this.init();
      
    } catch (error) {
      console.error('Failed to render HomeModule:', error);
      
      // Fallback content if template loading fails
      container.innerHTML = `
        <div class="welcome-hero">
          <h1 class="hero-title">
            <span class="text-gradient">Qualia-NSS</span>
            <small class="text-muted d-block">Professional Audio Analysis Toolkit</small>
          </h1>
          <div class="hero-description">
            <p class="lead">Choose an analysis module from the navigation above to begin your audio engineering workflow.</p>
            <div class="status-dashboard mt-4">
              <div class="status-badge active">
                <i class="bi bi-check-circle me-1"></i>
                Ready for Analysis
              </div>
            </div>
          </div>
        </div>
      `;
    }
  }
  
  /**
   * Cleanup method for module unloading
   * Removes event listeners and resets state
   */
  static destroy() {
    // Clear any timers or intervals
    // Remove event listeners if any were added
    console.log('HomeModule cleanup completed.');
  }
}

// --- HYBRID COMPATIBILITY LAYER ---
// Maintains backward compatibility during migration
// TODO: Remove in Phase 4 after complete ES6+ migration

// Global registration for current module loader compatibility
window.HomeModule = HomeModule;

// Legacy initialization support
window.initializeHomeModule = () => HomeModule.init();