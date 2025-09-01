/**
 * Audio Engine for Comb-Filter Analysis Tool
 * Handles Web Audio API operations, comb filtering, and signal generation
 * Part of Qualia-NSS Standalone Modules
 */

class CombFilterAudioEngine {
    constructor() {
        // Audio Context
        this.audioContext = null;
        this.isInitialized = false;
        this.sampleRate = 44100;
        
        // Signal Generation
        this.signalGenerators = new Map();
        this.currentSignalType = 'white-noise';
        this.masterGain = null;
        
        // Comb Filter Components
        this.combFilter = {
            input: null,
            delayNode: null,
            feedbackGain: null,
            dryGain: null,
            wetGain: null,
            output: null
        };
        
        // Analysis Nodes
        this.analyzers = {
            input: null,       // Pre-processing
            dry: null,         // Direct signal
            wet: null,         // Processed signal
            microphone: null,  // Microphone input
            reference: null,   // Raw reference signals (Phase 2B)
            calibrated: null   // Calibration-corrected measurement (Phase 4)
        };
        
        // Microphone
        this.microphoneStream = null;
        this.microphoneSource = null;
        this.microphoneGain = null;
        
        // Parameters (simplified for listener-only educational use)
        this.parameters = {
            delayTime: 0.005,      // 5ms default (legacy - now handled by multi-speaker system)
            masterVolume: 0.3,     // Safe volume level
            microphoneGain: 1.0    // Mic gain
        };
        
        // Phase 4: Audio Input Management
        this.audioInputManager = {
            availableInputs: [],
            activeInput: null,
            inputTypes: ['internal', 'external', 'lineIn', 'usbInterface'],
            calibrationData: new Map(),
            isCalibrated: false
        };
        
        // Custom tone state
        this.customTone = {
            oscillator: null,
            gain: null,
            frequency: 440,        // Default 440 Hz (A4)
            active: false          // Tone on/off state
        };
        
        // State
        this.isPlaying = false;
        this.isMicrophoneActive = false;
        
        // Speaker bus (per-speaker delayed copies)
        this.speakerBus = {
            input: null,
            output: null,
            nodes: {}, // keys: A_left, A_right, B_left, B_right
            setEnabled: { A: false, B: false }, // Initialize with default values
            delaysSec: { // Initialize with default values
                A_left: 0,
                A_right: 0,
                B_left: 0,
                B_right: 0
            }
        };
        
        // Callbacks
        this.onParameterChange = null;
        this.onStatusChange = null;
        this.onError = null;
    }
    
