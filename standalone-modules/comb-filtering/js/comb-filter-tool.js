/**
 * Main Comb-Filter Analysis Tool Controller
 * Coordinates all components and provides functional UI
 * Part of Qualia-NSS Standalone Modules
 */

class CombFilterTool {
    constructor() {
        // Core engines
        this.audioEngine = null;
        this.visualizationEngine = null;
        this.measurementEngine = null;
        
        // UI Elements
        this.elements = {};
        
        // State
        this.isInitialized = false;
        this.currentMode = 'educational';
        this.animationId = null;
        
        // Performance tracking
        this.performanceStats = {
            frameCount: 0,
            lastTime: 0,
            fps: 0
        };
        
        // Floor plan state (in meters)
        this.floorPlan = {
            // Listener at center
            listener: { x: 0, y: 0 },
            
            // Set A speakers (front) - 2m in front, 2m apart
            speakersA: {
                left: { x: -1, y: 2 },
                right: { x: 1, y: 2 }
            },
            
            // Set B speakers (back/side) - 0.5m back, 1.2m each side
            speakersB: {
                left: { x: -1.2, y: -0.5 },
                right: { x: 1.2, y: -0.5 }
            },
            
            // Room dimensions for display (meters)
            roomWidth: 12, // Increased to accommodate 10m Set B separation
            roomHeight: 6
        };
        
        // Floor plan interaction state
        this.floorPlanDrag = {
            isDragging: false,
            dragTarget: null, // 'listener', 'setA-left', 'setA-right', 'setB-vertical', 'setB-left', 'setB-right'
            startX: 0,
            startY: 0,
            startListenerX: 0,
            startListenerY: 0,
            startSetBY: 0,
            startSetBLeftX: 0,
            startSetBRightX: 0,
            startSetALeftX: 0,
            startSetARightX: 0
        };
        
        // Floor plan hover state
        this.floorPlanHover = {
            activeTarget: null // Track which element is being hovered
        };
        
        // Speaker state tracking for audio simulation
        this.speakerState = {
            setA: true,  // Controls both A left and right
            setB: true   // Controls both B left and right
        };
        
        console.log('🎛️ Comb-Filter Tool initializing...');
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('🚀 Starting Comb-Filter Tool initialization...');
            
            // Get UI elements
            this.cacheElements();
            
            // Initialize engines
            await this.initializeEngines();
            
            // Setup UI event listeners
            this.setupEventListeners();
            
            // Initialize UI state
            this.initializeUI();
            
            // Start render loop
            this.startRenderLoop();
            
            this.isInitialized = true;
            this.hideLoadingOverlay();
            
            console.log('✅ Comb-Filter Tool initialized successfully');
            
        } catch (error) {
            console.error('❌ Failed to initialize Comb-Filter Tool:', error);
            this.showError('Initialization failed: ' + error.message);
        }
    }
    
    /**
     * Cache DOM elements for performance
     */
    cacheElements() {
        console.log('🔍 Caching DOM elements...');
        
        // Cache frequently accessed DOM elements
        this.elements = {
            // Speaker controls
            speakerA: document.getElementById('speaker-a'),
            speakerB: document.getElementById('speaker-b'),
            distanceA: document.getElementById('distance-a'),
            distanceB: document.getElementById('distance-b'),
            distanceLabelA: document.getElementById('distance-a'),
            distanceLabelB: document.getElementById('distance-b'),
            
            // Parameter controls
            delaySlider: document.getElementById('delay-slider'),
            delayValue: document.getElementById('delay-value'),
            distanceSlider: document.getElementById('distance-slider'),
            distanceValue: document.getElementById('distance-value'),
            feedbackSlider: document.getElementById('feedback-slider'),
            feedbackValue: document.getElementById('feedback-value'),
            mixSlider: document.getElementById('mix-slider'),
            mixValue: document.getElementById('mix-value'),
            signalType: document.getElementById('signal-type'),
            colormapSelect: document.getElementById('colormap-select'),
            
            // Custom tone controls
            toneControlGroup: document.getElementById('tone-control-group'),
            customToneSlider: document.getElementById('custom-tone-slider'),
            customToneValue: document.getElementById('custom-tone-value'),
            
            // Canvas and visualization
            canvas: document.getElementById('main-visualization'),
            
            // Mode and visualization controls
            modeBtns: document.querySelectorAll('.mode-btn'),
            vizTabs: document.querySelectorAll('.viz-tab'),
            freezeDisplay: document.getElementById('freeze-display'),
            
            // Colormap preview
            colormapPreview: document.getElementById('colormap-preview'),
            
            // Other UI elements
            loadingOverlay: document.getElementById('loading-overlay'),
            loadingText: document.querySelector('#loading-overlay .loading-content p'),
            
            // Status indicators
            audioStatus: document.getElementById('audio-status'),
            micStatus: document.getElementById('mic-status'),
            signalQuality: document.getElementById('signal-quality'),
            speakerStatus: document.getElementById('speaker-status'),
            fpsCounter: document.getElementById('fps-counter'),
            cpuUsage: document.getElementById('cpu-usage'),
            
            // Theory display elements
            firstNotch: document.getElementById('first-notch'),
            notchSpacing: document.getElementById('notch-spacing'),
            patternDesc: document.getElementById('pattern-desc'),
            qualiaImpact: document.getElementById('qualia-impact'),
            
            // Analysis results
            notchList: document.getElementById('notch-list'),
            peakList: document.getElementById('peak-list'),
            rt60Value: document.getElementById('rt60-value'),
            reflectionsValue: document.getElementById('reflections-value'),
            roomSize: document.getElementById('room-size'),
            qualiaAssessment: document.getElementById('qualia-assessment'),
            
            // Export controls
            saveData: document.getElementById('save-measurement'),
            exportImage: document.getElementById('export-image'),
            exportCsv: document.getElementById('export-csv'),
            generateReport: document.getElementById('generate-report'),
            
            // Overlays
            loadingOverlay: document.getElementById('loading-overlay'),
            helpModal: document.getElementById('help-modal'),
            
            // Educational content
            educationalPanel: document.getElementById('educational-panel'),
            lessonContent: document.getElementById('lesson-content')
        };
        
        console.log('🔗 UI elements cached');
    }
    
    /**
     * Initialize core engines
     */
    async initializeEngines() {
        // Initialize audio engine
        this.audioEngine = new CombFilterAudioEngine();
        this.audioEngine.onStatusChange = (status, data) => this.handleAudioStatusChange(status, data);
        this.audioEngine.onParameterChange = (params) => this.handleParameterChange(params);
        this.audioEngine.onError = (message) => this.showError(message);
        
        // Initialize basic visualization (will be enhanced)
        this.initializeBasicVisualization();
        
        console.log('🎛️ Engines initialized');
    }
    
    /**
     * Initialize basic visualization
     */
    initializeBasicVisualization() {
        const canvas = this.elements.canvas;
        this.canvasContext = canvas.getContext('2d');
        
        // Set canvas size
        this.resizeCanvas();
        
        // Initialize visualization state
        this.vizState = {
            currentMode: 'spectrogram',
            frozen: false,
            spectrogramData: [],
            maxDataPoints: 500,
            currentColormap: 'musiclab'
        };
        
        // Initialize colormaps
        this.initializeColormaps();
        
        console.log('🎨 Basic visualization initialized');
    }
    
    /**
     * Initialize colormap definitions
     */
    initializeColormaps() {
        this.colormaps = {
            musiclab: {
                name: 'MusicLab',
                description: 'HSV-based colormap from Qualia-NSS spectrogram module',
                getColor: (intensity) => {
                    // MusicLab HSV-based colormap (from spectrogram.js)
                    const h = (1.0 - intensity) * 0.7 * 360; // Hue in [0, 252°]
                    const s = 80; // Saturation 80%
                    const v = intensity > 0.1 ? 100 : 0; // Thresholded brightness
                    return `hsl(${h}, ${s}%, ${v/2}%)`;
                }
            },
            custom: {
                name: 'Custom',
                description: 'Multi-stage HSL progression',
                getColor: (intensity) => {
                    let hue, saturation, lightness;
                    
                    if (intensity < 0.1) {
                        hue = 240;
                        saturation = 100;
                        lightness = 10 + intensity * 20;
                    } else if (intensity < 0.3) {
                        hue = 240 - (intensity - 0.1) * 60;
                        saturation = 100;
                        lightness = 30 + intensity * 30;
                    } else if (intensity < 0.6) {
                        hue = 180 - (intensity - 0.3) * 120;
                        saturation = 100;
                        lightness = 50 + intensity * 20;
                    } else if (intensity < 0.8) {
                        hue = 60 - (intensity - 0.6) * 30;
                        saturation = 100;
                        lightness = 60 + intensity * 15;
                    } else {
                        hue = 30 - (intensity - 0.8) * 30;
                        saturation = 100;
                        lightness = 70 + intensity * 10;
                    }
                    
                    return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
                }
            },
            jet: {
                name: 'Jet',
                description: 'MATLAB classic: Blue → Cyan → Yellow → Red',
                getColor: (intensity) => {
                    const r = Math.max(0, Math.min(1, 1.5 - Math.abs(intensity - 0.75) * 4));
                    const g = Math.max(0, Math.min(1, 1.5 - Math.abs(intensity - 0.5) * 4));
                    const b = Math.max(0, Math.min(1, 1.5 - Math.abs(intensity - 0.25) * 4));
                    return `rgb(${Math.round(r*255)}, ${Math.round(g*255)}, ${Math.round(b*255)})`;
                }
            },
            viridis: {
                name: 'Viridis',
                description: 'Perceptually uniform: Purple → Blue → Green → Yellow',
                getColor: (intensity) => {
                    // Simplified viridis approximation
                    const hue = 260 - intensity * 80; // 260° to 180° to 60°
                    const sat = 70 + intensity * 20;
                    const light = 20 + intensity * 60;
                    return `hsl(${hue}, ${sat}%, ${light}%)`;
                }
            },
            plasma: {
                name: 'Plasma',
                description: 'Modern: Purple → Pink → Yellow',
                getColor: (intensity) => {
                    const hue = 280 - intensity * 220; // 280° to 60°
                    const sat = 80 + intensity * 15;
                    const light = 25 + intensity * 55;
                    return `hsl(${hue}, ${sat}%, ${light}%)`;
                }
            },
            hot: {
                name: 'Hot',
                description: 'Thermal: Black → Red → Yellow → White',
                getColor: (intensity) => {
                    if (intensity < 0.33) {
                        const r = intensity * 3 * 255;
                        return `rgb(${Math.round(r)}, 0, 0)`;
                    } else if (intensity < 0.66) {
                        const g = (intensity - 0.33) * 3 * 255;
                        return `rgb(255, ${Math.round(g)}, 0)`;
                    } else {
                        const b = (intensity - 0.66) * 3 * 255;
                        return `rgb(255, 255, ${Math.round(b)})`;
                    }
                }
            },
            cool: {
                name: 'Cool',
                description: 'Temperature: Cyan → Blue → Magenta',
                getColor: (intensity) => {
                    const hue = 180 + intensity * 120; // 180° to 300°
                    const sat = 100;
                    const light = 50;
                    return `hsl(${hue}, ${sat}%, ${light}%)`;
                }
            },
            grayscale: {
                name: 'Grayscale',
                description: 'Monochrome: Black → White',
                getColor: (intensity) => {
                    const gray = Math.round(intensity * 255);
                    return `rgb(${gray}, ${gray}, ${gray})`;
                }
            }
        };
        
        // Update colormap preview
        this.updateColormapPreview();
        
        console.log('🎨 Colormaps initialized');
    }
    
    /**
     * Setup UI event listeners
     */
    setupEventListeners() {
        console.log('🔌 Setting up event listeners...');
        
        try {
            // Window events
            if (window) {
                window.addEventListener('resize', () => this.resizeCanvas());
            } else {
                console.warn('⚠️ Window object not available');
            }
            
            // Speaker toggle events
            if (this.elements.speakerA) {
                console.log('🔌 Found speaker A toggle:', this.elements.speakerA);
                this.elements.speakerA.addEventListener('change', (e) => {
                    console.log('🔊 Speaker A toggled:', e.target.checked);
                    this.onSpeakerToggle('A', e.target.checked);
                });
            } else {
                console.warn('⚠️ Speaker A toggle not found!');
            }
            
            if (this.elements.speakerB) {
                console.log('🔌 Found speaker B toggle:', this.elements.speakerB);
                this.elements.speakerB.addEventListener('change', (e) => {
                    console.log('🔊 Speaker B toggled:', e.target.checked);
                    this.onSpeakerToggle('B', e.target.checked);
                });
            } else {
                console.warn('⚠️ Speaker B toggle not found!');
            }
            
            // Parameter control events
            const addSliderListener = (elementId, handler) => {
                const element = this.elements[elementId];
                if (element) {
                    element.addEventListener('input', (e) => handler(parseFloat(e.target.value)));
                    console.log(`🔌 Added listener for ${elementId}`);
                } else {
                    console.warn(`⚠️ ${elementId} not found!`);
                }
            };
            
            // Add event listeners with null checks
            if (this.elements.delaySlider) {
                this.elements.delaySlider.addEventListener('input', (e) => this.updateDelay(parseFloat(e.target.value)));
            }
            
            if (this.elements.distanceSlider) {
                this.elements.distanceSlider.addEventListener('input', (e) => this.updateDistance(parseFloat(e.target.value)));
            }
            
            if (this.elements.feedbackSlider) {
                this.elements.feedbackSlider.addEventListener('input', (e) => this.updateFeedback(parseFloat(e.target.value)));
            }
            
            if (this.elements.mixSlider) {
                this.elements.mixSlider.addEventListener('input', (e) => this.updateMix(parseFloat(e.target.value)));
            }
            
            if (this.elements.signalType) {
                this.elements.signalType.addEventListener('change', (e) => this.changeSignalType(e.target.value));
            }
            
            if (this.elements.colormapSelect) {
                this.elements.colormapSelect.addEventListener('change', (e) => this.changeColormap(e.target.value));
            }
            
            // Tone control events
            if (this.elements.customToneSlider) {
                this.elements.customToneSlider.addEventListener('input', (e) => {
                    const pos = parseFloat(e.target.value);
                    const freq = this.logSliderPosToFreq(pos);
                    // Update label (Hz/kHz formatting)
                    if (this.elements.customToneValue) {
                        this.elements.customToneValue.textContent = this.formatFreqLabel(freq);
                    }
                    // Propagate to audio engine if active
                    this.updateCustomToneFrequency(freq);
                });
                console.log('🔌 Custom tone slider initialized');
            } else {
                console.warn('⚠️ Custom tone slider not found!');
            }
            
            // Mode button events
            if (this.elements.modeBtns) {
                this.elements.modeBtns.forEach(btn => {
                    btn.addEventListener('click', (e) => {
                        const mode = e.target.closest('.mode-btn').dataset.mode;
                        this.switchMode(mode);
                    });
                });
                console.log('🔌 Mode button listeners added');
            }
            
            // Visualization tab events
            if (this.elements.vizTabs) {
                this.elements.vizTabs.forEach(tab => {
                    tab.addEventListener('click', (e) => {
                        const vizType = e.target.closest('.viz-tab').dataset.viz;
                        this.switchVisualization(vizType);
                    });
                });
                console.log('🔌 Visualization tab listeners added');
            }
            
            // Visualization control events
            if (this.elements.freezeDisplay) {
                this.elements.freezeDisplay.addEventListener('click', () => this.toggleFreeze());
            }
            
            // Floor plan canvas drag events
            if (this.elements.canvas) {
                this.elements.canvas.addEventListener('mousedown', (e) => this.onFloorPlanMouseDown(e));
                this.elements.canvas.addEventListener('mousemove', (e) => this.onFloorPlanMouseMove(e));
                this.elements.canvas.addEventListener('mouseup', (e) => this.onFloorPlanMouseUp(e));
                this.elements.canvas.addEventListener('mouseleave', (e) => this.onFloorPlanMouseUp(e));
            } else {
                console.warn('⚠️ Canvas element not found!');
            }
            
            console.log('✅ Event listeners setup complete');
            
        } catch (error) {
            console.error('❌ Error setting up event listeners:', error);
            this.showError('Failed to set up event listeners: ' + error.message);
        }
    }
    
    /**
     * Initialize UI state
     */
    initializeUI() {
        // Update parameter displays
        this.updateParameterDisplays();
        
        // Update theory calculations
        this.updateTheoryDisplay();
        
        // Set initial mode
        this.switchMode('educational');
        
        // Update status
        this.updateStatus();
        
        // Initialize custom tone label if present
        if (this.elements.customToneSlider && this.elements.customToneValue) {
            const pos = parseFloat(this.elements.customToneSlider.value);
            const freq = this.logSliderPosToFreq(pos);
            this.elements.customToneValue.textContent = this.formatFreqLabel(freq);
        }
        
        // Default: start with both speaker sets OFF
        if (this.elements.speakerA) this.elements.speakerA.checked = false;
        if (this.elements.speakerB) this.elements.speakerB.checked = false;

        // Ensure engine reflects initial OFF state and apply initial delays
        if (this.audioEngine) {
            this.audioEngine.setSetEnabled('A', false);
            this.audioEngine.setSetEnabled('B', false);
            this.updateSpeakerDelaysFromFloorPlan();
        }

        // Default test signal: custom tone if available
        if (this.elements.signalType) {
            const desired = 'custom-tone';
            if ([...this.elements.signalType.options].some(o => o.value === desired)) {
                this.elements.signalType.value = desired;
                // Apply selection to show controls and prep engine
                this.changeSignalType(desired);
            }
        }

        // Compute initial distances/labels
        this.updateDistanceCalculations();
        
        // Update initial speaker status display
        this.updateSpeakerStatus();

        // Ensure playback reflects initial toggle state
        this.ensurePlaybackState();
        
        console.log('🎨 UI initialized');
    }
    
    /**
     * Auto-manage audio playback based on speaker toggles
     */
    async ensurePlaybackState() {
        console.log('🔄 Ensuring playback state...');
        
        if (!this.audioEngine) {
            console.warn('⚠️ Audio engine not available');
            return;
        }
        
        const speakerAOn = this.elements.speakerA?.checked || false;
        const speakerBOn = this.elements.speakerB?.checked || false;
        const wantPlaying = speakerAOn || speakerBOn;
        
        console.log(`🔈 Speaker states - A: ${speakerAOn}, B: ${speakerBOn}, Want playing: ${wantPlaying}`);

        try {
            // Initialize on first demand
            if (wantPlaying && !this.audioEngine.isInitialized) {
                console.log('🔊 Initializing audio system...');
                this.showLoadingOverlay('Initializing Audio System...');
                
                try {
                    const ok = await this.audioEngine.initialize();
                    if (!ok) {
                        throw new Error('Audio engine initialization failed');
                    }
                    console.log('✅ Audio system initialized successfully');
                    
                    // Apply current per-speaker delays after init
                    this.updateSpeakerDelaysFromFloorPlan();
                } catch (error) {
                    console.error('❌ Audio initialization error:', error);
                    this.showError(`Failed to initialize audio system: ${error.message}`);
                    return;
                } finally {
                    this.hideLoadingOverlay();
                }
            }

            // Handle playback state
            if (wantPlaying && !this.audioEngine.isPlaying) {
                console.log('▶️ Starting audio playback...');
                const type = this.elements.signalType?.value || 'custom-tone';
                console.log(`🎵 Signal type: ${type}`);
                
                try {
                    const started = await this.audioEngine.startSignal(type);
                    if (!started) {
                        throw new Error('Failed to start audio signal');
                    }
                    
                    console.log('✅ Audio playback started');
                    
                    // Handle mode-specific initialization
                    if (this.currentMode === 'analyze') {
                        console.log('🎤 Starting microphone for analysis...');
                        await this.audioEngine.startMicrophone().catch(err => {
                            console.warn('⚠️ Failed to start microphone:', err);
                        });
                    }
                    
                    // Configure custom tone if needed
                    if (type === 'custom-tone' && this.elements.customToneSlider) {
                        const pos = parseFloat(this.elements.customToneSlider.value);
                        const freq = this.logSliderPosToFreq(pos);
                        console.log(`🎛️ Setting custom tone frequency: ${freq.toFixed(1)} Hz`);
                        this.updateCustomToneFrequency(freq);
                        this.toggleCustomTone(true);
                    } else {
                        this.toggleCustomTone(false);
                    }
                } catch (error) {
                    console.error('❌ Playback error:', error);
                    this.showError(`Playback error: ${error.message}`);
                }
            } else if (!wantPlaying && this.audioEngine.isPlaying) {
                console.log('⏹️ Stopping audio playback...');
                this.audioEngine.stopSignal();
                
                if (this.currentMode === 'analyze') {
                    try {
                        await this.audioEngine.stopMicrophone?.();
                    } catch (err) {
                        console.warn('⚠️ Error stopping microphone:', err);
                    }
                }
                console.log('✅ Audio playback stopped');
            }
        } catch (error) {
            console.error('❌ Error in ensurePlaybackState:', error);
            this.showError(`Playback error: ${error.message}`);
        }
    }

    /**
     * Handle speaker set toggle changes
     */
    onSpeakerToggle(setName, enabled) {
        console.log(`🔊 Speaker ${setName} toggled: ${enabled ? 'ON' : 'OFF'}`);
        
        if (!this.audioEngine) {
            console.warn('⚠️ Audio engine not initialized');
            return;
        }
        
        console.log(`🎚️ Updating audio engine state for speaker ${setName} to:`, enabled);
        
        try {
            // Update audio engine state
            this.audioEngine.setSetEnabled(setName, enabled);
            console.log(`✅ Audio engine updated for speaker ${setName}`);
            
            // Update UI to reflect the new state
            const speakerElement = this.elements[`speaker${setName}`];
            if (speakerElement) {
                if (speakerElement.checked !== enabled) {
                    console.log(`🔄 Updating UI checkbox for speaker ${setName} to:`, enabled);
                    speakerElement.checked = enabled;
                }
            } else {
                console.warn(`⚠️ Speaker element not found for ${setName}`);
            }
            
            // Update playback state based on toggles
            console.log('🔄 Ensuring playback state...');
            this.ensurePlaybackState().then(() => {
                console.log(`✅ Playback state updated for speaker ${setName}`);
            }).catch(error => {
                console.error(`❌ Error updating playback state for speaker ${setName}:`, error);
            });
            
            // Update speaker delays if needed
            if (enabled) {
                console.log('🔄 Updating speaker delays from floor plan...');
                this.updateSpeakerDelaysFromFloorPlan();
            } else {
                // Update status bar even when disabling speakers
                this.updateSpeakerStatus();
            }
        } catch (error) {
            console.error(`❌ Error in onSpeakerToggle for ${setName}:`, error);
            this.showError(`Failed to update speaker ${setName}: ${error.message}`);
        }
    }
    
    /**
     * Parameter update methods
     */
    updateDelay(delayMs) {
        const delaySeconds = delayMs / 1000;
        this.audioEngine?.updateParameters({ delayTime: delaySeconds });
        this.elements.delayValue.textContent = delayMs.toFixed(1) + ' ms';
        
        // Update distance slider to match
        const distance = (delayMs / 1000) * 343; // Speed of sound
        this.elements.distanceSlider.value = distance.toFixed(1);
        this.elements.distanceValue.textContent = distance.toFixed(1) + ' m';
        
        this.updateTheoryDisplay();
    }
    
    updateDistance(distance) {
        const delayMs = (distance / 343) * 1000; // Convert to milliseconds
        this.audioEngine?.updateParameters({ delayTime: delayMs / 1000 });
        this.elements.distanceValue.textContent = distance.toFixed(1) + ' m';
        
        // Update delay slider to match
        this.elements.delaySlider.value = delayMs.toFixed(1);
        this.elements.delayValue.textContent = delayMs.toFixed(1) + ' ms';
        
        this.updateTheoryDisplay();
    }
    
    updateFeedback(feedback) {
        this.audioEngine?.updateParameters({ feedback: feedback });
        if (this.elements.feedbackValue) {
            this.elements.feedbackValue.textContent = Math.round(feedback * 100) + '%';
        }
    }
    
    updateMix(mix) {
        this.audioEngine?.updateParameters({ mix: mix / 100 });
        this.elements.mixValue.textContent = Math.round(mix) + '%';
    }
    
    changeSignalType(type) {
        // Show/hide tone control based on signal type
        if (this.elements.toneControlGroup) {
            this.elements.toneControlGroup.style.display = type === 'custom-tone' ? 'block' : 'none';
        }
        
        if (this.audioEngine?.isPlaying) {
            // If switching to custom tone, set frequency and enable tone before starting
            if (type === 'custom-tone' && this.elements.customToneSlider) {
                const pos = parseFloat(this.elements.customToneSlider.value);
                const freq = this.logSliderPosToFreq(pos);
                this.updateCustomToneFrequency(freq);
                this.toggleCustomTone(true);
            } else {
                // Ensure custom tone is disabled when leaving the mode
                this.toggleCustomTone(false);
            }
            this.audioEngine.startSignal(type);
        } else if (this.audioEngine) {
            // Persist selection for when audio starts later
            this.audioEngine.currentSignalType = type;
        }
    }

    /**
     * Map log slider position [0..1000] to frequency [20..20000] Hz
     */
    logSliderPosToFreq(pos) {
        const fmin = 20;
        const fmax = 20000;
        const t = Math.max(0, Math.min(1000, pos)) / 1000;
        const ratio = fmax / fmin;
        return fmin * Math.pow(ratio, t);
    }

    /**
     * Map frequency [20..20000] Hz to log slider position [0..1000]
     */
    freqToLogSliderPos(freq) {
        const fmin = 20;
        const fmax = 20000;
        const f = Math.max(fmin, Math.min(fmax, freq));
        const ratio = fmax / fmin;
        return Math.round(1000 * (Math.log(f / fmin) / Math.log(ratio)));
    }

    /**
     * Format frequency label for display
     */
    formatFreqLabel(freq) {
        if (freq >= 1000) {
            const val = freq / 1000;
            // Use one decimal for <10 kHz, no decimals otherwise
            const str = val < 10 ? val.toFixed(1) : Math.round(val).toString();
            return `${str} kHz`;
        }
        return `${Math.round(freq)} Hz`;
    }
    
    /**
     * Update custom tone frequency
     */
    updateCustomToneFrequency(frequency) {
        if (this.audioEngine && this.elements.signalType.value === 'custom-tone') {
            this.audioEngine.updateCustomToneFrequency(frequency);
        }
    }
    
    /**
     * Toggle custom tone on/off
     */
    toggleCustomTone(active) {
        if (this.audioEngine) {
            this.audioEngine.toggleCustomTone(active && this.elements.signalType.value === 'custom-tone');
        }
    }
    
    /**
     * Update parameter displays
     */
    updateParameterDisplays() {
        const delay = this.elements.delaySlider ? parseFloat(this.elements.delaySlider.value) : 5;
        const distance = this.elements.distanceSlider ? parseFloat(this.elements.distanceSlider.value) : 1.5;
        const feedback = this.elements.feedbackSlider ? parseFloat(this.elements.feedbackSlider.value) : 0;
        const mix = this.elements.mixSlider ? parseFloat(this.elements.mixSlider.value) : 50;
        
        if (this.elements.delayValue) {
            this.elements.delayValue.textContent = delay.toFixed(1) + ' ms';
        }
        if (this.elements.distanceValue) {
            this.elements.distanceValue.textContent = distance.toFixed(1) + ' m';
        }
        if (this.elements.feedbackValue) {
            this.elements.feedbackValue.textContent = Math.round(feedback * 100) + '%';
        }
        if (this.elements.mixValue) {
            this.elements.mixValue.textContent = Math.round(mix) + '%';
        }
    }
    
    /**
     * Update theory display with calculations
     */
    updateTheoryDisplay() {
        const delayMs = this.elements.delaySlider ? parseFloat(this.elements.delaySlider.value) : 5;
        const delaySeconds = delayMs / 1000;
        
        if (delaySeconds <= 0) {
            // No delay = no comb filtering
            if (this.elements.firstNotch) this.elements.firstNotch.textContent = 'No notches';
            if (this.elements.notchSpacing) this.elements.notchSpacing.textContent = 'No filtering';
            if (this.elements.patternDesc) this.elements.patternDesc.textContent = 'Constructive summation';
            if (this.elements.qualiaImpact) {
                this.elements.qualiaImpact.textContent = 'Optimal';
                this.elements.qualiaImpact.className = 'calc-value impact-optimal';
            }
        } else {
            const firstNotch = 1 / (2 * delaySeconds);
            const spacing = 1 / delaySeconds;
            
            if (this.elements.firstNotch) this.elements.firstNotch.textContent = Math.round(firstNotch) + ' Hz';
            if (this.elements.notchSpacing) this.elements.notchSpacing.textContent = Math.round(spacing) + ' Hz';
            
            // Determine pattern description
            let pattern, impact;
            if (firstNotch > 500) {
                pattern = 'High-frequency focus';
                impact = 'Too short';
                if (this.elements.qualiaImpact) this.elements.qualiaImpact.className = 'calc-value impact-danger';
            } else if (firstNotch > 200) {
                pattern = 'Mid-frequency focus';
                impact = 'Borderline';
                if (this.elements.qualiaImpact) this.elements.qualiaImpact.className = 'calc-value impact-warning';
            } else if (firstNotch > 100) {
                pattern = 'Low-mid focus';
                impact = 'Optimal';
                if (this.elements.qualiaImpact) this.elements.qualiaImpact.className = 'calc-value impact-optimal';
            } else {
                pattern = 'Low-frequency focus';
                impact = 'Good';
                if (this.elements.qualiaImpact) this.elements.qualiaImpact.className = 'calc-value impact-optimal';
            }
            
            if (this.elements.patternDesc) this.elements.patternDesc.textContent = pattern;
            if (this.elements.qualiaImpact) this.elements.qualiaImpact.textContent = impact;
        }
    }
    
    /**
     * Update speaker status display in status bar
     */
    updateSpeakerStatus() {
        if (!this.elements.speakerStatus || !this.audioEngine?.isInitialized) {
            return;
        }
        
        try {
            const timingStatus = this.audioEngine.getTimingStatus();
            const statusText = timingStatus.map(s => 
                `${s.speaker}: ${s.distance} (${s.delay}) ${s.enabled ? 'ON' : 'OFF'}`
            ).join(' | ');
            
            // Update the status element text (preserving icon)
            const icon = this.elements.speakerStatus.querySelector('i');
            if (icon) {
                this.elements.speakerStatus.innerHTML = icon.outerHTML + ' ' + statusText;
            } else {
                this.elements.speakerStatus.textContent = 'Speakers: ' + statusText;
            }
        } catch (error) {
            console.warn('⚠️ Error updating speaker status:', error);
            const icon = this.elements.speakerStatus.querySelector('i');
            if (icon) {
                this.elements.speakerStatus.innerHTML = icon.outerHTML + ' Speakers: Error';
            } else {
                this.elements.speakerStatus.textContent = 'Speakers: Error';
            }
        }
    }
    
    /**
     * Change colormap
     */
    changeColormap(colormapName) {
        this.vizState.currentColormap = colormapName;
        this.updateColormapPreview();
        console.log(`🎨 Switched to ${colormapName} colormap`);
    }
    
    /**
     * Update colormap preview bar
     */
    updateColormapPreview() {
        const previewElement = this.elements.colormapPreview;
        if (!previewElement || !this.colormaps) return;
        
        const currentColormap = this.colormaps[this.vizState.currentColormap];
        if (!currentColormap) return;
        
        // Create gradient stops
        const stops = [];
        const numStops = 20;
        
        for (let i = 0; i < numStops; i++) {
            const intensity = i / (numStops - 1);
            const color = currentColormap.getColor(intensity);
            const position = (intensity * 100).toFixed(1);
            stops.push(`${color} ${position}%`);
        }
        
        previewElement.style.background = `linear-gradient(to right, ${stops.join(', ')})`;
    }
    
    /**
     * Get color for intensity using current colormap
     */
    getSpectrogramColor(intensity) {
        const colormap = this.colormaps[this.vizState.currentColormap];
        if (!colormap) {
            // Fallback to custom if colormap not found
            return this.colormaps.custom.getColor(intensity);
        }
        return colormap.getColor(intensity);
    }
    
    /**
     * Mode switching
     */
    switchMode(mode) {
        this.currentMode = mode;
        
        // Update active button
        this.elements.modeBtns.forEach(btn => {
            btn.classList.toggle('active', btn.dataset.mode === mode);
        });
        
        // Show/hide educational content
        this.elements.educationalPanel.classList.toggle('active', mode === 'educational');
        
        // Update lesson content based on mode
        this.updateEducationalContent(mode);
        
        console.log(`📚 Switched to ${mode} mode`);
    }
    
    /**
     * Update educational content
     */
    updateEducationalContent(mode) {
        let content = '';
        
        switch (mode) {
            case 'educational':
                content = `
                    <h4>Understanding Comb-Filtering</h4>
                    <p>Comb-filtering occurs when a sound combines with a delayed copy of itself, creating interference patterns.</p>
                    <p><strong>Try this:</strong> Adjust the delay slider and watch how the first notch frequency changes.</p>
                    <p><strong>Formula:</strong> First Notch = 1 / (2 × delay time)</p>
                `;
                break;
            case 'generator':
                content = `
                    <h4>Digital Comb-Filter</h4>
                    <p>Generate controlled comb-filtering effects to understand the theory.</p>
                    <p><strong>Controls:</strong> Adjust delay and mix to hear different effects.</p>
                    <p><strong>Signals:</strong> Try different test signals to hear how comb-filtering affects various sounds.</p>
                `;
                break;
            case 'analyze':
                content = `
                    <h4>Room Analysis</h4>
                    <p>Measure real-world comb-filtering in your acoustic space.</p>
                    <p><strong>Setup:</strong> Enable a speaker set (A or B) to begin playback and analysis.</p>
                    <p><strong>Method:</strong> Compare the direct signal with the microphone capture to identify room effects.</p>
                `;
                break;
        }
        
        this.elements.lessonContent.innerHTML = content;
    }
    
    /**
     * Visualization controls
     */
    switchVisualization(vizType) {
        this.vizState.currentMode = vizType;
        
        // Update active tab
        this.elements.vizTabs.forEach(tab => {
            tab.classList.toggle('active', tab.dataset.viz === vizType);
        });
        
        console.log(`📊 Switched to ${vizType} visualization`);
    }
    
    toggleFreeze() {
        this.vizState.frozen = !this.vizState.frozen;
        const icon = this.vizState.frozen ? 'fa-play' : 'fa-pause';
        this.elements.freezeDisplay.innerHTML = `<i class="fas ${icon}"></i>`;
    }
    
    clearDisplay() {
        this.vizState.spectrogramData = [];
        this.clearCanvas();
    }
    
    /**
     * Canvas management
     */
    resizeCanvas() {
        const canvas = this.elements.canvas;
        const container = canvas.parentElement;
        
        canvas.width = container.clientWidth;
        canvas.height = container.clientHeight;
        
        console.log(`🎨 Canvas resized to ${canvas.width}x${canvas.height}`);
    }
    
    clearCanvas() {
        const ctx = this.canvasContext;
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, this.elements.canvas.width, this.elements.canvas.height);
    }
    
    /**
     * Render loop
     */
    startRenderLoop() {
        const render = (currentTime) => {
            // Calculate FPS
            this.updatePerformanceStats(currentTime);
            
            // Always update floor plan, or when not frozen and audio is ready
            if (this.vizState.currentMode === 'floorplan' || (!this.vizState.frozen && this.audioEngine?.isInitialized)) {
                this.updateVisualization();
            }
            
            this.updateUI();
            
            this.animationId = requestAnimationFrame(render);
        };
        
        this.animationId = requestAnimationFrame(render);
        console.log('🔄 Render loop started');
    }
    
    /**
     * Update visualization
     */
    updateVisualization() {
        if (!this.canvasContext) return;
        
        const canvas = this.elements.canvas;
        const ctx = this.canvasContext;
        
        // Floor plan doesn't need audio data
        if (this.vizState.currentMode === 'floorplan') {
            // Clear canvas with appropriate background
            ctx.fillStyle = '#f5f5f5'; // Light gray for floor plan
            ctx.fillRect(0, 0, canvas.width, canvas.height);
            this.drawFloorPlan(ctx, canvas);
            return;
        }
        
        // Other visualizations need audio engine and data
        if (!this.audioEngine) return;
        
        // Get analyzer data
        const analyzerData = this.audioEngine.getAnalyzerData('wet');
        if (!analyzerData) return;
        
        // Clear canvas with black background for audio visualizations
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        if (this.vizState.currentMode === 'frequency') {
            this.drawFrequencyResponse(ctx, analyzerData, canvas);
        } else if (this.vizState.currentMode === 'spectrogram') {
            this.drawSpectrogram(ctx, analyzerData, canvas);
        } else if (this.vizState.currentMode === 'waveform') {
            this.drawWaveform(ctx, analyzerData, canvas);
        }
    }
    
    /**
     * Draw frequency response
     */
    drawFrequencyResponse(ctx, data, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const frequencyData = data.frequency;
        const nyquist = this.audioEngine ? this.audioEngine.sampleRate / 2 : 22050;
        
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Plot using log-frequency x-axis from 20 Hz to Nyquist
        let started = false;
        const denom = Math.log10(nyquist / 20);
        const len = frequencyData.length;
        for (let i = 0; i < len; i++) {
            const freq = (i / (len - 1)) * nyquist;
            if (freq < 20 || !isFinite(freq) || denom <= 0) continue;
            const x = (Math.log10(freq / 20) / denom) * width;
            const amplitude = (frequencyData[i] + 140) / 140; // Normalize from -140dB to 0dB
            const y = height - (amplitude * height);
            
            if (!started) {
                ctx.moveTo(x, y);
                started = true;
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
        
        // Add frequency labels
        this.drawFrequencyLabels(ctx, canvas);
    }
    
    /**
     * Draw spectrogram with proper scrolling
     */
    drawSpectrogram(ctx, data, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const frequencyData = data.frequency;
        
        // Add new data column
        this.vizState.spectrogramData.push([...frequencyData]);
        
        // Use fixed column width for consistent time scale
        const columnWidth = 2; // 2 pixels per time step
        const maxColumns = Math.floor(width / columnWidth);
        
        // Keep only visible columns (scroll old data out)
        if (this.vizState.spectrogramData.length > maxColumns) {
            this.vizState.spectrogramData.shift();
        }
        
        // Clear canvas
        ctx.fillStyle = '#000';
        ctx.fillRect(0, 0, width, height);
        
        // Draw spectrogram with fixed column width
        const startX = width - (this.vizState.spectrogramData.length * columnWidth);
        
        for (let x = 0; x < this.vizState.spectrogramData.length; x++) {
            const column = this.vizState.spectrogramData[x];
            
            for (let y = 0; y < column.length; y++) {
                const amplitude = (column[y] + 140) / 140; // Normalize -140dB to 0dB
                const intensity = Math.max(0, Math.min(1, amplitude));
                
                if (intensity > 0.01) { // Skip drawing very low amplitudes for performance
                    // Use selected colormap
                    ctx.fillStyle = this.getSpectrogramColor(intensity);
                    
                    const pixelX = startX + (x * columnWidth);
                    const pixelY = height - ((y / column.length) * height);
                    const pixelHeight = Math.max(1, height / column.length);
                    
                    ctx.fillRect(pixelX, pixelY - pixelHeight, columnWidth, pixelHeight);
                }
            }
        }
        
        // Draw frequency grid lines
        this.drawSpectrogramGrid(ctx, canvas);
    }
    
    /**
     * Draw spectrogram grid and labels
     */
    drawSpectrogramGrid(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Frequency grid lines
        const frequencies = [100, 500, 1000, 5000, 10000];
        const nyquist = this.audioEngine ? this.audioEngine.sampleRate / 2 : 22050;
        
        ctx.strokeStyle = 'rgba(255, 255, 255, 0.2)';
        ctx.lineWidth = 1;
        ctx.font = '10px monospace';
        ctx.fillStyle = 'rgba(255, 255, 255, 0.7)';
        
        frequencies.forEach(freq => {
            if (freq < nyquist) {
                const y = height - (Math.log10(freq / 20) / Math.log10(nyquist / 20) * height);
                
                // Grid line
                ctx.beginPath();
                ctx.moveTo(0, y);
                ctx.lineTo(width, y);
                ctx.stroke();
                
                // Frequency label
                const label = freq >= 1000 ? (freq/1000) + 'k' : freq + '';
                ctx.fillText(label, 5, y - 2);
            }
        });
    }
    
    /**
     * Draw waveform
     */
    drawWaveform(ctx, data, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        const timeData = data.time;
        
        ctx.strokeStyle = '#88ff00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        
        const centerY = height / 2;
        
        for (let i = 0; i < timeData.length; i++) {
            const x = (i / timeData.length) * width;
            const y = centerY + (timeData[i] * centerY);
            
            if (i === 0) {
                ctx.moveTo(x, y);
            } else {
                ctx.lineTo(x, y);
            }
        }
        
        ctx.stroke();
    }
    
    /**
     * Draw frequency labels
     */
    drawFrequencyLabels(ctx, canvas) {
        const frequencies = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
        const width = canvas.width;
        const height = canvas.height;
        const nyquist = this.audioEngine ? this.audioEngine.sampleRate / 2 : 22050;
        const denom = Math.log10(nyquist / 20);
        
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        
        frequencies.forEach(freq => {
            if (freq < 20 || freq > nyquist || denom <= 0) return;
            const x = (Math.log10(freq / 20) / denom) * width;
            if (x >= 0 && x <= width) {
                ctx.fillText(freq >= 1000 ? (freq/1000) + 'k' : freq, x, height - 5);
                
                // Draw grid line
                ctx.strokeStyle = '#333';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, 0);
                ctx.lineTo(x, height - 20);
                ctx.stroke();
            }
        });
    }
    
    /**
     * Draw floor plan visualization
     */
    drawFloorPlan(ctx, canvas) {
        const width = canvas.width;
        const height = canvas.height;
        
        // Auto-zoom: calculate dynamic bounds based on actual speaker positions
        const allPositions = [
            this.floorPlan.listener,
            this.floorPlan.speakersA.left,
            this.floorPlan.speakersA.right,
            this.floorPlan.speakersB.left,
            this.floorPlan.speakersB.right
        ];
        
        // Find actual bounds of all elements
        const minX = Math.min(...allPositions.map(p => p.x)) - 1; // 1m margin
        const maxX = Math.max(...allPositions.map(p => p.x)) + 1; // 1m margin
        const minY = Math.min(...allPositions.map(p => p.y)) - 1; // 1m margin
        const maxY = Math.max(...allPositions.map(p => p.y)) + 1; // 1m margin
        
        // Calculate dynamic room dimensions
        const dynamicWidth = maxX - minX + 2; // Extra margin for measurement lines
        const dynamicHeight = maxY - minY;
        
        // Calculate scale to fit content in 80% of canvas
        const scaleX = (width * 0.8) / dynamicWidth;
        const scaleY = (height * 0.8) / dynamicHeight;
        const scale = Math.min(scaleX, scaleY);
        
        // Adjust offset to center the dynamic bounds
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        
        // Center offset
        const offsetX = width / 2;
        const offsetY = height / 2;
        
        // Convert meters to pixels with dynamic centering
        const toPixels = (x, y) => ({
            x: offsetX + ((x - centerX) * scale),
            y: offsetY - ((y - centerY) * scale) // Flip Y axis (canvas Y+ is down, room Y+ is up)
        });
        
        // No room outline - simulating infinite/anechoic space
        
        // Draw listener (person icon)
        const listener = toPixels(this.floorPlan.listener.x, this.floorPlan.listener.y);
        
        // Hover effect for listener
        if (this.floorPlanHover.activeTarget === 'listener') {
            ctx.strokeStyle = '#00ff00';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.arc(listener.x, listener.y + 2, 18, 0, Math.PI * 2);
            ctx.stroke();
        }
        
        // Draw professional listener icon (head with ears)
        ctx.fillStyle = '#00aa00';
        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 2;
        
        // Main head (larger circle)
        ctx.beginPath();
        ctx.arc(listener.x, listener.y, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.stroke();
        
        // Left ear
        ctx.beginPath();
        ctx.arc(listener.x - 10, listener.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Right ear  
        ctx.beginPath();
        ctx.arc(listener.x + 10, listener.y - 2, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = '#ffffff';
        ctx.beginPath();
        ctx.arc(listener.x - 3, listener.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        ctx.beginPath();
        ctx.arc(listener.x + 3, listener.y - 2, 1.5, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        ctx.fillStyle = '#00aa00';
        ctx.beginPath();
        ctx.arc(listener.x, listener.y + 1, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction arrow (pointing up/forward)
        ctx.strokeStyle = '#00aa00';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(listener.x, listener.y - 15);
        ctx.lineTo(listener.x, listener.y - 25);
        ctx.moveTo(listener.x, listener.y - 25);
        ctx.lineTo(listener.x - 3, listener.y - 22);
        ctx.moveTo(listener.x, listener.y - 25);
        ctx.lineTo(listener.x + 3, listener.y - 22);
        ctx.stroke();
        
        // Draw Set A speakers (front) - speaker icons
        const speakerAL = toPixels(this.floorPlan.speakersA.left.x, this.floorPlan.speakersA.left.y);
        const speakerAR = toPixels(this.floorPlan.speakersA.right.x, this.floorPlan.speakersA.right.y);
        
        // Hover effects for Set A speakers (smaller rectangular)
        if (this.floorPlanHover.activeTarget === 'setA-left') {
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.rect(speakerAL.x - 8, speakerAL.y - 6, 16, 12);
            ctx.stroke();
        }
        
        if (this.floorPlanHover.activeTarget === 'setA-right') {
            ctx.strokeStyle = '#ff6666';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.rect(speakerAR.x - 8, speakerAR.y - 6, 16, 12);
            ctx.stroke();
        }
        
        // Draw Set A speaker icons - smaller rectangular (top view)
        ctx.fillStyle = '#cc3333';
        ctx.strokeStyle = '#cc3333';
        ctx.lineWidth = 2;
        
        // Left speaker - compact rectangular design (top view)
        // Main cabinet (rectangular, wider than deep)
        ctx.fillRect(speakerAL.x - 6, speakerAL.y - 4, 12, 8);
        ctx.strokeRect(speakerAL.x - 6, speakerAL.y - 4, 12, 8);
        
        // Single driver (from top view)
        ctx.beginPath();
        ctx.arc(speakerAL.x, speakerAL.y, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(speakerAL.x, speakerAL.y, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction indicator (front face)
        ctx.fillRect(speakerAL.x - 6, speakerAL.y + 3, 12, 1);
        
        // Right speaker - identical rectangular design
        // Main cabinet (rectangular, wider than deep)
        ctx.fillRect(speakerAR.x - 6, speakerAR.y - 4, 12, 8);
        ctx.strokeRect(speakerAR.x - 6, speakerAR.y - 4, 12, 8);
        
        // Single driver (from top view)
        ctx.beginPath();
        ctx.arc(speakerAR.x, speakerAR.y, 2.5, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(speakerAR.x, speakerAR.y, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Direction indicator (front face)
        ctx.fillRect(speakerAR.x - 6, speakerAR.y + 3, 12, 1);
        
        // Removed red dotted lines from listener to Set A speakers
        
        // Draw Set B speakers (back/side) - smaller speaker icons
        const speakerBL = toPixels(this.floorPlan.speakersB.left.x, this.floorPlan.speakersB.left.y);
        const speakerBR = toPixels(this.floorPlan.speakersB.right.x, this.floorPlan.speakersB.right.y);
        
        // Hover effects for Set B speakers (larger square)
        if (this.floorPlanHover.activeTarget === 'setB-left') {
            ctx.strokeStyle = '#6666ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.rect(speakerBL.x - 10, speakerBL.y - 10, 20, 20);
            ctx.stroke();
        }
        
        if (this.floorPlanHover.activeTarget === 'setB-right') {
            ctx.strokeStyle = '#6666ff';
            ctx.lineWidth = 3;
            ctx.setLineDash([]);
            ctx.beginPath();
            ctx.rect(speakerBR.x - 10, speakerBR.y - 10, 20, 20);
            ctx.stroke();
        }
        
        // Hover effect for Set B vertical drag (show line between speakers)
        if (this.floorPlanHover.activeTarget === 'setB-vertical') {
            ctx.strokeStyle = '#6666ff';
            ctx.lineWidth = 4;
            ctx.setLineDash([5, 5]);
            ctx.beginPath();
            ctx.moveTo(speakerBL.x, speakerBL.y);
            ctx.lineTo(speakerBR.x, speakerBR.y);
            ctx.stroke();
            ctx.setLineDash([]);
        }
        
        // Draw Set B speaker icons - larger square (top view)
        ctx.fillStyle = '#3333cc';
        ctx.strokeStyle = '#3333cc';
        ctx.lineWidth = 2;
        
        // Left speaker - large square design (top view)
        // Main cabinet (square, larger than Set A)
        ctx.fillRect(speakerBL.x - 8, speakerBL.y - 8, 16, 16);
        ctx.strokeRect(speakerBL.x - 8, speakerBL.y - 8, 16, 16);
        
        // Large woofer (from top view)
        ctx.beginPath();
        ctx.arc(speakerBL.x, speakerBL.y + 2, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(speakerBL.x, speakerBL.y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Tweeter (from top view)
        ctx.beginPath();
        ctx.arc(speakerBL.x, speakerBL.y - 3, 2, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(speakerBL.x, speakerBL.y - 3, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Bass port (rectangular)
        ctx.fillRect(speakerBL.x - 2, speakerBL.y - 7, 4, 2);
        
        // Direction indicator (front face)
        ctx.strokeRect(speakerBL.x - 8, speakerBL.y + 6, 16, 2);
        
        // Right speaker - identical large square design
        // Main cabinet (square, larger than Set A)
        ctx.fillRect(speakerBR.x - 8, speakerBR.y - 8, 16, 16);
        ctx.strokeRect(speakerBR.x - 8, speakerBR.y - 8, 16, 16);
        
        // Large woofer (from top view)
        ctx.beginPath();
        ctx.arc(speakerBR.x, speakerBR.y + 2, 4, 0, Math.PI * 2);
        ctx.stroke();
        ctx.beginPath();
        ctx.arc(speakerBR.x, speakerBR.y + 2, 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Tweeter (from top view)
        ctx.beginPath();
        ctx.arc(speakerBR.x, speakerBR.y - 3, 2, 0, Math.PI * 2);
        ctx.stroke();
        
        // Green dotted lines from listener to each speaker with distance and delay labels
        {
            const c = 343; // m/s
            const fmt = (m) => `${m.toFixed(2)}m, ${((m / c) * 1000).toFixed(1)}ms`;
            const pairs = [
                { px: speakerAL, m: this.floorPlan.speakersA.left },
                { px: speakerAR, m: this.floorPlan.speakersA.right },
                { px: speakerBL, m: this.floorPlan.speakersB.left },
                { px: speakerBR, m: this.floorPlan.speakersB.right },
            ];
            ctx.save();
            ctx.setLineDash([3, 3]);
            ctx.lineWidth = 1;
            ctx.strokeStyle = '#00aa00';
            ctx.fillStyle = '#00aa00';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            for (const p of pairs) {
                const dx = p.m.x - this.floorPlan.listener.x;
                const dy = p.m.y - this.floorPlan.listener.y;
                const dist = Math.hypot(dx, dy);
                // line
                ctx.beginPath();
                ctx.moveTo(listener.x, listener.y);
                ctx.lineTo(p.px.x, p.px.y);
                ctx.stroke();
                // label
                const midX = (listener.x + p.px.x) / 2;
                const midY = (listener.y + p.px.y) / 2 + 12;
                ctx.fillText(fmt(dist), midX, midY);
            }
            ctx.restore();
        }
        
        ctx.font = '11px monospace';
        ctx.textAlign = 'center';
        
        // Set A speaker separation line
        const separationA = Math.abs(this.floorPlan.speakersA.right.x - this.floorPlan.speakersA.left.x);
        const separationAPixels = {
            startX: speakerAL.x,
            endX: speakerAR.x,
            y: speakerAL.y - 25 // Above the speakers
        };
        
        // Draw horizontal line for Set A
        ctx.beginPath();
        ctx.moveTo(separationAPixels.startX, separationAPixels.y);
        ctx.lineTo(separationAPixels.endX, separationAPixels.y);
        ctx.stroke();
        
        // Draw end markers for Set A
        ctx.beginPath();
        ctx.moveTo(separationAPixels.startX, separationAPixels.y - 3);
        ctx.lineTo(separationAPixels.startX, separationAPixels.y + 3);
        ctx.moveTo(separationAPixels.endX, separationAPixels.y - 3);
        ctx.lineTo(separationAPixels.endX, separationAPixels.y + 3);
        ctx.stroke();
        
        // Label for Set A separation
        const centerAX = (separationAPixels.startX + separationAPixels.endX) / 2;
        ctx.fillText(`${separationA.toFixed(2)}m`, centerAX, separationAPixels.y - 8);
        
        // Set B speaker separation line
        const separationB = Math.abs(this.floorPlan.speakersB.right.x - this.floorPlan.speakersB.left.x);
        const separationBPixels = {
            startX: speakerBL.x,
            endX: speakerBR.x,
            y: speakerBL.y + 35 // Below the speakers
        };
        
        // Draw horizontal line for Set B
        ctx.beginPath();
        ctx.moveTo(separationBPixels.startX, separationBPixels.y);
        ctx.lineTo(separationBPixels.endX, separationBPixels.y);
        ctx.stroke();
        
        // Draw end markers for Set B
        ctx.beginPath();
        ctx.moveTo(separationBPixels.startX, separationBPixels.y - 3);
        ctx.lineTo(separationBPixels.startX, separationBPixels.y + 3);
        ctx.moveTo(separationBPixels.endX, separationBPixels.y - 3);
        ctx.lineTo(separationBPixels.endX, separationBPixels.y + 3);
        ctx.stroke();
        
        // Label for Set B separation
        const centerBX = (separationBPixels.startX + separationBPixels.endX) / 2;
        ctx.fillText(`${separationB.toFixed(2)}m`, centerBX, separationBPixels.y + 15);
        
        // Draw Set A to Set B separation line (vertical distance between sets)
        const setASetBSeparation = Math.abs(this.floorPlan.speakersA.left.y - this.floorPlan.speakersB.left.y);
        
        // Find the rightmost speaker position (Set A or Set B)
        const setARightmostX = Math.max(this.floorPlan.speakersA.left.x, this.floorPlan.speakersA.right.x);
        const setBRightmostX = Math.max(this.floorPlan.speakersB.left.x, this.floorPlan.speakersB.right.x);
        const rightmostSpeakerX = Math.max(setARightmostX, setBRightmostX);
        const rightmostSpeakerPixelX = offsetX + (rightmostSpeakerX * scale);
        
        const separationABPixels = {
            x: rightmostSpeakerPixelX + 60, // 60px to the right of rightmost speaker
            startY: (speakerAL.y + speakerAR.y) / 2, // Center of Set A
            endY: (speakerBL.y + speakerBR.y) / 2 // Center of Set B
        };
        
        // Draw vertical line between Set A and Set B
        ctx.beginPath();
        ctx.moveTo(separationABPixels.x, separationABPixels.startY);
        ctx.lineTo(separationABPixels.x, separationABPixels.endY);
        ctx.stroke();
        
        // Draw end markers for A-B separation
        ctx.beginPath();
        ctx.moveTo(separationABPixels.x - 3, separationABPixels.startY);
        ctx.lineTo(separationABPixels.x + 3, separationABPixels.startY);
        ctx.moveTo(separationABPixels.x - 3, separationABPixels.endY);
        ctx.lineTo(separationABPixels.x + 3, separationABPixels.endY);
        ctx.stroke();
        
        // Label for A-B separation
        const centerABY = (separationABPixels.startY + separationABPixels.endY) / 2;
        ctx.save();
        ctx.translate(separationABPixels.x + 20, centerABY);
        ctx.rotate(-Math.PI / 2); // Rotate text 90 degrees
        ctx.textAlign = 'center';
        ctx.fillText(`${setASetBSeparation.toFixed(2)}m`, 0, 0);
        ctx.restore();
        
        // Draw Listener to Set A and Listener to Set B distance lines
        // NOTE: Use vertical (Y-axis) separation only, not diagonal distance
        const listenerToSetADistance = Math.abs(this.floorPlan.speakersA.left.y - this.floorPlan.listener.y);
        const listenerToSetBDistance = Math.abs(this.floorPlan.speakersB.left.y - this.floorPlan.listener.y);
        
        // Position for single listener distance line (30px from rightmost speaker)
        const listenerDistanceLineX = rightmostSpeakerPixelX + 30;
        
        // Draw single line from Set A through Listener to Set B
        const listenerLinePixels = {
            x: listenerDistanceLineX,
            startY: (speakerAL.y + speakerAR.y) / 2, // Center of Set A
            middleY: listener.y, // Listener position
            endY: (speakerBL.y + speakerBR.y) / 2 // Center of Set B
        };
        
        // Draw complete line from A through Listener to B
        ctx.beginPath();
        ctx.moveTo(listenerLinePixels.x, listenerLinePixels.startY);
        ctx.lineTo(listenerLinePixels.x, listenerLinePixels.endY);
        ctx.stroke();
        
        // End markers for Set A, Listener, and Set B
        ctx.beginPath();
        // Set A marker
        ctx.moveTo(listenerLinePixels.x - 3, listenerLinePixels.startY);
        ctx.lineTo(listenerLinePixels.x + 3, listenerLinePixels.startY);
        // Listener marker
        ctx.moveTo(listenerLinePixels.x - 3, listenerLinePixels.middleY);
        ctx.lineTo(listenerLinePixels.x + 3, listenerLinePixels.middleY);
        // Set B marker
        ctx.moveTo(listenerLinePixels.x - 3, listenerLinePixels.endY);
        ctx.lineTo(listenerLinePixels.x + 3, listenerLinePixels.endY);
        ctx.stroke();
        
        // Label for Listener to A (upper segment)
        const listenerAMidY = (listenerLinePixels.startY + listenerLinePixels.middleY) / 2;
        ctx.save();
        ctx.translate(listenerLinePixels.x - 15, listenerAMidY);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(`${listenerToSetADistance.toFixed(2)}m`, 0, 0);
        ctx.restore();
        
        // Label for Listener to B (lower segment)
        const listenerBMidY = (listenerLinePixels.middleY + listenerLinePixels.endY) / 2;
        ctx.save();
        ctx.translate(listenerLinePixels.x - 15, listenerBMidY);
        ctx.rotate(-Math.PI / 2);
        ctx.textAlign = 'center';
        ctx.fillText(`${listenerToSetBDistance.toFixed(2)}m`, 0, 0);
        ctx.restore();
        
        // Removed gray horizontal line from listener to Set A center
        
        // Set B speakers separation line (moved further down to create space at original position)
        {
            const ySpeakers = speakerBL.y + 75; // moved further below original (~+55)
            
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(speakerBL.x, ySpeakers);
            ctx.lineTo(speakerBR.x, ySpeakers);
            ctx.stroke();
            // End markers at B-L and B-R
            ctx.beginPath();
            ctx.moveTo(speakerBL.x, ySpeakers - 3);
            ctx.lineTo(speakerBL.x, ySpeakers + 3);
            // Listener marker on the same horizontal line
            ctx.moveTo(listener.x, ySpeakers - 3);
            ctx.lineTo(listener.x, ySpeakers + 3);
            ctx.moveTo(speakerBR.x, ySpeakers - 3);
            ctx.lineTo(speakerBR.x, ySpeakers + 3);
            ctx.stroke();
            // Two labels on the same line: listener-to-BL and listener-to-BR
            const horizToBLeft = Math.abs(this.floorPlan.listener.x - this.floorPlan.speakersB.left.x);
            const horizToBRight = Math.abs(this.floorPlan.listener.x - this.floorPlan.speakersB.right.x);
            const midLeft = (listener.x + speakerBL.x) / 2;
            const midRight = (listener.x + speakerBR.x) / 2;
            ctx.fillStyle = '#888';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            const labelY = ySpeakers + 15; // both labels at same vertical position
            ctx.fillText(`${horizToBLeft.toFixed(2)}m`, midLeft, labelY);
            ctx.fillText(`${horizToBRight.toFixed(2)}m`, midRight, labelY);
        }
        
        
        
        
        // Draw distance measurements
        ctx.fillStyle = '#333';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        
        // Distance from Set A/B to listener (vertical separation only)
        const distanceA = Math.abs(this.floorPlan.speakersA.left.y - this.floorPlan.listener.y);
        const distanceB = Math.abs(this.floorPlan.speakersB.left.y - this.floorPlan.listener.y);
        
        // Distance difference
        const distanceDiff = Math.abs(distanceA - distanceB);
        
        // Labels
        ctx.fillText('Listener', listener.x, listener.y + 25);
        // Place Set labels inline, vertically centered with speakers
        ctx.save();
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('Set A (Front)', (speakerAL.x + speakerAR.x) / 2, (speakerAL.y + speakerAR.y) / 2);
        ctx.fillText('Set B (Back)', (speakerBL.x + speakerBR.x) / 2, (speakerBL.y + speakerBR.y) / 2);
        ctx.restore();
        
        // Distance info
        ctx.textAlign = 'left';
        ctx.fillText(`Set A Distance: ${distanceA.toFixed(2)}m`, 20, 30);
        ctx.fillText(`Set B Distance: ${distanceB.toFixed(2)}m`, 20, 50);
        ctx.fillText(`Difference: ${distanceDiff.toFixed(2)}m`, 20, 70);
        ctx.fillText(`Delay: ${((distanceDiff / 343) * 1000).toFixed(1)}ms`, 20, 90);
    }
    
    /**
     * Floor plan mouse interaction methods
     */
    onFloorPlanMouseDown(event) {
        // Only handle drag events in floor plan mode
        if (this.vizState.currentMode !== 'floorplan') return;
        
        const rect = this.elements.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const canvas = this.elements.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Calculate dynamic scale and offset (same as in drawFloorPlan)
        const allPositions = [
            this.floorPlan.listener,
            this.floorPlan.speakersA.left,
            this.floorPlan.speakersA.right,
            this.floorPlan.speakersB.left,
            this.floorPlan.speakersB.right
        ];
        
        const minX = Math.min(...allPositions.map(p => p.x)) - 1;
        const maxX = Math.max(...allPositions.map(p => p.x)) + 1;
        const minY = Math.min(...allPositions.map(p => p.y)) - 1;
        const maxY = Math.max(...allPositions.map(p => p.y)) + 1;
        
        const dynamicWidth = maxX - minX + 2;
        const dynamicHeight = maxY - minY;
        
        const scaleX = (width * 0.8) / dynamicWidth;
        const scaleY = (height * 0.8) / dynamicHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const offsetX = width / 2;
        const offsetY = height / 2;
        
        // Convert positions to pixels with dynamic centering
        const listenerPixels = {
            x: offsetX + ((this.floorPlan.listener.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.listener.y - centerY) * scale)
        };
        
        const setBLeftPixels = {
            x: offsetX + ((this.floorPlan.speakersB.left.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersB.left.y - centerY) * scale)
        };
        
        const setBRightPixels = {
            x: offsetX + ((this.floorPlan.speakersB.right.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersB.right.y - centerY) * scale)
        };
        
        const setALeftPixels = {
            x: offsetX + ((this.floorPlan.speakersA.left.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersA.left.y - centerY) * scale)
        };
        
        const setARightPixels = {
            x: offsetX + ((this.floorPlan.speakersA.right.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersA.right.y - centerY) * scale)
        };
        
        const tolerance = 20;
        
        // Check listener drag
        const listenerDistance = Math.sqrt(
            Math.pow(mouseX - listenerPixels.x, 2) + 
            Math.pow(mouseY - listenerPixels.y, 2)
        );
        
        // Check Set B left speaker drag
        const setBLeftDistance = Math.sqrt(
            Math.pow(mouseX - setBLeftPixels.x, 2) + 
            Math.pow(mouseY - setBLeftPixels.y, 2)
        );
        
        // Check Set B right speaker drag
        const setBRightDistance = Math.sqrt(
            Math.pow(mouseX - setBRightPixels.x, 2) + 
            Math.pow(mouseY - setBRightPixels.y, 2)
        );
        
        // Check Set B vertical drag area (between speakers)
        const setBCenterX = (setBLeftPixels.x + setBRightPixels.x) / 2;
        const setBVerticalDistance = Math.sqrt(
            Math.pow(mouseX - setBCenterX, 2) + 
            Math.pow(mouseY - setBLeftPixels.y, 2)
        );
        const inSetBHorizontalRange = mouseX >= Math.min(setBLeftPixels.x, setBRightPixels.x) - tolerance && 
                                     mouseX <= Math.max(setBLeftPixels.x, setBRightPixels.x) + tolerance;
        
        // Check Set A left speaker drag
        const setALeftDistance = Math.sqrt(
            Math.pow(mouseX - setALeftPixels.x, 2) + 
            Math.pow(mouseY - setALeftPixels.y, 2)
        );
        
        // Check Set A right speaker drag
        const setARightDistance = Math.sqrt(
            Math.pow(mouseX - setARightPixels.x, 2) + 
            Math.pow(mouseY - setARightPixels.y, 2)
        );
        
        if (listenerDistance <= tolerance) {
            this.floorPlanDrag.isDragging = true;
            this.floorPlanDrag.dragTarget = 'listener';
            this.floorPlanDrag.startX = mouseX;
            this.floorPlanDrag.startY = mouseY;
            this.floorPlanDrag.startListenerX = this.floorPlan.listener.x;
            this.floorPlanDrag.startListenerY = this.floorPlan.listener.y;
            this.elements.canvas.style.cursor = 'grabbing';
        } else if (setALeftDistance <= tolerance) {
            this.floorPlanDrag.isDragging = true;
            this.floorPlanDrag.dragTarget = 'setA-left';
            this.floorPlanDrag.startX = mouseX;
            this.floorPlanDrag.startSetALeftX = this.floorPlan.speakersA.left.x;
            this.floorPlanDrag.startSetARightX = this.floorPlan.speakersA.right.x;
            this.elements.canvas.style.cursor = 'grabbing';
        } else if (setARightDistance <= tolerance) {
            this.floorPlanDrag.isDragging = true;
            this.floorPlanDrag.dragTarget = 'setA-right';
            this.floorPlanDrag.startX = mouseX;
            this.floorPlanDrag.startSetALeftX = this.floorPlan.speakersA.left.x;
            this.floorPlanDrag.startSetARightX = this.floorPlan.speakersA.right.x;
            this.elements.canvas.style.cursor = 'grabbing';
        } else if (setBLeftDistance <= tolerance) {
            this.floorPlanDrag.isDragging = true;
            this.floorPlanDrag.dragTarget = 'setB-left';
            this.floorPlanDrag.startX = mouseX;
            this.floorPlanDrag.startSetBLeftX = this.floorPlan.speakersB.left.x;
            this.floorPlanDrag.startSetBRightX = this.floorPlan.speakersB.right.x;
            this.elements.canvas.style.cursor = 'grabbing';
        } else if (setBRightDistance <= tolerance) {
            this.floorPlanDrag.isDragging = true;
            this.floorPlanDrag.dragTarget = 'setB-right';
            this.floorPlanDrag.startX = mouseX;
            this.floorPlanDrag.startSetBLeftX = this.floorPlan.speakersB.left.x;
            this.floorPlanDrag.startSetBRightX = this.floorPlan.speakersB.right.x;
            this.elements.canvas.style.cursor = 'grabbing';
        } else if (setBVerticalDistance <= tolerance && inSetBHorizontalRange) {
            this.floorPlanDrag.isDragging = true;
            this.floorPlanDrag.dragTarget = 'setB-vertical';
            this.floorPlanDrag.startY = mouseY;
            this.floorPlanDrag.startSetBY = this.floorPlan.speakersB.left.y;
            this.elements.canvas.style.cursor = 'grabbing';
        }
    }
    
    onFloorPlanMouseMove(event) {
        if (this.vizState.currentMode !== 'floorplan') return;
        
        const rect = this.elements.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        if (this.floorPlanDrag.isDragging) {
            const canvas = this.elements.canvas;
            const width = canvas.width;
            const height = canvas.height;
            
            // Calculate dynamic scale (same as in drawFloorPlan)
            const allPositions = [
                this.floorPlan.listener,
                this.floorPlan.speakersA.left,
                this.floorPlan.speakersA.right,
                this.floorPlan.speakersB.left,
                this.floorPlan.speakersB.right
            ];
            
            const minX = Math.min(...allPositions.map(p => p.x)) - 1;
            const maxX = Math.max(...allPositions.map(p => p.x)) + 1;
            const minY = Math.min(...allPositions.map(p => p.y)) - 1;
            const maxY = Math.max(...allPositions.map(p => p.y)) + 1;
            
            const dynamicWidth = maxX - minX + 2;
            const dynamicHeight = maxY - minY;
            
            const scaleX = (width * 0.8) / dynamicWidth;
            const scaleY = (height * 0.8) / dynamicHeight;
            const scale = Math.min(scaleX, scaleY);
            
            if (this.floorPlanDrag.dragTarget === 'listener') {
                // Listener free movement (both X and Y)
                const deltaX = mouseX - this.floorPlanDrag.startX;
                const deltaY = mouseY - this.floorPlanDrag.startY;
                const deltaXMeters = deltaX / scale;
                const deltaYMeters = -deltaY / scale; // Negative because canvas Y+ is down
                
                const rawX = this.floorPlanDrag.startListenerX + deltaXMeters;
                const rawY = this.floorPlanDrag.startListenerY + deltaYMeters;
                
                // Snap to 0.05m steps
                const snappedX = Math.round(rawX / 0.05) * 0.05;
                const snappedY = Math.round(rawY / 0.05) * 0.05;
                
                this.floorPlan.listener.x = snappedX; // Free horizontal movement
                this.floorPlan.listener.y = snappedY; // Free vertical movement
                
            } else if (this.floorPlanDrag.dragTarget === 'setB-vertical') {
                // Set B vertical drag (both speakers together)
                const deltaY = mouseY - this.floorPlanDrag.startY;
                const deltaYMeters = -deltaY / scale;
                const rawY = this.floorPlanDrag.startSetBY + deltaYMeters;
                // Snap to 0.05m steps
                const snappedY = Math.round(rawY / 0.05) * 0.05;
                // Limit Set B to reasonable range (50m max separation from Set A)
                const setAY = this.floorPlan.speakersA.left.y; // Set A Y position
                const maxSeparation = 50; // Maximum 50m separation
                const minY = setAY - maxSeparation; // 50m behind Set A
                const maxY = setAY + maxSeparation; // 50m in front of Set A
                const newY = Math.max(minY, Math.min(maxY, snappedY));
                this.floorPlan.speakersB.left.y = newY;
                this.floorPlan.speakersB.right.y = newY;
                
            } else if (this.floorPlanDrag.dragTarget === 'setA-left') {
                // Set A left speaker horizontal drag (with right speaker mirroring)
                const deltaX = mouseX - this.floorPlanDrag.startX;
                const deltaXMeters = deltaX / scale;
                
                // Calculate new positions maintaining center
                const currentCenter = (this.floorPlanDrag.startSetALeftX + this.floorPlanDrag.startSetARightX) / 2;
                const currentSeparation = Math.abs(this.floorPlanDrag.startSetARightX - this.floorPlanDrag.startSetALeftX);
                const rawSeparation = currentSeparation - deltaXMeters * 2;
                // Snap to 0.05m steps
                const snappedSeparation = Math.round(rawSeparation / 0.05) * 0.05;
                const newSeparation = Math.max(0.2, Math.min(50, snappedSeparation)); // Min 0.2m, max 50m apart
                
                this.floorPlan.speakersA.left.x = currentCenter - newSeparation / 2;
                this.floorPlan.speakersA.right.x = currentCenter + newSeparation / 2;
                
            } else if (this.floorPlanDrag.dragTarget === 'setA-right') {
                // Set A right speaker horizontal drag (with left speaker mirroring)
                const deltaX = mouseX - this.floorPlanDrag.startX;
                const deltaXMeters = deltaX / scale;
                
                // Calculate new positions maintaining center
                const currentCenter = (this.floorPlanDrag.startSetALeftX + this.floorPlanDrag.startSetARightX) / 2;
                const currentSeparation = Math.abs(this.floorPlanDrag.startSetARightX - this.floorPlanDrag.startSetALeftX);
                const rawSeparation = currentSeparation + deltaXMeters * 2;
                // Snap to 0.05m steps
                const snappedSeparation = Math.round(rawSeparation / 0.05) * 0.05;
                const newSeparation = Math.max(0.2, Math.min(50, snappedSeparation)); // Min 0.2m, max 50m apart
                
                this.floorPlan.speakersA.left.x = currentCenter - newSeparation / 2;
                this.floorPlan.speakersA.right.x = currentCenter + newSeparation / 2;
                
            } else if (this.floorPlanDrag.dragTarget === 'setB-left') {
                // Set B left speaker horizontal drag (with right speaker mirroring)
                const deltaX = mouseX - this.floorPlanDrag.startX;
                const deltaXMeters = deltaX / scale;
                
                // Calculate new positions maintaining center
                const currentCenter = (this.floorPlanDrag.startSetBLeftX + this.floorPlanDrag.startSetBRightX) / 2;
                const currentSeparation = Math.abs(this.floorPlanDrag.startSetBRightX - this.floorPlanDrag.startSetBLeftX);
                const rawSeparation = currentSeparation - deltaXMeters * 2;
                // Snap to 0.05m steps
                const snappedSeparation = Math.round(rawSeparation / 0.05) * 0.05;
                const newSeparation = Math.max(0.2, Math.min(50, snappedSeparation)); // Min 0.2m, max 50m apart
                
                this.floorPlan.speakersB.left.x = currentCenter - newSeparation / 2;
                this.floorPlan.speakersB.right.x = currentCenter + newSeparation / 2;
                
            } else if (this.floorPlanDrag.dragTarget === 'setB-right') {
                // Set B right speaker horizontal drag (with left speaker mirroring)
                const deltaX = mouseX - this.floorPlanDrag.startX;
                const deltaXMeters = deltaX / scale;
                
                // Calculate new positions maintaining center
                const currentCenter = (this.floorPlanDrag.startSetBLeftX + this.floorPlanDrag.startSetBRightX) / 2;
                const currentSeparation = Math.abs(this.floorPlanDrag.startSetBRightX - this.floorPlanDrag.startSetBLeftX);
                const rawSeparation = currentSeparation + deltaXMeters * 2;
                // Snap to 0.05m steps
                const snappedSeparation = Math.round(rawSeparation / 0.05) * 0.05;
                const newSeparation = Math.max(0.2, Math.min(50, snappedSeparation)); // Min 0.2m, max 50m apart
                
                this.floorPlan.speakersB.left.x = currentCenter - newSeparation / 2;
                this.floorPlan.speakersB.right.x = currentCenter + newSeparation / 2;
            }
            
            // Update distance calculations and UI
            this.updateDistanceCalculations();
        } else {
            // Show cursor hints when hovering over draggable elements
            this.updateFloorPlanCursor(event);
        }
    }
    
    onFloorPlanMouseUp(event) {
        if (this.floorPlanDrag.isDragging) {
            this.floorPlanDrag.isDragging = false;
            this.floorPlanDrag.dragTarget = null;
            this.elements.canvas.style.cursor = 'default';
        }
    }
    
    updateFloorPlanCursor(event) {
        if (this.vizState.currentMode !== 'floorplan') return;
        
        const rect = this.elements.canvas.getBoundingClientRect();
        const mouseX = event.clientX - rect.left;
        const mouseY = event.clientY - rect.top;
        
        const canvas = this.elements.canvas;
        const width = canvas.width;
        const height = canvas.height;
        
        // Calculate dynamic scale and offset (same as in drawFloorPlan)
        const allPositions = [
            this.floorPlan.listener,
            this.floorPlan.speakersA.left,
            this.floorPlan.speakersA.right,
            this.floorPlan.speakersB.left,
            this.floorPlan.speakersB.right
        ];
        
        const minX = Math.min(...allPositions.map(p => p.x)) - 1;
        const maxX = Math.max(...allPositions.map(p => p.x)) + 1;
        const minY = Math.min(...allPositions.map(p => p.y)) - 1;
        const maxY = Math.max(...allPositions.map(p => p.y)) + 1;
        
        const dynamicWidth = maxX - minX + 2;
        const dynamicHeight = maxY - minY;
        
        const scaleX = (width * 0.8) / dynamicWidth;
        const scaleY = (height * 0.8) / dynamicHeight;
        const scale = Math.min(scaleX, scaleY);
        
        const centerX = (minX + maxX) / 2;
        const centerY = (minY + maxY) / 2;
        const offsetX = width / 2;
        const offsetY = height / 2;
        
        // Convert positions to pixels with dynamic centering
        const listenerPixels = {
            x: offsetX + ((this.floorPlan.listener.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.listener.y - centerY) * scale)
        };
        
        const setBLeftPixels = {
            x: offsetX + ((this.floorPlan.speakersB.left.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersB.left.y - centerY) * scale)
        };
        
        const setBRightPixels = {
            x: offsetX + ((this.floorPlan.speakersB.right.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersB.right.y - centerY) * scale)
        };
        
        const setALeftPixels = {
            x: offsetX + ((this.floorPlan.speakersA.left.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersA.left.y - centerY) * scale)
        };
        
        const setARightPixels = {
            x: offsetX + ((this.floorPlan.speakersA.right.x - centerX) * scale),
            y: offsetY - ((this.floorPlan.speakersA.right.y - centerY) * scale)
        };
        
        const tolerance = 20;
        
        // Check all interactive areas
        const listenerDistance = Math.sqrt(Math.pow(mouseX - listenerPixels.x, 2) + Math.pow(mouseY - listenerPixels.y, 2));
        const setBLeftDistance = Math.sqrt(Math.pow(mouseX - setBLeftPixels.x, 2) + Math.pow(mouseY - setBLeftPixels.y, 2));
        const setBRightDistance = Math.sqrt(Math.pow(mouseX - setBRightPixels.x, 2) + Math.pow(mouseY - setBRightPixels.y, 2));
        const setALeftDistance = Math.sqrt(Math.pow(mouseX - setALeftPixels.x, 2) + Math.pow(mouseY - setALeftPixels.y, 2));
        const setARightDistance = Math.sqrt(Math.pow(mouseX - setARightPixels.x, 2) + Math.pow(mouseY - setARightPixels.y, 2));
        
        // Check Set B vertical drag area
        const setBCenterX = (setBLeftPixels.x + setBRightPixels.x) / 2;
        const setBVerticalDistance = Math.sqrt(Math.pow(mouseX - setBCenterX, 2) + Math.pow(mouseY - setBLeftPixels.y, 2));
        const inSetBHorizontalRange = mouseX >= Math.min(setBLeftPixels.x, setBRightPixels.x) - tolerance && 
                                     mouseX <= Math.max(setBLeftPixels.x, setBRightPixels.x) + tolerance;
        
        // Set appropriate cursor and hover target
        if (listenerDistance <= tolerance) {
            this.elements.canvas.style.cursor = 'grab';
            this.floorPlanHover.activeTarget = 'listener';
        } else if (setALeftDistance <= tolerance) {
            this.elements.canvas.style.cursor = 'ew-resize'; // Horizontal resize cursor
            this.floorPlanHover.activeTarget = 'setA-left';
        } else if (setARightDistance <= tolerance) {
            this.elements.canvas.style.cursor = 'ew-resize'; // Horizontal resize cursor
            this.floorPlanHover.activeTarget = 'setA-right';
        } else if (setBLeftDistance <= tolerance) {
            this.elements.canvas.style.cursor = 'ew-resize'; // Horizontal resize cursor
            this.floorPlanHover.activeTarget = 'setB-left';
        } else if (setBRightDistance <= tolerance) {
            this.elements.canvas.style.cursor = 'ew-resize'; // Horizontal resize cursor
            this.floorPlanHover.activeTarget = 'setB-right';
        } else if (setBVerticalDistance <= tolerance && inSetBHorizontalRange) {
            this.elements.canvas.style.cursor = 'ns-resize'; // Vertical resize cursor
            this.floorPlanHover.activeTarget = 'setB-vertical';
        } else {
            this.elements.canvas.style.cursor = 'default';
            this.floorPlanHover.activeTarget = null;
        }
    }
    
    updateDistanceCalculations() {
        // Update the delay/distance sliders based on floor plan
        const distanceA = Math.sqrt(
            Math.pow(this.floorPlan.speakersA.left.x - this.floorPlan.listener.x, 2) + 
            Math.pow(this.floorPlan.speakersA.left.y - this.floorPlan.listener.y, 2)
        );
        
        const distanceB = Math.sqrt(
            Math.pow(this.floorPlan.speakersB.left.x - this.floorPlan.listener.x, 2) + 
            Math.pow(this.floorPlan.speakersB.left.y - this.floorPlan.listener.y, 2)
        );
        
        const distanceDiff = Math.abs(distanceA - distanceB);
        const delayMs = (distanceDiff / 343) * 1000; // Speed of sound = 343 m/s
        
        // Update the delay slider to match floor plan
        if (this.elements.delaySlider && this.elements.distanceSlider) {
            this.elements.delaySlider.value = delayMs.toFixed(1);
            this.elements.distanceSlider.value = distanceDiff.toFixed(1);
            this.updateParameterDisplays();
            this.updateTheoryDisplay();
        }
        
        // Update sidebar distance labels (use left speaker for display consistency)
        if (this.elements.distanceLabelA) {
            const msA = (distanceA / 343) * 1000;
            this.elements.distanceLabelA.textContent = `${distanceA.toFixed(2)} m / ${msA.toFixed(1)} ms`;
        }
        if (this.elements.distanceLabelB) {
            const msB = (distanceB / 343) * 1000;
            this.elements.distanceLabelB.textContent = `${distanceB.toFixed(2)} m / ${msB.toFixed(1)} ms`;
        }
        
        // Apply per-speaker delays to the audio engine
        this.updateSpeakerDelaysFromFloorPlan();
    }

    /**
     * Compute per-speaker delays from floor plan and update audio engine
     */
    updateSpeakerDelaysFromFloorPlan() {
        if (!this.audioEngine?.isInitialized) return;
        const L = this.floorPlan.listener;
        const dist = (p) => Math.sqrt(Math.pow(p.x - L.x, 2) + Math.pow(p.y - L.y, 2));
        const dA_L = dist(this.floorPlan.speakersA.left) / 343;   // seconds
        const dA_R = dist(this.floorPlan.speakersA.right) / 343;  // seconds
        const dB_L = dist(this.floorPlan.speakersB.left) / 343;   // seconds
        const dB_R = dist(this.floorPlan.speakersB.right) / 343;  // seconds
        this.audioEngine.setSpeakerDelays({
            A_left: dA_L,
            A_right: dA_R,
            B_left: dB_L,
            B_right: dB_R
        });
        
        // Update status bar display
        this.updateSpeakerStatus();
    }

    
    /**
     * Update UI elements
     */
    updateUI() {
        // Update status indicators
        this.updateStatus();
        
        // Update analysis results
        this.updateAnalysisResults();
    }
    
    /**
     * Update status indicators
     */
    updateStatus() {
        if (!this.audioEngine) return;
        
        const status = this.audioEngine.getStatus();
        
        // Audio status
        const audioIcon = status.isPlaying ? 'status-green' : 'status-red';
        const audioText = status.isPlaying ? 'Playing' : 'Stopped';
        this.elements.audioStatus.innerHTML = `<i class="fas fa-circle ${audioIcon}"></i> Audio: ${audioText}`;
        
        // Microphone status
        const micIcon = status.isMicrophoneActive ? 'status-green' : 'status-red';
        const micText = status.isMicrophoneActive ? 'Connected' : 'Disconnected';
        this.elements.micStatus.innerHTML = `<i class="fas fa-circle ${micIcon}"></i> Microphone: ${micText}`;
        
        // Performance
        this.elements.fpsCounter.textContent = this.performanceStats.fps;
    }
    
    /**
     * Update analysis results
     */
    updateAnalysisResults() {
        if (!this.audioEngine?.isInitialized) {
            return;
        }
        
        const delayMs = parseFloat(this.elements.delaySlider.value);
        const delaySeconds = delayMs / 1000;
        
        // Calculate and display notch frequencies
        const notches = this.audioEngine.calculateNotchFrequencies(delaySeconds, 5);
        
        let notchHtml = '';
        notches.forEach((freq, index) => {
            notchHtml += `<li>${Math.round(freq)} Hz</li>`;
        });
        
        if (notchHtml) {
            this.elements.notchList.innerHTML = notchHtml;
        }
        
        // Update QUALIA assessment
        const distance = (delaySeconds * 343).toFixed(1);
        let assessment = '';
        
        if (delaySeconds <= 0.001) {
            // Near-zero delay = optimal condition (no comb filtering)
            assessment = `<p class="impact-optimal">✅ Perfect alignment (${distance}m). No comb-filtering - optimal QUALIA-NSS condition.</p>`;
        } else if (delaySeconds < 0.008) {
            // Small delay = still good condition
            assessment = `<p class="impact-optimal">✅ Good distance (${distance}m) for QUALIA-NSS setup.</p>`;
        } else {
            // Large delay = precedence effect, but comb filtering present
            assessment = `<p class="impact-warning">⚡ Large distance (${distance}m). Good precedence effect but comb-filtering present.</p>`;
        }
        
        this.elements.qualiaAssessment.innerHTML = assessment;
    }
    
    /**
     * Performance tracking
     */
    updatePerformanceStats(currentTime) {
        this.performanceStats.frameCount++;
        
        if (currentTime - this.performanceStats.lastTime >= 1000) {
            this.performanceStats.fps = Math.round(
                this.performanceStats.frameCount * 1000 / (currentTime - this.performanceStats.lastTime)
            );
            this.performanceStats.frameCount = 0;
            this.performanceStats.lastTime = currentTime;
        }
    }
    
    /**
     * Event handlers
     */
    handleAudioStatusChange(status, data) {
        console.log(`🎵 Audio status changed: ${status}`);
        this.updateStatus();
    }
    
    handleParameterChange(params) {
        // Parameters updated, refresh theory display
        this.updateTheoryDisplay();
    }
    
    /**
     * Utility methods
     */
    showLoadingOverlay(message = 'Loading...') {
        this.elements.loadingOverlay.querySelector('p').textContent = message;
        this.elements.loadingOverlay.classList.add('visible');
    }
    
    hideLoadingOverlay() {
        this.elements.loadingOverlay.classList.remove('visible');
    }
    
    showError(message) {
        console.error('❌ Error:', message);
        alert('Error: ' + message); // Simple error display for now
    }
    
    calibrateSystem() {
        console.log('🔧 System calibration not yet implemented');
        this.showError('Calibration feature coming soon');
    }
    
    changeSampleRate(rate) {
        console.log(`🎵 Sample rate change requested: ${rate} Hz`);
        this.showError('Sample rate change requires audio system restart');
    }
    
    toggleFullscreen() {
        console.log('🖥️ Fullscreen toggle not yet implemented');
    }
    
    // Export methods (placeholders)
    saveData() { console.log('💾 Save data not yet implemented'); }
    exportImage() { console.log('🖼️ Export image not yet implemented'); }
    exportCsv() { console.log('📊 Export CSV not yet implemented'); }
    generateReport() { console.log('📄 Generate report not yet implemented'); }
    
    /**
     * Cleanup
     */
    destroy() {
        if (this.animationId) {
            cancelAnimationFrame(this.animationId);
        }
        
        if (this.audioEngine) {
            this.audioEngine.dispose();
        }
        
        console.log('🗑️ Comb-Filter Tool destroyed');
    }
}

// Expose class to global scope
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombFilterTool;
} else {
    window.CombFilterTool = CombFilterTool;
}

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.combFilterApp) {
        window.combFilterApp.destroy();
    }
});