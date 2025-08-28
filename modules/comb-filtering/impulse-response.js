/**
 * Impulse Response Extraction using FFT-based Deconvolution
 * 
 * Implements the Farina method for extracting room impulse responses
 * from exponential sine sweep measurements.
 */

import { FFT } from './fft.js';

export class ImpulseResponseExtractor {
  /**
   * Extract impulse response from recorded ESS measurement
   * @param {Float32Array} recording - Recorded audio containing ESS response
   * @param {Float32Array} inverse - Inverse filter from ESS generator
   * @param {Object} options - Processing options
   * @param {number} [options.sampleRate=48000] - Sample rate in Hz
   * @param {number} [options.regularization=1e-6] - Regularization epsilon
   * @param {number} [options.windowStart=0.005] - IR window start in seconds
   * @param {number} [options.windowLength=2.0] - IR window length in seconds
   * @returns {Object} Impulse response data and metadata
   */
  static extract(recording, inverse, {
    sampleRate = 48000,
    regularization = 1e-6,
    windowStart = 0.005,
    windowLength = 2.0
  } = {}) {
    
    // Preprocessing
    const processedRecording = this._preprocess(recording);
    const processedInverse = this._preprocess(inverse);
    
    // FFT-based deconvolution
    const rawIR = this._deconvolve(processedRecording, processedInverse, regularization);
    
    // Find IR onset and apply windowing
    const onsetIndex = this._findOnset(rawIR, sampleRate);
    const windowedIR = this._windowIR(rawIR, onsetIndex, sampleRate, windowStart, windowLength);
    
    // Normalize
    const maxVal = Math.max(...windowedIR.map(Math.abs));
    if (maxVal > 0) {
      for (let i = 0; i < windowedIR.length; i++) {
        windowedIR[i] /= maxVal;
      }
    }
    
    return {
      impulseResponse: windowedIR,
      onsetIndex,
      onsetTime: onsetIndex / sampleRate,
      sampleRate,
      length: windowedIR.length,
      duration: windowedIR.length / sampleRate,
      metadata: {
        regularization,
        windowStart,
        windowLength,
        maxAmplitude: maxVal
      }
    };
  }
  
  /**
   * Preprocess audio data (DC removal, optional filtering)
   * @private
   */
  static _preprocess(data) {
    const processed = new Float32Array(data.length);
    
    // Calculate DC offset
    let sum = 0;
    for (let i = 0; i < data.length; i++) {
      sum += data[i];
    }
    const dcOffset = sum / data.length;
    
    // Remove DC and apply gentle high-pass (20 Hz)
    let prevInput = 0;
    let prevOutput = 0;
    const alpha = 0.999; // High-pass filter coefficient for ~20 Hz at 48kHz
    
    for (let i = 0; i < data.length; i++) {
      const input = data[i] - dcOffset;
      const output = alpha * (prevOutput + input - prevInput);
      processed[i] = output;
      prevInput = input;
      prevOutput = output;
    }
    
    return processed;
  }
  
  /**
   * Perform FFT-based deconvolution
   * @private
   */
  static _deconvolve(recording, inverse, regularization) {
    // Zero-pad to next power of 2 for efficient FFT
    const totalLength = recording.length + inverse.length - 1;
    const fftSize = this._nextPowerOf2(totalLength);
    
    // Pad arrays
    const paddedRecording = new Float32Array(fftSize);
    const paddedInverse = new Float32Array(fftSize);
    
    paddedRecording.set(recording);
    paddedInverse.set(inverse);
    
    // Create FFT instances
    const fft = new FFT(fftSize);
    
    // Forward FFTs
    const recordingReal = new Float32Array(paddedRecording);
    const recordingImag = new Float32Array(fftSize);
    const inverseReal = new Float32Array(paddedInverse);
    const inverseImag = new Float32Array(fftSize);
    
    fft.realTransform(recordingReal, recordingImag);
    fft.realTransform(inverseReal, inverseImag);
    
    // Complex multiplication with regularization
    const resultReal = new Float32Array(fftSize);
    const resultImag = new Float32Array(fftSize);
    
    for (let i = 0; i < fftSize; i++) {
      const recReal = recordingReal[i];
      const recImag = recordingImag[i];
      const invReal = inverseReal[i];
      const invImag = inverseImag[i];
      
      // Complex conjugate of inverse
      const invConjReal = invReal;
      const invConjImag = -inverseImag[i];
      
      // Magnitude squared for regularization
      const magSq = invReal * invReal + invImag * invImag + regularization;
      
      // Complex multiplication: recording * conj(inverse) / |inverse|^2
      resultReal[i] = (recReal * invConjReal - recImag * invConjImag) / magSq;
      resultImag[i] = (recReal * invConjImag + recImag * invConjReal) / magSq;
    }
    
    // Inverse FFT
    fft.completeSpectrum(resultReal, resultImag);
    fft.inverseTransform(resultReal, resultImag);
    
    // Return real part (impulse response)
    return resultReal.slice(0, totalLength);
  }
  