    /**
     * Initialize the audio system
     */
    async initialize() {
        try {
            console.log('🎵 Initializing Audio Engine...');
            
            // Create audio context
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)({
                sampleRate: this.sampleRate,
                latencyHint: 'interactive'
            });
            
            // Wait for context to start
            if (this.audioContext.state === 'suspended') {
                await this.audioContext.resume();
            }
            
            this.sampleRate = this.audioContext.sampleRate;
            
            // Create master gain
            this.masterGain = this.audioContext.createGain();
            this.masterGain.gain.value = this.parameters.masterVolume;
            this.masterGain.connect(this.audioContext.destination);
            
            // Initialize comb filter chain
            this.initializeCombFilter();
            
            // Initialize analyzers
            this.initializeAnalyzers();
            
            // Initialize signal generators
            this.initializeSignalGenerators();
            
            // Initialize multi-speaker delay bus
            this.initializeSpeakerBus();
            
            this.isInitialized = true;
            console.log('✅ Audio Engine initialized successfully');
            console.log(`Sample Rate: ${this.sampleRate} Hz`);
            
            this.notifyStatusChange('initialized');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to initialize audio engine:', error);
            this.notifyError('Failed to initialize audio system: ' + error.message);
            return false;
        }
    }
    
    /**
     * Initialize the comb filter audio graph
     */
    initializeCombFilter() {
        // Create nodes
        this.combFilter.input = this.audioContext.createGain();
        this.combFilter.delayNode = this.audioContext.createDelay(0.1); // Max 100ms delay
        this.combFilter.feedbackGain = this.audioContext.createGain();
        this.combFilter.dryGain = this.audioContext.createGain();
        this.combFilter.wetGain = this.audioContext.createGain();
        this.combFilter.output = this.audioContext.createGain();
        
        // Set initial values
        this.combFilter.delayNode.delayTime.value = this.parameters.delayTime;
        // Force feedback to 0 in standalone tool
        this.combFilter.feedbackGain.gain.value = 0;
        this.updateMixParameters();
        
        // Connect the graph
        // Input splits to dry and delay paths
        this.combFilter.input.connect(this.combFilter.dryGain);
        this.combFilter.input.connect(this.combFilter.delayNode);
        
        // Delay path (no feedback in standalone tool)
        this.combFilter.delayNode.connect(this.combFilter.wetGain);
        // Feedback loop intentionally disabled
        
        // Mix dry and wet to output
        this.combFilter.dryGain.connect(this.combFilter.output);
        this.combFilter.wetGain.connect(this.combFilter.output);
        
        // Connect to master (downstream of speaker bus)
        this.combFilter.output.connect(this.masterGain);
        
        console.log('🔗 Comb filter chain initialized');
    }
    
    /**
     * Initialize analyzer nodes for visualization
     */
    initializeAnalyzers() {
        const analyzerConfig = {
            fftSize: 8192,
            smoothingTimeConstant: 0.3
        };
        
        // Input analyzer (pre-processing)
        this.analyzers.input = this.audioContext.createAnalyser();
        Object.assign(this.analyzers.input, analyzerConfig);
        
        // Dry signal analyzer
        this.analyzers.dry = this.audioContext.createAnalyser();
        Object.assign(this.analyzers.dry, analyzerConfig);
        
        // Wet signal analyzer (post-processing)
        this.analyzers.wet = this.audioContext.createAnalyser();
        Object.assign(this.analyzers.wet, analyzerConfig);
        
        // Microphone analyzer
        this.analyzers.microphone = this.audioContext.createAnalyser();
        Object.assign(this.analyzers.microphone, analyzerConfig);
        
        // Reference signal analyzer (raw reference signals, pre-processing)
        this.analyzers.reference = this.audioContext.createAnalyser();
        Object.assign(this.analyzers.reference, analyzerConfig);
        
        // Phase 4: Calibrated microphone analyzer for real-world measurement
        this.analyzers.calibrated = this.audioContext.createAnalyser();
        Object.assign(this.analyzers.calibrated, analyzerConfig);
        
        // Connect analyzers to appropriate points
        this.combFilter.input.connect(this.analyzers.input);
        this.combFilter.dryGain.connect(this.analyzers.dry);
        this.combFilter.output.connect(this.analyzers.wet);
        
        console.log('📊 Analysis nodes initialized');
    }

    /**
     * Initialize multi-speaker delay/mix bus
     * Graph: source -> speakerBus.input -> [per speaker gains]->Delay->Gain -> speakerBus.output -> combFilter.input
     */
    initializeSpeakerBus() {
        this.speakerBus.input = this.audioContext.createGain();
        this.speakerBus.output = this.audioContext.createGain();

        const mkSpeakerChain = () => {
            const preGain = this.audioContext.createGain();
            const delay = this.audioContext.createDelay(2.0); // up to ~2s (~686m)
            const gain = this.audioContext.createGain();
            // defaults
            preGain.gain.value = 1.0;
            delay.delayTime.value = 0.0;
            gain.gain.value = 1.0;
            // connect
            preGain.connect(delay);
            delay.connect(gain);
            gain.connect(this.speakerBus.output);
            return { preGain, delay, gain };
        };

        // Build chains
        this.speakerBus.nodes.A_left = mkSpeakerChain();
        this.speakerBus.nodes.A_right = mkSpeakerChain();
        this.speakerBus.nodes.B_left = mkSpeakerChain();
        this.speakerBus.nodes.B_right = mkSpeakerChain();

        // Split input to all speakers
        this.speakerBus.input.connect(this.speakerBus.nodes.A_left.preGain);
        this.speakerBus.input.connect(this.speakerBus.nodes.A_right.preGain);
        this.speakerBus.input.connect(this.speakerBus.nodes.B_left.preGain);
        this.speakerBus.input.connect(this.speakerBus.nodes.B_right.preGain);

        // Speaker bus feeds comb filter input
        this.speakerBus.output.connect(this.combFilter.input);
        
        // Connect reference analyzer to raw input signals (pre-speaker processing)
        this.speakerBus.input.connect(this.analyzers.reference);

        // Apply initial enabled states
        this.applySetEnable('A', this.speakerBus.setEnabled.A);
        this.applySetEnable('B', this.speakerBus.setEnabled.B);

        console.log('🔀 Speaker delay bus initialized');
    }
    
    /**
     * Initialize signal generators
     */
    initializeSignalGenerators() {
        this.signalGenerators.clear();
        
        // Will be populated when signals are requested
        console.log('🎛️ Signal generators ready');
    }
    
    /**
     * Start microphone input
     */
    async startMicrophone() {
        try {
            console.log('🎤 Starting microphone...');
            
            if (!this.isInitialized) {
                throw new Error('Audio engine not initialized');
            }
            
            const stream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false,
                    sampleRate: this.sampleRate
                }
            });
            
            this.microphoneStream = stream;
            this.microphoneSource = this.audioContext.createMediaStreamSource(stream);
            this.microphoneGain = this.audioContext.createGain();
            this.microphoneGain.gain.value = this.parameters.microphoneGain;
            
            // Connect microphone to analyzer only (not to output to avoid feedback)
            this.microphoneSource.connect(this.microphoneGain);
            this.microphoneGain.connect(this.analyzers.microphone);
            
            this.isMicrophoneActive = true;
            console.log('✅ Microphone started successfully');
            
            this.notifyStatusChange('microphone-started');
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start microphone:', error);
            this.notifyError('Microphone access denied: ' + error.message);
            return false;
        }
    }
    
    /**
     * Stop microphone input
     */
    stopMicrophone() {
        try {
            if (this.microphoneStream) {
                this.microphoneStream.getTracks().forEach(track => track.stop());
                this.microphoneStream = null;
            }
            
            if (this.microphoneSource) {
                this.microphoneSource.disconnect();
                this.microphoneSource = null;
            }
            
            if (this.microphoneGain) {
                this.microphoneGain.disconnect();
                this.microphoneGain = null;
            }
            
            this.isMicrophoneActive = false;
            console.log('🎤 Microphone stopped');
            
            this.notifyStatusChange('microphone-stopped');
            
        } catch (error) {
            console.error('❌ Error stopping microphone:', error);
        }
    }
    
    /**
     * Generate signal source
     */
    createSignalSource(type) {
        switch (type) {
            case 'white-noise':
                return this.createWhiteNoise();
            case 'pink-noise':
                return this.createPinkNoise();
            case 'sine-sweep':
                return this.createSineSweep();
            case 'tone-burst':
                return this.createToneBurst();
            case 'custom-tone':
                return this.createCustomTone();
            case 'music':
                return this.createMusicSource();
            default:
                return this.createWhiteNoise();
        }
    }
    
    /**
     * Create white noise generator
     */
    createWhiteNoise() {
        const bufferSize = this.sampleRate * 2; // 2 seconds
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1; // Low amplitude
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        return source;
    }
    
    /**
     * Create pink noise generator
     */
    createPinkNoise() {
        const bufferSize = this.sampleRate * 2;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Pink noise generation using simple filtering
        let b0, b1, b2, b3, b4, b5, b6;
        b0 = b1 = b2 = b3 = b4 = b5 = b6 = 0.0;
        
        for (let i = 0; i < bufferSize; i++) {
            const white = Math.random() * 2 - 1;
            b0 = 0.99886 * b0 + white * 0.0555179;
            b1 = 0.99332 * b1 + white * 0.0750759;
            b2 = 0.96900 * b2 + white * 0.1538520;
            b3 = 0.86650 * b3 + white * 0.3104856;
            b4 = 0.55000 * b4 + white * 0.5329522;
            b5 = -0.7616 * b5 - white * 0.0168980;
            
            data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.05;
            b6 = white * 0.115926;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        return source;
    }
    
    /**
     * Create sine sweep generator
     */
    createSineSweep() {
        const duration = 10; // 10 second sweep
        const bufferSize = this.sampleRate * duration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.sampleRate);
        const data = buffer.getChannelData(0);
        
        const startFreq = 20;
        const endFreq = 20000;
        const logStart = Math.log(startFreq);
        const logEnd = Math.log(endFreq);
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.sampleRate;
            const progress = t / duration;
            const freq = Math.exp(logStart + progress * (logEnd - logStart));
            const phase = 2 * Math.PI * freq * t;
            data[i] = Math.sin(phase) * 0.1;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        return source;
    }
    
    /**
     * Create tone burst generator
     */
    createToneBurst() {
        const frequency = 1000; // 1kHz tone
        const burstDuration = 0.1; // 100ms bursts
        const silenceDuration = 0.4; // 400ms silence
        const totalDuration = burstDuration + silenceDuration;
        
        const bufferSize = this.sampleRate * totalDuration;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.sampleRate);
        const data = buffer.getChannelData(0);
        
        const burstSamples = this.sampleRate * burstDuration;
        
        for (let i = 0; i < bufferSize; i++) {
            if (i < burstSamples) {
                const t = i / this.sampleRate;
                const envelope = Math.sin(Math.PI * i / burstSamples); // Smooth envelope
                data[i] = Math.sin(2 * Math.PI * frequency * t) * envelope * 0.1;
            } else {
                data[i] = 0; // Silence
            }
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        return source;
    }
    
    /**
     * Create music source (placeholder)
     */
    createMusicSource() {
        // For now, return a complex tone
        const bufferSize = this.sampleRate * 4;
        const buffer = this.audioContext.createBuffer(1, bufferSize, this.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate a chord (C major)
        const frequencies = [261.63, 329.63, 392.00]; // C, E, G
        
        for (let i = 0; i < bufferSize; i++) {
            const t = i / this.sampleRate;
            let sample = 0;
            
            frequencies.forEach(freq => {
                sample += Math.sin(2 * Math.PI * freq * t) * 0.033;
            });
            
            data[i] = sample;
        }
        
        const source = this.audioContext.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        
        return source;
    }
    
    /**
     * Create custom tone oscillator
     */
    createCustomTone() {
        // Create oscillator and gain nodes
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        // Set up oscillator
        oscillator.type = 'sine';
        oscillator.frequency.setValueAtTime(this.customTone.frequency, this.audioContext.currentTime);
        
        // Set up gain (muted by default if inactive)
        gainNode.gain.setValueAtTime(this.customTone.active ? 0.1 : 0, this.audioContext.currentTime);
        
        // Connect nodes
        oscillator.connect(gainNode);
        
        // Store references for later control
        this.customTone.oscillator = oscillator;
        this.customTone.gain = gainNode;
        
        return gainNode; // Return the gain node as the "source"
    }
    
    /**
     * Update custom tone frequency
     */
    updateCustomToneFrequency(frequency) {
        this.customTone.frequency = frequency;
        if (this.customTone.oscillator) {
            this.customTone.oscillator.frequency.setValueAtTime(frequency, this.audioContext.currentTime);
        }
    }
    
    /**
     * Toggle custom tone on/off
     */
    toggleCustomTone(active) {
        this.customTone.active = active;
        if (this.customTone.gain) {
            this.customTone.gain.gain.setValueAtTime(active ? 0.1 : 0, this.audioContext.currentTime);
        }
    }
    
    /**
     * Start signal generation
     */
    async startSignal(signalType = null) {
        try {
            if (!this.isInitialized) {
                throw new Error('Audio engine not initialized');
            }
            
            // Stop current signal
            this.stopSignal();
            
            const type = signalType || this.currentSignalType;
            console.log(`🎵 Starting signal: ${type}`);
            
            // Create and start new source
            const source = this.createSignalSource(type);
            // Route through multi-speaker bus (splits to per-speaker delays)
            source.connect(this.speakerBus.input);
            
            // Handle custom tone differently (oscillator needs to be started)
            if (type === 'custom-tone') {
                this.customTone.oscillator.start();
            } else {
                source.start();
            }
            
            // Store reference
            this.signalGenerators.set('current', source);
            this.currentSignalType = type;
            this.isPlaying = true;
            
            console.log('✅ Signal started successfully');
            this.notifyStatusChange('signal-started');
            
            return true;
            
        } catch (error) {
            console.error('❌ Failed to start signal:', error);
            this.notifyError('Failed to start signal: ' + error.message);
            return false;
        }
    }
    
    /**
     * Stop signal generation
     */
    stopSignal() {
        try {
            const current = this.signalGenerators.get('current');
            if (current) {
                // Handle custom tone cleanup
                if (this.currentSignalType === 'custom-tone' && this.customTone.oscillator) {
                    try {
                        this.customTone.oscillator.stop();
                        this.customTone.oscillator.disconnect();
                    } catch (e) {
                        // Oscillator may have already been stopped
                    }
                    this.customTone.oscillator = null;
                    this.customTone.gain = null;
                } else {
                    try { current.stop(); } catch (e) {}
                }
                try { current.disconnect(); } catch (e) {}
                this.signalGenerators.delete('current');
            }
            
            this.isPlaying = false;
            console.log('🎵 Signal stopped');
            this.notifyStatusChange('signal-stopped');
            
        } catch (error) {
            console.error('❌ Error stopping signal:', error);
        }
    }
    
    /**
     * Update comb filter parameters
     */
    updateParameters(params) {
        if (!this.isInitialized) return;
        
        try {
            const now = this.audioContext.currentTime;
            const rampTime = 0.01; // 10ms ramp to avoid clicks
            
            if (params.delayTime !== undefined) {
                this.parameters.delayTime = Math.max(0.0005, Math.min(0.1, params.delayTime));
                this.combFilter.delayNode.delayTime.exponentialRampToValueAtTime(
                    this.parameters.delayTime, now + rampTime
                );
            }
            
            // Feedback parameter intentionally ignored in standalone tool
            if (params.feedback !== undefined) {
                this.parameters.feedback = 0;
                if (this.combFilter.feedbackGain) {
                    this.combFilter.feedbackGain.gain.setValueAtTime(0, now);
                }
            }
            
            // Mix parameter removed - fixed at 100% wet for listener-only scenario
            
            if (params.masterVolume !== undefined) {
                this.parameters.masterVolume = Math.max(0, Math.min(1, params.masterVolume));
                this.masterGain.gain.exponentialRampToValueAtTime(
                    Math.max(0.001, this.parameters.masterVolume), now + rampTime
                );
            }
            
            if (params.microphoneGain !== undefined && this.microphoneGain) {
                this.parameters.microphoneGain = Math.max(0, Math.min(10, params.microphoneGain));
                this.microphoneGain.gain.exponentialRampToValueAtTime(
                    Math.max(0.001, this.parameters.microphoneGain), now + rampTime
                );
            }
            
            this.notifyParameterChange();
            
        } catch (error) {
            console.error('❌ Error updating parameters:', error);
        }
    }
    
    /**
     * Update mix parameters for listener-only scenario
     * Force 100% wet (multi-speaker processed) signal for educational demo
     */
    updateMixParameters() {
        if (!this.combFilter.dryGain || !this.combFilter.wetGain) return;
        
        const now = this.audioContext.currentTime;
        const rampTime = 0.01;
        
        // Listener-only scenario: 100% processed signal from multi-speaker system
        // Dry = 0% (no direct signal bypass)
        // Wet = 100% (full multi-speaker phase interference simulation)
        this.combFilter.dryGain.gain.exponentialRampToValueAtTime(0.001, now + rampTime);
        this.combFilter.wetGain.gain.exponentialRampToValueAtTime(1.0, now + rampTime);
    }

    /**
     * Update per-speaker delays (seconds)
     * delays = { A_left, A_right, B_left, B_right }
     */
    setSpeakerDelays(delays) {
        // Save desired state
        this.speakerBus.delaysSec = {
            ...this.speakerBus.delaysSec,
            ...delays
        };
        if (!this.isInitialized || !this.speakerBus.nodes || !this.speakerBus.nodes.A_left) return;

        const now = this.audioContext.currentTime;
        const ramp = 0.01;
        const clamp = (v) => Math.max(0, Math.min(2.0, Number.isFinite(v) ? v : 0));

        const apply = (key) => {
            const node = this.speakerBus.nodes[key];
            if (!node) return;
            const d = clamp(this.speakerBus.delaysSec[key] || 0);
            node.delay.delayTime.linearRampToValueAtTime(d, now + ramp);
        };
        apply('A_left');
        apply('A_right');
        apply('B_left');
        apply('B_right');
    }

    /**
     * Enable/disable an entire set ('A' or 'B')
     */
    setSetEnabled(setName, enabled) {
        if (!['A','B'].includes(setName)) return;
        this.speakerBus.setEnabled[setName] = !!enabled;
        if (!this.isInitialized || !this.speakerBus.nodes || !this.speakerBus.nodes.A_left) return;
        this.applySetEnable(setName, !!enabled);
    }

    /**
     * Internal helper to ramp output gain per speaker for a set
     */
    applySetEnable(setName, enabled) {
        const keys = setName === 'A' ? ['A_left', 'A_right'] : ['B_left', 'B_right'];
        const now = this.audioContext.currentTime;
        const ramp = 0.01;
        keys.forEach(k => {
            const node = this.speakerBus.nodes[k];
            if (!node) return;
            node.gain.gain.exponentialRampToValueAtTime(
                Math.max(0.001, enabled ? 1.0 : 0.001), now + ramp
            );
        });
    }
    
    /**
     * Get analyzer data
     */
    getAnalyzerData(analyzerName) {
        const analyzer = this.analyzers[analyzerName];
        if (!analyzer) return null;
        
        const bufferLength = analyzer.frequencyBinCount;
        const dataArray = new Float32Array(bufferLength);
        
        // Get frequency data
        analyzer.getFloatFrequencyData(dataArray);
        
        // Get time data
        const timeData = new Float32Array(bufferLength);
        analyzer.getFloatTimeDomainData(timeData);
        
        return {
            frequency: dataArray,
            time: timeData,
            sampleRate: this.sampleRate,
            fftSize: analyzer.fftSize,
            bufferLength: bufferLength
        };
    }
    
    /**
     * Calculate frequency from delay time
     */
    calculateNotchFrequencies(delayTime, maxNotches = 10) {
        if (delayTime <= 0) return [];
        
        const notches = [];
        const firstNotch = 1 / (2 * delayTime);
        const spacing = 1 / delayTime;
        
        for (let n = 0; n < maxNotches; n++) {
            const frequency = firstNotch + n * spacing;
            if (frequency > this.sampleRate / 2) break; // Nyquist limit
            notches.push(frequency);
        }
        
        return notches;
    }
    
    /**
     * Get current audio status
     */
    getStatus() {
        return {
            isInitialized: this.isInitialized,
            isPlaying: this.isPlaying,
            isMicrophoneActive: this.isMicrophoneActive,
            currentSignalType: this.currentSignalType,
            sampleRate: this.sampleRate,
            parameters: { ...this.parameters }
        };
    }
    
    /**
     * Cleanup and dispose
     */
    dispose() {
        try {
            this.stopSignal();
            this.stopMicrophone();
            
            if (this.audioContext && this.audioContext.state !== 'closed') {
                this.audioContext.close();
            }
            
            this.isInitialized = false;
            console.log('🗑️ Audio Engine disposed');
            
        } catch (error) {
            console.error('❌ Error disposing audio engine:', error);
        }
    }
    
    /**
     * Get timing status for all speakers (for status bar display)
     * Returns array of speaker timing information
     */
    getTimingStatus() {
        return Object.entries(this.speakerBus.delaysSec).map(([speaker, delay]) => ({
            speaker: speaker.replace('_', '-'),
            distance: `${(delay * 343).toFixed(2)}m`,
            delay: `${(delay * 1000).toFixed(1)}ms`,
            enabled: this.isSpeakerEnabled(speaker)
        }));
    }
    
    /**
     * Check if individual speaker is enabled (helper for getTimingStatus)
     */
    isSpeakerEnabled(speakerKey) {
        if (speakerKey.startsWith('A_')) {
            return this.speakerBus.setEnabled.A;
        } else if (speakerKey.startsWith('B_')) {
            return this.speakerBus.setEnabled.B;
        }
        return false;
    }
    
    /**
     * Notification helpers
     */
    notifyStatusChange(status) {
        if (this.onStatusChange) {
            this.onStatusChange(status, this.getStatus());
        }
    }
    
    notifyParameterChange() {
        if (this.onParameterChange) {
            this.onParameterChange(this.parameters);
        }
    }
    
    notifyError(message) {
        if (this.onError) {
            this.onError(message);
        }
    }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombFilterAudioEngine;
} else {
    window.CombFilterAudioEngine = CombFilterAudioEngine;
}