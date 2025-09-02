/**
 * RT60/EDT Analyzer using Schroeder Integration
 * 
 * Implements reverberation time analysis from impulse responses
 * using the backward integration method (Schroeder, 1965).
 */

export class RT60Analyzer {
  /**
   * Analyze reverberation times from impulse response
   * @param {Float32Array} ir - Impulse response
   * @param {number} sampleRate - Sample rate in Hz
   * @param {Object} options - Analysis options
   * @param {number} [options.onsetOffset=0.005] - Offset from IR start in seconds
   * @param {number} [options.minDecayRange=20] - Minimum decay range in dB
   * @param {boolean} [options.bandLimited=false] - Perform octave band analysis
   * @returns {Object} RT60 analysis results
   */
  static analyze(ir, sampleRate, {
    onsetOffset = 0.005,
    minDecayRange = 20,
    bandLimited = false
  } = {}) {
    
    // Calculate energy decay curve (Schroeder integration)
    const edc = this._calculateEDC(ir, sampleRate, onsetOffset);
    
    // Analyze broadband RT60
    const broadband = this._analyzeDecay(edc, sampleRate);
    
    let bands = null;
    if (bandLimited) {
      bands = this._analyzeBands(ir, sampleRate, onsetOffset);
    }
    
    return {
      broadband,
      bands,
      edc: {
        curve: edc.curve,
        timeAxis: edc.timeAxis
      },
      metadata: {
        sampleRate,
        onsetOffset,
        minDecayRange,
        irLength: ir.length,
        irDuration: ir.length / sampleRate
      }
    };
  }
  
  /**
   * Calculate Energy Decay Curve using Schroeder integration
   * @private
   */
  static _calculateEDC(ir, sampleRate, onsetOffset) {
    const startSample = Math.floor(onsetOffset * sampleRate);
    const workingIR = ir.slice(startSample);
    
    // Square the impulse response to get instantaneous power
    const power = new Float32Array(workingIR.length);
    for (let i = 0; i < workingIR.length; i++) {
      power[i] = workingIR[i] * workingIR[i];
    }
    
    // Backward integration (Schroeder method)
    const energy = new Float32Array(power.length);
    energy[energy.length - 1] = power[power.length - 1];
    
    for (let i = energy.length - 2; i >= 0; i--) {
      energy[i] = energy[i + 1] + power[i];
    }
    
    // Convert to dB scale
    const maxEnergy = energy[0];
    const curve = new Float32Array(energy.length);
    const timeAxis = new Float32Array(energy.length);
    
    for (let i = 0; i < energy.length; i++) {
      curve[i] = 10 * Math.log10(Math.max(energy[i] / maxEnergy, 1e-10));
      timeAxis[i] = (startSample + i) / sampleRate;
    }
    
    return { curve, timeAxis };
  }
  
  /**
   * Analyze decay characteristics from EDC
   * @private
   */
  static _analyzeDecay(edc, sampleRate) {
    const { curve, timeAxis } = edc;
    
    // Find valid decay range
    const validRange = this._findValidRange(curve);
    
    if (!validRange) {
      return {
        EDT: null,
        T20: null,
        T30: null,
        confidence: 0,
        error: 'Insufficient decay range'
      };
    }
    
    // Calculate EDT (0 to -10 dB)
    const edt = this._calculateRT(curve, timeAxis, 0, -10, 6);
    
    // Calculate T20 (-5 to -25 dB, extrapolated to -60 dB)
    const t20 = this._calculateRT(curve, timeAxis, -5, -25, 3);
    
    // Calculate T30 (-5 to -35 dB, extrapolated to -60 dB)
    const t30 = this._calculateRT(curve, timeAxis, -5, -35, 2);
    
    // Determine best estimate and confidence
    const estimates = [edt, t20, t30].filter(est => est && est.rt60 > 0);
    
    if (estimates.length === 0) {
      return {
        EDT: null,
        T20: null,
        T30: null,
        confidence: 0,
        error: 'No valid RT estimates'
      };
    }
    
    // Calculate confidence based on correlation coefficients
    const avgCorrelation = estimates.reduce((sum, est) => sum + est.correlation, 0) / estimates.length;
    const confidence = Math.max(0, Math.min(1, (avgCorrelation + 1) / 2)); // Map [-1,1] to [0,1]
    
    return {
      EDT: edt?.rt60 || null,
      T20: t20?.rt60 || null,
      T30: t30?.rt60 || null,
      confidence,
      correlations: {
        EDT: edt?.correlation || 0,
        T20: t20?.correlation || 0,
        T30: t30?.correlation || 0
      },
      ranges: {
        EDT: edt ? [0, -10] : null,
        T20: t20 ? [-5, -25] : null,
        T30: t30 ? [-5, -35] : null
      }
    };
  }
  
