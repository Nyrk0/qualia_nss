/**
 * Tests for ToneControl Web Component
 */

describe('ToneControl Component', () => {
    let toneControl;

    beforeEach(() => {
        // Create a fresh tone control instance for each test
        toneControl = document.createElement('tone-control');
        document.body.appendChild(toneControl);
    });

    afterEach(() => {
        // Clean up after each test
        if (toneControl && toneControl.parentNode) {
            toneControl.parentNode.removeChild(toneControl);
        }
    });

    it('should be defined as a custom element', () => {
        expect.toBeTruthy(customElements.get('tone-control'));
    });

    it('should create shadow DOM', () => {
        expect.toExist(toneControl.shadowRoot);
    });

    it('should have default frequency of 1000Hz', () => {
        expect.toEqual(toneControl.frequency, 1000);
    });

    it('should have default active state of false', () => {
        expect.toBeFalsy(toneControl.active);
    });

    it('should update frequency when attribute changes', () => {
        toneControl.setAttribute('value', '2000');
        expect.toEqual(toneControl.frequency, 2000);
    });

    it('should update active state when attribute changes', () => {
        toneControl.setAttribute('active', '');
        expect.toBeTruthy(toneControl.active);
    });

    it('should have slider element in shadow DOM', () => {
        const slider = toneControl.shadowRoot.getElementById('slider');
        expect.toExist(slider);
    });

    it('should have speaker button in shadow DOM', () => {
        const button = toneControl.shadowRoot.getElementById('speakerBtn');
        expect.toExist(button);
    });

    it('should emit frequency-changed event when frequency changes', (done) => {
        toneControl.addEventListener('frequency-changed', (event) => {
            expect.toEqual(event.detail.frequency, 1500);
            done();
        });
        
        toneControl.frequency = 1500;
    });

    it('should emit speaker-toggled event when speaker button clicked', (done) => {
        toneControl.addEventListener('speaker-toggled', (event) => {
            expect.toBeTruthy(event.detail.active);
            done();
        });
        
        const speakerBtn = toneControl.shadowRoot.getElementById('speakerBtn');
        speakerBtn.click();
    });

    it('should clamp frequency to valid range', () => {
        toneControl.frequency = 10; // Below minimum
        expect.toBeTruthy(toneControl.frequency >= 20);
        
        toneControl.frequency = 25000; // Above maximum  
        expect.toBeTruthy(toneControl.frequency <= 20000);
    });

    it('should handle colormap property', () => {
        toneControl.colormap = 'googleturbo';
        expect.toEqual(toneControl.colormap, 'googleturbo');
    });
});

// Helper function for async tests
function done() {
    return new Promise(resolve => {
        setTimeout(resolve, 0);
    });
}