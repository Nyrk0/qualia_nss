/**
 * Delay Estimator for NSS Speaker Set Analysis
 * 
 * Estimates time delays between different speaker sets by analyzing
 * direct arrivals in impulse responses.
 */

export class DelayEstimator {
  /**
   * Estimate delay between two impulse responses or find multiple arrivals in one IR
   * @param {Float32Array|Object} irA - First IR or IR analysis object
   * @param {Float32Array} [irB] - Second IR (optional for dual-IR analysis)
   * @param {number} sampleRate - Sample rate in Hz
   * @param {Object} options - Analysis options
   * @param {number} [options.searchWindow=0.05] - Search window duration in seconds
   * @param {number} [options.threshold=0.1] - Peak detection threshold (0-1)
   * @param {number} [options.minSeparation=0.001] - Minimum separation between peaks in seconds
   * @returns {Object} Delay estimation results
   */
  static estimate(irA, irB = null, sampleRate, {
    searchWindow = 0.05,
    threshold = 0.1,
    minSeparation = 0.001
  } = {}) {
    
    if (irB) {
      // Dual-IR analysis: compare arrivals between two separate recordings
      return this._analyzeDualIR(irA, irB, sampleRate, { searchWindow, threshold });
    } else {
      // Single-IR analysis: find multiple arrivals in one recording
      return this._analyzeSingleIR(irA, sampleRate, { searchWindow, threshold, minSeparation });
    }
  }
  
  /**
   * Analyze delay between two separate impulse responses
   * @private
   */
  static _analyzeDualIR(irA, irB, sampleRate, options) {
    // Find direct arrival in each IR
    const arrivalA = this._findDirectArrival(irA, sampleRate, options);
    const arrivalB = this._findDirectArrival(irB, sampleRate, options);
    
    if (!arrivalA.found || !arrivalB.found) {
      return {
        delay: null,
        confidence: 0,
        error: 'Could not detect arrivals in both IRs',
        arrivals: { A: arrivalA, B: arrivalB }
      };
    }
    
    // Calculate delay
    const delaySamples = arrivalB.index - arrivalA.index;
    const delayMs = (delaySamples / sampleRate) * 1000;
    
    // Calculate confidence based on peak strengths
    const confidence = Math.min(arrivalA.confidence, arrivalB.confidence);
    
    return {
      delay: delayMs,
      confidence,
      arrivals: {
        A: { time: arrivalA.index / sampleRate, strength: arrivalA.strength },
        B: { time: arrivalB.index / sampleRate, strength: arrivalB.strength }
      },
      metadata: {
        sampleRate,
        delaySamples,
        method: 'dual-IR'
      }
    };
  }
  
  /**
   * Analyze multiple arrivals in single impulse response
   * @private
   */
  static _analyzeSingleIR(ir, sampleRate, options) {
    const arrivals = this._findMultipleArrivals(ir, sampleRate, options);
    
    if (arrivals.length < 2) {
      return {
        delay: null,
        confidence: 0,
        error: 'Insufficient arrivals detected',
        arrivals: arrivals.map(a => ({
          time: a.index / sampleRate,
          strength: a.strength
        }))
      };
    }
    
    // Sort by time
    arrivals.sort((a, b) => a.index - b.index);
    
    // Calculate delays between consecutive arrivals
    const delays = [];
    for (let i = 1; i < arrivals.length; i++) {
      const delaySamples = arrivals[i].index - arrivals[i-1].index;
      const delayMs = (delaySamples / sampleRate) * 1000;
      
      delays.push({
        delayMs,
        from: arrivals[i-1],
        to: arrivals[i],
        confidence: Math.min(arrivals[i-1].confidence, arrivals[i].confidence)
      });
    }
    
    // Return primary delay (first to second arrival)
    const primaryDelay = delays[0];
    
    return {
      delay: primaryDelay.delayMs,
      confidence: primaryDelay.confidence,
      arrivals: arrivals.map(a => ({
        time: a.index / sampleRate,
        strength: a.strength,
        confidence: a.confidence
      })),
      allDelays: delays.map(d => ({
        delay: d.delayMs,
        confidence: d.confidence
      })),
      metadata: {
        sampleRate,
        method: 'single-IR',
        totalArrivals: arrivals.length
      }
    };
  }
  
  /**
   * Find direct arrival in impulse response
   * @private
   */
  static _findDirectArrival(ir, sampleRate, { searchWindow, threshold }) {
    const searchSamples = Math.floor(searchWindow * sampleRate);
    const searchLength = Math.min(searchSamples, ir.length);
    
    // Calculate short-time energy for onset detection
    const windowSize = Math.floor(0.001 * sampleRate); // 1ms window
    const energy = this._calculateShortTimeEnergy(ir, windowSize, searchLength);
    
    // Find peak energy
    const maxEnergy = Math.max(...energy);
    const energyThreshold = maxEnergy * threshold;
    
    // Find first significant peak
    let peakIndex = -1;
    let peakStrength = 0;
    
    for (let i = 1; i < energy.length - 1; i++) {
      if (energy[i] > energyThreshold && 
          energy[i] > energy[i-1] && 
          energy[i] > energy[i+1]) {
        peakIndex = i;
        peakStrength = energy[i];
        break;
      }
    }
    
    if (peakIndex === -1) {
      return { found: false, confidence: 0 };
    }
    
    // Refine peak location using parabolic interpolation
    const refinedIndex = this._parabolicInterpolation(energy, peakIndex);
    
    // Calculate confidence based on peak prominence
    const noiseFloor = this._estimateNoiseFloor(energy.slice(0, Math.min(50, energy.length)));
    const snr = 20 * Math.log10(peakStrength / (noiseFloor + 1e-10));
    const confidence = Math.min(1, Math.max(0, (snr - 6) / 20)); // Map 6-26 dB SNR to 0-1
    
    return {
      found: true,
      index: Math.round(refinedIndex),
      strength: peakStrength,
      confidence,
      snr
    };
  }
  
