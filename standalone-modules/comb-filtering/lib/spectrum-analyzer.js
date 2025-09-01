/**
 * Spectrum Analyzer for Comb-Filter Analysis Tool
 * Advanced FFT analysis and spectral processing
 * Part of Qualia-NSS Standalone Modules
 */

class SpectrumAnalyzer {
    constructor(options = {}) {
        this.options = {
            fftSize: options.fftSize || 8192,
            smoothingTimeConstant: options.smoothingTimeConstant || 0.3,
            windowFunction: options.windowFunction || 'hann',
            enablePeakHold: options.enablePeakHold || true,
            peakHoldTime: options.peakHoldTime || 2000, // ms
            enableAveraging: options.enableAveraging || true,
            averagingConstant: options.averagingConstant || 0.1,
            ...options
        };
        
        // Analysis data
        this.currentSpectrum = null;
        this.peakHoldSpectrum = null;
        this.averagedSpectrum = null;
        this.spectralHistory = [];
        this.maxHistoryLength = 100;
        
        // Peak hold timing
        this.peakHoldTimestamp = 0;
        this.peakHoldDecay = 0.99;
        
        // Frequency mapping
        this.frequencyBins = null;
        this.sampleRate = 44100;
        
        console.log('📊 Spectrum Analyzer initialized');
    }
    
    /**
     * Initialize with audio context
     */
    initialize(audioContext) {
        this.audioContext = audioContext;
        this.sampleRate = audioContext.sampleRate;
        this.setupFrequencyMapping();
        
        console.log(`📊 Spectrum Analyzer setup complete (${this.sampleRate} Hz)`);
    }
    
    /**
     * Setup frequency mapping for bins
     */
    setupFrequencyMapping() {
        const nyquist = this.sampleRate / 2;
        const binCount = this.options.fftSize / 2;
        
        this.frequencyBins = new Array(binCount);
        for (let i = 0; i < binCount; i++) {
            this.frequencyBins[i] = (i * nyquist) / binCount;
        }
    }
    
    /**
     * Analyze spectrum from analyzer node
     */
    analyze(analyzerNode, options = {}) {
        if (!analyzerNode) return null;
        
        const bufferLength = analyzerNode.frequencyBinCount;
        const frequencyData = new Float32Array(bufferLength);
        const timeData = new Float32Array(bufferLength);
        
        // Get FFT data
        analyzerNode.getFloatFrequencyData(frequencyData);
        analyzerNode.getFloatTimeDomainData(timeData);
        
        // Process the data
        this.currentSpectrum = this.processSpectrum(frequencyData);
        
        // Update peak hold
        if (this.options.enablePeakHold) {
            this.updatePeakHold();
        }
        
        // Update averaging
        if (this.options.enableAveraging) {
            this.updateAveraging();
        }
        
        // Store in history
        this.updateHistory();
        
        return {
            frequency: this.currentSpectrum,
            time: timeData,
            peaks: this.peakHoldSpectrum,
            averaged: this.averagedSpectrum,
            sampleRate: this.sampleRate,
            fftSize: this.options.fftSize,
            frequencyBins: this.frequencyBins
        };
    }
    
    /**
     * Process raw FFT data
     */
    processSpectrum(rawData) {
        let processed = new Float32Array(rawData);
        
        // Apply windowing if specified
        if (this.options.windowFunction !== 'none') {
            processed = AudioUtils.applyWindow(processed, this.options.windowFunction);
        }
        
        // Apply smoothing
        if (this.options.smoothingTimeConstant > 0) {
            processed = AudioUtils.smoothData(processed, 
                Math.ceil(this.options.smoothingTimeConstant * 10));
        }
        
        return processed;
    }
    
