/**
 * Exponential Sine Sweep (ESS) Signal Generator
 * 
 * Generates exponential sine sweeps for impulse response measurement
 * following the Farina method for acoustic analysis.
 */

export class ESSGenerator {
  /**
   * Generate an exponential sine sweep and its inverse filter
   * @param {Object} options - Configuration options
   * @param {number} [options.sampleRate=48000] - Sample rate in Hz
   * @param {number} [options.duration=10] - Sweep duration in seconds
   * @param {number} [options.f1=20] - Start frequency in Hz
   * @param {number} [options.f2=20000] - End frequency in Hz
   * @param {number} [options.amplitude=0.5] - Amplitude (0-1)
   * @param {number} [options.fadeIn=0.1] - Fade-in duration in seconds
   * @param {number} [options.fadeOut=0.1] - Fade-out duration in seconds
   * @returns {Object} Object containing sweep, inverse, and metadata
   */
  static generate({
    sampleRate = 48000,
    duration = 10,
    f1 = 20,
    f2 = 20000,
    amplitude = 0.5,
    fadeIn = 0.1,
    fadeOut = 0.1
  } = {}) {
    
    const L = Math.floor(duration * sampleRate);
    const K = duration / Math.log(f2 / f1);
    const w1 = 2 * Math.PI * f1;
    
    // Generate sweep
    const sweep = new Float32Array(L);
    const inverse = new Float32Array(L);
    
    for (let n = 0; n < L; n++) {
      const t = n / sampleRate;
      
      // Exponential frequency modulation
      const phase = w1 * K * (Math.exp(t / K) - 1);
      const sample = Math.sin(phase);
      
      // Apply amplitude
      sweep[n] = amplitude * sample;
      
      // Generate inverse filter (time-reversed with amplitude compensation)
      const invIdx = L - 1 - n;
      const compensation = Math.exp(-t / K);
      inverse[invIdx] = amplitude * sample * compensation;
    }
    
    // Apply fade-in/fade-out to reduce clicks
    this._applyFades(sweep, sampleRate, fadeIn, fadeOut);
    this._applyFades(inverse, sampleRate, fadeIn, fadeOut);
    
    return {
      sweep,
      inverse,
      metadata: {
        sampleRate,
        duration,
        length: L,
        f1,
        f2,
        amplitude,
        K,
        fadeIn,
        fadeOut
      }
    };
  }
  
  /**
   * Generate pink noise for testing
   * @param {Object} options - Configuration options
   * @returns {Float32Array} Pink noise buffer
   */
  static generatePinkNoise({
    sampleRate = 48000,
    duration = 5,
    amplitude = 0.3
  } = {}) {
    
    const length = Math.floor(duration * sampleRate);
    const noise = new Float32Array(length);
    
    // Simple pink noise approximation using multiple octave bands
    const numOctaves = 8;
    const octaveGains = new Array(numOctaves);
    const octaveStates = new Array(numOctaves);
    
    // Initialize octave filters (simple first-order lowpass)
    for (let i = 0; i < numOctaves; i++) {
      octaveGains[i] = Math.pow(2, -i * 0.5); // -3dB per octave
      octaveStates[i] = 0;
    }
    
    for (let n = 0; n < length; n++) {
      let sample = 0;
      const white = (Math.random() - 0.5) * 2;
      
      // Filter white noise through octave bands
      for (let i = 0; i < numOctaves; i++) {
        const cutoff = 0.1 / Math.pow(2, i);
        octaveStates[i] += cutoff * (white - octaveStates[i]);
        sample += octaveStates[i] * octaveGains[i];
      }
      
      noise[n] = amplitude * sample * 0.1;
    }
    
    return noise;
  }
  
  /**
   * Create an audio buffer from Float32Array for Web Audio API
   * @param {AudioContext} audioContext - Web Audio context
   * @param {Float32Array} data - Audio data
   * @param {number} sampleRate - Sample rate
   * @returns {AudioBuffer} Web Audio buffer
   */
  static createAudioBuffer(audioContext, data, sampleRate) {
    const buffer = audioContext.createBuffer(1, data.length, sampleRate);
    buffer.copyToChannel(data, 0);
    return buffer;
  }
  
  /**
   * Apply fade-in and fade-out to prevent clicks
   * @private
   */
  static _applyFades(buffer, sampleRate, fadeIn, fadeOut) {
    const fadeInSamples = Math.floor(fadeIn * sampleRate);
    const fadeOutSamples = Math.floor(fadeOut * sampleRate);
    const length = buffer.length;
    
    // Fade-in (Hann window)
    for (let i = 0; i < fadeInSamples && i < length; i++) {
      const factor = 0.5 * (1 - Math.cos(Math.PI * i / fadeInSamples));
      buffer[i] *= factor;
    }
    
    // Fade-out (Hann window)
    for (let i = 0; i < fadeOutSamples && i < length; i++) {
      const idx = length - 1 - i;
      const factor = 0.5 * (1 - Math.cos(Math.PI * i / fadeOutSamples));
      buffer[idx] *= factor;
    }
  }
  
  /**
   * Calculate the theoretical frequency at a given time
   * @param {number} t - Time in seconds
   * @param {number} f1 - Start frequency
   * @param {number} K - Time constant
   * @returns {number} Frequency in Hz
   */
  static getFrequencyAtTime(t, f1, K) {
    return f1 * Math.exp(t / K);
  }
  
  /**
   * Calculate the time when a given frequency occurs
   * @param {number} f - Frequency in Hz
   * @param {number} f1 - Start frequency
   * @param {number} K - Time constant
   * @returns {number} Time in seconds
   */
  static getTimeAtFrequency(f, f1, K) {
    return K * Math.log(f / f1);
  }
}