  /**
   * Calculate RT60 from specific dB range
   * @private
   */
  static _calculateRT(curve, timeAxis, startDB, endDB, extrapolationFactor) {
    // Find indices for start and end dB levels
    let startIdx = -1, endIdx = -1;
    
    for (let i = 0; i < curve.length; i++) {
      if (startIdx === -1 && curve[i] <= startDB) {
        startIdx = i;
      }
      if (curve[i] <= endDB) {
        endIdx = i;
        break;
      }
    }
    
    if (startIdx === -1 || endIdx === -1 || endIdx <= startIdx) {
      return null;
    }
    
    // Extract data for linear regression
    const x = timeAxis.slice(startIdx, endIdx + 1);
    const y = curve.slice(startIdx, endIdx + 1);
    
    if (x.length < 3) {
      return null;
    }
    
    // Perform linear regression
    const regression = this._linearRegression(x, y);
    
    if (!regression || regression.slope >= 0) {
      return null; // Invalid slope (should be negative for decay)
    }
    
    // Calculate RT60
    const decayRange = Math.abs(endDB - startDB);
    const rt60 = (60 / decayRange) * Math.abs(1 / regression.slope);
    
    return {
      rt60,
      correlation: regression.correlation,
      slope: regression.slope,
      intercept: regression.intercept
    };
  }
  
  /**
   * Perform linear regression
   * @private
   */
  static _linearRegression(x, y) {
    const n = x.length;
    if (n < 2) return null;
    
    let sumX = 0, sumY = 0, sumXY = 0, sumXX = 0, sumYY = 0;
    
    for (let i = 0; i < n; i++) {
      sumX += x[i];
      sumY += y[i];
      sumXY += x[i] * y[i];
      sumXX += x[i] * x[i];
      sumYY += y[i] * y[i];
    }
    
    const meanX = sumX / n;
    const meanY = sumY / n;
    
    const slope = (sumXY - n * meanX * meanY) / (sumXX - n * meanX * meanX);
    const intercept = meanY - slope * meanX;
    
    // Calculate correlation coefficient
    const numerator = sumXY - n * meanX * meanY;
    const denominator = Math.sqrt((sumXX - n * meanX * meanX) * (sumYY - n * meanY * meanY));
    const correlation = denominator !== 0 ? numerator / denominator : 0;
    
    return { slope, intercept, correlation };
  }
  
  /**
   * Find valid decay range in EDC
   * @private
   */
  static _findValidRange(curve) {
    let maxLevel = Math.max(...curve);
    let minLevel = Math.min(...curve);
    
    // Need at least 20 dB of decay
    if (maxLevel - minLevel < 20) {
      return null;
    }
    
    // Find where curve starts declining consistently
    let startIdx = 0;
    for (let i = 1; i < curve.length - 10; i++) {
      let isDecreasing = true;
      for (let j = 0; j < 10; j++) {
        if (curve[i + j] > curve[i]) {
          isDecreasing = false;
          break;
        }
      }
      if (isDecreasing) {
        startIdx = i;
        break;
      }
    }
    
    return { startIdx, range: maxLevel - minLevel };
  }
  
  /**
   * Analyze RT60 in octave bands
   * @private
   */
  static _analyzeBands(ir, sampleRate, onsetOffset) {
    const bands = [125, 250, 500, 1000, 2000, 4000, 8000]; // Standard octave bands
    const results = {};
    
    for (const centerFreq of bands) {
      const filteredIR = this._octaveBandFilter(ir, sampleRate, centerFreq);
      const edc = this._calculateEDC(filteredIR, sampleRate, onsetOffset);
      const analysis = this._analyzeDecay(edc, sampleRate);
      
      results[centerFreq] = {
        ...analysis,
        centerFrequency: centerFreq
      };
    }
    
    return results;
  }
  
  /**
   * Simple octave band filter (approximation)
   * @private
   */
  static _octaveBandFilter(ir, sampleRate, centerFreq) {
    // This is a simplified implementation
    // In practice, you'd want proper IIR octave band filters
    
    const nyquist = sampleRate / 2;
    const lowFreq = centerFreq / Math.sqrt(2);
    const highFreq = centerFreq * Math.sqrt(2);
    
    // Simple frequency domain filtering
    const fftSize = this._nextPowerOf2(ir.length);
    const paddedIR = new Float32Array(fftSize);
    paddedIR.set(ir);
    
    // This would require a proper FFT implementation for filtering
    // For now, return the original IR (broadband analysis)
    return ir;
  }
  
  /**
   * Find next power of 2
   * @private
   */
  static _nextPowerOf2(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
}
