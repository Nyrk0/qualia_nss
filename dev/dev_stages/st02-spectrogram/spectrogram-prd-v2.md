# Spectrogram Visualizer - Technical Specification

## 1. Core Architecture

### 1.1 WebGL Implementation
- **WebGL Version**: 1.0 with `experimental-webgl` fallback
- **Context Creation**:
  ```javascript
  const canvas = document.getElementById('spectrogram-canvas');
  const gl = canvas.getContext('webgl') || 
             canvas.getContext('experimental-webgl');
  ```
- **Required Extensions**:
  - `OES_texture_float`
  - `OES_standard_derivatives`
  - `EXT_frag_depth`

### 1.2 Texture Configuration
- **Texture Format**: RGBA8 (WebGL 1.0 compatible)
- **Texture Dimensions**: 256x256 pixels
- **Texture Parameters**:
  ```javascript
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
  gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
  ```

## 2. Audio Processing

### 2.1 Audio Graph
```
Microphone → GainNode → AnalyserNode → Web Audio Destination
                    ↓
              (gain control)
```

### 2.2 FFT Configuration
- **FFT Size**: 2048 (default), configurable to [1024, 4096, 8192]
- **Smoothing Time Constant**: 0.8
- **Windowing Function**: Hann (default), with support for Hamming, Rectangular, Blackman

## 3. Shader Programs

### 3.1 Vertex Shader
```glsl
attribute vec2 position;
attribute vec2 texCoord;

uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D audioTexture;
uniform float timeOffset;
uniform float heightScale;

varying vec4 vColor;

void main() {
    // Sample audio data
    vec4 audioSample = texture2D(audioTexture, vec2(texCoord.x, texCoord.y + timeOffset));
    
    // Calculate position with height mapping
    vec4 pos = vec4(position.x, audioSample.r * heightScale, position.y, 1.0);
    
    // Transform to clip space
    gl_Position = projectionMatrix * modelViewMatrix * pos;
    
    // Pass color to fragment shader
    vColor = vec4(audioSample.rrr, 1.0);
}
```

### 3.2 Fragment Shader
```glsl
precision mediump float;

varying vec4 vColor;

void main() {
    // Apply colormap (MusicLab style)
    vec3 color = vec3(0.0);
    float value = vColor.r;
    
    // HSV to RGB conversion with MusicLab colormap
    float h = (1.0 - value) * 0.7; // Hue (0.0 to 0.7)
    float s = 0.8;                 // Saturation
    float v = value > 0.1 ? 1.0 : 0.0; // Value with threshold
    
    vec3 hsv = vec3(h, s, v);
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
    
    gl_FragColor = vec4(rgb, 1.0);
}
```

## 4. Texture Update Logic

### 4.1 Data Flow
1. Get frequency data from AnalyserNode
2. Resample to match texture height (logarithmic scale)
3. Update texture column in circular buffer
4. Update time offset for scrolling effect

### 4.2 Implementation
```javascript
updateTexture() {
    if (!this.analyser || !this.frequencyData) return;
    
    // Get frequency data
    this.analyser.getByteFrequencyData(this.frequencyData);
    
    // Create column data buffer (RGBA format)
    const columnData = new Uint8Array(this.meshHeight * 4);
    
    // Resample frequency data with logarithmic mapping
    for (let i = 0; i < this.meshHeight; i++) {
        // Map to logarithmic frequency scale
        const logPos = Math.log2(i + 1) / Math.log2(this.meshHeight);
        const linearPos = Math.floor(logPos * (this.frequencyData.length - 1));
        const value = this.frequencyData[linearPos];
        
        // Store in RGBA format
        const idx = i * 4;
        columnData[idx] = value;     // R
        columnData[idx + 1] = value; // G
        columnData[idx + 2] = value; // B
        columnData[idx + 3] = 255;   // A (fully opaque)
    }
    
    // Update texture
    this.gl.bindTexture(this.gl.TEXTURE_2D, this.texture);
    this.gl.texSubImage2D(
        this.gl.TEXTURE_2D,
        0,                      // level
        this.currentColumn,     // xoffset
        0,                      // yoffset
        1,                      // width
        this.meshHeight,        // height
        this.gl.RGBA,           // format
        this.gl.UNSIGNED_BYTE,  // type
        columnData              // pixels
    );
    
    // Update column position (circular buffer)
    this.currentColumn = (this.currentColumn + 1) % this.meshWidth;
    this.timeOffset = this.currentColumn / this.meshWidth;
}
```