    /**
     * Update peak hold spectrum
     */
    updatePeakHold() {
        const now = Date.now();
        
        if (!this.peakHoldSpectrum || this.peakHoldSpectrum.length !== this.currentSpectrum.length) {
            this.peakHoldSpectrum = new Float32Array(this.currentSpectrum);
            this.peakHoldTimestamp = now;
            return;
        }
        
        // Update peaks
        let hasNewPeak = false;
        for (let i = 0; i < this.currentSpectrum.length; i++) {
            if (this.currentSpectrum[i] > this.peakHoldSpectrum[i]) {
                this.peakHoldSpectrum[i] = this.currentSpectrum[i];
                hasNewPeak = true;
            }
        }
        
        if (hasNewPeak) {
            this.peakHoldTimestamp = now;
        }
        
        // Apply decay if peak hold time exceeded
        if (now - this.peakHoldTimestamp > this.options.peakHoldTime) {
            for (let i = 0; i < this.peakHoldSpectrum.length; i++) {
                this.peakHoldSpectrum[i] *= this.peakHoldDecay;
            }
        }
    }
    
    /**
     * Update averaged spectrum
     */
    updateAveraging() {
        if (!this.averagedSpectrum || this.averagedSpectrum.length !== this.currentSpectrum.length) {
            this.averagedSpectrum = new Float32Array(this.currentSpectrum);
            return;
        }
        
        const alpha = this.options.averagingConstant;
        for (let i = 0; i < this.currentSpectrum.length; i++) {
            this.averagedSpectrum[i] = alpha * this.currentSpectrum[i] + 
                                     (1 - alpha) * this.averagedSpectrum[i];
        }
    }
    
    /**
     * Update spectral history
     */
    updateHistory() {
        this.spectralHistory.push({
            timestamp: Date.now(),
            spectrum: new Float32Array(this.currentSpectrum)
        });
        
        // Limit history size
        if (this.spectralHistory.length > this.maxHistoryLength) {
            this.spectralHistory.shift();
        }
    }
    
    /**
     * Find spectral peaks
     */
    findPeaks(threshold = -60, minDistance = 5) {
        if (!this.currentSpectrum) return [];
        
        const peaks = AudioUtils.findPeaks(this.currentSpectrum, threshold, minDistance);
        
        // Add frequency information
        peaks.forEach(peak => {
            peak.frequency = this.frequencyBins[peak.index];
        });
        
        return peaks;
    }
    
    /**
     * Find spectral notches
     */
    findNotches(threshold = -80, minDistance = 5) {
        if (!this.currentSpectrum) return [];
        
        const notches = AudioUtils.findNotches(this.currentSpectrum, threshold, minDistance);
        
        // Add frequency information
        notches.forEach(notch => {
            notch.frequency = this.frequencyBins[notch.index];
        });
        
        return notches;
    }
    
    /**
     * Detect comb filtering patterns
     */
    detectCombFiltering(expectedDelay = null) {
        const peaks = this.findPeaks(-50, 10);
        const notches = this.findNotches(-70, 10);
        
        if (notches.length < 3) {
            return { detected: false, confidence: 0 };
        }
        
        // Calculate spacing between notches
        const spacings = [];
        for (let i = 1; i < notches.length; i++) {
            spacings.push(notches[i].frequency - notches[i-1].frequency);
        }
        
        // Check if spacings are consistent (within 10% tolerance)
        const avgSpacing = spacings.reduce((a, b) => a + b, 0) / spacings.length;
        const tolerance = avgSpacing * 0.1;
        
        let consistentSpacings = 0;
        spacings.forEach(spacing => {
            if (Math.abs(spacing - avgSpacing) < tolerance) {
                consistentSpacings++;
            }
        });
        
        const consistency = consistentSpacings / spacings.length;
        
        // Calculate estimated delay from spacing
        const estimatedDelay = avgSpacing > 0 ? 1 / avgSpacing : 0;
        
        // If expected delay is provided, check how close we are
        let delayMatch = 1;
        if (expectedDelay && expectedDelay > 0) {
            const expectedSpacing = 1 / expectedDelay;
            delayMatch = 1 - Math.abs(avgSpacing - expectedSpacing) / expectedSpacing;
            delayMatch = Math.max(0, Math.min(1, delayMatch));
        }
        
        const confidence = consistency * delayMatch * 
                          Math.min(1, notches.length / 5); // More notches = higher confidence
        
        return {
            detected: confidence > 0.6,
            confidence: confidence,
            estimatedDelay: estimatedDelay,
            notchSpacing: avgSpacing,
            notchCount: notches.length,
            peakCount: peaks.length,
            consistency: consistency
        };
    }
    