  /**
   * Find impulse response onset using energy-based detection
   * @private
   */
  static _findOnset(ir, sampleRate) {
    const windowSize = Math.floor(0.001 * sampleRate); // 1ms window
    const energyThreshold = 0.01; // 1% of peak energy
    
    // Calculate short-time energy
    const energy = new Float32Array(ir.length - windowSize);
    for (let i = 0; i < energy.length; i++) {
      let sum = 0;
      for (let j = 0; j < windowSize; j++) {
        const sample = ir[i + j];
        sum += sample * sample;
      }
      energy[i] = sum / windowSize;
    }
    
    // Find peak energy
    const maxEnergy = Math.max(...energy);
    const threshold = maxEnergy * energyThreshold;
    
    // Find first sample above threshold
    for (let i = 0; i < energy.length; i++) {
      if (energy[i] > threshold) {
        return i;
      }
    }
    
    return 0; // Fallback to start
  }
  
  /**
   * Apply windowing to impulse response
   * @private
   */
  static _windowIR(ir, onsetIndex, sampleRate, windowStart, windowLength) {
    const startSample = onsetIndex + Math.floor(windowStart * sampleRate);
    const lengthSamples = Math.floor(windowLength * sampleRate);
    const endSample = Math.min(ir.length, startSample + lengthSamples);
    
    if (startSample >= ir.length) {
      return new Float32Array(lengthSamples);
    }
    
    const windowed = new Float32Array(lengthSamples);
    const actualLength = endSample - startSample;
    
    // Copy data
    for (let i = 0; i < actualLength; i++) {
      windowed[i] = ir[startSample + i];
    }
    
    // Apply Hann window to reduce artifacts
    const fadeLength = Math.min(Math.floor(0.01 * sampleRate), actualLength / 4); // 10ms or 25% of length
    
    // Fade-in
    for (let i = 0; i < fadeLength; i++) {
      const factor = 0.5 * (1 - Math.cos(Math.PI * i / fadeLength));
      windowed[i] *= factor;
    }
    
    // Fade-out
    for (let i = 0; i < fadeLength && i < actualLength; i++) {
      const idx = actualLength - 1 - i;
      const factor = 0.5 * (1 - Math.cos(Math.PI * i / fadeLength));
      windowed[idx] *= factor;
    }
    
    return windowed;
  }
  
  /**
   * Calculate frequency response from impulse response
   * @param {Float32Array} ir - Impulse response
   * @param {number} sampleRate - Sample rate in Hz
   * @param {number} [fftSize] - FFT size (defaults to next power of 2)
   * @returns {Object} Frequency response data
   */
  static getFrequencyResponse(ir, sampleRate, fftSize = null) {
    if (!fftSize) {
      fftSize = this._nextPowerOf2(ir.length);
    }
    
    // Zero-pad IR
    const paddedIR = new Float32Array(fftSize);
    paddedIR.set(ir);
    
    // Apply window to reduce spectral leakage
    this._applyHannWindow(paddedIR, ir.length);
    
    // FFT
    const fft = new FFT(fftSize);
    const real = new Float32Array(paddedIR);
    const imag = new Float32Array(fftSize);
    
    fft.realTransform(real, imag);
    
    // Calculate magnitude and phase
    const numBins = Math.floor(fftSize / 2) + 1;
    const magnitude = new Float32Array(numBins);
    const phase = new Float32Array(numBins);
    const frequencies = new Float32Array(numBins);
    
    for (let i = 0; i < numBins; i++) {
      const re = real[i];
      const im = imag[i];
      
      magnitude[i] = 20 * Math.log10(Math.sqrt(re * re + im * im) + 1e-10);
      phase[i] = Math.atan2(im, re);
      frequencies[i] = i * sampleRate / fftSize;
    }
    
    return {
      frequencies,
      magnitude,
      phase,
      fftSize
    };
  }
  
  /**
   * Apply Hann window to data
   * @private
   */
  static _applyHannWindow(data, length) {
    for (let i = 0; i < length; i++) {
      const factor = 0.5 * (1 - Math.cos(2 * Math.PI * i / (length - 1)));
      data[i] *= factor;
    }
  }
  
  /**
   * Find next power of 2
   * @private
   */
  static _nextPowerOf2(n) {
    return Math.pow(2, Math.ceil(Math.log2(n)));
  }
}
