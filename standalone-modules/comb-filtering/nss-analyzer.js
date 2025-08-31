/**
 * NSS (Natural Surround Sound) Analyzer
 * 
 * Integrated measurement workflow for analyzing NSS speaker setups.
 * Orchestrates ESS generation, recording, impulse response extraction,
 * RT60 analysis, delay estimation, and comb-filtering detection.
 */

import { ESSGenerator } from './ess-generator.js';
import { ImpulseResponseExtractor } from './impulse-response.js';
import { RT60Analyzer } from './rt60-analyzer.js';
import { DelayEstimator } from './delay-estimator.js';
import { CombFilterDetector } from './comb-filter.js';

export class NSSAnalyzer {
  /**
   * Create a new NSS Analyzer instance
   * @param {AudioContext} audioContext - Web Audio context
   * @param {Object} options - Configuration options
   */
  constructor(audioContext, options = {}) {
    this.audioContext = audioContext;
    this.sampleRate = audioContext.sampleRate;
    
    // Configuration
    this.config = {
      // ESS parameters
      essF1: 20,
      essF2: 20000,
      essDuration: 10,
      essAmplitude: 0.5,
      
      // Recording parameters
      recordingLeadIn: 0.5,
      recordingTail: 2.0,
      
      // Analysis parameters
      combMinFreq: 20,
      combMaxFreq: 20000,
      combConfidenceThreshold: 8,
      
      // RT60 parameters
      rt60BandLimited: true,
      
      // Delay estimation parameters
      delaySearchWindow: 0.05,
      delayThreshold: 0.1,
      
      ...options
    };
    
    // State
    this.isRecording = false;
    this.currentMeasurement = null;
    this.mediaStream = null;
    this.recorder = null;
    
    // Initialize comb filter detector
    this.combDetector = new CombFilterDetector({
      sampleRate: this.sampleRate,
      minFreq: this.config.combMinFreq,
      maxFreq: this.config.combMaxFreq,
      confidenceThreshold: this.config.combConfidenceThreshold
    });
  }
  
  /**
   * Start a complete NSS measurement sequence
   * @param {string} measurementType - 'setA', 'setB', or 'both'
   * @param {Object} options - Measurement options
   * @returns {Promise<Object>} Complete measurement results
   */
  async startMeasurement(measurementType = 'both', options = {}) {
    if (this.isRecording) {
      throw new Error('Measurement already in progress');
    }
    
    try {
      this.isRecording = true;
      this.currentMeasurement = {
        type: measurementType,
        startTime: Date.now(),
        status: 'initializing'
      };
      
      // Generate ESS signal
      this.currentMeasurement.status = 'generating_signal';
      const essData = this._generateESSSignal();
      
      // Setup recording
      this.currentMeasurement.status = 'setup_recording';
      await this._setupRecording();
      
      // Play ESS and record response
      this.currentMeasurement.status = 'recording';
      const recording = await this._playAndRecord(essData.sweep, essData.metadata);
      
      // Process and analyze
      this.currentMeasurement.status = 'analyzing';
      const results = await this._analyzeRecording(recording, essData);
      
      this.currentMeasurement.status = 'completed';
      this.currentMeasurement.results = results;
      
      return {
        success: true,
        measurementType,
        timestamp: new Date().toISOString(),
        ...results
      };
      
    } catch (error) {
      this.currentMeasurement = {
        ...this.currentMeasurement,
        status: 'error',
        error: error.message
      };
      throw error;
    } finally {
      this.isRecording = false;
      this._cleanup();
    }
  }
  
  /**
   * Generate ESS test signal
   * @private
   */
  _generateESSSignal() {
    return ESSGenerator.generate({
      sampleRate: this.sampleRate,
      duration: this.config.essDuration,
      f1: this.config.essF1,
      f2: this.config.essF2,
      amplitude: this.config.essAmplitude
    });
  }
  
