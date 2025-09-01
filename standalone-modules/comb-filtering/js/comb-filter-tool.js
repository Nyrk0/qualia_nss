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
        // Control elements
        this.elements = {
            // Header controls
            startAudio: document.getElementById('start-audio'),
            calibrate: document.getElementById('calibrate'),
            sampleRate: document.getElementById('sample-rate'),
            
            // Mode buttons
            modeBtns: document.querySelectorAll('.mode-btn'),
            
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
            toneControlGroup: document.getElementById('tone-control-group'),
            customToneControl: document.getElementById('custom-tone-control'),
            colormapSelect: document.getElementById('colormap-select'),
            colormapPreview: document.getElementById('colormap-preview'),
            
            // Theory display
            firstNotch: document.getElementById('first-notch'),
            notchSpacing: document.getElementById('notch-spacing'),
            patternDesc: document.getElementById('pattern-desc'),
            qualiaImpact: document.getElementById('qualia-impact'),
            
            // Visualization
            canvas: document.getElementById('main-visualization'),
            vizTabs: document.querySelectorAll('.viz-tab'),
            freezeDisplay: document.getElementById('freeze-display'),
            clearDisplay: document.getElementById('clear-display'),
            fullscreenViz: document.getElementById('fullscreen-viz'),
            
            // Status indicators
            audioStatus: document.getElementById('audio-status'),
            micStatus: document.getElementById('mic-status'),
            signalQuality: document.getElementById('signal-quality'),
            fpsCounter: document.getElementById('fps-counter'),
            cpuUsage: document.getElementById('cpu-usage'),
            
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
        // Audio controls
        this.elements.startAudio.addEventListener('click', () => this.toggleAudio());
        this.elements.calibrate.addEventListener('click', () => this.calibrateSystem());
        this.elements.sampleRate.addEventListener('change', (e) => this.changeSampleRate(e.target.value));
        
        // Mode switching
        this.elements.modeBtns.forEach(btn => {
            btn.addEventListener('click', (e) => this.switchMode(e.target.dataset.mode));
        });
        
        // Parameter controls
        this.elements.delaySlider.addEventListener('input', (e) => this.updateDelay(parseFloat(e.target.value)));
        this.elements.distanceSlider.addEventListener('input', (e) => this.updateDistance(parseFloat(e.target.value)));
        this.elements.feedbackSlider.addEventListener('input', (e) => this.updateFeedback(parseFloat(e.target.value)));
        this.elements.mixSlider.addEventListener('input', (e) => this.updateMix(parseFloat(e.target.value)));
        this.elements.signalType.addEventListener('change', (e) => this.changeSignalType(e.target.value));
        this.elements.colormapSelect.addEventListener('change', (e) => this.changeColormap(e.target.value));
        
        // Tone control events
        if (this.elements.customToneControl) {
            this.elements.customToneControl.addEventListener('frequency-change', (e) => this.updateCustomToneFrequency(e.detail.frequency));
            this.elements.customToneControl.addEventListener('toggle', (e) => this.toggleCustomTone(e.detail.active));
        }
        
        // Visualization controls
        this.elements.vizTabs.forEach(tab => {
            tab.addEventListener('click', (e) => this.switchVisualization(e.target.dataset.viz));
        });
        this.elements.freezeDisplay.addEventListener('click', () => this.toggleFreeze());
        this.elements.clearDisplay.addEventListener('click', () => this.clearDisplay());
        this.elements.fullscreenViz.addEventListener('click', () => this.toggleFullscreen());
        
        // Export controls
        this.elements.saveData.addEventListener('click', () => this.saveData());
        this.elements.exportImage.addEventListener('click', () => this.exportImage());
        this.elements.exportCsv.addEventListener('click', () => this.exportCsv());
        this.elements.generateReport.addEventListener('click', () => this.generateReport());
        
        // Window resize
        window.addEventListener('resize', () => this.resizeCanvas());
        
        // Floor plan canvas drag events
        this.elements.canvas.addEventListener('mousedown', (e) => this.onFloorPlanMouseDown(e));
        this.elements.canvas.addEventListener('mousemove', (e) => this.onFloorPlanMouseMove(e));
        this.elements.canvas.addEventListener('mouseup', (e) => this.onFloorPlanMouseUp(e));
        this.elements.canvas.addEventListener('mouseleave', (e) => this.onFloorPlanMouseUp(e));
        
        console.log('👂 Event listeners setup complete');
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
        
        console.log('🎨 UI initialized');
    }
    
    /**
     * Audio control methods
     */
    async toggleAudio() {
        if (!this.audioEngine) return;
        
        if (!this.audioEngine.isInitialized) {
            this.showLoadingOverlay('Initializing Audio System...');
            const success = await this.audioEngine.initialize();
            this.hideLoadingOverlay();
            
            if (!success) {
                this.showError('Failed to initialize audio system');
                return;
            }
        }
        
        if (this.audioEngine.isPlaying) {
            this.audioEngine.stopSignal();
            this.elements.startAudio.innerHTML = '<i class="fas fa-play"></i> Start Audio';
        } else {
            const success = await this.audioEngine.startSignal();
            if (success) {
                this.elements.startAudio.innerHTML = '<i class="fas fa-stop"></i> Stop Audio';
                
                // Start microphone if in analyze mode
                if (this.currentMode === 'analyze') {
                    await this.audioEngine.startMicrophone();
                }
            }
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
        this.elements.feedbackValue.textContent = Math.round(feedback * 100) + '%';
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
            this.audioEngine.startSignal(type);
        }
    }
    
    /**
     * Update custom tone frequency
     */
    updateCustomToneFrequency(frequency) {
        if (this.audioEngine?.isPlaying && this.elements.signalType.value === 'custom-tone') {
            this.audioEngine.updateCustomToneFrequency(frequency);
        }
    }
    
    /**
     * Toggle custom tone on/off
     */
    toggleCustomTone(active) {
        if (this.audioEngine?.isPlaying && this.elements.signalType.value === 'custom-tone') {
            this.audioEngine.toggleCustomTone(active);
        }
    }
    
    /**
     * Update parameter displays
     */
    updateParameterDisplays() {
        const delay = parseFloat(this.elements.delaySlider.value);
        const distance = parseFloat(this.elements.distanceSlider.value);
        const feedback = parseFloat(this.elements.feedbackSlider.value);
        const mix = parseFloat(this.elements.mixSlider.value);
        
        this.elements.delayValue.textContent = delay.toFixed(1) + ' ms';
        this.elements.distanceValue.textContent = distance.toFixed(1) + ' m';
        this.elements.feedbackValue.textContent = Math.round(feedback * 100) + '%';
        this.elements.mixValue.textContent = Math.round(mix) + '%';
    }
    
    /**
     * Update theory display with calculations
     */
    updateTheoryDisplay() {
        const delayMs = parseFloat(this.elements.delaySlider.value);
        const delaySeconds = delayMs / 1000;
        
        if (delaySeconds <= 0) {
            // No delay = no comb filtering
            this.elements.firstNotch.textContent = 'No notches';
            this.elements.notchSpacing.textContent = 'No filtering';
            this.elements.patternDesc.textContent = 'Constructive summation';
            this.elements.qualiaImpact.textContent = 'Optimal';
            this.elements.qualiaImpact.className = 'calc-value impact-optimal';
        } else {
            const firstNotch = 1 / (2 * delaySeconds);
            const spacing = 1 / delaySeconds;
            
            this.elements.firstNotch.textContent = Math.round(firstNotch) + ' Hz';
            this.elements.notchSpacing.textContent = Math.round(spacing) + ' Hz';
            
            // Determine pattern description
            let pattern, impact;
            if (firstNotch > 500) {
                pattern = 'High-frequency focus';
                impact = 'Too short';
                this.elements.qualiaImpact.className = 'calc-value impact-danger';
            } else if (firstNotch > 200) {
                pattern = 'Mid-frequency focus';
                impact = 'Borderline';
                this.elements.qualiaImpact.className = 'calc-value impact-warning';
            } else if (firstNotch > 100) {
                pattern = 'Low-mid focus';
                impact = 'Optimal';
                this.elements.qualiaImpact.className = 'calc-value impact-optimal';
            } else {
                pattern = 'Low-frequency focus';
                impact = 'Good';
                this.elements.qualiaImpact.className = 'calc-value impact-optimal';
            }
            
            this.elements.patternDesc.textContent = pattern;
            this.elements.qualiaImpact.textContent = impact;
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
                    <p><strong>Controls:</strong> Adjust delay, feedback, and mix to hear different effects.</p>
                    <p><strong>Signals:</strong> Try different test signals to hear how comb-filtering affects various sounds.</p>
                `;
                break;
            case 'analyze':
                content = `
                    <h4>Room Analysis</h4>
                    <p>Measure real-world comb-filtering in your acoustic space.</p>
                    <p><strong>Setup:</strong> Click "Start Audio" to begin microphone analysis.</p>
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
        
        ctx.strokeStyle = '#00ff88';
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        for (let i = 0; i < frequencyData.length; i++) {
            const x = (i / frequencyData.length) * width;
            const amplitude = (frequencyData[i] + 140) / 140; // Normalize from -140dB to 0dB
            const y = height - (amplitude * height);
            
            if (i === 0) {
                ctx.moveTo(x, y);
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
        const frequencies = [20, 100, 500, 1000, 5000, 10000, 20000];
        const width = canvas.width;
        const height = canvas.height;
        
        ctx.fillStyle = '#888';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        
        frequencies.forEach(freq => {
            const x = Math.log10(freq / 20) / Math.log10(1000) * width;
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
        
        // Draw cone angles for Set A speakers (pointing toward listener)
        ctx.strokeStyle = '#cc3333';
        ctx.lineWidth = 1;
        ctx.setLineDash([2, 2]);
        
        // Left speaker cone
        ctx.beginPath();
        ctx.moveTo(speakerAL.x, speakerAL.y);
        ctx.lineTo(listener.x - 10, listener.y);
        ctx.moveTo(speakerAL.x, speakerAL.y);
        ctx.lineTo(listener.x + 10, listener.y);
        ctx.stroke();
        
        // Right speaker cone
        ctx.beginPath();
        ctx.moveTo(speakerAR.x, speakerAR.y);
        ctx.lineTo(listener.x - 10, listener.y);
        ctx.moveTo(speakerAR.x, speakerAR.y);
        ctx.lineTo(listener.x + 10, listener.y);
        ctx.stroke();
        
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
        ctx.beginPath();
        ctx.arc(speakerBR.x, speakerBR.y - 3, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Bass port (rectangular)
        ctx.fillRect(speakerBR.x - 2, speakerBR.y - 7, 4, 2);
        
        // Direction indicator (front face)
        ctx.strokeRect(speakerBR.x - 8, speakerBR.y + 6, 16, 2);
        
        ctx.setLineDash([]);
        
        // Draw speaker separation lines and labels
        ctx.strokeStyle = '#666';
        ctx.lineWidth = 1;
        ctx.fillStyle = '#666';
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
        const listenerToSetADistance = Math.sqrt(
            Math.pow(this.floorPlan.speakersA.left.x - this.floorPlan.listener.x, 2) + 
            Math.pow(this.floorPlan.speakersA.left.y - this.floorPlan.listener.y, 2)
        );
        
        const listenerToSetBDistance = Math.sqrt(
            Math.pow(this.floorPlan.speakersB.left.x - this.floorPlan.listener.x, 2) + 
            Math.pow(this.floorPlan.speakersB.left.y - this.floorPlan.listener.y, 2)
        );
        
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
        
        // Draw horizontal measurement lines for listener (X-axis distances)
        const listenerHorizontalDistance = {
            toSetA: Math.abs(this.floorPlan.listener.x - (this.floorPlan.speakersA.left.x + this.floorPlan.speakersA.right.x) / 2),
            toSetB: Math.abs(this.floorPlan.listener.x - (this.floorPlan.speakersB.left.x + this.floorPlan.speakersB.right.x) / 2)
        };
        
        // Draw horizontal line from listener to Set A (if there's horizontal separation)
        if (listenerHorizontalDistance.toSetA > 0.05) {
            const setACenterX = toPixels((this.floorPlan.speakersA.left.x + this.floorPlan.speakersA.right.x) / 2, this.floorPlan.speakersA.left.y).x;
            const listenerToSetAY = listener.y - 40; // Above listener
            
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            
            // Horizontal line from listener X to Set A center X
            ctx.beginPath();
            ctx.moveTo(listener.x, listenerToSetAY);
            ctx.lineTo(setACenterX, listenerToSetAY);
            ctx.stroke();
            
            // End markers
            ctx.beginPath();
            ctx.moveTo(listener.x, listenerToSetAY - 3);
            ctx.lineTo(listener.x, listenerToSetAY + 3);
            ctx.moveTo(setACenterX, listenerToSetAY - 3);
            ctx.lineTo(setACenterX, listenerToSetAY + 3);
            ctx.stroke();
            
            // Label
            const midX = (listener.x + setACenterX) / 2;
            ctx.fillStyle = '#888';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${listenerHorizontalDistance.toSetA.toFixed(2)}m`, midX, listenerToSetAY - 8);
        }
        
        // Draw horizontal line from listener to Set B (if there's horizontal separation)
        if (listenerHorizontalDistance.toSetB > 0.05) {
            const setBCenterX = toPixels((this.floorPlan.speakersB.left.x + this.floorPlan.speakersB.right.x) / 2, this.floorPlan.speakersB.left.y).x;
            const listenerToSetBY = listener.y + 40; // Below listener
            
            ctx.strokeStyle = '#888';
            ctx.lineWidth = 1;
            
            // Horizontal line from listener X to Set B center X
            ctx.beginPath();
            ctx.moveTo(listener.x, listenerToSetBY);
            ctx.lineTo(setBCenterX, listenerToSetBY);
            ctx.stroke();
            
            // End markers
            ctx.beginPath();
            ctx.moveTo(listener.x, listenerToSetBY - 3);
            ctx.lineTo(listener.x, listenerToSetBY + 3);
            ctx.moveTo(setBCenterX, listenerToSetBY - 3);
            ctx.lineTo(setBCenterX, listenerToSetBY + 3);
            ctx.stroke();
            
            // Label
            const midX = (listener.x + setBCenterX) / 2;
            ctx.fillStyle = '#888';
            ctx.font = '11px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(`${listenerHorizontalDistance.toSetB.toFixed(2)}m`, midX, listenerToSetBY + 15);
        }
        
        // Draw distance measurements
        ctx.fillStyle = '#333';
        ctx.font = '12px monospace';
        ctx.textAlign = 'center';
        
        // Distance from Set A to listener
        const distanceA = Math.sqrt(
            Math.pow(this.floorPlan.speakersA.left.x - this.floorPlan.listener.x, 2) + 
            Math.pow(this.floorPlan.speakersA.left.y - this.floorPlan.listener.y, 2)
        );
        
        // Distance from Set B to listener  
        const distanceB = Math.sqrt(
            Math.pow(this.floorPlan.speakersB.left.x - this.floorPlan.listener.x, 2) + 
            Math.pow(this.floorPlan.speakersB.left.y - this.floorPlan.listener.y, 2)
        );
        
        // Distance difference
        const distanceDiff = Math.abs(distanceA - distanceB);
        
        // Labels
        ctx.fillText('Listener', listener.x, listener.y + 25);
        ctx.fillText('Set A (Front)', (speakerAL.x + speakerAR.x) / 2, speakerAL.y - 15);
        ctx.fillText('Set B (Back)', (speakerBL.x + speakerBR.x) / 2, speakerBL.y + 25);
        
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

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.combFilterTool = new CombFilterTool();
    window.combFilterTool.init();
});

// Handle page unload
window.addEventListener('beforeunload', () => {
    if (window.combFilterTool) {
        window.combFilterTool.destroy();
    }
});