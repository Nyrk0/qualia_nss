/**
 * Module Loader - Handles dynamic module loading and templates
 * Part of the Qualia-NSS modular architecture
 */

document.addEventListener('DOMContentLoaded', () => {
    
    // --- MODULE HTML TEMPLATES ---
    const moduleHTML = {
        'speakers-spl': `<div class="module-content">
    <div id="speakers-spl-root" class="spl-viewer"></div>
</div>`,
        filters: `<div class="module-content">
    <h1>Filters Module</h1>
    <p>Audio filter configuration and frequency response analysis.</p>
    
    <div class="filters-controls">
        <div class="control-group">
            <label for="filter-type">Filter Type:</label>
            <select id="filter-type">
                <option value="lowpass">Low Pass</option>
                <option value="highpass">High Pass</option>
                <option value="bandpass">Band Pass</option>
                <option value="notch">Notch</option>
            </select>
        </div>
        
        <div class="control-group">
            <label for="cutoff-freq">Cutoff Frequency (Hz):</label>
            <input type="range" id="cutoff-freq" min="20" max="20000" value="1000">
            <span id="freq-display">1000 Hz</span>
        </div>
        
        <div class="control-group">
            <label for="q-factor">Q Factor:</label>
            <input type="range" id="q-factor" min="0.1" max="10" step="0.1" value="0.7">
            <span id="q-display">0.7</span>
        </div>
        
        <button class="btn-primary">Apply Filter</button>
    </div>
</div>`,
        cabinets: `<div class="module-content">
    <h1>Cabinets Module</h1>
    <p>Speaker cabinet design and acoustic modeling tools.</p>
    
    <div class="cabinets-controls">
        <div class="control-group">
            <label for="cabinet-type">Cabinet Type:</label>
            <select id="cabinet-type">
                <option value="sealed">Sealed (Closed Box)</option>
                <option value="ported">Ported (Bass Reflex)</option>
                <option value="passive">Passive Radiator</option>
                <option value="transmission">Transmission Line</option>
            </select>
        </div>
        
        <div class="control-group">
            <label for="internal-volume">Internal Volume (L):</label>
            <input type="number" id="internal-volume" min="0.1" max="1000" step="0.1" value="20">
        </div>
        
        <div class="control-group">
            <label for="port-diameter">Port Diameter (mm):</label>
            <input type="number" id="port-diameter" min="10" max="200" value="50">
        </div>
        
        <div class="control-group">
            <label for="port-length">Port Length (mm):</label>
            <input type="number" id="port-length" min="10" max="500" value="100">
        </div>
        
        <button class="btn-primary">Calculate Response</button>
    </div>
</div>`,
        tests: `<div class="module-content">
    <h1>Tests Module</h1>
    <p>Audio measurement and testing suite.</p>
    
    <div class="tests-controls">
        <div class="control-group">
            <label for="test-type">Test Type:</label>
            <select id="test-type">
                <option value="frequency">Frequency Response</option>
                <option value="thd">THD+N Analysis</option>
                <option value="impedance">Impedance Sweep</option>
                <option value="phase">Phase Response</option>
            </select>
        </div>
        
        <div class="control-group">
            <label for="test-signal">Test Signal:</label>
            <select id="test-signal">
                <option value="sine">Sine Wave</option>
                <option value="chirp">Chirp</option>
                <option value="white-noise">White Noise</option>
                <option value="pink-noise">Pink Noise</option>
            </select>
        </div>
        
        <div class="control-group">
            <label for="amplitude">Amplitude (dB):</label>
            <input type="range" id="amplitude" min="-60" max="0" value="-20">
            <span id="amp-display">-20 dB</span>
        </div>
        
        <button class="btn-primary">Start Test</button>
        <button class="btn-secondary">Stop Test</button>
    </div>
</div>`,
        'spectrogram': `<div id="canvas-container" style="flex-grow: 1; position: relative; height: 100%;"><canvas id="spectrogram"></canvas><button id="start-button" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; padding: 15px 25px; font-size: 1.2em; cursor: pointer;">Start Microphone</button><div id="x-axis-label" class="axis-label" style="display: none;">Frequency</div><div id="y-axis-label" class="axis-label" style="display: none;">Amplitude</div><div id="z-axis-label" class="axis-label" style="display: none;">Time</div><div id="legend-title" style="position: absolute; bottom: 72px; right: 20px; color: #ddd; font-size: 0.8em;">MusicLab Colormap</div><div id="color-map-legend" style="position: absolute; bottom: 20px; right: 20px; width: 150px; height: 20px; background: linear-gradient(to right, #2a5bff, #00b5ff, #00ff9b, #80ff00, #ffcc00, #ff6600, #ff0000); border: 1px solid #555;"></div><div id="legend-text" style="position: absolute; bottom: 45px; right: 20px; color: white; font-size: 0.8em; display: flex; justify-content: space-between; width: 150px;"><span>Min</span><span>Max</span></div></div>`
    };

    // Make module templates globally available
    window.moduleHTML = moduleHTML;

    // --- MODULE LOADING LOGIC ---
    let currentModule = null;
    window.currentModule = currentModule;

    const loadModule = (moduleName) => {
        try {
            // Redirect legacy module name to new module
            if (moduleName === 'speakers') {
                moduleName = 'speakers-spl';
            }
            
            // Destroy current module if exists
            if (currentModule && currentModule.instance) {
                currentModule.instance.destroy();
            }

            // Remove home-page class and add sidebar back to content wrapper
            const contentWrapper = document.getElementById('content-wrapper');
            if (contentWrapper) {
                contentWrapper.classList.remove('home-page');
                
                // Create or update sidebar
                let sidebar = document.getElementById('sidebar');
                if (!sidebar) {
                    sidebar = document.createElement('div');
                    sidebar.id = 'sidebar';
                    contentWrapper.insertBefore(sidebar, contentWrapper.firstChild);
                }
                // Clear any existing classes on sidebar container
                sidebar.className = '';
                
                // Update sidebar content for this module
                if (window.sidebarHTML && window.sidebarHTML[moduleName]) {
                    sidebar.innerHTML = window.sidebarHTML[moduleName];
                    // Initialize scroll-fade effect for the scroll-fade-container INSIDE the sidebar
                    if (window.initializeScrollFade) {
                        window.initializeScrollFade('#sidebar .scroll-fade-container');
                    }
                } else {
                    sidebar.innerHTML = ''; // Clear sidebar for modules without one
                }
            }

            // Update main content
            const mainContent = document.getElementById('main-content');
            if (mainContent && moduleHTML[moduleName]) {
                // Remove full-width class if it exists
                mainContent.classList.remove('full-width');
                mainContent.innerHTML = moduleHTML[moduleName];
                
                // Load and initialize module JavaScript
                // Special case for spectrogram, which doesn't follow the convention
                const scriptSrc = (moduleName === 'spectrogram')
                    ? 'src/spectrogram/spectrogram.js'
                    : `src/${moduleName}/index.js`;

                const script = document.createElement('script');
                script.src = scriptSrc;
                script.onload = () => {
                    if (moduleName === 'spectrogram') {
                        // Special handling for spectrogram module
                        if (window.initializeSpectrogram) {
                            window.initializeSpectrogram();
                            currentModule = { name: moduleName, instance: null };
                            window.currentModule = currentModule;
                        } else {
                            console.log('initializeSpectrogram function not found');
                        }
                    } else {
                        // For conventional modules, instantiate their class
                        const toPascal = (name) => name
                            .split('-')
                            .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                            .join('');
                        const ModuleClass = window[`${toPascal(moduleName)}Module`];
                        if (ModuleClass) {
                            const instance = new ModuleClass();
                            currentModule = { name: moduleName, instance };
                            window.currentModule = currentModule;
                            instance.init();
                        } else {
                            console.log(`Module class not found for ${moduleName}`);
                        }
                    }
                    // Remember last opened module
                    try { localStorage.setItem('lastModule', moduleName); } catch(_) {}
                    // Reflect active nav
                    if (window.setNavActiveForModule) {
                        window.setNavActiveForModule(moduleName);
                    }
                };
                script.onerror = () => {
                    console.log(`Module script not found for ${moduleName}`);
                };
                document.head.appendChild(script);
            }
            
        } catch (error) {
            console.error(`Error loading module ${moduleName}:`, error);
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                mainContent.innerHTML = `<div class="alert alert-danger">Error loading ${moduleName} module</div>`;
            }
        }
    };

    // Make loadModule globally available
    window.loadModule = loadModule;

    console.log('Module loader initialized.');
});