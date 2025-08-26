// Filters Module JavaScript
class FiltersModule {
    constructor() {
        this.currentConfig = {
            type: 'lowpass',
            cutoffFreq: 1000,
            qFactor: 0.7
        };
    }

    init() {
        console.log('Filters module initialized');
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        const filterType = document.getElementById('filter-type');
        const cutoffFreq = document.getElementById('cutoff-freq');
        const qFactor = document.getElementById('q-factor');
        const applyBtn = document.querySelector('.btn-primary');

        if (filterType) {
            filterType.addEventListener('change', (e) => {
                this.currentConfig.type = e.target.value;
                this.updateDisplay();
            });
        }

        if (cutoffFreq) {
            cutoffFreq.addEventListener('input', (e) => {
                this.currentConfig.cutoffFreq = parseInt(e.target.value);
                this.updateFreqDisplay();
                this.updateDisplay();
            });
        }

        if (qFactor) {
            qFactor.addEventListener('input', (e) => {
                this.currentConfig.qFactor = parseFloat(e.target.value);
                this.updateQDisplay();
                this.updateDisplay();
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', () => {
                this.applyFilter();
            });
        }
    }

    updateFreqDisplay() {
        const display = document.getElementById('freq-display');
        if (display) {
            display.textContent = `${this.currentConfig.cutoffFreq} Hz`;
        }
    }

    updateQDisplay() {
        const display = document.getElementById('q-display');
        if (display) {
            display.textContent = this.currentConfig.qFactor.toFixed(1);
        }
    }

    applyFilter() {
        console.log('Applying filter with config:', this.currentConfig);
        alert(`Applied ${this.currentConfig.type} filter at ${this.currentConfig.cutoffFreq}Hz (Q=${this.currentConfig.qFactor})`);
    }

    updateDisplay() {
        console.log('Filter config updated:', this.currentConfig);
        this.updateFreqDisplay();
        this.updateQDisplay();
    }

    destroy() {
        console.log('Filters module destroyed');
    }
}

// Export for module loading
window.FiltersModule = FiltersModule;