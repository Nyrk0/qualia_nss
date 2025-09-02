// Tests Module JavaScript
class TestsModule {
    constructor() {
        this.currentConfig = {
            testType: 'frequency',
            testSignal: 'sine',
            amplitude: -20
        };
        this.isRunning = false;
    }

    init() {
        console.log('Tests module initialized');
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        const testType = document.getElementById('test-type');
        const testSignal = document.getElementById('test-signal');
        const amplitude = document.getElementById('amplitude');
        const startBtn = document.querySelector('.btn-primary');
        const stopBtn = document.querySelector('.btn-secondary');

        if (testType) {
            testType.addEventListener('change', (e) => {
                this.currentConfig.testType = e.target.value;
                this.updateDisplay();
            });
        }

        if (testSignal) {
            testSignal.addEventListener('change', (e) => {
                this.currentConfig.testSignal = e.target.value;
                this.updateDisplay();
            });
        }

        if (amplitude) {
            amplitude.addEventListener('input', (e) => {
                this.currentConfig.amplitude = parseInt(e.target.value);
                this.updateAmplitudeDisplay();
                this.updateDisplay();
            });
        }

        if (startBtn) {
            startBtn.addEventListener('click', () => {
                this.startTest();
            });
        }

        if (stopBtn) {
            stopBtn.addEventListener('click', () => {
                this.stopTest();
            });
        }
    }

    updateAmplitudeDisplay() {
        const display = document.getElementById('amp-display');
        if (display) {
            display.textContent = `${this.currentConfig.amplitude} dB`;
        }
    }

    startTest() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        console.log('Starting test with config:', this.currentConfig);
        
        const startBtn = document.querySelector('.btn-primary');
        const stopBtn = document.querySelector('.btn-secondary');
        
        if (startBtn) startBtn.disabled = true;
        if (stopBtn) stopBtn.disabled = false;
        
        alert(`Started ${this.currentConfig.testType} test using ${this.currentConfig.testSignal} signal at ${this.currentConfig.amplitude}dB`);
    }

    stopTest() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        console.log('Stopping test');
        
        const startBtn = document.querySelector('.btn-primary');
        const stopBtn = document.querySelector('.btn-secondary');
        
        if (startBtn) startBtn.disabled = false;
        if (stopBtn) stopBtn.disabled = true;
        
        alert('Test stopped');
    }

    updateDisplay() {
        console.log('Tests config updated:', this.currentConfig);
        this.updateAmplitudeDisplay();
        
        const stopBtn = document.querySelector('.btn-secondary');
        if (stopBtn) {
            stopBtn.disabled = !this.isRunning;
        }
    }

    destroy() {
        console.log('Tests module destroyed');
        if (this.isRunning) {
            this.stopTest();
        }
    }
}

// Export for module loading
window.TestsModule = TestsModule;