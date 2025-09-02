/**
 * UI Components for Comb-Filter Analysis Tool
 * Utility functions for interface management
 * Part of Qualia-NSS Standalone Modules
 */

class UIComponents {
    constructor() {
        this.tooltips = new Map();
        this.initialized = false;
    }
    
    /**
     * Initialize UI components
     */
    init() {
        this.setupTooltips();
        this.setupKeyboardShortcuts();
        this.setupThemeHandling();
        this.initialized = true;
        console.log('🎨 UI Components initialized');
    }
    
    /**
     * Setup tooltips for help elements
     */
    setupTooltips() {
        const tooltipElements = document.querySelectorAll('[data-tooltip]');
        
        tooltipElements.forEach(element => {
            const tooltip = this.createTooltip(element.dataset.tooltip);
            this.tooltips.set(element, tooltip);
            
            element.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltip));
            element.addEventListener('mouseleave', () => this.hideTooltip(tooltip));
            element.addEventListener('mousemove', (e) => this.positionTooltip(e, tooltip));
        });
        
        // Also setup tooltips for elements with title attributes
        const titleElements = document.querySelectorAll('[title]');
        titleElements.forEach(element => {
            if (!element.dataset.tooltip) {
                const tooltip = this.createTooltip(element.title);
                this.tooltips.set(element, tooltip);
                
                // Remove default browser tooltip
                element.removeAttribute('title');
                element.dataset.originalTitle = element.title || '';
                
                element.addEventListener('mouseenter', (e) => this.showTooltip(e, tooltip));
                element.addEventListener('mouseleave', () => this.hideTooltip(tooltip));
                element.addEventListener('mousemove', (e) => this.positionTooltip(e, tooltip));
            }
        });
    }
    
    /**
     * Create tooltip element
     */
    createTooltip(text) {
        const tooltip = document.createElement('div');
        tooltip.className = 'custom-tooltip';
        tooltip.textContent = text;
        tooltip.style.cssText = `
            position: absolute;
            background: rgba(0, 0, 0, 0.9);
            color: white;
            padding: 8px 12px;
            border-radius: 6px;
            font-size: 12px;
            font-weight: 500;
            z-index: 10000;
            pointer-events: none;
            opacity: 0;
            transition: opacity 0.2s ease;
            max-width: 250px;
            line-height: 1.4;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
        `;
        
        document.body.appendChild(tooltip);
        return tooltip;
    }
    
    /**
     * Show tooltip
     */
    showTooltip(event, tooltip) {
        tooltip.style.opacity = '1';
        this.positionTooltip(event, tooltip);
    }
    
    /**
     * Hide tooltip
     */
    hideTooltip(tooltip) {
        tooltip.style.opacity = '0';
    }
    
    /**
     * Position tooltip
     */
    positionTooltip(event, tooltip) {
        const x = event.clientX + 10;
        const y = event.clientY - tooltip.offsetHeight - 10;
        
        // Keep tooltip on screen
        const maxX = window.innerWidth - tooltip.offsetWidth - 10;
        const maxY = window.innerHeight - tooltip.offsetHeight - 10;
        
        tooltip.style.left = Math.min(x, maxX) + 'px';
        tooltip.style.top = Math.max(y, 10) + 'px';
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            // Don't interfere with form inputs
            if (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT') {
                return;
            }
            
            switch (e.key) {
                case ' ': // Spacebar - toggle audio
                    e.preventDefault();
                    document.getElementById('start-audio')?.click();
                    break;
                    
                case 'f': // F - freeze display
                    e.preventDefault();
                    document.getElementById('freeze-display')?.click();
                    break;
                    
                case 'c': // C - clear display
                    e.preventDefault();
                    document.getElementById('clear-display')?.click();
                    break;
                    
                case '1': // Number keys - switch visualization modes
                case '2':
                case '3':
                case '4':
                    e.preventDefault();
                    const tabs = document.querySelectorAll('.viz-tab');
                    const index = parseInt(e.key) - 1;
                    if (tabs[index]) {
                        tabs[index].click();
                    }
                    break;
                    
                case 'Escape': // Escape - close modals
                    this.closeAllModals();
                    break;
            }
        });
        
        console.log('⌨️ Keyboard shortcuts setup');
    }
    
    /**
     * Setup theme handling
     */
    setupThemeHandling() {
        // Handle system theme changes
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        mediaQuery.addEventListener('change', (e) => {
            console.log(`🎨 System theme changed to: ${e.matches ? 'dark' : 'light'}`);
        });
        
        // Handle reduced motion preference
        const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
        if (motionQuery.matches) {
            document.body.classList.add('reduced-motion');
        }
    }
    
    /**
     * Utility methods
     */
    
    /**
     * Format frequency for display
     */
    static formatFrequency(frequency) {
        if (frequency >= 1000) {
            return (frequency / 1000).toFixed(1) + ' kHz';
        }
        return Math.round(frequency) + ' Hz';
    }
    
    /**
     * Format time for display
     */
    static formatTime(timeSeconds) {
        if (timeSeconds >= 1) {
            return timeSeconds.toFixed(2) + ' s';
        }
        return (timeSeconds * 1000).toFixed(1) + ' ms';
    }
    
    /**
     * Format decibels for display
     */
    static formatDecibels(db) {
        return db.toFixed(1) + ' dB';
    }
    
    /**
     * Format percentage for display
     */
    static formatPercent(value) {
        return Math.round(value * 100) + '%';
    }
    
    /**
     * Create loading spinner
     */
    static createSpinner(size = 'medium') {
        const spinner = document.createElement('div');
        spinner.className = `spinner spinner-${size}`;
        
        const sizeMap = {
            small: '20px',
            medium: '40px',
            large: '60px'
        };
        
        const spinnerSize = sizeMap[size] || sizeMap.medium;
        
        spinner.style.cssText = `
            width: ${spinnerSize};
            height: ${spinnerSize};
            border: 3px solid var(--surface-color, #ccc);
            border-top: 3px solid var(--primary-light, #3498db);
            border-radius: 50%;
            animation: spin 1s linear infinite;
            margin: 0 auto;
        `;
        
        return spinner;
    }
    
    /**
     * Show notification
     */
    static showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification notification-${type}`;
        notification.textContent = message;
        
        const colors = {
            info: '#3498db',
            success: '#27ae60',
            warning: '#f39c12',
            error: '#e74c3c'
        };
        
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${colors[type]};
            color: white;
            padding: 12px 20px;
            border-radius: 6px;
            font-size: 14px;
            font-weight: 500;
            z-index: 10001;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            transform: translateX(100%);
            transition: transform 0.3s ease;
            max-width: 300px;
            word-wrap: break-word;
        `;
        
        document.body.appendChild(notification);
        
        // Animate in
        setTimeout(() => {
            notification.style.transform = 'translateX(0)';
        }, 10);
        
        // Auto remove
        setTimeout(() => {
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
        
        return notification;
    }
    
    /**
     * Create progress bar
     */
    static createProgressBar(container, options = {}) {
        const {
            height = '6px',
            color = 'var(--primary-light, #3498db)',
            backgroundColor = 'var(--surface-light, #ddd)',
            animated = true
        } = options;
        
        const progressBar = document.createElement('div');
        progressBar.className = 'progress-bar-container';
        progressBar.style.cssText = `
            width: 100%;
            height: ${height};
            background: ${backgroundColor};
            border-radius: calc(${height} / 2);
            overflow: hidden;
            position: relative;
        `;
        
        const progressFill = document.createElement('div');
        progressFill.className = 'progress-bar-fill';
        progressFill.style.cssText = `
            height: 100%;
            background: ${color};
            border-radius: inherit;
            width: 0%;
            transition: width 0.3s ease;
            ${animated ? 'animation: progress-shimmer 1.5s infinite;' : ''}
        `;
        
        progressBar.appendChild(progressFill);
        container.appendChild(progressBar);
        
        return {
            container: progressBar,
            setProgress: (percent) => {
                progressFill.style.width = Math.min(100, Math.max(0, percent)) + '%';
            }
        };
    }
    
    /**
     * Close all modals
     */
    closeAllModals() {
        const modals = document.querySelectorAll('.modal.visible');
        modals.forEach(modal => {
            modal.classList.remove('visible');
        });
    }
    
    /**
     * Animate element
     */
    static animateElement(element, animation, duration = 300) {
        return new Promise((resolve) => {
            const animationName = `animate-${animation}`;
            element.style.animation = `${animationName} ${duration}ms ease-out forwards`;
            
            setTimeout(() => {
                element.style.animation = '';
                resolve();
            }, duration);
        });
    }
    
    /**
     * Debounce function calls
     */
    static debounce(func, wait) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
    
    /**
     * Throttle function calls
     */
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    /**
     * Cleanup
     */
    destroy() {
        // Remove all tooltips
        this.tooltips.forEach((tooltip) => {
            if (tooltip.parentNode) {
                tooltip.parentNode.removeChild(tooltip);
            }
        });
        this.tooltips.clear();
        
        console.log('🗑️ UI Components destroyed');
    }
}

// Add CSS animations
const style = document.createElement('style');
style.textContent = `
    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }
    
    @keyframes progress-shimmer {
        0% { background-position: -200px 0; }
        100% { background-position: calc(200px + 100%) 0; }
    }
    
    @keyframes animate-fadeIn {
        from { opacity: 0; }
        to { opacity: 1; }
    }
    
    @keyframes animate-slideIn {
        from { transform: translateY(-20px); opacity: 0; }
        to { transform: translateY(0); opacity: 1; }
    }
    
    @keyframes animate-bounce {
        0%, 20%, 53%, 80%, 100% { transform: translateY(0); }
        40%, 43% { transform: translateY(-20px); }
        70% { transform: translateY(-10px); }
    }
    
    .reduced-motion * {
        animation-duration: 0.01ms !important;
        animation-iteration-count: 1 !important;
        transition-duration: 0.01ms !important;
    }
`;
document.head.appendChild(style);

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = UIComponents;
} else {
    window.UIComponents = UIComponents;
}

// Auto-initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    if (!window.uiComponents) {
        window.uiComponents = new UIComponents();
        window.uiComponents.init();
    }
});