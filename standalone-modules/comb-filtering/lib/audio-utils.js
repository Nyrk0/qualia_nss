/**
 * Audio Utilities for Comb-Filter Analysis Tool
 * Common audio processing functions and calculations
 * Part of Qualia-NSS Standalone Modules
 */

class AudioUtils {
    /**
     * Convert frequency to bin index for FFT
     */
    static frequencyToBin(frequency, sampleRate, fftSize) {
        return Math.round((frequency * fftSize) / sampleRate);
    }
    
    /**
     * Convert bin index to frequency
     */
    static binToFrequency(bin, sampleRate, fftSize) {
        return (bin * sampleRate) / fftSize;
    }
    
    /**
     * Convert linear amplitude to dB
     */
    static linearToDb(linear) {
        return 20 * Math.log10(Math.abs(linear));
    }
    
    /**
     * Convert dB to linear amplitude
     */
    static dbToLinear(db) {
        return Math.pow(10, db / 20);
    }
    
    /**
     * Convert delay time to distance (speed of sound in air)
     */
    static delayToDistance(delaySeconds, speedOfSound = 343) {
        return delaySeconds * speedOfSound;
    }
    
    /**
     * Convert distance to delay time
     */
    static distanceToDelay(distance, speedOfSound = 343) {
        return distance / speedOfSound;
    }
    
    /**
     * Calculate comb filter notch frequencies
     */
    static calculateCombNotches(delaySeconds, maxFrequency = 20000) {
        if (delaySeconds <= 0) return [];
        
        const notches = [];
        const firstNotch = 1 / (2 * delaySeconds);
        const spacing = 1 / delaySeconds;
        
        let frequency = firstNotch;
        while (frequency <= maxFrequency) {
            notches.push(frequency);
            frequency += spacing;
        }
        
        return notches;
    }
    
    /**
     * Calculate comb filter peak frequencies
     */
    static calculateCombPeaks(delaySeconds, maxFrequency = 20000) {
        if (delaySeconds <= 0) return [0]; // DC is always a peak
        
        const peaks = [0]; // DC component
        const spacing = 1 / delaySeconds;
        
        let frequency = spacing;
        while (frequency <= maxFrequency) {
            peaks.push(frequency);
            frequency += spacing;
        }
        
        return peaks;
    }
    
    /**
     * Apply window function to data
     */
    static applyWindow(data, windowType = 'hann') {
        const N = data.length;
        const windowed = new Float32Array(N);
        
        for (let i = 0; i < N; i++) {
            let window = 1;
            
            switch (windowType) {
                case 'hann':
                    window = 0.5 * (1 - Math.cos((2 * Math.PI * i) / (N - 1)));
                    break;
                case 'hamming':
                    window = 0.54 - 0.46 * Math.cos((2 * Math.PI * i) / (N - 1));
                    break;
                case 'blackman':
                    window = 0.42 - 0.5 * Math.cos((2 * Math.PI * i) / (N - 1)) + 
                            0.08 * Math.cos((4 * Math.PI * i) / (N - 1));
                    break;
                case 'none':
                default:
                    window = 1;
                    break;
            }
            
            windowed[i] = data[i] * window;
        }
        
        return windowed;
    }
    
    /**
     * Find peaks in frequency data
     */
    static findPeaks(data, threshold = -60, minDistance = 5) {
        const peaks = [];
        
        for (let i = minDistance; i < data.length - minDistance; i++) {
            if (data[i] < threshold) continue;
            
            // Check if this is a local maximum
            let isPeak = true;
            for (let j = i - minDistance; j <= i + minDistance; j++) {
                if (j !== i && data[j] >= data[i]) {
                    isPeak = false;
                    break;
                }
            }
            
            if (isPeak) {
                peaks.push({
                    index: i,
                    value: data[i],
                    frequency: null // Will be calculated by caller
                });
            }
        }
        
        return peaks;
    }
    
    /**
     * Find notches (valleys) in frequency data
     */
    static findNotches(data, threshold = -80, minDistance = 5) {
        const notches = [];
        
        for (let i = minDistance; i < data.length - minDistance; i++) {
            if (data[i] > threshold) continue;
            
            // Check if this is a local minimum
            let isNotch = true;
            for (let j = i - minDistance; j <= i + minDistance; j++) {
                if (j !== i && data[j] <= data[i]) {
                    isNotch = false;
                    break;
                }
            }
            
            if (isNotch) {
                notches.push({
                    index: i,
                    value: data[i],
                    frequency: null // Will be calculated by caller
                });
            }
        }
        
        return notches;
    }
    
