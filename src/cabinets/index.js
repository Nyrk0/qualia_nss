// Cabinets Module JavaScript
class CabinetsModule {
    constructor() {
        this.currentConfig = {
            type: 'sealed',
            internalVolume: 20,
            portDiameter: 50,
            portLength: 100
        };
    }

    init() {
        console.log('Cabinets module initialized');
        this.bindEvents();
        this.updateDisplay();
    }

    bindEvents() {
        const cabinetType = document.getElementById('cabinet-type');
        const internalVolume = document.getElementById('internal-volume');
        const portDiameter = document.getElementById('port-diameter');
        const portLength = document.getElementById('port-length');
        const calculateBtn = document.querySelector('.btn-primary');

        if (cabinetType) {
            cabinetType.addEventListener('change', (e) => {
                this.currentConfig.type = e.target.value;
                this.updatePortControls();
                this.updateDisplay();
            });
        }

        if (internalVolume) {
            internalVolume.addEventListener('input', (e) => {
                this.currentConfig.internalVolume = parseFloat(e.target.value);
                this.updateDisplay();
            });
        }

        if (portDiameter) {
            portDiameter.addEventListener('input', (e) => {
                this.currentConfig.portDiameter = parseInt(e.target.value);
                this.updateDisplay();
            });
        }

        if (portLength) {
            portLength.addEventListener('input', (e) => {
                this.currentConfig.portLength = parseInt(e.target.value);
                this.updateDisplay();
            });
        }

        if (calculateBtn) {
            calculateBtn.addEventListener('click', () => {
                this.calculateResponse();
            });
        }
    }

    updatePortControls() {
        const portDiameter = document.getElementById('port-diameter');
        const portLength = document.getElementById('port-length');
        const isPorted = this.currentConfig.type === 'ported' || this.currentConfig.type === 'passive';
        
        if (portDiameter) portDiameter.disabled = !isPorted;
        if (portLength) portLength.disabled = !isPorted;
    }

    calculateResponse() {
        console.log('Calculating cabinet response with config:', this.currentConfig);
        const portInfo = this.currentConfig.type === 'sealed' ? 
            '' : ` with ${this.currentConfig.portDiameter}mm port (${this.currentConfig.portLength}mm length)`;
        
        alert(`Calculated response for ${this.currentConfig.type} cabinet (${this.currentConfig.internalVolume}L)${portInfo}`);
    }

    updateDisplay() {
        console.log('Cabinet config updated:', this.currentConfig);
        this.updatePortControls();
    }

    destroy() {
        console.log('Cabinets module destroyed');
    }
}

// Export for module loading
window.CabinetsModule = CabinetsModule;