## 5. Error Handling

### 5.1 WebGL Error Checking
```javascript
function checkGLError(gl, context) {
    const error = gl.getError();
    if (error !== gl.NO_ERROR) {
        console.error(`WebGL error in ${context}:`, error);
        return false;
    }
    return true;
}
```

### 5.2 Texture Validation
```javascript
function validateTexture(gl, texture, width, height) {
    if (!texture) {
        console.error('Failed to create WebGL texture');
        return false;
    }
    
    const framebuffer = gl.createFramebuffer();
    gl.bindFramebuffer(gl.FRAMEBUFFER, framebuffer);
    gl.framebufferTexture2D(
        gl.FRAMEBUFFER, 
        gl.COLOR_ATTACHMENT0, 
        gl.TEXTURE_2D, 
        texture, 
        0
    );
    
    const status = gl.checkFramebufferStatus(gl.FRAMEBUFFER);
    gl.bindFramebuffer(gl.FRAMEBUFFER, null);
    gl.deleteFramebuffer(framebuffer);
    
    if (status !== gl.FRAMEBUFFER_COMPLETE) {
        console.error('Framebuffer not complete:', status);
        return false;
    }
    
    return true;
}
```

## 6. Performance Optimization

### 6.1 Memory Management
- Reuse buffers where possible
- Clean up WebGL resources on disposal
- Use `requestAnimationFrame` for rendering
- Implement double buffering for texture updates

### 6.2 Adaptive Quality
- Reduce mesh resolution on mobile devices
- Adjust FFT size based on performance
- Implement frame skipping if necessary

## 7. Browser Compatibility

### 7.1 Feature Detection
```javascript
function checkBrowserCompatibility() {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl') || 
               canvas.getContext('experimental-webgl');
    
    if (!gl) {
        return {
            supported: false,
            reason: 'WebGL not supported'
        };
    }
    
    const extensions = [
        'OES_texture_float',
        'OES_standard_derivatives',
        'EXT_frag_depth'
    ];
    
    const missingExtensions = extensions.filter(ext => !gl.getExtension(ext));
    
    return {
        supported: missingExtensions.length === 0,
        missingExtensions: missingExtensions,
        webGLVersion: gl.getParameter(gl.VERSION)
    };
}
```

## 8. Integration Guide

### 8.1 Initialization
```javascript
const spectrogram = new SpectrogramVisualizer({
    canvas: document.getElementById('spectrogram-canvas'),
    fftSize: 2048,
    smoothingTimeConstant: 0.8,
    minDecibels: -100,
    maxDecibels: -20,
    heightScale: 1.0,
    autoStart: true
});
```

### 8.2 Public API
```javascript
class SpectrogramVisualizer {
    // Start/stop visualization
    start() {}
    stop() {}
    
    // Configuration
    setFFTSize(size) {}
    setSmoothing(value) {}
    setHeightScale(scale) {}
    setDecibelRange(min, max) {}
    
    // Audio control
    setGain(gain) {}
    setMute(muted) {}
    
    // Cleanup
    dispose() {}
}
```

## 9. Troubleshooting

### 9.1 Common Issues
1. **Black Screen**
   - Check WebGL context creation
   - Verify shader compilation
   - Ensure texture data is valid

2. **No Audio**
   - Check microphone permissions
   - Verify audio routing
   - Test with different audio sources

3. **Poor Performance**
   - Reduce mesh resolution
   - Lower FFT size
   - Enable frame skipping

## 10. References
- WebGL 1.0 Specification
- Web Audio API Specification
- Chrome Music Lab Spectrogram Implementation
- WebGL Best Practices

## 11. Version History
- v2.0 (2025-08-27): Complete rewrite with WebGL 1.0 compatibility
- v1.0: Initial implementation

## 12. License
MIT License - See LICENSE file for details
