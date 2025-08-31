# Comb-Filtering Detection Library

A JavaScript library for detecting comb-filtering artifacts in audio signals using cepstrum analysis.

## Features

- Real-time comb-filtering detection
- Configurable frequency and delay ranges
- Confidence scoring and temporal smoothing
- Visual feedback with notch markers
- Works with Web Audio API

## Installation

```bash
npm install @your-username/comb-filtering
```

Or include directly in HTML:

```html
<script src="path/to/comb-filter.js"></script>
```

## Usage

```javascript
import { CombFilterDetector } from 'comb-filtering';

// Initialize with audio context and options
const detector = new CombFilterDetector({
  sampleRate: 44100,
  fftSize: 2048,
  minFreq: 200,    // Hz
  maxFreq: 8000,   // Hz
  minDelay: 0.2,   // ms
  maxDelay: 20,    // ms
  confidenceThreshold: 8 // dB
});

// Process audio data (Float32Array of frequency magnitudes in dB)
const result = detector.detect(magnitudeSpectrum);

if (result) {
  console.log(`Comb detected: ${result.tau.toFixed(2)}ms (${result.deltaF.toFixed(1)} Hz)`);
  console.log(`Confidence: ${(result.confidence * 100).toFixed(1)}%`);
}
```

## API

### `new CombFilterDetector(options)`

Create a new detector instance.

**Options:**
- `sampleRate`: Audio sample rate in Hz (default: 44100)
- `fftSize`: FFT size for analysis (default: 2048)
- `minFreq`: Minimum frequency for analysis in Hz (default: 200)
- `maxFreq`: Maximum frequency for analysis in Hz (default: 8000)
- `minDelay`: Minimum delay to detect in ms (default: 0.2)
- `maxDelay`: Maximum delay to detect in ms (default: 20)
- `confidenceThreshold`: Minimum confidence threshold in dB (default: 8)

### `detect(magnitudeSpectrum)`

Analyze a magnitude spectrum and return detection results.

**Parameters:**
- `magnitudeSpectrum`: Float32Array of frequency magnitudes in dB

**Returns:** `null` if no comb-filtering detected, otherwise an object with:
- `tau`: Estimated delay in ms
- `deltaF`: Notch spacing in Hz
- `confidence`: Detection confidence (0-1)
- `notches`: Array of detected notch frequencies in Hz

## License

MIT
