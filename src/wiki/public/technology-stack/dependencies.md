# Technology Stack & Dependencies

## Overview

Qualia-NSS is built with a carefully selected technology stack that prioritizes **compatibility**, **performance**, and **maintainability**. The project follows a **no-build-system philosophy**, using modern web standards directly without bundlers or complex toolchains.

## Frontend Technologies

### JavaScript
- **ES6+ Modules** - Native browser module system
- **No Bundler** - Direct module loading for maximum compatibility
- **Vanilla JavaScript** - No framework dependencies
- **Modern APIs** - Web Audio API, WebGL, Canvas, File API

```javascript
// Example: ES6 module structure
export class AudioProcessor {
    constructor() {
        this.audioContext = new AudioContext();
        this.analyser = this.audioContext.createAnalyser();
    }
}
```

### CSS & Styling
- **Vanilla CSS** - No preprocessors or CSS-in-JS
- **Bootstrap 5 (CSS-only)** - Layout and component styling
- **CSS Custom Properties** - Theme system and dynamic styling
- **Bootstrap Icons** - Comprehensive icon set

```css
/* Example: CSS custom properties for theming */
:root {
    --primary-color: #007bff;
    --background-color: #ffffff;
    --text-color: #333333;
}

[data-theme="dark"] {
    --background-color: #1a1a1a;
    --text-color: #ffffff;
}
```

### Graphics & Visualization
- **WebGL 2.0** - High-performance 3D graphics (primary)
- **WebGL 1.0** - Fallback for older devices
- **HTML5 Canvas** - 2D visualizations and charts
- **SVG** - Vector graphics and diagrams

## Audio Processing

### Web Audio API
- **AudioContext** - Core audio processing engine
- **AnalyserNode** - Real-time frequency analysis
- **MediaStream** - Microphone and system audio input
- **AudioWorklet** - High-performance audio processing

```javascript
// Example: Web Audio API setup
const audioContext = new AudioContext();
const analyser = audioContext.createAnalyser();
analyser.fftSize = 2048;
analyser.smoothingTimeConstant = 0.8;
```

### Custom Audio Implementations
- **FFT Processing** - Configurable windowing and sizes (512–8192)
- **Cepstrum Analysis** - For comb filtering detection
- **Psychoacoustic Filtering** - 7-band frequency analysis
- **DSP Controls** - Echo cancellation, noise suppression, auto gain

### Audio Sources
- **Microphone Input** - `getUserMedia()` with constraints
- **File Upload** - Audio file analysis and processing
- **System Audio** - Display media capture (where supported)
- **Test Tone Generation** - Built-in signal generators

## Build & Deployment

### Build System
- **None** - Pure static files
- **No Transpilation** - Direct ES6+ usage
- **No Bundling** - Individual module files
- **CDN-Friendly** - Optimized for content delivery networks

### Deployment Targets
- **Static Hosting** - GitHub Pages, Netlify, Vercel
- **CDN Deployment** - CloudFlare, AWS CloudFront
- **Local Development** - Python/Node.js HTTP servers
- **File Protocol** - Limited functionality, HTTP preferred

### CI/CD
- **GitHub Actions** - Automated deployment pipeline
- **Deployment Script** - `dev/deploy.yml` configuration
- **Security Headers** - `.htaccess` for static hosting protection

```yaml
# Example: GitHub Actions deployment
name: Deploy to GitHub Pages
on:
  push:
    branches: [ main ]
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Deploy to GitHub Pages
        uses: peaceiris/actions-gh-pages@v3
```

## Development Tools

### Required Tools
- **Modern Browser** - Chrome, Firefox, Safari, Edge
- **HTTP Server** - Python 3 or Node.js for local development
- **Text Editor** - VS Code, Sublime Text, or similar

### Browser Requirements
- **Web Audio API** - For audio processing
- **WebGL Support** - For 3D visualizations
- **ES6+ Modules** - Native module loading
- **MediaStream API** - For microphone access

### Development Commands

