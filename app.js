
document.addEventListener('DOMContentLoaded', () => {
    const themeToggleButton = document.getElementById('theme-toggle');
    const body = document.body;

    // --- THEME MANAGEMENT ---

    // Function to apply the saved theme on load
    const applySavedTheme = () => {
        const savedTheme = localStorage.getItem('theme');
        if (savedTheme === 'light') {
            body.classList.add('light-theme');
        }
    };

    // Function to toggle the theme
    const toggleTheme = () => {
        body.classList.toggle('light-theme');
        // Save the new theme preference
        if (body.classList.contains('light-theme')) {
            localStorage.setItem('theme', 'light');
        } else {
            localStorage.removeItem('theme');
        }
    };

    // Attach event listener to the theme toggle button
    if (themeToggleButton) {
        themeToggleButton.addEventListener('click', toggleTheme);
    }

    // Apply the theme when the page loads
    applySavedTheme();
    
    // --- ACTIVE STATE MANAGEMENT ---
    window.setActiveNav = (activeElement) => {
        // Remove active from all nav items
        document.querySelectorAll('.nav-link, .logo').forEach(item => {
            item.classList.remove('active');
        });
        
        // Add active to specified element
        if (activeElement) {
            activeElement.classList.add('active');
        }
    };
    
    // Set QUALIA logo as active on page load (landing page)
    const logo = document.querySelector('.logo');
    if (logo) {
        setActiveNav(logo);
    }


    // --- SIDEBAR MANAGEMENT (EXAMPLE) ---
    // Example functions to demonstrate toggling the sidebar.
    // This can be wired up to module loading logic later.
    const contentWrapper = document.getElementById('content-wrapper');

    window.showSidebar = () => {
        if (contentWrapper) {
            contentWrapper.classList.add('with-sidebar');
        }
    };

    window.hideSidebar = () => {
        if (contentWrapper) {
            contentWrapper.classList.remove('with-sidebar');
        }
    };

    // --- WORKFLOW ITEM CLICK HANDLERS ---
    
    const workflowItems = document.querySelectorAll('.workflow-item');
    workflowItems.forEach((item, index) => {
        item.addEventListener('click', () => {
            console.log(`Clicked on workflow item: ${item.querySelector('.item-text').textContent}`);
            // Add navigation logic here
        });
    });

    // --- MODULE LOADING ---
    let currentModule = null;

    const moduleHTML = {
        speakers: `<div class="module-content">
    <h1>Speakers Module</h1>
    <p>Speaker configuration and analysis tools will be loaded here.</p>
    
    <div class="speakers-controls">
        <div class="control-group">
            <label for="speaker-type">Speaker Type:</label>
            <select id="speaker-type">
                <option value="bookshelf">Bookshelf</option>
                <option value="floor">Floor Standing</option>
                <option value="center">Center Channel</option>
                <option value="subwoofer">Subwoofer</option>
            </select>
        </div>
        
        <div class="control-group">
            <label for="impedance">Impedance (Ω):</label>
            <select id="impedance">
                <option value="4">4Ω</option>
                <option value="8">8Ω</option>
                <option value="16">16Ω</option>
            </select>
        </div>
        
        <button class="btn-primary">Analyze Speakers</button>
    </div>
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
</div>`
    };

    const sidebarHTML = {
        speakers: `
            <div class="sidebar-header">
                <h3><i class="bi bi-speaker me-2"></i>Speakers Control</h3>
                <button class="btn-close-sidebar" onclick="hideSidebar()">&times;</button>
            </div>
            
            <div class="sidebar-section">
                <h4><i class="bi bi-soundwave me-2"></i>Driver Selection</h4>
                <div class="control-group">
                    <label>Driver Type</label>
                    <button class="btn-sidebar btn-primary"><i class="bi bi-soundwave me-1"></i>Woofer</button>
                    <button class="btn-sidebar"><i class="bi bi-soundwave me-1"></i>Tweeter</button>
                    <button class="btn-sidebar"><i class="bi bi-soundwave me-1"></i>Mid-range</button>
                </div>
                <div class="control-group">
                    <label>Analysis Progress</label>
                    <div class="progress mb-2">
                        <div class="progress-bar bg-info" style="width: 65%">65%</div>
                    </div>
                    <small class="text-muted">Frequency response mapping...</small>
                </div>
            </div>

            <div class="sidebar-section">
                <h4><i class="bi bi-graph-up me-2"></i>Response Analysis</h4>
                <div class="control-group">
                    <label>Frequency Range</label>
                    <button class="btn-sidebar btn-primary"><i class="bi bi-bar-chart me-1"></i>20Hz - 20kHz</button>
                    <button class="btn-sidebar"><i class="bi bi-bar-chart me-1"></i>Custom Range</button>
                </div>
                <div class="control-group">
                    <label>Measurement Type</label>
                    <button class="btn-sidebar btn-primary"><i class="bi bi-activity me-1"></i>SPL</button>
                    <button class="btn-sidebar"><i class="bi bi-activity me-1"></i>Impedance</button>
                </div>
            </div>
        `,
        filters: `
            <div class="sidebar-header">
                <h3><i class="bi bi-funnel me-2"></i>Filters Control</h3>
                <button class="btn-close-sidebar" onclick="hideSidebar()">&times;</button>
            </div>
            
            <div class="sidebar-section">
                <h4><i class="bi bi-sliders me-2"></i>Filter Bank</h4>
                <div class="control-group">
                    <label>Active Filters</label>
                    <button class="btn-sidebar"><i class="bi bi-graph-up me-1"></i>HPF 80Hz</button>
                    <button class="btn-sidebar btn-primary"><i class="bi bi-graph-down me-1"></i>LPF 5kHz</button>
                    <button class="btn-sidebar"><i class="bi bi-activity me-1"></i>Notch 1kHz</button>
                </div>
                <div class="control-group">
                    <label>Crossover Settings</label>
                    <button class="btn-sidebar btn-primary"><i class="bi bi-arrow-up-right me-1"></i>2-Way</button>
                    <button class="btn-sidebar"><i class="bi bi-arrow-up-right me-1"></i>3-Way</button>
                </div>
            </div>

            <div class="sidebar-section">
                <h4><i class="bi bi-bar-chart-line me-2"></i>Real-time FFT</h4>
                <div class="control-group">
                    <label>Spectrum Display</label>
                    <div class="fft-display">
                        <div class="fft-bar" style="height: 20%"></div>
                        <div class="fft-bar" style="height: 40%"></div>
                        <div class="fft-bar" style="height: 80%"></div>
                        <div class="fft-bar" style="height: 60%"></div>
                        <div class="fft-bar" style="height: 30%"></div>
                        <div class="fft-bar" style="height: 50%"></div>
                        <div class="fft-bar" style="height: 70%"></div>
                        <div class="fft-bar" style="height: 45%"></div>
                    </div>
                </div>
            </div>
        `,
        cabinets: `
            <div class="sidebar-header">
                <h3><i class="bi bi-box me-2"></i>Cabinet Control</h3>
                <button class="btn-close-sidebar" onclick="hideSidebar()">&times;</button>
            </div>
            
            <div class="sidebar-section">
                <h4><i class="bi bi-boombox me-2"></i>Cabinet Models</h4>
                <div class="control-group">
                    <label>Enclosure Type</label>
                    <button class="btn-sidebar btn-primary"><i class="bi bi-square me-1"></i>Sealed</button>
                    <button class="btn-sidebar"><i class="bi bi-circle me-1"></i>Ported</button>
                    <button class="btn-sidebar"><i class="bi bi-triangle me-1"></i>Bandpass</button>
                </div>
                <div class="control-group">
                    <label>Design Parameters</label>
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-rulers me-1"></i>
                        <span class="badge bg-secondary">Volume: 42.5L</span>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <i class="bi bi-circle-fill me-1"></i>
                        <span class="badge bg-secondary">Port: 5cm x 15cm</span>
                    </div>
                </div>
            </div>

            <div class="sidebar-section">
                <h4><i class="bi bi-calculator me-2"></i>Calculations</h4>
                <div class="control-group">
                    <label>Tuning Frequency</label>
                    <button class="btn-sidebar btn-primary"><i class="bi bi-play-fill me-1"></i>Calculate Fb</button>
                    <button class="btn-sidebar"><i class="bi bi-gear me-1"></i>Optimize</button>
                </div>
            </div>
        `,
        tests: `
            <div class="sidebar-header">
                <h3><i class="bi bi-clipboard-check me-2"></i>Test Control</h3>
                <button class="btn-close-sidebar" onclick="hideSidebar()">&times;</button>
            </div>
            
            <div class="sidebar-section">
                <h4><i class="bi bi-play-circle me-2"></i>Test Suite</h4>
                <div class="control-group">
                    <label>Test Control</label>
                    <button class="btn-sidebar btn-success"><i class="bi bi-play-fill me-1"></i>Run All Tests</button>
                    <button class="btn-sidebar"><i class="bi bi-pause-fill me-1"></i>Pause</button>
                    <button class="btn-sidebar btn-outline-danger"><i class="bi bi-stop-fill me-1"></i>Stop</button>
                </div>
                <div class="control-group">
                    <label>Quick Tests</label>
                    <button class="btn-sidebar"><i class="bi bi-graph-up me-1"></i>Frequency Sweep</button>
                    <button class="btn-sidebar"><i class="bi bi-activity me-1"></i>THD Analysis</button>
                </div>
            </div>

            <div class="sidebar-section">
                <h4><i class="bi bi-signal me-2"></i>Signal Status</h4>
                <div class="control-group">
                    <label>Input/Output Levels</label>
                    <div class="d-flex align-items-center gap-2">
                        <div class="status-dot bg-success"></div>
                        <small>Input: -12dB</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="status-dot bg-warning"></div>
                        <small>Output: -6dB</small>
                    </div>
                    <div class="d-flex align-items-center gap-2">
                        <div class="status-dot bg-info"></div>
                        <small>SNR: 96dB</small>
                    </div>
                </div>
            </div>
        `
    };

    const loadModule = (moduleName) => {
        try {
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
                
                // Update sidebar content for this module
                if (sidebarHTML[moduleName]) {
                    sidebar.innerHTML = sidebarHTML[moduleName];
                }
            }

            // Update main content
            const mainContent = document.getElementById('main-content');
            if (mainContent && moduleHTML[moduleName]) {
                // Remove full-width class if it exists
                mainContent.classList.remove('full-width');
                mainContent.innerHTML = moduleHTML[moduleName];
                
                // Load and initialize module JavaScript
                const script = document.createElement('script');
                script.src = `src/${moduleName}/index.js`;
                script.onload = () => {
                    const ModuleClass = window[`${moduleName.charAt(0).toUpperCase() + moduleName.slice(1)}Module`];
                    if (ModuleClass) {
                        const instance = new ModuleClass();
                        currentModule = { name: moduleName, instance };
                        instance.init();
                    }
                };
                script.onerror = () => {
                    console.log(`Module script not found for ${moduleName}, continuing without JavaScript module`);
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

    // --- WELCOME PAGE FUNCTION ---
    window.showWelcome = () => {
        if (currentModule && currentModule.instance) {
            currentModule.instance.destroy();
            currentModule = null;
        }
        
        // Set up home page layout
        const contentWrapper = document.getElementById('content-wrapper');
        if (contentWrapper) {
            // Add home-page class for styling
            contentWrapper.classList.add('home-page');
            
            // Remove sidebar if it exists
            const sidebar = document.getElementById('sidebar');
            if (sidebar) {
                sidebar.remove();
            }
        }
        
        const mainContent = document.getElementById('main-content');
        if (mainContent) {
            // Add full-width class for home page
            mainContent.classList.add('full-width');
            mainContent.innerHTML = `
                <h1>Welcome</h1>
                <p>QUALIA•NSS blueprint will be loaded here.</p>
            `;
        }
        
        // Set logo as active when showing welcome
        const logo = document.querySelector('.logo');
        setActiveNav(logo);
    };

    // --- MODULE NAVIGATION ---
    window.loadSpeakers = () => loadModule('speakers');
    window.loadFilters = () => loadModule('filters');
    window.loadCabinets = () => loadModule('cabinets');
    window.loadTests = () => loadModule('tests');

    console.log('App shell initialized.');
    console.log('You can test the sidebar with showSidebar() and hideSidebar() in the console.');

});