    /**
     * Calculate spectral centroid
     */
    calculateSpectralCentroid() {
        if (!this.currentSpectrum) return 0;
        
        let numerator = 0;
        let denominator = 0;
        
        for (let i = 0; i < this.currentSpectrum.length; i++) {
            const magnitude = AudioUtils.dbToLinear(this.currentSpectrum[i]);
            const frequency = this.frequencyBins[i];
            
            numerator += frequency * magnitude;
            denominator += magnitude;
        }
        
        return denominator > 0 ? numerator / denominator : 0;
    }
    
    /**
     * Calculate spectral rolloff
     */
    calculateSpectralRolloff(threshold = 0.85) {
        if (!this.currentSpectrum) return 0;
        
        // Convert to linear magnitudes
        const magnitudes = this.currentSpectrum.map(db => AudioUtils.dbToLinear(db));
        
        // Calculate total energy
        const totalEnergy = magnitudes.reduce((sum, mag) => sum + mag * mag, 0);
        const thresholdEnergy = totalEnergy * threshold;
        
        // Find rolloff frequency
        let cumulativeEnergy = 0;
        for (let i = 0; i < magnitudes.length; i++) {
            cumulativeEnergy += magnitudes[i] * magnitudes[i];
            if (cumulativeEnergy >= thresholdEnergy) {
                return this.frequencyBins[i];
            }
        }
        
        return this.frequencyBins[this.frequencyBins.length - 1];
    }
    
    /**
     * Calculate spectral flatness (Wiener entropy)
     */
    calculateSpectralFlatness() {
        if (!this.currentSpectrum) return 0;
        
        // Convert to linear magnitudes
        const magnitudes = this.currentSpectrum.map(db => AudioUtils.dbToLinear(db));
        
        // Calculate geometric and arithmetic means
        let geometricMean = 1;
        let arithmeticMean = 0;
        let validBins = 0;
        
        for (let i = 1; i < magnitudes.length; i++) { // Skip DC bin
            if (magnitudes[i] > 1e-10) {
                geometricMean *= Math.pow(magnitudes[i], 1 / (magnitudes.length - 1));
                arithmeticMean += magnitudes[i];
                validBins++;
            }
        }
        
        arithmeticMean /= validBins;
        
        return validBins > 0 ? geometricMean / arithmeticMean : 0;
    }
    
    /**
     * Get octave band analysis
     */
    getOctaveBands(bandsPerOctave = 3) {
        if (!this.currentSpectrum) return null;
        
        return AudioUtils.calculateOctaveBands(
            this.currentSpectrum, 
            this.sampleRate, 
            this.options.fftSize, 
            bandsPerOctave
        );
    }
    
