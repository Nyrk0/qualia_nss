/**
 * @fileoverview Sidebar Manager - manages sidebar content and templates for all modules
 * Contains HTML templates for each module's sidebar and makes them globally available
 * Part of the Qualia-NSS modular architecture
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

document.addEventListener('DOMContentLoaded', () => {
    

    // --- SIDEBAR HTML TEMPLATES ---
    /**
     * Sidebar HTML templates for each module
     * Each template contains the complete sidebar markup for its respective module
     * @type {Object<string, string>}
     */
    const sidebarHTML = {
        'speakers-spl': `
            <div class="sidebar-section">
                <div class="control-group" style="display:flex; flex-direction:column; gap:.5rem;">
                    <div class="spl-file-input-wrapper">
                        <input type="file" id="spl-file-input" accept=".csv" multiple />
                        <label for="spl-file-input" class="btn btn-outline-secondary w-100">
                            <i class="bi bi-folder2-open me-1"></i> Select CSV Files
                        </label>
                    </div>
                    <button class="btn btn-outline-danger w-100" id="spl-clear-btn"><i class="bi bi-trash me-1"></i> Clear</button>
                </div>
            </div>
            
            <div class="sidebar-section">
                <h4 style="font-size:0.8rem; margin-bottom:0.5rem;"><i class="bi bi-bar-chart-line me-1"></i>Analysis</h4>
                <div id="spl-analysis-content" class="scroll-hidden" style="font-size:0.75rem; max-height: calc(100vh - 300px); overflow-y: auto;">
                    <div class="spl-metric-group" style="margin-bottom:0.75rem;">
                        <h5 style="font-size:0.7rem; margin-bottom:0.25rem; color: var(--bs-secondary-color);">Overview</h5>
                        <div class="spl-metric"><span>Loaded Curves</span><strong id="spl-curves-count">0</strong></div>
                        <div class="spl-metric"><span>Total Points</span><strong id="spl-points-count">0</strong></div>
                        <div class="spl-metric"><span>Memory Usage</span><strong id="spl-memory-usage">0 MB</strong></div>
                    </div>

                    <div class="spl-metric-group" id="spl-acoustic-metrics" style="display:none; margin-bottom:0.75rem;">
                        <h5 style="font-size:0.7rem; margin-bottom:0.25rem; color: var(--bs-secondary-color);">Acoustic</h5>
                        <div class="spl-metric"><span>A-weighted SPL</span><strong id="spl-a-weighted-spl">-- dB(A)</strong></div>
                        <div class="spl-metric"><span>Peak Level</span><strong id="spl-peak-level">-- dB</strong></div>
                        <div class="spl-metric"><span>Crest Factor</span><strong id="spl-crest-factor">-- dB</strong></div>
                        <div class="spl-metric"><span>Resonances</span><strong id="spl-resonances-count">0</strong></div>
                    </div>

                    <div class="spl-metric-group" id="spl-validation-metrics" style="display:none; margin-bottom:0.75rem;">
                        <h5 style="font-size:0.7rem; margin-bottom:0.25rem; color: var(--bs-secondary-color);">Validation</h5>
                        <div class="spl-metric"><span>Math Tests</span><strong id="spl-math-tests">-- / 3</strong></div>
                        <div class="spl-metric"><span>Quality Score</span><strong id="spl-quality-score">--%</strong></div>
                        <div class="spl-metric"><span>Coherence</span><strong id="spl-coherence">--</strong></div>
                    </div>

                    <div id="spl-curve-list">
                        <h5 style="font-size:0.7rem; margin-bottom:0.25rem; color: var(--bs-secondary-color);"><i class="bi bi-list-check me-1"></i>Loaded Curves</h5>
                    </div>
                </div>
            </div>
        `,
        filters: `
            <div class="sidebar-header">
                <h2><i class="bi bi-funnel me-2"></i>Filters Control</h2>
                <button class="btn-close-sidebar" onclick="hideSidebar()">&times;</button>
            </div>
            
            <div class="sidebar-section">
                <h3><i class="bi bi-sliders me-2"></i>Filter Bank</h3>
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
        '7band-levelmeter': `
            <div class="sidebar-header">
                <h3><i class="bi bi-clipboard-check me-2"></i>7bandmeter</h3>
                <button class="btn-close-sidebar" onclick="hideSidebar()">&times;</button>
            </div>
            <div class="sidebar-section">
                <h4 class="mb-2" style="font-size:0.9rem;"><i class="bi bi-palette me-2"></i>Colormap</h4>
                <div class="control-group">
                    <label for="colormapSelect" class="form-label" style="font-size:0.8rem;">7‑Band Level Meter</label>
                    <select id="colormapSelect" class="form-select form-select-sm">
                        <option value="band">7band-colormap QUALIA·NSS</option>
                        <option value="turbo-google">Google’s Turbo</option>
                    </select>
                    <div id="colormapPreview" class="colormap-preview" aria-label="Colormap preview" style="margin-top:8px;"></div>
                    <div class="form-text">Affects tone slider gradient and colors.</div>
                </div>
            </div>
        `,
        'wiki': `
            <div id="sidebar-canvas">
                <div id="sidebar-content">
                    <div class="sidebar-section">
                        <h3 style="text-align: center; margin-bottom: 1rem; font-weight: 600;">
                            <a href="#" class="wiki-home-link" data-path="Home.md" data-name="Home" style="text-decoration: none; color: inherit; cursor: pointer;" title="Go to Wiki Home">
                                Our Wiki For You
                            </a>
                        </h3>
                    </div>
                    <div id="wiki-toc-container" class="sidebar-section"></div>
                </div>
            </div>
        `,
        'spectrogram': `
            <div id="sidebar-canvas">
                <div id="sidebar-content">
                    <div class="accordion" id="sidebarAccordion">
                <!-- 1. Experiment Setup -->
                <div class="accordion-item">
                    <h2 class="accordion-header" id="headingOne">
                        <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapseOne" aria-expanded="true" aria-controls="collapseOne">
                            Experiment Setup
                        </button>
                    </h2>
                    <div id="collapseOne" class="accordion-collapse collapse show" aria-labelledby="headingOne" data-bs-parent="#sidebarAccordion">
                        <div class="accordion-body">
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="experimentType" id="expControlled" checked>
                                <label class="form-check-label" for="expControlled">
                                    Controlled Comb-Filter
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="experimentType" id="expAcoustic">
                                <label class="form-check-label" for="expAcoustic">
                                    Acoustic Comb-Filter
                                </label>
                            </div>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="experimentType" id="expAnalysis">
                                <label class="form-check-label" for="expAnalysis">
                                    Room Acoustics Analysis
                                </label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 2. Signal Generator -->
                <div class="accordion-item">
                    <h2 class="accordion-header" id="headingTwo">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseTwo" aria-expanded="false" aria-controls="collapseTwo">
                            Signal Generator
                        </button>
                    </h2>
                    <div id="collapseTwo" class="accordion-collapse collapse" aria-labelledby="headingTwo" data-bs-parent="#sidebarAccordion">
                        <div class="accordion-body">
                            <label for="signalType" class="form-label">Signal Type</label>
                            <select class="form-select mb-3" id="signalType">
                                <option value="whitenoise" selected>White Noise</option>
                                <option value="sinesweep">Sine Sweep</option>
                            </select>
                            
                            <label for="digitalDelay" class="form-label">Digital Delay</label>
                            <div class="input-group">
                                <input type="range" class="form-range" id="digitalDelay" min="0" max="50" step="0.1">
                                <span class="input-group-text" id="digitalDelayValue">0 ms</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 3. Analysis Source -->
                <div class="accordion-item">
                    <h2 class="accordion-header" id="headingThree">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseThree" aria-expanded="false" aria-controls="collapseThree">
                            Analysis Source
                        </button>
                    </h2>
                    <div id="collapseThree" class="accordion-collapse collapse" aria-labelledby="headingThree" data-bs-parent="#sidebarAccordion">
                        <div class="accordion-body">
                            <p class="form-label">Source:</p>
                            <div class="form-check">
                                <input class="form-check-input" type="radio" name="analysisSource" id="sourceDigital" checked>
                                <label class="form-check-label" for="sourceDigital">Digital Output</label>
                            </div>
                            <div class="form-check mb-3">
                                <input class="form-check-input" type="radio" name="analysisSource" id="sourceMic">
                                <label class="form-check-label" for="sourceMic">Microphone Input</label>
                            </div>

                            <p class="form-label">Microphone DSP:</p>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="micEchoCancellation">
                                <label class="form-check-label" for="micEchoCancellation">Echo Cancellation</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="micNoiseSuppression">
                                <label class="form-check-label" for="micNoiseSuppression">Noise Suppression</label>
                            </div>
                            <div class="form-check form-switch">
                                <input class="form-check-input" type="checkbox" role="switch" id="micAutoGain">
                                <label class="form-check-label" for="micAutoGain">Auto Gain Control</label>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 4. 3D Viewport -->
                <div class="accordion-item">
                    <h2 class="accordion-header" id="headingFour">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFour" aria-expanded="false" aria-controls="collapseFour">
                            3D Viewport
                        </button>
                    </h2>
                    <div id="collapseFour" class="accordion-collapse collapse" aria-labelledby="headingFour" data-bs-parent="#sidebarAccordion">
                        <div class="accordion-body">
                            <label for="rotX" class="form-label">Rotate X</label>
                            <input type="range" class="form-range" id="rotX" min="-360" max="360" value="-90">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">-360°</small>
                                <small class="text-muted" id="rotX-value">-90°</small>
                                <small class="text-muted">360°</small>
                            </div>
                            
                            <label for="rotY" class="form-label mt-3">Rotate Y</label>
                            <input type="range" class="form-range" id="rotY" min="-360" max="360" value="0">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">-360°</small>
                                <small class="text-muted" id="rotY-value">0°</small>
                                <small class="text-muted">360°</small>
                            </div>
                            
                            <label for="rotZ" class="form-label mt-3">Rotate Z</label>
                            <input type="range" class="form-range" id="rotZ" min="-360" max="360" value="90">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">-360°</small>
                                <small class="text-muted" id="rotZ-value">90°</small>
                                <small class="text-muted">360°</small>
                            </div>

                            <label for="posY" class="form-label mt-3">Position Y</label>
                            <input type="range" class="form-range" id="posY" min="-10" max="10" value="-3.5" step="0.1">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">-10</small>
                                <small class="text-muted" id="posY-value">-3.5</small>
                                <small class="text-muted">10</small>
                            </div>

                            <label for="posZ" class="form-label mt-3">Zoom (Position Z)</label>
                            <input type="range" class="form-range" id="posZ" min="-20" max="0" value="-7.5" step="0.1">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">-20</small>
                                <small class="text-muted" id="posZ-value">-7.5</small>
                                <small class="text-muted">0</small>
                            </div>

                            <label for="vScale" class="form-label mt-3">Vertical Scale</label>
                            <input type="range" class="form-range" id="vScale" min="0.1" max="6" value="3.5" step="0.1">
                            <div class="d-flex justify-content-between">
                                <small class="text-muted">0.1</small>
                                <small class="text-muted" id="vScale-value">3.5</small>
                                <small class="text-muted">6.0</small>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- 5. Calibration -->
                <div class="accordion-item">
                    <h2 class="accordion-header" id="headingFive">
                        <button class="accordion-button collapsed" type="button" data-bs-toggle="collapse" data-bs-target="#collapseFive" aria-expanded="false" aria-controls="collapseFive">
                            Calibration
                        </button>
                    </h2>
                    <div id="collapseFive" class="accordion-collapse collapse" aria-labelledby="headingFive" data-bs-parent="#sidebarAccordion">
                        <div class="accordion-body">
                            <label for="dbfsOffset" class="form-label">dBFS Offset</label>
                            <div class="input-group">
                                <input type="number" class="form-control" id="dbfsOffset" value="0.0" step="0.1" min="-60" max="60">
                                <span class="input-group-text">dB</span>
                            </div>
                            <div class="form-text">Align displayed dBFS to calibrated mic level</div>
                        </div>
                    </div>
                    </div>
                </div>
            </div>
        `
    };

    /**
     * Make sidebar templates globally available for module loader
     * @global
     * @type {Object<string, string>}
     */
    window.sidebarHTML = sidebarHTML;

    console.log('Sidebar manager initialized.');
});