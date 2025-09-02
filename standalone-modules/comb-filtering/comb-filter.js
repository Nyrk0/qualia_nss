/**
 * Comb-Filtering Detection using Cepstrum Analysis
 * 
 * This module provides real-time detection of comb-filtering artifacts in audio signals.
 * Comb-filtering occurs when a signal is mixed with a delayed copy of itself, creating
 * a series of notches in the frequency spectrum at regular intervals.
 */

import { FFT } from './fft.js';

export class CombFilterDetector {
  /**
   * Create a new CombFilterDetector instance
   * @param {Object} options - Configuration options
   * @param {number} [options.sampleRate=44100] - Audio sample rate in Hz
   * @param {number} [options.fftSize=2048] - FFT size for analysis
   * @param {number} [options.minFreq=200] - Minimum frequency for analysis in Hz
   * @param {number} [options.maxFreq=8000] - Maximum frequency for analysis in Hz
   * @param {number} [options.minDelay=0.2] - Minimum delay to detect in ms
   * @param {number} [options.maxDelay=20] - Maximum delay to detect in ms
   * @param {number} [options.confidenceThreshold=8] - Minimum confidence threshold in dB
   */
  constructor({
    sampleRate = 44100,
    fftSize = 2048,
    minFreq = 200,
    maxFreq = 8000,
    minDelay = 0.2,
    maxDelay = 20,
    confidenceThreshold = 8
  } = {}) {
    this.sampleRate = sampleRate;
    this.fftSize = fftSize;
    this.minFreq = minFreq;
    this.maxFreq = maxFreq;
    this.minDelay = minDelay;
    this.maxDelay = maxDelay;
    this.confidenceThreshold = confidenceThreshold;
    
    // Initialize FFT for cepstrum analysis
    this.fft = null;
    this.history = [];
    this.updateFFTSize(fftSize);
  }

  /**
   * Update FFT size and reinitialize internal buffers
   * @param {number} fftSize - New FFT size (must be power of 2)
   */
  updateFFTSize(fftSize) {
    this.fftSize = fftSize;
    this.freqPerBin = this.sampleRate / fftSize;
    
    // Find analysis bin range
    this.minBin = Math.max(1, Math.floor(this.minFreq / this.freqPerBin));
    this.maxBin = Math.min(fftSize/2 - 1, Math.ceil(this.maxFreq / this.freqPerBin));
    this.numBins = this.maxBin - this.minBin + 1;
    
    // Initialize FFT for cepstrum analysis
    this.fft = new FFT(this.numBins);
    
    // Convert delay range to lag range
    this.minLag = Math.max(1, Math.floor(1 / (this.maxDelay * 0.001 * this.sampleRate / fftSize)));
    this.maxLag = Math.min(
      Math.floor(this.numBins/2), 
      Math.ceil(1 / (this.minDelay * 0.001 * this.sampleRate / fftSize))
    );
    
    // Reset history
    this.history = [];
  }

  /**
   * Detect comb-filtering in a magnitude spectrum
   * @param {Float32Array} magnitudeSpectrum - Magnitude spectrum in dB
   * @returns {Object|null} Detection result or null if no comb-filtering detected
   */
  detect(magnitudeSpectrum) {
    if (magnitudeSpectrum.length !== this.fftSize/2) {
      console.warn(`Expected ${this.fftSize/2} frequency bins, got ${magnitudeSpectrum.length}`);
      return null;
    }

    // Convert to linear magnitude and analyze
    const result = this._analyzeSpectrum(magnitudeSpectrum);
    
    // Update history and apply temporal smoothing
    return this._updateHistory(result);
  }

  /**
   * Analyze a single spectrum frame
   * @private
   */
  _analyzeSpectrum(magnitudeSpectrum) {
    // Extract frequency range of interest
    const magLin = new Float32Array(this.numBins);
    let sum = 0, sumFreq = 0, sumFreqSq = 0, sumMag = 0;
    
    // Convert to linear magnitude and calculate statistics
    for (let i = 0; i < this.numBins; i++) {
      const freq = (this.minBin + i) * this.freqPerBin;
      const mag = Math.pow(10, magnitudeSpectrum[this.minBin + i] / 20);
      magLin[i] = mag;
      sum += mag;
      sumFreq += freq * mag;
      sumFreqSq += freq * freq * mag;
      sumMag += mag * mag;
    }
    
    // Check signal level
    const rms = Math.sqrt(sumMag / this.numBins);
    if (rms < 1e-6) return null;
    
    // Simple detrending: remove linear trend
    const centerFreq = sumFreq / sum;
    const variance = Math.max(1, sumFreqSq / sum - centerFreq * centerFreq);
    
    for (let i = 0; i < this.numBins; i++) {
      const freq = (this.minBin + i) * this.freqPerBin;
      const trend = (freq - centerFreq) / variance * 0.1;
      magLin[i] = Math.max(0, magLin[i] - trend);
    }
    
    // Compute real cepstrum (IFFT of log-magnitude)
    const cepstrum = new Float32Array(this.numBins);
    
    // Log magnitude with epsilon to avoid -Inf
    for (let i = 0; i < this.numBins; i++) {
      cepstrum[i] = Math.log(magLin[i] + 1e-10);
    }
    
    // Perform FFT to get cepstrum
    this.fft.realTransform(cepstrum, null);
    
    // Find peak in cepstrum within delay range
    let maxVal = -Infinity;
    let maxIdx = -1;
    
    for (let i = this.minLag; i <= this.maxLag; i++) {
      if (cepstrum[i] > maxVal) {
        maxVal = cepstrum[i];
        maxIdx = i;
      }
    }
    
    // Estimate noise floor (median of cepstrum)
    const sorted = [...cepstrum].sort((a, b) => a - b);
    const noiseFloor = sorted[Math.floor(sorted.length * 0.5)];
    const peakHeight = maxVal - noiseFloor;
    
    // Check confidence
    if (peakHeight < this.confidenceThreshold || maxIdx === -1) {
      return null;
    }
    
    // Convert lag to delay (ms) and notch spacing (Hz)
    const tau = 1000 / (maxIdx * this.freqPerBin);
    const deltaF = 1000 / tau;
    
    // Calculate notch frequencies
    const notches = [];
    for (let f = deltaF; f < this.maxFreq; f += deltaF) {
      if (f >= this.minFreq) {
        notches.push(f);
      }
    }
    
    return {
      tau,
      deltaF,
      confidence: Math.min(1, peakHeight / 20), // Normalized 0-1
      notches,
      timestamp: Date.now()
    };
  }

  /**
   * Update detection history and apply temporal smoothing
   * @private
   */
  _updateHistory(detection) {
    const now = Date.now();
    
    // Add to history if we have a detection
    if (detection) {
      this.history.push(detection);
    }
    
    // Remove old entries (keep last 1 second)
    this.history = this.history.filter(d => now - d.timestamp < 1000);
    
    if (this.history.length === 0) {
      return null;
    }
    
    // Calculate median values for stability
    const taus = this.history.map(d => d.tau);
    const confidences = this.history.map(d => d.confidence);
    
    taus.sort((a, b) => a - b);
    confidences.sort((a, b) => a - b);
    
    const medianTau = taus[Math.floor(taus.length / 2)];
    const medianConfidence = confidences[Math.floor(confidences.length / 2)];
    
    // Return combined result
    return {
      tau: medianTau,
      deltaF: 1000 / medianTau,
      confidence: medianConfidence,
      notches: this.history[0].notches, // Use most recent notches
      timestamp: now
    };
  }
}
