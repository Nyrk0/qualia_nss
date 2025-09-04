/**
 * @fileoverview Auto Dynamic Range Experiment using AGC principles
 * Separate experiment for automatic dynamic range detection based on real-time
 * microphone input analysis using Web Audio API AGC techniques.
 * 
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 * @date 2025-09-04
 */

'use strict';

/**
 * AutoDynamicRangeExperiment - Experimental AGC-based dynamic range detection
 * 
 * This class implements automatic gain control principles to intelligently
 * adjust spectrogram dynamic range based on real-time audio analysis.
 */
class AutoDynamicRangeExperiment {
    constructor() {
        // AGC Parameters (based on your specifications)
        this.TARGET_DBFS = -12.0;      // Target output level (leaves headroom)
        this.MAX_GAIN_DB = 24.0;       // Maximum boost to avoid amplifying noise
        this.NOISE_FLOOR_DB = -65.0;   // Quiet room noise floor threshold
        this.ATTACK_TIME = 0.01;       // Fast response to peaks (10ms)
        this.RELEASE_TIME = 0.5;       // Slower response for quiet signals (500ms)
        this.BUFFER_SIZE = 256;        // Low latency buffer
        
        // Dynamic range tracking
        this.currentGain = 1.0;
        this.peakHistory = [];         // Rolling window of peak levels
        this.historyDuration = 10;     // Keep 10 seconds of history
        this.updateInterval = 1000;    // Update range every 1 second
        this.lastUpdate = 0;
        
        // Spectrogram integration
        this.spectrogramAnalyserView = null;
        this.enabled = false;
        
        // Audio context (will be shared with spectrogram)
        this.audioContext = null;
        this.processor = null;
        this.analyser = null;
        
        console.log('🧪 AutoDynamicRangeExperiment initialized');
    }
    
    /**
     * Initialize the experiment with spectrogram integration
     * @param {AnalyserView} spectrogramAnalyserView - Reference to spectrogram analyser
     * @param {AudioContext} audioContext - Shared audio context
     * @param {AnalyserNode} analyser - Shared analyser node
     */
    init(spectrogramAnalyserView, audioContext, analyser) {
        this.spectrogramAnalyserView = spectrogramAnalyserView;
        this.audioContext = audioContext;
        this.analyser = analyser;
        
        console.log('🔗 AutoDynamicRangeExperiment connected to spectrogram');
    }
    
    /**
     * Start the auto dynamic range experiment
     */
    start() {
        if (!this.audioContext || !this.analyser) {
            console.warn('AutoDynamicRangeExperiment: Audio context not initialized');
            return;
        }
        
        this.enabled = true;
        this.peakHistory = [];
        this.currentGain = 1.0;
        this.lastUpdate = Date.now();
        
        // Set initial sensible range as suggested
        this.updateSpectrogramRange(-80, -10);
        
        // Start processing loop
        this.processAudio();
        
        console.log('🎯 AutoDynamicRangeExperiment started with defaults: -80 to -10 dBFS');
    }
    
    /**
     * Stop the experiment
     */
    stop() {
        this.enabled = false;
        this.peakHistory = [];
        console.log('⏹️ AutoDynamicRangeExperiment stopped');
    }
    
    /**
     * Main audio processing loop
     */
    processAudio() {
        if (!this.enabled) return;
        
        // Get frequency data from shared analyser
        const bufferLength = this.analyser.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyser.getByteFrequencyData(dataArray);
        
        // Calculate peak level in dBFS
        let peak = 0;
        for (let i = 0; i < dataArray.length; i++) {
            const normalized = dataArray[i] / 255.0;
            peak = Math.max(peak, normalized);
        }
        
        // Convert to dBFS (-100 to 0)
        const peakDbFs = peak > 0 ? -100.0 + (peak * 100.0) : -100.0;
        
        // Store peak in history
        this.peakHistory.push({
            timestamp: Date.now(),
            peakDb: peakDbFs
        });
        
        // Clean old history (keep only recent data)
        const cutoff = Date.now() - (this.historyDuration * 1000);
        this.peakHistory = this.peakHistory.filter(entry => entry.timestamp > cutoff);
        
        // Update dynamic range if enough time has passed
        const now = Date.now();
        if (now - this.lastUpdate >= this.updateInterval) {
            this.updateDynamicRange();
            this.lastUpdate = now;
        }
        
        // Continue processing
        requestAnimationFrame(() => this.processAudio());
    }
    
