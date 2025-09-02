/**
 * Tests for Module Loader functionality
 */

describe('Module Loader', () => {
    
    it('should have loadModule function available globally', () => {
        expect.toBeTruthy(window.loadModule);
        expect.toEqual(typeof window.loadModule, 'function');
    });

    it('should have currentModule tracking', () => {
        expect.toBeTruthy(window.hasOwnProperty('currentModule'));
    });

    it('should have moduleHTML templates available', () => {
        expect.toBeTruthy(window.moduleHTML);
        expect.toEqual(typeof window.moduleHTML, 'object');
    });

    it('should have templates for core modules', () => {
        const expectedModules = ['speakers-spl', 'filters', 'cabinets', '7band-levelmeter', 'spectrogram'];
        
        expectedModules.forEach(moduleName => {
            expect.toBeTruthy(window.moduleHTML[moduleName]);
        });
    });

    it('should have main-content container', () => {
        const mainContent = document.getElementById('main-content');
        expect.toExist(mainContent);
    });

    it('should handle legacy module name redirection', () => {
        // Test would require mocking the actual module loading
        // For now, just verify the function exists
        expect.toBeTruthy(window.loadModule);
    });

    // Note: Full module loading tests would require setting up the entire DOM structure
    // and mocking module files, which is beyond basic unit testing scope
});

describe('Navigation Functions', () => {
    
    it('should have module navigation functions available', () => {
        const navigationFunctions = [
            'loadSpeakersSpl',
            'loadFilters', 
            'loadCabinets',
            'load7bandLevelmeter',
            'loadSpectrogram'
        ];
        
        navigationFunctions.forEach(funcName => {
            expect.toBeTruthy(window[funcName]);
            expect.toEqual(typeof window[funcName], 'function');
        });
    });

    it('should have showWelcome function', () => {
        expect.toBeTruthy(window.showWelcome);
        expect.toEqual(typeof window.showWelcome, 'function');
    });

    it('should have setActiveNav function', () => {
        expect.toBeTruthy(window.setActiveNav);
        expect.toEqual(typeof window.setActiveNav, 'function');
    });
});