    /**
     * Compare two spectra
     */
    compareSpectra(spectrumA, spectrumB) {
        if (!spectrumA || !spectrumB || spectrumA.length !== spectrumB.length) {
            return null;
        }
        
        const difference = new Float32Array(spectrumA.length);
        let mse = 0; // Mean squared error
        let correlation = 0;
        
        // Calculate difference and MSE
        for (let i = 0; i < spectrumA.length; i++) {
            difference[i] = spectrumA[i] - spectrumB[i];
            mse += difference[i] * difference[i];
        }
        mse /= spectrumA.length;
        
        // Calculate correlation coefficient
        const meanA = spectrumA.reduce((a, b) => a + b, 0) / spectrumA.length;
        const meanB = spectrumB.reduce((a, b) => a + b, 0) / spectrumB.length;
        
        let numerator = 0;
        let denomA = 0;
        let denomB = 0;
        
        for (let i = 0; i < spectrumA.length; i++) {
            const devA = spectrumA[i] - meanA;
            const devB = spectrumB[i] - meanB;
            
            numerator += devA * devB;
            denomA += devA * devA;
            denomB += devB * devB;
        }
        
        const denominator = Math.sqrt(denomA * denomB);
        correlation = denominator > 0 ? numerator / denominator : 0;
        
        return {
            difference: difference,
            mse: mse,
            correlation: correlation,
            similarity: Math.max(0, correlation) // 0 to 1 scale
        };
    }
    
    /**
     * Get frequency response in logarithmic scale
     */
    getLogFrequencyResponse(minFreq = 20, maxFreq = 20000, points = 500) {
        if (!this.currentSpectrum) return null;
        
        return {
            frequencies: AudioUtils.generateLogFrequencyScale(minFreq, maxFreq, points),
            magnitudes: AudioUtils.interpolateToLogScale(
                this.currentSpectrum, 
                this.sampleRate, 
                this.options.fftSize, 
                minFreq, 
                maxFreq
            )
        };
    }
    
    /**
     * Export analysis data
     */
    exportData(format = 'json') {
        const data = {
            timestamp: new Date().toISOString(),
            sampleRate: this.sampleRate,
            fftSize: this.options.fftSize,
            frequencyBins: Array.from(this.frequencyBins),
            currentSpectrum: Array.from(this.currentSpectrum || []),
            peakSpectrum: Array.from(this.peakHoldSpectrum || []),
            averagedSpectrum: Array.from(this.averagedSpectrum || []),
            spectralFeatures: {
                centroid: this.calculateSpectralCentroid(),
                rolloff: this.calculateSpectralRolloff(),
                flatness: this.calculateSpectralFlatness()
            },
            peaks: this.findPeaks(),
            notches: this.findNotches(),
            combFiltering: this.detectCombFiltering()
        };
        
        if (format === 'csv') {
            return this.convertToCSV(data);
        }
        
        return data;
    }
    
    /**
     * Convert data to CSV format
     */
    convertToCSV(data) {
        const lines = ['Frequency (Hz),Magnitude (dB),Peak Hold (dB),Averaged (dB)'];
        
        for (let i = 0; i < data.frequencyBins.length; i++) {
            const freq = data.frequencyBins[i].toFixed(2);
            const mag = (data.currentSpectrum[i] || 0).toFixed(3);
            const peak = (data.peakSpectrum[i] || 0).toFixed(3);
            const avg = (data.averagedSpectrum[i] || 0).toFixed(3);
            
            lines.push(`${freq},${mag},${peak},${avg}`);
        }
        
        return lines.join('\n');
    }
    
    /**
     * Reset analysis state
     */
    reset() {
        this.currentSpectrum = null;
        this.peakHoldSpectrum = null;
        this.averagedSpectrum = null;
        this.spectralHistory = [];
        this.peakHoldTimestamp = 0;
        
        console.log('📊 Spectrum Analyzer reset');
    }
    
    /**
     * Get analysis statistics
     */
    getStatistics() {
        if (!this.currentSpectrum) return null;
        
        return {
            bufferLength: this.currentSpectrum.length,
            sampleRate: this.sampleRate,
            frequencyResolution: this.sampleRate / this.options.fftSize,
            nyquistFrequency: this.sampleRate / 2,
            historyLength: this.spectralHistory.length,
            peakHoldActive: this.peakHoldSpectrum !== null,
            averagingActive: this.averagedSpectrum !== null
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = SpectrumAnalyzer;
} else {
    window.SpectrumAnalyzer = SpectrumAnalyzer;
}