    /**
     * AGC-inspired dynamic range calculation
     */
    updateDynamicRange() {
        if (this.peakHistory.length < 10) return; // Need enough samples
        
        // Extract dB values and sort
        const dbValues = this.peakHistory.map(entry => entry.peakDb);
        const sortedDb = dbValues.sort((a, b) => a - b);
        const total = sortedDb.length;
        
        // Calculate percentiles (more conservative than AGC)
        const noiseFloor = sortedDb[Math.floor(total * 0.1)];  // 10th percentile
        const averageLevel = sortedDb[Math.floor(total * 0.5)]; // 50th percentile (median)
        const peakLevel = sortedDb[Math.floor(total * 0.9)];   // 90th percentile
        
        // AGC-inspired gain calculation
        let targetMin = noiseFloor;
        let targetMax = peakLevel;
        
        // Apply AGC principles:
        // 1. If signal is consistently below noise floor, expand down
        if (averageLevel < this.NOISE_FLOOR_DB) {
            targetMin = Math.max(noiseFloor - 10, -100); // Expand to see quiet signals
        } else {
            targetMin = Math.max(noiseFloor - 5, -85);   // Stay above typical noise
        }
        
        // 2. If signal peaks are low, boost the top range
        if (peakLevel < this.TARGET_DBFS) {
            const boost = Math.min(this.MAX_GAIN_DB, this.TARGET_DBFS - peakLevel);
            targetMax = Math.min(peakLevel + boost, -5);
        } else {
            targetMax = Math.min(peakLevel + 3, -5); // Small headroom
        }
        
        // 3. Ensure reasonable range (AGC typically maintains 30-50dB dynamic range)
        const range = targetMax - targetMin;
        if (range < 30) {
            const center = (targetMin + targetMax) / 2;
            targetMin = center - 15;
            targetMax = center + 15;
        } else if (range > 70) {
            // Contract excessive range
            const center = (targetMin + targetMax) / 2;
            targetMin = center - 35;
            targetMax = center + 35;
        }
        
        // Apply bounds
        targetMin = Math.max(targetMin, -120);
        targetMax = Math.min(targetMax, -5);
        
        console.log(`🧪 AGC Analysis: Floor=${noiseFloor.toFixed(1)} Med=${averageLevel.toFixed(1)} Peak=${peakLevel.toFixed(1)} → Range=${targetMin.toFixed(1)} to ${targetMax.toFixed(1)} dBFS`);
        
        // Update spectrogram if change is significant
        if (this.spectrogramAnalyserView) {
            const currentMin = this.spectrogramAnalyserView.minDb;
            const currentMax = this.spectrogramAnalyserView.maxDb;
            
            if (Math.abs(targetMin - currentMin) > 3 || Math.abs(targetMax - currentMax) > 3) {
                this.updateSpectrogramRange(targetMin, targetMax);
                console.log(`📈 Dynamic range updated: ${targetMin.toFixed(1)} to ${targetMax.toFixed(1)} dBFS`);
            }
        }
    }
    
    /**
     * Update spectrogram dynamic range
     * @param {number} minDb - Minimum dBFS
     * @param {number} maxDb - Maximum dBFS
     */
    updateSpectrogramRange(minDb, maxDb) {
        if (!this.spectrogramAnalyserView) return;
        
        // Update spectrogram internal values
        this.spectrogramAnalyserView.setDbRange(minDb, maxDb);
        
        // Update UI sliders
        const minDbSlider = document.getElementById('spectro-min-db');
        const maxDbSlider = document.getElementById('spectro-max-db');
        const minValue = document.getElementById('range-min-value');
        const maxValue = document.getElementById('range-max-value');
        
        if (minDbSlider) minDbSlider.value = minDb;
        if (maxDbSlider) maxDbSlider.value = maxDb;
        if (minValue) minValue.textContent = Math.round(minDb);
        if (maxValue) maxValue.textContent = Math.round(maxDb);
    }
    
    /**
     * Get current experiment status
     * @returns {Object} Status information
     */
    getStatus() {
        return {
            enabled: this.enabled,
            peakHistoryCount: this.peakHistory.length,
            currentGain: this.currentGain,
            lastUpdate: this.lastUpdate
        };
    }
}

// Export for use in main spectrogram code
if (typeof window !== 'undefined') {
    window.AutoDynamicRangeExperiment = AutoDynamicRangeExperiment;
    console.log('✅ AutoDynamicRangeExperiment added to window object');
}

// Note: ES6 exports removed to avoid syntax errors when loaded as regular script
// For ES6 module usage, uncomment: export { AutoDynamicRangeExperiment };