    /**
     * Smooth frequency data using moving average
     */
    static smoothData(data, windowSize = 3) {
        const smoothed = new Float32Array(data.length);
        const halfWindow = Math.floor(windowSize / 2);
        
        for (let i = 0; i < data.length; i++) {
            let sum = 0;
            let count = 0;
            
            for (let j = Math.max(0, i - halfWindow); 
                 j <= Math.min(data.length - 1, i + halfWindow); j++) {
                sum += data[j];
                count++;
            }
            
            smoothed[i] = sum / count;
        }
        
        return smoothed;
    }
    
    /**
     * Calculate RMS (Root Mean Square) of audio data
     */
    static calculateRMS(data) {
        let sum = 0;
        for (let i = 0; i < data.length; i++) {
            sum += data[i] * data[i];
        }
        return Math.sqrt(sum / data.length);
    }
    
    /**
     * Calculate peak level of audio data
     */
    static calculatePeak(data) {
        let peak = 0;
        for (let i = 0; i < data.length; i++) {
            const abs = Math.abs(data[i]);
            if (abs > peak) {
                peak = abs;
            }
        }
        return peak;
    }
    
    /**
     * Generate logarithmic frequency scale
     */
    static generateLogFrequencyScale(minFreq, maxFreq, numPoints) {
        const scale = [];
        const logMin = Math.log10(minFreq);
        const logMax = Math.log10(maxFreq);
        const logStep = (logMax - logMin) / (numPoints - 1);
        
        for (let i = 0; i < numPoints; i++) {
            const logFreq = logMin + i * logStep;
            scale.push(Math.pow(10, logFreq));
        }
        
        return scale;
    }
    
    /**
     * Interpolate frequency data to logarithmic scale
     */
    static interpolateToLogScale(data, sampleRate, fftSize, minFreq = 20, maxFreq = 20000) {
        const logFreqs = this.generateLogFrequencyScale(minFreq, maxFreq, data.length);
        const interpolated = new Float32Array(logFreqs.length);
        
        for (let i = 0; i < logFreqs.length; i++) {
            const targetFreq = logFreqs[i];
            const bin = this.frequencyToBin(targetFreq, sampleRate, fftSize);
            
            // Linear interpolation between adjacent bins
            const lowerBin = Math.floor(bin);
            const upperBin = Math.ceil(bin);
            const fraction = bin - lowerBin;
            
            if (upperBin < data.length) {
                interpolated[i] = data[lowerBin] * (1 - fraction) + data[upperBin] * fraction;
            } else {
                interpolated[i] = data[lowerBin];
            }
        }
        
        return interpolated;
    }
    
    /**
     * Calculate octave bands
     */
    static calculateOctaveBands(data, sampleRate, fftSize, bandsPerOctave = 1) {
        const centerFrequencies = [];
        const bandData = [];
        
        // Generate octave band center frequencies
        const startFreq = 31.25; // Starting frequency
        let freq = startFreq;
        
        while (freq <= sampleRate / 2) {
            centerFrequencies.push(freq);
            
            // Calculate band limits
            const factor = Math.pow(2, 1 / (2 * bandsPerOctave));
            const lowerFreq = freq / factor;
            const upperFreq = freq * factor;
            
            // Convert to bin indices
            const lowerBin = this.frequencyToBin(lowerFreq, sampleRate, fftSize);
            const upperBin = this.frequencyToBin(upperFreq, sampleRate, fftSize);
            
            // Calculate average level in this band
            let sum = 0;
            let count = 0;
            
            for (let bin = Math.floor(lowerBin); bin <= Math.ceil(upperBin) && bin < data.length; bin++) {
                sum += this.dbToLinear(data[bin]); // Convert to linear, sum, then back to dB
                count++;
            }
            
            const avgLinear = count > 0 ? sum / count : 0;
            bandData.push(this.linearToDb(avgLinear));
            
            // Next octave band
            freq *= Math.pow(2, 1 / bandsPerOctave);
        }
        
        return {
            frequencies: centerFrequencies,
            levels: bandData
        };
    }
    