  /**
   * Setup audio recording
   * @private
   */
  async _setupRecording() {
    try {
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: this.sampleRate,
          channelCount: 1,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
    } catch (error) {
      throw new Error(`Failed to access microphone: ${error.message}`);
    }
  }
  
  /**
   * Play ESS signal and record response
   * @private
   */
  async _playAndRecord(essSignal, essMetadata) {
    return new Promise((resolve, reject) => {
      const totalDuration = this.config.recordingLeadIn + essMetadata.duration + this.config.recordingTail;
      const totalSamples = Math.floor(totalDuration * this.sampleRate);
      const recordedData = new Float32Array(totalSamples);
      let sampleIndex = 0;
      
      // Create audio buffer for ESS playback
      const essBuffer = ESSGenerator.createAudioBuffer(this.audioContext, essSignal, this.sampleRate);
      
      // Setup recording using ScriptProcessorNode (deprecated but widely supported)
      const source = this.audioContext.createMediaStreamSource(this.mediaStream);
      const processor = this.audioContext.createScriptProcessor(4096, 1, 1);
      
      processor.onaudioprocess = (event) => {
        const inputData = event.inputBuffer.getChannelData(0);
        const samplesToCopy = Math.min(inputData.length, totalSamples - sampleIndex);
        
        if (samplesToCopy > 0) {
          recordedData.set(inputData.subarray(0, samplesToCopy), sampleIndex);
          sampleIndex += samplesToCopy;
        }
        
        if (sampleIndex >= totalSamples) {
          // Recording complete
          source.disconnect();
          processor.disconnect();
          resolve({
            data: recordedData,
            sampleRate: this.sampleRate,
            duration: totalDuration,
            leadIn: this.config.recordingLeadIn,
            essStart: this.config.recordingLeadIn,
            essEnd: this.config.recordingLeadIn + essMetadata.duration
          });
        }
      };
      
      // Connect recording chain
      source.connect(processor);
      processor.connect(this.audioContext.destination);
      
      // Start playback after lead-in delay
      setTimeout(() => {
        const playbackSource = this.audioContext.createBufferSource();
        playbackSource.buffer = essBuffer;
        playbackSource.connect(this.audioContext.destination);
        playbackSource.start();
      }, this.config.recordingLeadIn * 1000);
      
      // Safety timeout
      setTimeout(() => {
        source.disconnect();
        processor.disconnect();
        reject(new Error('Recording timeout'));
      }, (totalDuration + 5) * 1000);
    });
  }
  
  /**
   * Analyze recorded data
   * @private
   */
  async _analyzeRecording(recording, essData) {
    // Extract the ESS portion from recording
    const essStartSample = Math.floor(recording.essStart * this.sampleRate);
    const essLengthSamples = essData.sweep.length;
    const essRecording = recording.data.slice(essStartSample, essStartSample + essLengthSamples);
    
    // Extract impulse response
    const irData = ImpulseResponseExtractor.extract(
      essRecording,
      essData.inverse,
      { sampleRate: this.sampleRate }
    );
    
    // Analyze RT60/EDT
    const rt60Results = RT60Analyzer.analyze(
      irData.impulseResponse,
      this.sampleRate,
      { bandLimited: this.config.rt60BandLimited }
    );
    
    // Estimate delays
    const delayResults = DelayEstimator.estimate(
      irData.impulseResponse,
      null,
      this.sampleRate,
      {
        searchWindow: this.config.delaySearchWindow,
        threshold: this.config.delayThreshold
      }
    );
    
    // Get frequency response for comb filtering analysis
    const freqResponse = ImpulseResponseExtractor.getFrequencyResponse(
      irData.impulseResponse,
      this.sampleRate
    );
    
    // Detect comb filtering
    const combResults = this.combDetector.detect(freqResponse.magnitude);
    
    // Compile comprehensive results
    return {
      impulseResponse: {
        data: irData.impulseResponse,
        onsetTime: irData.onsetTime,
        duration: irData.duration,
        sampleRate: this.sampleRate
      },
      
      frequencyResponse: {
        frequencies: freqResponse.frequencies,
        magnitude: freqResponse.magnitude,
        phase: freqResponse.phase
      },
      
      reverberation: {
        EDT: rt60Results.broadband?.EDT || null,
        T20: rt60Results.broadband?.T20 || null,
        T30: rt60Results.broadband?.T30 || null,
        confidence: rt60Results.broadband?.confidence || 0,
        bands: rt60Results.bands || null
      },
      
      delay: {
        primaryDelay: delayResults.delay,
        confidence: delayResults.confidence,
        arrivals: delayResults.arrivals || [],
        method: delayResults.metadata?.method || 'unknown'
      },
      
      combFiltering: combResults ? {
        detected: true,
        delay: combResults.tau,
        notchSpacing: combResults.deltaF,
        confidence: combResults.confidence,
        notches: combResults.notches
      } : {
        detected: false,
        confidence: 0
      },
      
      nssValidation: this._validateNSSDesign(rt60Results, delayResults, combResults),
      
      metadata: {
        measurementDuration: recording.duration,
        essParameters: essData.metadata,
        analysisTimestamp: Date.now()
      }
    };
  }
  