```bash
# Python HTTP server
python3 -m http.server 8080

# Node.js HTTP server
npx http-server -p 8080

# Access application
open http://localhost:8080
```

## Dependencies & Libraries

### Core Dependencies
- **Bootstrap 5.3+** - CSS framework (CSS-only)
- **Bootstrap Icons 1.10+** - Icon library
- **No JavaScript frameworks** - Vanilla JS only

### Optional Enhancements
- **Docsify** - Documentation rendering (wiki module)
- **Mermaid.js** - Diagram generation (documentation)

### Browser APIs Used
- **Web Audio API** - Audio processing and analysis
- **WebGL API** - 3D graphics rendering
- **Canvas API** - 2D visualizations
- **File API** - File upload and processing
- **MediaStream API** - Microphone access
- **History API** - Client-side routing

## Performance Considerations

### Real-Time Requirements
- **Low Latency** - Audio processing under 10ms
- **High Frame Rate** - 60 FPS for WebGL rendering
- **Memory Efficiency** - Optimized for long-running sessions
- **CPU Optimization** - Efficient FFT and DSP algorithms

### Optimization Strategies
- **Web Workers** - For heavy computational tasks
- **RequestAnimationFrame** - Smooth animation loops
- **Typed Arrays** - Efficient audio data handling
- **Object Pooling** - Memory management for real-time processing

```javascript
// Example: Optimized audio processing
class OptimizedProcessor {
    constructor() {
        this.bufferPool = new Float32Array(2048);
        this.worker = new Worker('audio-worker.js');
    }
    
    processAudio(inputBuffer) {
        // Reuse buffers to avoid garbage collection
        this.worker.postMessage(inputBuffer, [inputBuffer.buffer]);
    }
}
```

## Browser Compatibility

### Supported Browsers
| Browser | Version | Web Audio | WebGL 2.0 | ES6 Modules |
|---------|---------|-----------|-----------|-------------|
| Chrome  | 80+     | ✅        | ✅        | ✅          |
| Firefox | 75+     | ✅        | ✅        | ✅          |
| Safari  | 14+     | ✅        | ✅        | ✅          |
| Edge    | 80+     | ✅        | ✅        | ✅          |

### Known Limitations
- **File Protocol** - Limited functionality when opening files directly
- **CORS Restrictions** - HTTP server required for full feature set
- **Mobile Browsers** - Limited WebGL 2.0 support on older devices
- **Audio Latency** - Varies by platform and audio system

## Security Considerations

### HTTPS Requirements
- **Microphone Access** - Requires secure context in production
- **MediaStream API** - HTTPS mandatory for deployment
- **Service Workers** - Secure context required

### Content Security Policy
```html
<!-- Example: CSP headers for audio applications -->
<meta http-equiv="Content-Security-Policy" 
      content="default-src 'self'; 
               media-src 'self' blob:; 
               worker-src 'self' blob:;">
```

### Static Hosting Security
- **`.htaccess` Rules** - Protection for static assets
- **CORS Configuration** - Secure cross-origin requests
- **Header Security** - X-Frame-Options, X-Content-Type-Options

## Future Technology Roadmap

### Emerging APIs
- **Web Codecs API** - Advanced audio processing
- **AudioWorklet** - Enhanced real-time processing
- **WebAssembly** - High-performance DSP algorithms
- **Web Workers** - Parallel processing capabilities

### Planned Enhancements
- **WebAssembly DSP** - Ultra-low latency processing
- **WebRTC Integration** - Real-time collaboration features
- **Progressive Web App** - Offline capabilities and native feel
- **WebXR Support** - 3D spatial audio visualization

## Related Documentation

- [Modular Architecture](../modular-architecture/javascript-modules.md)
- [Audio Processing Pipeline](../audio-processing/web-audio-api.md)
- [Development Guidelines](../development/guidelines.md)
- [Deployment & Production](../deployment/production.md)

---

*The technology stack is carefully designed to balance modern capabilities with broad compatibility, ensuring Qualia-NSS works reliably across diverse environments and use cases.*