    /**
     * Estimate RT60 from impulse response
     */
    static estimateRT60(impulseResponse, sampleRate) {
        // Find the peak in the impulse response
        let peakIndex = 0;
        let peakValue = 0;
        
        for (let i = 0; i < impulseResponse.length; i++) {
            const abs = Math.abs(impulseResponse[i]);
            if (abs > peakValue) {
                peakValue = abs;
                peakIndex = i;
            }
        }
        
        // Calculate energy decay curve
        const decayLength = impulseResponse.length - peakIndex;
        const energyDecay = new Float32Array(decayLength);
        
        for (let i = 0; i < decayLength; i++) {
            let energy = 0;
            // Integrate remaining energy
            for (let j = peakIndex + i; j < impulseResponse.length; j++) {
                energy += impulseResponse[j] * impulseResponse[j];
            }
            energyDecay[i] = 10 * Math.log10(energy + 1e-10); // Convert to dB
        }
        
        // Find -5dB and -35dB points (for T30 method)
        const peakDb = energyDecay[0];
        let t5Index = -1, t35Index = -1;
        
        for (let i = 0; i < energyDecay.length; i++) {
            if (t5Index === -1 && energyDecay[i] <= peakDb - 5) {
                t5Index = i;
            }
            if (t35Index === -1 && energyDecay[i] <= peakDb - 35) {
                t35Index = i;
                break;
            }
        }
        
        if (t5Index !== -1 && t35Index !== -1) {
            // T30 method: measure time for 30dB decay, multiply by 2 for RT60
            const t30 = ((t35Index - t5Index) / sampleRate) * 2;
            return t30;
        }
        
        return null; // Could not estimate
    }
    
    /**
     * Generate standard frequency labels
     */
    static getStandardFrequencyLabels() {
        return [
            { freq: 20, label: '20' },
            { freq: 50, label: '50' },
            { freq: 100, label: '100' },
            { freq: 200, label: '200' },
            { freq: 500, label: '500' },
            { freq: 1000, label: '1k' },
            { freq: 2000, label: '2k' },
            { freq: 5000, label: '5k' },
            { freq: 10000, label: '10k' },
            { freq: 20000, label: '20k' }
        ];
    }
    
    /**
     * Check if frequency is audible
     */
    static isAudibleFrequency(frequency) {
        return frequency >= 20 && frequency <= 20000;
    }
    
    /**
     * Get frequency category
     */
    static getFrequencyCategory(frequency) {
        if (frequency < 250) return 'bass';
        if (frequency < 500) return 'low-mid';
        if (frequency < 2000) return 'mid';
        if (frequency < 4000) return 'high-mid';
        return 'treble';
    }
    
    /**
     * Calculate QUALIA-NSS impact assessment
     */
    static assessQualiaImpact(delaySeconds, distance) {
        const assessment = {
            category: '',
            description: '',
            recommendation: '',
            score: 0 // 0-100
        };
        
        if (delaySeconds < 0.0015) {
            assessment.category = 'too-short';
            assessment.description = 'Distance too short - strong comb filtering expected';
            assessment.recommendation = 'Increase distance to at least 1m';
            assessment.score = 20;
        } else if (delaySeconds < 0.008) {
            assessment.category = 'optimal';
            assessment.description = 'Optimal distance for QUALIA-NSS setup';
            assessment.recommendation = 'Excellent balance of precedence and minimal comb filtering';
            assessment.score = 95;
        } else if (delaySeconds < 0.015) {
            assessment.category = 'good';
            assessment.description = 'Good distance with strong precedence effect';
            assessment.recommendation = 'Suitable for larger rooms, minimal audible comb effects';
            assessment.score = 80;
        } else if (delaySeconds < 0.025) {
            assessment.category = 'borderline';
            assessment.description = 'Approaching echo threshold';
            assessment.recommendation = 'May be perceived as discrete echo in some conditions';
            assessment.score = 60;
        } else {
            assessment.category = 'too-long';
            assessment.description = 'Exceeds psychoacoustic comfort zone';
            assessment.recommendation = 'Reduce distance to avoid echo perception';
            assessment.score = 30;
        }
        
        return assessment;
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = AudioUtils;
} else {
    window.AudioUtils = AudioUtils;
}