  /**
   * Validate NSS design based on measurement results
   * @private
   */
  _validateNSSDesign(rt60Results, delayResults, combResults) {
    const validation = {
      overall: 'unknown',
      criteria: {},
      recommendations: []
    };
    
    // Check delay between sets (expected ~3-15ms for NSS)
    if (delayResults.delay !== null) {
      const delayOk = delayResults.delay >= 3 && delayResults.delay <= 15;
      validation.criteria.delay = {
        status: delayOk ? 'pass' : 'warning',
        measured: delayResults.delay,
        expected: '3-15 ms',
        confidence: delayResults.confidence
      };
      
      if (!delayOk) {
        if (delayResults.delay < 3) {
          validation.recommendations.push('Consider increasing distance between Set A and Set B speakers');
        } else {
          validation.recommendations.push('Delay between sets may be too large for optimal NSS effect');
        }
      }
    }
    
    // Check reverberation enhancement
    if (rt60Results.broadband) {
      const rt60 = rt60Results.broadband.T30 || rt60Results.broadband.T20 || rt60Results.broadband.EDT;
      if (rt60) {
        const rtOk = rt60 >= 0.3 && rt60 <= 1.2; // Typical room range
        validation.criteria.reverberation = {
          status: rtOk ? 'pass' : 'info',
          measured: rt60,
          expected: '0.3-1.2 s',
          confidence: rt60Results.broadband.confidence
        };
        
        if (rt60 < 0.3) {
          validation.recommendations.push('Room may be too acoustically dead for optimal NSS effect');
        } else if (rt60 > 1.2) {
          validation.recommendations.push('Room reverberation may be excessive');
        }
      }
    }
    
    // Check comb filtering (should be minimal above 2kHz for NSS)
    if (combResults) {
      const combOk = combResults.confidence < 0.7; // Lower confidence = less comb filtering
      validation.criteria.combFiltering = {
        status: combOk ? 'pass' : 'warning',
        detected: combResults.confidence > 0.3,
        confidence: combResults.confidence,
        notchSpacing: combResults.deltaF
      };
      
      if (!combOk) {
        validation.recommendations.push('Significant comb filtering detected - check speaker positioning and crossover settings');
      }
    }
    
    // Overall assessment
    const passCount = Object.values(validation.criteria).filter(c => c.status === 'pass').length;
    const totalCriteria = Object.keys(validation.criteria).length;
    
    if (passCount === totalCriteria) {
      validation.overall = 'excellent';
    } else if (passCount >= totalCriteria * 0.7) {
      validation.overall = 'good';
    } else if (passCount >= totalCriteria * 0.5) {
      validation.overall = 'acceptable';
    } else {
      validation.overall = 'needs_improvement';
    }
    
    return validation;
  }
  
