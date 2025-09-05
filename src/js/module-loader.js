/**
 * Module Loader - Handles dynamic module loading and templates
 * Part of the Qualia-NSS modular architecture
 * Enhanced with Phase 2: Component System Modernization
 */

document.addEventListener('DOMContentLoaded', async () => {
    
    // --- COMPONENT REGISTRY INTEGRATION ---
    // Note: ES6 component registry disabled until st02-modularization is fully implemented
    let componentRegistry = null;
    
    // Use global component registry if available
    if (window.getComponentRegistry) {
        componentRegistry = window.getComponentRegistry();
        console.log('Using global component registry');
    } else {
        console.log('Component registry not available, using direct script loading');
    }
    
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
        '7band-levelmeter': `<div class="module-content">
    <div id="tests-root" class="tests-root"></div>
</div>`,
        'spectrogram': `<div class="spectrogram-container" style="display: flex; flex-direction: column; height: 100%; width: 100%;">
    <!-- Top: Tone Control -->
    <div class="tone-control-container" style="padding: 12px 20px; background: rgba(30, 30, 30, 0.8); border-bottom: 1px solid var(--panel-border-color, #333); flex-shrink: 0;">
        <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 0.9rem; color: var(--text-color, #ddd); min-width: 80px;">Test Tone:</span>
            <tone-control id="spectrogramToneControl" aria-label="Spectrogram test tone frequency control" style="flex: 1;"></tone-control>
        </div>
    </div>
    
    <!-- Main: Canvas Container -->
    <div id="canvas-container" style="flex: 1; position: relative; min-height: 400px; width: 100%;">
        <canvas id="spectrogram" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%;"></canvas>
        <button id="start-button" style="position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%); z-index: 10; padding: 15px 25px; font-size: 1.2em; cursor: pointer; background: rgba(0, 136, 255, 0.9); color: white; border: none; border-radius: 8px; box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);">Start Microphone</button>
        
        <!-- Axis labels -->
        <div id="x-axis-label" class="axis-label" style="display: none;">Frequency</div>
        <div id="y-axis-label" class="axis-label" style="display: none;">Amplitude</div>
        <div id="z-axis-label" class="axis-label" style="display: none;">Time</div>
        
        <!-- MusicLab legend -->
        <div id="legend-title" style="position: absolute; bottom: 72px; right: 20px; color: #ddd; font-size: 0.8em;">MusicLab Colormap</div>
        <div id="color-map-legend" style="position: absolute; bottom: 20px; right: 20px; width: 150px; height: 20px; background: linear-gradient(to right, #2a5bff, #00b5ff, #00ff9b, #80ff00, #ffcc00, #ff6600, #ff0000); border: 1px solid #555;"></div>
        <div id="legend-text" style="position: absolute; bottom: 45px; right: 20px; color: white; font-size: 0.8em; display: flex; justify-content: space-between; width: 150px;">
            <span>Min</span><span>Max</span>
        </div>
    </div>
</div>`,
        'wiki': `<div class="module-content" id="wiki-module-container">
    <!-- Wiki content loads directly here via WikiModule -->
</div>`
    };

    // Make module templates globally available
    window.moduleHTML = moduleHTML;


    // --- SPECTROGRAM SCRIPT LOADING HELPER ---
    const loadSpectrogramScript = async () => {
        // Load tone-control component
        try {
            if (componentRegistry) {
                console.log('Loading tone-control component via registry...');
                await componentRegistry.load('tone-control');
                console.log('✓ tone-control component loaded via registry');
            } else {
                console.log('Loading tone-control component via direct script loading...');
                // Direct script loading (current standard method)
                await new Promise((resolve, reject) => {
                    const toneScript = document.createElement('script');
                    toneScript.src = '/src/components/tone-control/tone-control.js';
                    toneScript.type = 'module';  // Enable ES6 module loading
                    toneScript.onload = resolve;
                    toneScript.onerror = reject;
                    document.head.appendChild(toneScript);
                });
                console.log('✓ tone-control component loaded successfully');
            }
        } catch (error) {
            console.warn('Failed to load tone-control component:', error);
        }
        
        // Load spectrogram script
        const script = document.createElement('script');
        script.src = 'src/spectrogram/spectrogram.js';
        script.onload = () => {
            if (window.initializeSpectrogram) {
                window.initializeSpectrogram();
                currentModule = { name: 'spectrogram', instance: null };
                window.currentModule = currentModule;
            } else {
                console.log('initializeSpectrogram function not found');
            }
            // Remember last opened module
            try { localStorage.setItem('lastModule', 'spectrogram'); } catch(_) {}
            // Reflect active nav
            if (window.setNavActiveForModule) {
                window.setNavActiveForModule('spectrogram');
            }
        };
        script.onerror = () => {
            console.log('Spectrogram script not found');
        };
        document.head.appendChild(script);
    };

    // --- MODULE LOADING LOGIC ---
    let currentModule = null;
    window.currentModule = currentModule;

    /**
     * Loads and initializes a module, destroying any currently active module
     * @param {string} moduleName - Name of the module to load (e.g. 'spectrogram', '7band-levelmeter')
     * @throws {Error} When module template or class is not found
     */
    const loadModule = (moduleName) => {
        try {
            // Redirect legacy module name to new module
            if (moduleName === 'speakers') {
                moduleName = 'speakers-spl';
            }
            // Redirect legacy name for level meter
            if (moduleName === 'tests') {
                moduleName = '7band-levelmeter';
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
                // Clean up previous WindowMeter instance
                if (window._debugWindowMeter) {
                    window._debugWindowMeter.destroy();
                    window._debugWindowMeter = null;
                }
                
                // Clear any existing classes on sidebar container
                sidebar.className = '';
                
                // Update sidebar content for this module
                console.log('Loading sidebar for module:', moduleName);
                console.log('Available sidebars:', window.sidebarHTML ? Object.keys(window.sidebarHTML) : 'sidebarHTML not available');
                if (window.sidebarHTML && window.sidebarHTML[moduleName]) {
                    console.log('Found sidebar HTML for:', moduleName);
                    sidebar.innerHTML = window.sidebarHTML[moduleName];
                    
                    // Only initialize scroll-fade for modules that have the sidebar-canvas structure
                    const hasSidebarCanvas = sidebar.querySelector('#sidebar-canvas');
                    if (hasSidebarCanvas) {
                        // Add scroll-fade-container class to main sidebar (for fixed fade positioning)
                        sidebar.classList.add('scroll-fade-container');
                        // Initialize scroll-fade effect monitoring the canvas but applying to sidebar
                        if (window.initializeScrollFade) {
                            window.initializeScrollFadeFixed('#sidebar-canvas', '#sidebar');
                        }
                    }
                } else {
                    console.log('No sidebar HTML found for:', moduleName);
                    sidebar.innerHTML = ''; // Clear sidebar for modules without one
                }
            }

            // Update main content
            const mainContent = document.getElementById('main-content');
            if (mainContent) {
                // Remove full-width class if it exists
                mainContent.classList.remove('full-width');
                
                // Special case for spectrogram - hybrid loading strategy
                if (moduleName === 'spectrogram') {
                    const loadingStrategy = window.location.protocol !== 'file:' ? 'fetch' : 'inline';
                    console.log('Spectrogram loading strategy:', loadingStrategy);
                    
                    if (loadingStrategy === 'fetch') {
                        // HTTP context - use fragment loading
                        const fragmentUrl = '/src/spectrogram/index.html';
                        
                        fetch(fragmentUrl)
                            .then(response => {
                                if (!response.ok) {
                                    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
                                }
                                return response.text();
                            })
                            .then(html => {
                                // With root-relative paths, no processing needed
                                mainContent.innerHTML = html;
                                loadSpectrogramScript();
                            })
                            .catch(error => {
                                console.error('Failed to load spectrogram HTML fragment:', error);
                                console.error('Attempted URL:', fragmentUrl);
                                console.log('Falling back to inline template...');
                                // Fallback to inline template on fetch failure
                                mainContent.innerHTML = moduleHTML[moduleName];
                                loadSpectrogramScript();
                            });
                    } else {
                        // File context - use inline template
                        console.log('Using inline template for file:// context');
                        mainContent.innerHTML = moduleHTML[moduleName];
                        loadSpectrogramScript();
                    }
                    return; // Exit early for spectrogram
                } else if (moduleHTML[moduleName]) {
                    mainContent.innerHTML = moduleHTML[moduleName];
                } else {
                    console.log(`No HTML template found for ${moduleName}`);
                    mainContent.innerHTML = `<div class="alert alert-warning">Module ${moduleName} template not found</div>`;
                    return;
                }
                
                // Load and initialize module JavaScript (non-spectrogram modules)
                const scriptSrc = (function(){
                    if (moduleName === '7band-levelmeter') return 'src/7band-levelmeter/7band-level-meter.js';
                    if (moduleName === 'wiki') return 'src/wiki-utils/index.js';
                    return `src/${moduleName}/index.js`;
                })();

                // Check if script already loaded to prevent duplicate class declarations
                const existingScript = document.querySelector(`script[src="${scriptSrc}"]`);
                if (existingScript) {
                    // Script already loaded, just initialize the module
                    const toPascal = (name) => name
                        .split('-')
                        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                        .join('');
                    const expectedClassName = `${toPascal(moduleName)}Module`;
                    let ModuleClass = window[expectedClassName];
                    
                    // Backward compatibility for legacy export name
                    if (!ModuleClass && moduleName === '7band-levelmeter') {
                        ModuleClass = window.TestsModule || window.SevenBandLevelmeterModule;
                    }
                    if (ModuleClass) {
                        const instance = new ModuleClass();
                        currentModule = { name: moduleName, instance };
                        window.currentModule = currentModule;
                        instance.init();
                    }
                    // Remember last opened module
                    try { localStorage.setItem('lastModule', moduleName); } catch(_) {}
                    // Reflect active nav
                    if (window.setNavActiveForModule) {
                        window.setNavActiveForModule(moduleName);
                    }
                    return;
                }

                const script = document.createElement('script');
                script.src = scriptSrc;
                script.onload = () => {
                    // For conventional modules, instantiate their class
                    const toPascal = (name) => name
                        .split('-')
                        .map(part => part.charAt(0).toUpperCase() + part.slice(1))
                        .join('');
                    const expectedClassName = `${toPascal(moduleName)}Module`;
                    console.log('Looking for module class:', expectedClassName);
                    let ModuleClass = window[expectedClassName];
                    console.log('Found class:', ModuleClass);
                    
                    // Backward compatibility for legacy export name
                    if (!ModuleClass && moduleName === '7band-levelmeter') {
                        console.log('Trying fallback classes for 7band-levelmeter');
                        console.log('window.TestsModule:', window.TestsModule);
                        console.log('window.SevenBandLevelmeterModule:', window.SevenBandLevelmeterModule);
                        ModuleClass = window.TestsModule || window.SevenBandLevelmeterModule;
                        console.log('Fallback class found:', ModuleClass);
                    }
                    if (ModuleClass) {
                        const instance = new ModuleClass();
                        currentModule = { name: moduleName, instance };
                        window.currentModule = currentModule;
                        instance.init();
                    } else {
                        console.log(`Module class not found for ${moduleName}`);
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

    /**
     * Global module loading function
     * @global
     * @function loadModule
     * @param {string} moduleName - Module to load
     */
    window.loadModule = loadModule;

    console.log('Module loader initialized.');
});