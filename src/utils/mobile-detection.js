/**
 * @fileoverview Mobile Detection Utility
 * Device detection and mobile capabilities for Qualia-NSS
 * Part of ES6 modules migration - Phase 1
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

/**
 * Mobile detection utilities for responsive behavior
 * @namespace MobileDetection
 */
export const MobileDetection = {
  /**
   * Detect if device is iOS (iPhone, iPad, iPod)
   * @returns {boolean} True if iOS device
   */
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),

  /**
   * Detect if device is Android
   * @returns {boolean} True if Android device
   */
  isAndroid: () => /Android/.test(navigator.userAgent),

  /**
   * Detect if device is mobile based on screen size and user agent
   * @returns {boolean} True if mobile device
   */
  isMobile: () => {
    return window.innerWidth < 768 || /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
  },

  /**
   * Detect if device supports touch
   * @returns {boolean} True if touch is supported
   */
  isTouch: () => {
    return 'ontouchstart' in window || navigator.maxTouchPoints > 0 || navigator.msMaxTouchPoints > 0;
  },

  /**
   * Get device type information
   * @returns {Object} Device type details
   * @returns {boolean} returns.ios - Is iOS device
   * @returns {boolean} returns.android - Is Android device
   * @returns {boolean} returns.mobile - Is mobile device
   * @returns {boolean} returns.touch - Supports touch
   * @returns {string} returns.type - Device type string
   */
  getDeviceType: () => {
    const ios = MobileDetection.isIOS();
    const android = MobileDetection.isAndroid();
    const mobile = MobileDetection.isMobile();
    const touch = MobileDetection.isTouch();

    let type = 'desktop';
    if (ios) type = 'ios';
    else if (android) type = 'android';
    else if (mobile) type = 'mobile';

    return { ios, android, mobile, touch, type };
  },

  /**
   * Get viewport dimensions
   * @returns {Object} Viewport information
   * @returns {number} returns.width - Viewport width
   * @returns {number} returns.height - Viewport height
   * @returns {boolean} returns.portrait - Is portrait orientation
   * @returns {boolean} returns.landscape - Is landscape orientation
   */
  getViewport: () => {
    const width = window.innerWidth;
    const height = window.innerHeight;
    const portrait = height > width;
    const landscape = width > height;

    return { width, height, portrait, landscape };
  },

  /**
   * Check if device supports specific features
   * @returns {Object} Feature support information
   */
  getFeatureSupport: () => {
    return {
      webAudio: !!(window.AudioContext || window.webkitAudioContext),
      webGL: !!window.WebGLRenderingContext,
      webComponents: !!window.customElements,
      modules: !!window.import || 'noModule' in document.createElement('script'),
      serviceWorker: 'serviceWorker' in navigator
    };
  }
};

// Maintain global compatibility during migration
if (typeof window !== 'undefined') {
  window.MobileDetection = MobileDetection;
}

// Default export for convenience
export default MobileDetection;