  /**
   * Get current measurement status
   */
  getMeasurementStatus() {
    return this.currentMeasurement;
  }
  
  /**
   * Stop current measurement
   */
  stopMeasurement() {
    if (this.isRecording) {
      this.isRecording = false;
      this._cleanup();
    }
  }
  
  /**
   * Update configuration
   */
  updateConfig(newConfig) {
    this.config = { ...this.config, ...newConfig };
    
    // Update comb detector if frequency range changed
    if (newConfig.combMinFreq || newConfig.combMaxFreq || newConfig.combConfidenceThreshold) {
      this.combDetector = new CombFilterDetector({
        sampleRate: this.sampleRate,
        minFreq: this.config.combMinFreq,
        maxFreq: this.config.combMaxFreq,
        confidenceThreshold: this.config.combConfidenceThreshold
      });
    }
  }
  
  /**
   * Cleanup resources
   * @private
   */
  _cleanup() {
    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach(track => track.stop());
      this.mediaStream = null;
    }
    
    if (this.recorder) {
      this.recorder = null;
    }
  }
  
  /**
   * Export measurement results
   * @param {Object} results - Measurement results
   * @param {string} format - Export format ('json', 'csv', 'wav')
   * @returns {Blob|Object} Exported data
   */
  exportResults(results, format = 'json') {
    switch (format) {
      case 'json':
        return new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
        
      case 'csv':
        return this._exportCSV(results);
        
      case 'wav':
        return this._exportWAV(results.impulseResponse.data, this.sampleRate);
        
      default:
        throw new Error(`Unsupported export format: ${format}`);
    }
  }
  
  /**
   * Export results as CSV
   * @private
   */
  _exportCSV(results) {
    const lines = [
      'NSS Measurement Results',
      `Timestamp,${new Date().toISOString()}`,
      '',
      'Reverberation Analysis',
      `EDT (s),${results.reverberation.EDT || 'N/A'}`,
      `T20 (s),${results.reverberation.T20 || 'N/A'}`,
      `T30 (s),${results.reverberation.T30 || 'N/A'}`,
      `Confidence,${results.reverberation.confidence}`,
      '',
      'Delay Analysis',
      `Primary Delay (ms),${results.delay.primaryDelay || 'N/A'}`,
      `Confidence,${results.delay.confidence}`,
      '',
      'Comb Filtering',
      `Detected,${results.combFiltering.detected}`,
      `Confidence,${results.combFiltering.confidence}`,
      `Notch Spacing (Hz),${results.combFiltering.notchSpacing || 'N/A'}`,
      '',
      'NSS Validation',
      `Overall Assessment,${results.nssValidation.overall}`
    ];
    
    return new Blob([lines.join('\n')], { type: 'text/csv' });
  }
  
  /**
   * Export impulse response as WAV
   * @private
   */
  _exportWAV(irData, sampleRate) {
    // Simple WAV export (16-bit PCM)
    const length = irData.length;
    const buffer = new ArrayBuffer(44 + length * 2);
    const view = new DataView(buffer);
    
    // WAV header
    const writeString = (offset, string) => {
      for (let i = 0; i < string.length; i++) {
        view.setUint8(offset + i, string.charCodeAt(i));
      }
    };
    
    writeString(0, 'RIFF');
    view.setUint32(4, 36 + length * 2, true);
    writeString(8, 'WAVE');
    writeString(12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, 1, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * 2, true);
    view.setUint16(32, 2, true);
    view.setUint16(34, 16, true);
    writeString(36, 'data');
    view.setUint32(40, length * 2, true);
    
    // Convert float samples to 16-bit PCM
    let offset = 44;
    for (let i = 0; i < length; i++) {
      const sample = Math.max(-1, Math.min(1, irData[i]));
      view.setInt16(offset, sample * 0x7FFF, true);
      offset += 2;
    }
    
    return new Blob([buffer], { type: 'audio/wav' });
  }
}
