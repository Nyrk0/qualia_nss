/**
 * Comb Filter Core Algorithms
 * Mathematical models and digital signal processing for comb filtering
 * Part of Qualia-NSS Standalone Modules
 */

class CombFilterCore {
    constructor() {
        this.sampleRate = 44100;
        this.maxDelayTime = 0.1; // 100ms max delay
        
        // Mathematical constants
        this.SPEED_OF_SOUND = 343; // m/s at 20°C
        this.MIN_AUDIBLE_FREQ = 20;
        this.MAX_AUDIBLE_FREQ = 20000;
        
        console.log('🧮 Comb Filter Core initialized');
    }
    
    /**
     * Calculate comb filter transfer function magnitude response
     */
    calculateTransferFunction(delaySeconds, feedback = 0, frequencies = null) {
        if (!frequencies) {
            frequencies = AudioUtils.generateLogFrequencyScale(
                this.MIN_AUDIBLE_FREQ, 
                this.MAX_AUDIBLE_FREQ, 
                500
            );
        }
        
        const response = new Float32Array(frequencies.length);
        
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i];
            const omega = 2 * Math.PI * freq * delaySeconds;
            
            // Feedforward comb filter: H(z) = 1 + z^(-k)
            if (feedback === 0) {
                // |H(e^jω)| = 2|cos(ωk/2)|
                response[i] = 2 * Math.abs(Math.cos(omega / 2));
            } else {
                // Feedback comb filter: H(z) = 1 / (1 - g*z^(-k))
                const real = 1 - feedback * Math.cos(omega);
                const imag = feedback * Math.sin(omega);
                const magnitude = 1 / Math.sqrt(real * real + imag * imag);
                response[i] = magnitude;
            }
        }
        
        return {
            frequencies: frequencies,
            magnitudes: response
        };
    }
    
    /**
     * Calculate comb filter phase response
     */
    calculatePhaseResponse(delaySeconds, feedback = 0, frequencies = null) {
        if (!frequencies) {
            frequencies = AudioUtils.generateLogFrequencyScale(
                this.MIN_AUDIBLE_FREQ, 
                this.MAX_AUDIBLE_FREQ, 
                500
            );
        }
        
        const phase = new Float32Array(frequencies.length);
        
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i];
            const omega = 2 * Math.PI * freq * delaySeconds;
            
            if (feedback === 0) {
                // Feedforward: phase depends on cos sign
                phase[i] = Math.cos(omega / 2) >= 0 ? 0 : Math.PI;
            } else {
                // Feedback: phase = -arctan(g*sin(ω) / (1 - g*cos(ω)))
                const real = 1 - feedback * Math.cos(omega);
                const imag = feedback * Math.sin(omega);
                phase[i] = -Math.atan2(imag, real);
            }
        }
        
        return {
            frequencies: frequencies,
            phases: phase
        };
    }
    
    /**
     * Calculate exact notch frequencies for feedforward comb filter
     */
    calculateNotchFrequencies(delaySeconds, maxFrequency = null) {
        if (delaySeconds <= 0) return [];
        
        const maxFreq = maxFrequency || this.MAX_AUDIBLE_FREQ;
        const notches = [];
        
        // First notch: f₁ = 1/(2τ)
        const firstNotch = 1 / (2 * delaySeconds);
        
        // Subsequent notches: fₙ = (2n+1)/(2τ) for n = 0, 1, 2, ...
        let n = 0;
        let frequency = firstNotch;
        
        while (frequency <= maxFreq) {
            if (frequency >= this.MIN_AUDIBLE_FREQ) {
                notches.push({
                    frequency: frequency,
                    order: n,
                    depth: -Infinity, // Perfect cancellation in theory
                    qFactor: this.calculateNotchQ(frequency, delaySeconds)
                });
            }
            
            n++;
            frequency = (2 * n + 1) / (2 * delaySeconds);
        }
        
        return notches;
    }
    
    /**
     * Calculate exact peak frequencies for feedforward comb filter
     */
    calculatePeakFrequencies(delaySeconds, maxFrequency = null) {
        if (delaySeconds <= 0) return [{ frequency: 0, order: 0, gain: 2 }]; // DC peak
        
        const maxFreq = maxFrequency || this.MAX_AUDIBLE_FREQ;
        const peaks = [{ frequency: 0, order: 0, gain: 2 }]; // DC component
        
        // Peak frequencies: fₙ = n/τ for n = 1, 2, 3, ...
        let n = 1;
        let frequency = n / delaySeconds;
        
        while (frequency <= maxFreq) {
            if (frequency >= this.MIN_AUDIBLE_FREQ) {
                peaks.push({
                    frequency: frequency,
                    order: n,
                    gain: 2, // 6dB boost for feedforward
                    qFactor: this.calculatePeakQ(frequency, delaySeconds)
                });
            }
            
            n++;
            frequency = n / delaySeconds;
        }
        
        return peaks;
    }
    
    /**
     * Calculate Q factor for notches (approximation)
     */
    calculateNotchQ(frequency, delaySeconds) {
        // Q ≈ π * frequency * delay
        return Math.PI * frequency * delaySeconds;
    }
    
    /**
     * Calculate Q factor for peaks (approximation)
     */
    calculatePeakQ(frequency, delaySeconds) {
        // Q ≈ π * frequency * delay
        return Math.PI * frequency * delaySeconds;
    }
    
    /**
     * Calculate group delay
     */
    calculateGroupDelay(delaySeconds, feedback = 0, frequencies = null) {
        if (!frequencies) {
            frequencies = AudioUtils.generateLogFrequencyScale(
                this.MIN_AUDIBLE_FREQ, 
                this.MAX_AUDIBLE_FREQ, 
                500
            );
        }
        
        const groupDelay = new Float32Array(frequencies.length);
        
        for (let i = 0; i < frequencies.length; i++) {
            const freq = frequencies[i];
            const omega = 2 * Math.PI * freq * delaySeconds;
            
            if (feedback === 0) {
                // Feedforward: constant group delay
                groupDelay[i] = delaySeconds;
            } else {
                // Feedback: frequency-dependent group delay
                const denominator = 1 - 2 * feedback * Math.cos(omega) + feedback * feedback;
                groupDelay[i] = delaySeconds * (1 - feedback * Math.cos(omega)) / denominator;
            }
        }
        
        return {
            frequencies: frequencies,
            groupDelay: groupDelay
        };
    }
    
    /**
     * Analyze room impulse response for comb filtering
     */
    analyzeImpulseResponse(impulseResponse, sampleRate) {
        if (!impulseResponse || impulseResponse.length === 0) {
            return { reflections: [], estimatedDelays: [] };
        }
        
        // Find peak in impulse response (direct sound)
        let directSoundIndex = 0;
        let directSoundLevel = 0;
        
        for (let i = 0; i < impulseResponse.length; i++) {
            const level = Math.abs(impulseResponse[i]);
            if (level > directSoundLevel) {
                directSoundLevel = level;
                directSoundIndex = i;
            }
        }
        
        // Find subsequent peaks (reflections)
        const reflections = [];
        const minReflectionLevel = directSoundLevel * 0.1; // -20dB relative
        const minDistance = Math.floor(sampleRate * 0.001); // 1ms minimum
        
        for (let i = directSoundIndex + minDistance; i < impulseResponse.length; i += minDistance) {
            let localPeak = 0;
            let localPeakIndex = i;
            
            // Look for local maximum in window
            const windowEnd = Math.min(i + minDistance, impulseResponse.length);
            for (let j = i; j < windowEnd; j++) {
                const level = Math.abs(impulseResponse[j]);
                if (level > localPeak) {
                    localPeak = level;
                    localPeakIndex = j;
                }
            }
            
            if (localPeak > minReflectionLevel) {
                const delayTime = (localPeakIndex - directSoundIndex) / sampleRate;
                const distance = delayTime * this.SPEED_OF_SOUND;
                
                reflections.push({
                    index: localPeakIndex,
                    delayTime: delayTime,
                    distance: distance,
                    level: localPeak,
                    relativeLevel: 20 * Math.log10(localPeak / directSoundLevel)
                });
            }
            
            i = localPeakIndex; // Jump to found peak
        }
        
        return {
            directSound: {
                index: directSoundIndex,
                level: directSoundLevel
            },
            reflections: reflections,
            estimatedDelays: reflections.map(r => r.delayTime)
        };
    }
    
    /**
     * Predict comb filtering from room geometry
     */
    predictRoomCombFiltering(roomDimensions, listenerPosition, sourcePositions) {
        const predictions = [];
        
        sourcePositions.forEach((sourcePos, sourceIndex) => {
            // Calculate direct path
            const directDistance = this.calculateDistance3D(listenerPosition, sourcePos);
            const directDelay = directDistance / this.SPEED_OF_SOUND;
            
            // Calculate first-order reflections from walls
            const reflections = this.calculateFirstOrderReflections(
                roomDimensions, 
                listenerPosition, 
                sourcePos
            );
            
            reflections.forEach(reflection => {
                const totalDelay = reflection.delay;
                const relativeDelay = totalDelay - directDelay;
                
                if (relativeDelay > 0.0005 && relativeDelay < 0.05) { // 0.5-50ms range
                    const combEffect = this.predictCombEffect(relativeDelay, reflection.attenuation);
                    
                    predictions.push({
                        sourceIndex: sourceIndex,
                        reflectionSurface: reflection.surface,
                        delayTime: relativeDelay,
                        distance: relativeDelay * this.SPEED_OF_SOUND,
                        attenuation: reflection.attenuation,
                        combEffect: combEffect,
                        firstNotch: 1 / (2 * relativeDelay),
                        notchSpacing: 1 / relativeDelay
                    });
                }
            });
        });
        
        return predictions.sort((a, b) => a.delayTime - b.delayTime);
    }
    
    /**
     * Calculate first-order reflections in rectangular room
     */
    calculateFirstOrderReflections(roomDimensions, listener, source) {
        const { width, height, depth } = roomDimensions;
        const reflections = [];
        
        // Define wall surfaces and their positions
        const walls = [
            { name: 'front', normal: [0, 0, -1], position: [0, 0, 0] },
            { name: 'back', normal: [0, 0, 1], position: [0, 0, depth] },
            { name: 'left', normal: [-1, 0, 0], position: [0, 0, 0] },
            { name: 'right', normal: [1, 0, 0], position: [width, 0, 0] },
            { name: 'floor', normal: [0, -1, 0], position: [0, 0, 0] },
            { name: 'ceiling', normal: [0, 1, 0], position: [0, height, 0] }
        ];
        
        walls.forEach(wall => {
            // Calculate mirror source position
            const mirrorSource = this.calculateMirrorSource(source, wall);
            
            // Calculate path length
            const pathLength = this.calculateDistance3D(listener, mirrorSource);
            const delay = pathLength / this.SPEED_OF_SOUND;
            
            // Estimate attenuation (simplified)
            const attenuation = 1 / (pathLength * pathLength); // Inverse square law
            
            reflections.push({
                surface: wall.name,
                mirrorSource: mirrorSource,
                pathLength: pathLength,
                delay: delay,
                attenuation: attenuation
            });
        });
        
        return reflections;
    }
    
    /**
     * Calculate mirror source position for wall reflection
     */
    calculateMirrorSource(source, wall) {
        // Simplified for rectangular room - would need proper vector math for arbitrary walls
        const [x, y, z] = source;
        
        switch (wall.name) {
            case 'front': return [x, y, -z];
            case 'back': return [x, y, 2 * wall.position[2] - z];
            case 'left': return [-x, y, z];
            case 'right': return [2 * wall.position[0] - x, y, z];
            case 'floor': return [x, -y, z];
            case 'ceiling': return [x, 2 * wall.position[1] - y, z];
            default: return [x, y, z];
        }
    }
    
    /**
     * Calculate 3D distance between two points
     */
    calculateDistance3D(point1, point2) {
        const dx = point1[0] - point2[0];
        const dy = point1[1] - point2[1];
        const dz = point1[2] - point2[2];
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    /**
     * Predict comb effect severity
     */
    predictCombEffect(delayTime, attenuation) {
        const firstNotch = 1 / (2 * delayTime);
        
        // Severity based on notch frequency and attenuation
        let severity = 'minimal';
        let score = 0;
        
        if (firstNotch < 100) {
            severity = 'minimal'; // Low frequency notches less audible
            score = 0.2 * attenuation;
        } else if (firstNotch < 500) {
            severity = 'moderate'; // Mid-frequency notches more noticeable
            score = 0.6 * attenuation;
        } else if (firstNotch < 2000) {
            severity = 'significant'; // High-mid frequencies most audible
            score = 0.9 * attenuation;
        } else {
            severity = 'severe'; // High frequency notches very audible
            score = 1.0 * attenuation;
        }
        
        return {
            severity: severity,
            score: Math.min(1, score),
            audibilityFactor: this.calculateAudibilityFactor(firstNotch)
        };
    }
    
    /**
     * Calculate audibility factor based on psychoacoustic principles
     */
    calculateAudibilityFactor(frequency) {
        // Simplified A-weighting-like curve for notch audibility
        if (frequency < 100) return 0.3;
        if (frequency < 500) return 0.7;
        if (frequency < 2000) return 1.0; // Peak sensitivity
        if (frequency < 8000) return 0.8;
        return 0.5;
    }
    
    /**
     * Generate optimal delay recommendations for QUALIA-NSS
     */
    generateQualiaRecommendations(roomDimensions, constraints = {}) {
        const {
            minDistance = 0.5,  // meters
            maxDistance = 3.0,  // meters
            preferredRange = [1.0, 2.0], // optimal range
            avoidFrequencies = [200, 500, 1000, 2000] // frequencies to avoid notching
        } = constraints;
        
        const recommendations = [];
        const stepSize = 0.1; // 10cm steps
        
        for (let distance = minDistance; distance <= maxDistance; distance += stepSize) {
            const delayTime = distance / this.SPEED_OF_SOUND;
            const firstNotch = 1 / (2 * delayTime);
            
            // Check if first notch conflicts with critical frequencies
            let hasConflict = false;
            for (const criticalFreq of avoidFrequencies) {
                if (Math.abs(firstNotch - criticalFreq) < criticalFreq * 0.1) { // 10% tolerance
                    hasConflict = true;
                    break;
                }
            }
            
            // Calculate score based on multiple factors
            let score = 100;
            
            // Prefer distances in optimal range
            if (distance >= preferredRange[0] && distance <= preferredRange[1]) {
                score += 20;
            } else if (distance < preferredRange[0]) {
                score -= (preferredRange[0] - distance) * 30;
            } else {
                score -= (distance - preferredRange[1]) * 15;
            }
            
            // Penalize critical frequency conflicts
            if (hasConflict) score -= 40;
            
            // Prefer lower first notch frequencies (less audible)
            if (firstNotch < 100) score += 15;
            else if (firstNotch > 500) score -= 25;
            
            // Room size compatibility
            const maxRoomDim = Math.max(roomDimensions.width, roomDimensions.depth);
            if (distance > maxRoomDim * 0.3) score -= 20; // Too close to walls
            
            const assessment = AudioUtils.assessQualiaImpact(delayTime, distance);
            
            recommendations.push({
                distance: distance,
                delayTime: delayTime,
                firstNotch: firstNotch,
                notchSpacing: 1 / delayTime,
                score: Math.max(0, score),
                hasConflict: hasConflict,
                assessment: assessment,
                category: this.categorizeRecommendation(score)
            });
        }
        
        return recommendations.sort((a, b) => b.score - a.score);
    }
    
    /**
     * Categorize recommendation based on score
     */
    categorizeRecommendation(score) {
        if (score >= 90) return 'excellent';
        if (score >= 75) return 'good';
        if (score >= 60) return 'acceptable';
        if (score >= 40) return 'marginal';
        return 'poor';
    }
    
    /**
     * Calculate theoretical comb filter response
     */
    calculateTheoreticalResponse(params) {
        const {
            delayTime,
            feedback = 0,
            mix = 0.5,
            frequencies = null,
            sampleRate = 44100
        } = params;
        
        const freqs = frequencies || AudioUtils.generateLogFrequencyScale(20, 20000, 1000);
        const magnitude = new Float32Array(freqs.length);
        const phase = new Float32Array(freqs.length);
        
        for (let i = 0; i < freqs.length; i++) {
            const freq = freqs[i];
            const omega = 2 * Math.PI * freq * delayTime;
            
            // Complex transfer function calculation
            let H_real, H_imag;
            
            if (feedback === 0) {
                // Feedforward: H(z) = 1 + z^(-k)
                H_real = 1 + Math.cos(omega);
                H_imag = -Math.sin(omega);
            } else {
                // Feedback: H(z) = 1 / (1 - g*z^(-k))
                const denom_real = 1 - feedback * Math.cos(omega);
                const denom_imag = feedback * Math.sin(omega);
                const denom_mag_sq = denom_real * denom_real + denom_imag * denom_imag;
                
                H_real = denom_real / denom_mag_sq;
                H_imag = -denom_imag / denom_mag_sq;
            }
            
            // Apply dry/wet mix
            const dry_gain = Math.sqrt(1 - mix);
            const wet_gain = Math.sqrt(mix);
            
            const mixed_real = dry_gain + wet_gain * H_real;
            const mixed_imag = wet_gain * H_imag;
            
            magnitude[i] = Math.sqrt(mixed_real * mixed_real + mixed_imag * mixed_imag);
            phase[i] = Math.atan2(mixed_imag, mixed_real);
        }
        
        return {
            frequencies: freqs,
            magnitude: magnitude,
            phase: phase,
            magnitudeDb: magnitude.map(m => 20 * Math.log10(Math.max(1e-10, m)))
        };
    }
}

// Export for module systems
if (typeof module !== 'undefined' && module.exports) {
    module.exports = CombFilterCore;
} else {
    window.CombFilterCore = CombFilterCore;
}