  /**
   * Find multiple arrivals in impulse response
   * @private
   */
  static _findMultipleArrivals(ir, sampleRate, { searchWindow, threshold, minSeparation }) {
    const searchSamples = Math.floor(searchWindow * sampleRate);
    const searchLength = Math.min(searchSamples, ir.length);
    const minSepSamples = Math.floor(minSeparation * sampleRate);
    
    // Calculate short-time energy
    const windowSize = Math.floor(0.001 * sampleRate);
    const energy = this._calculateShortTimeEnergy(ir, windowSize, searchLength);
    
    // Find peaks
    const maxEnergy = Math.max(...energy);
    const energyThreshold = maxEnergy * threshold;
    const peaks = [];
    
    for (let i = 1; i < energy.length - 1; i++) {
      if (energy[i] > energyThreshold && 
          energy[i] > energy[i-1] && 
          energy[i] > energy[i+1]) {
        
        // Check minimum separation from previous peaks
        let tooClose = false;
        for (const peak of peaks) {
          if (Math.abs(i - peak.index) < minSepSamples) {
            tooClose = true;
            break;
          }
        }
        
        if (!tooClose) {
          const refinedIndex = this._parabolicInterpolation(energy, i);
          const noiseFloor = this._estimateNoiseFloor(energy.slice(0, Math.min(50, energy.length)));
          const snr = 20 * Math.log10(energy[i] / (noiseFloor + 1e-10));
          const confidence = Math.min(1, Math.max(0, (snr - 6) / 20));
          
          peaks.push({
            index: Math.round(refinedIndex),
            strength: energy[i],
            confidence,
            snr
          });
        }
      }
    }
    
    return peaks;
  }
  
  /**
   * Calculate short-time energy
   * @private
   */
  static _calculateShortTimeEnergy(signal, windowSize, maxLength = null) {
    const length = maxLength || signal.length;
    const energy = new Float32Array(length - windowSize);
    
    for (let i = 0; i < energy.length; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = signal[i + j];
        sum += sample * sample;
      }
      energy[i] = sum / windowSize;
    }
    
    return energy;
  }
  
  /**
   * Parabolic interpolation for sub-sample peak location
   * @private
   */
  static _parabolicInterpolation(data, peakIndex) {
    if (peakIndex <= 0 || peakIndex >= data.length - 1) {
      return peakIndex;
    }
    
    const y1 = data[peakIndex - 1];
    const y2 = data[peakIndex];
    const y3 = data[peakIndex + 1];
    
    const a = (y1 - 2*y2 + y3) / 2;
    const b = (y3 - y1) / 2;
    
    if (Math.abs(a) < 1e-10) {
      return peakIndex;
    }
    
    const offset = -b / (2 * a);
    return peakIndex + Math.max(-0.5, Math.min(0.5, offset));
  }
  
  /**
   * Estimate noise floor from early samples
   * @private
   */
  static _estimateNoiseFloor(earlyData) {
    if (earlyData.length === 0) return 1e-10;
    
    // Use median for robust noise floor estimation
    const sorted = [...earlyData].sort((a, b) => a - b);
    return sorted[Math.floor(sorted.length * 0.5)];
  }
  
  /**
   * Cross-correlation based delay estimation (alternative method)
   * @param {Float32Array} signalA - First signal
   * @param {Float32Array} signalB - Second signal
   * @param {number} sampleRate - Sample rate in Hz
   * @param {number} [maxDelay=0.05] - Maximum expected delay in seconds
   * @returns {Object} Cross-correlation delay estimate
   */
  static crossCorrelationDelay(signalA, signalB, sampleRate, maxDelay = 0.05) {
    const maxLag = Math.floor(maxDelay * sampleRate);
    const minLength = Math.min(signalA.length, signalB.length);
    const correlationLength = Math.min(minLength, Math.floor(0.02 * sampleRate)); // Use 20ms window
    
    let maxCorr = -Infinity;
    let bestLag = 0;
    
    // Calculate cross-correlation for different lags
    for (let lag = -maxLag; lag <= maxLag; lag++) {
      let correlation = 0;
      let count = 0;
      
      for (let i = 0; i < correlationLength; i++) {
        const idxA = i;
        const idxB = i + lag;
        
        if (idxA >= 0 && idxA < signalA.length && 
            idxB >= 0 && idxB < signalB.length) {
          correlation += signalA[idxA] * signalB[idxB];
          count++;
        }
      }
      
      if (count > 0) {
        correlation /= count;
        if (correlation > maxCorr) {
          maxCorr = correlation;
          bestLag = lag;
        }
      }
    }
    
    const delayMs = (bestLag / sampleRate) * 1000;
    const confidence = Math.max(0, Math.min(1, maxCorr));
    
    return {
      delay: delayMs,
      confidence,
      correlation: maxCorr,
      lag: bestLag,
      method: 'cross-correlation'
    };
  }
}
