/*
 Enhanced Spectrogram - Web Audio + Canvas
 - Real-time mic input with overlapping windows
 - Professional frequency grid and time axis
 - Improved color mapping with better dynamic range
 - Windowing functions for cleaner analysis
 - Velocity control functionality with turtle/car/rocket speed settings
*/

// ---------- DOM ----------
function safeGetElement(id) {
    const el = document.getElementById(id);
    if (!el) console.warn(`Element not found: ${id}`);
    return el;
  }
  
  const els = {
    micToggle: safeGetElement('micToggle'),
    
    deviceSelect: safeGetElement('deviceSelect'),
    fftSize: safeGetElement('fftSize'),
    colormap: safeGetElement('colormap'),
    floorDb: safeGetElement('floorDb'),
    overlayBands: safeGetElement('overlayBands'),
    startBtn: safeGetElement('startBtn'),
    stopBtn: safeGetElement('stopBtn'),
    snapshotBtn: safeGetElement('snapshotBtn'),
    timeBtn: safeGetElement('timeBtn'),
    spec2d: safeGetElement('spec2d'),
    spec3d: safeGetElement('spec3d'),
    overlay: safeGetElement('overlay'),
    scaleCanvas: safeGetElement('scaleCanvas'),
    readout: safeGetElement('readout'),
  };
  
  // ---------- Enhanced State ----------
  let audioCtx, analyser, mediaStream, sourceNode, rafId;
  let freqData; // Float32Array of dB values from analyser
  let lastColumn = []; // last rendered column values in dB (mapped rows)
  let timeBuffer = []; // circular buffer for overlapping windows
  let bufferIndex = 0;
  let windowFunction = []; // Hann window for better frequency resolution
  
  // 3D WebGL State
  let gl = null;
  let webgl3DRenderer = null;
  let use3D = false; // Start in 2D; user can toggle to 3D
  
  // Frequency mapping cache (row -> bin index)
  let rowToBin = [];
  
  // Time tracking for axis labels
  let startTime = 0;
  let currentTime = 0;
  
  // ---------- Google's Logarithmic Scale Utils (from util.js) ----------
  const LogScale = {
    a: 1,
    b: 1,
    setLogScale: function(x1, y1, x2, y2) {
      this.b = Math.log(y1/y2) / (x1-x2);
      this.a = y1 / Math.exp(this.b * x1);
    },
    lin2log: function(x) {
      return this.a * Math.exp(this.b * x);
    },
    log2lin: function(y) {
      return Math.log(y / this.a) / this.b;
    }
  };
  
  // Initialize Google's frequency mapping (20Hz to 20kHz)
  LogScale.setLogScale(20, 20, 20000, 20000);
  
  // ---------- Matrix4x4 Math (from Google's matrix4x4.js) ----------
  class Matrix4x4 {
    constructor() {
      this.elements = new Float32Array(16);
      this.loadIdentity();
    }
    
    loadIdentity() {
      const m = this.elements;
      for (let i = 0; i < 16; i++) m[i] = 0;
      m[0] = m[5] = m[10] = m[15] = 1;
    }
    
    perspective(fovy, aspect, near, far) {
      const f = 1.0 / Math.tan(fovy * Math.PI / 360);
      const nf = 1 / (near - far);
      const m = this.elements;
      
      m[0] = f / aspect; m[1] = 0; m[2] = 0; m[3] = 0;
      m[4] = 0; m[5] = f; m[6] = 0; m[7] = 0;
      m[8] = 0; m[9] = 0; m[10] = (far + near) * nf; m[11] = -1;
      m[12] = 0; m[13] = 0; m[14] = 2 * far * near * nf; m[15] = 0;
    }
    
    translate(x, y, z) {
      const m = this.elements;
      m[12] += m[0] * x + m[4] * y + m[8] * z;
      m[13] += m[1] * x + m[5] * y + m[9] * z;
      m[14] += m[2] * x + m[6] * y + m[10] * z;
      m[15] += m[3] * x + m[7] * y + m[11] * z;
    }
    
    rotate(angle, x, y, z) {
      const rad = angle * Math.PI / 180;
      const c = Math.cos(rad);
      const s = Math.sin(rad);
      const len = Math.sqrt(x*x + y*y + z*z);
      if (len === 0) return;
      
      x /= len; y /= len; z /= len;
      const nc = 1 - c;
      
      const m = this.elements;
      const m00 = m[0], m01 = m[1], m02 = m[2], m03 = m[3];
      const m10 = m[4], m11 = m[5], m12 = m[6], m13 = m[7];
      const m20 = m[8], m21 = m[9], m22 = m[10], m23 = m[11];
      
      const r00 = x*x*nc + c, r01 = y*x*nc + z*s, r02 = z*x*nc - y*s;
      const r10 = x*y*nc - z*s, r11 = y*y*nc + c, r12 = z*y*nc + x*s;
      const r20 = x*z*nc + y*s, r21 = y*z*nc - x*s, r22 = z*z*nc + c;
      
      m[0] = m00*r00 + m10*r01 + m20*r02;
      m[1] = m01*r00 + m11*r01 + m21*r02;
      m[2] = m02*r00 + m12*r01 + m22*r02;
      m[3] = m03*r00 + m13*r01 + m23*r02;
      m[4] = m00*r10 + m10*r11 + m20*r12;
      m[5] = m01*r10 + m11*r11 + m21*r12;
      m[6] = m02*r10 + m12*r11 + m22*r12;
      m[7] = m03*r10 + m13*r11 + m23*r12;
      m[8] = m00*r20 + m10*r21 + m20*r22;
      m[9] = m01*r20 + m11*r21 + m21*r22;
      m[10] = m02*r20 + m12*r21 + m22*r22;
      m[11] = m03*r20 + m13*r21 + m23*r22;
    }
    
    multiply(other) {
      const a = this.elements;
      const b = other.elements;
      const result = new Float32Array(16);
      
      for (let i = 0; i < 4; i++) {
        for (let j = 0; j < 4; j++) {
          result[i*4 + j] = 0;
          for (let k = 0; k < 4; k++) {
            result[i*4 + j] += a[i*4 + k] * b[k*4 + j];
          }
        }
      }
      
      for (let i = 0; i < 16; i++) {
        this.elements[i] = result[i];
      }
    }
  }
  
  // Enhanced rendering parameters
  const OVERLAP_FACTOR = 4; // 75% overlap
  let TIME_WINDOW_SEC = 10; // Show N seconds of history (configurable)
  // Shared frequency mapping exponent (must match render/grid/tooltip)
  // True logarithmic placement for accurate highs
  const FREQ_EXP = 1.0;
  
  // ---------- 3D WebGL Renderer (Google Chrome Music Lab Style) ----------
  class WebGL3DRenderer {
    constructor(canvas) {
      this.canvas = canvas;
      
      // Validate canvas readiness
      if (!canvas || !canvas.getContext) {
        throw new Error('Invalid canvas element');
      }
      // Force-reset any previous context state
      canvas.width = canvas.width;
  
      // Prefer robust attribute set; try multiple context IDs
      const contextAttributes = {
        alpha: false,
        depth: true,
        stencil: false,
        antialias: true,
        premultipliedAlpha: false,
        preserveDrawingBuffer: false
      };
  
      this.gl = canvas.getContext('webgl', contextAttributes)
        || canvas.getContext('experimental-webgl', contextAttributes)
        || canvas.getContext('webkit-3d', contextAttributes)
        || canvas.getContext('moz-webgl', contextAttributes);
  
      if (!this.gl) {
        console.error('WebGL context creation failed');
        console.log('Canvas:', canvas);
        console.log('Canvas width/height:', canvas.width, canvas.height);
        throw new Error('WebGL not supported - context creation failed');
      }
  
      console.log('WebGL context created successfully');
  
      // Vertex textures diagnostic (relax requirement; attempt fallback if 0)
      const maxVertexTextures = this.gl.getParameter(this.gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS);
      console.log('Max vertex texture units:', maxVertexTextures);
      this.hasVertexTextures = maxVertexTextures > 0;
      if (!this.hasVertexTextures) {
        console.warn('No vertex texture units; continuing with fallback-friendly path');
        // Do not throw; shaders/techniques should avoid vertex texture sampling when 0
      }
      
      // Google's settings
      this.sonogram3DWidth = 256;
      this.sonogram3DHeight = 256;
      this.sonogram3DGeometrySize = 9.5;
      this.TEXTURE_HEIGHT = 256;
      this.yOffset = 0;
      
      // Camera rotated to show time on X-axis, frequency on Z-axis
      this.camera = {
        xRot: -45,   // Look down at terrain
        yRot: 90,    // Rotate 90° to swap X and Z axes visually
        zRot: 0,     // No roll
        xT: 0,       // Centered horizontally
        yT: 0,       // Centered vertically  
        zT: -15      // Back away to see full terrain
      };
      
      this.dragging = false;
      this.lastX = 0;
      this.lastY = 0;
      this.scaleFactor = 3.0;
      
      this.init();
    }
    
    init() {
      const gl = this.gl;
      
      // Google's background color
      gl.clearColor(0.08, 0.08, 0.08, 1.0);
      gl.enable(gl.DEPTH_TEST);
      
      this.createShaders();
      this.createMesh();
      this.createTexture();
      this.setupEventListeners();
    }
    
    createShaders() {
      const gl = this.gl;
      
      // Google's vertex shader (adapted: logarithmic frequency sampling)
      const vertexShaderSource = `
        attribute vec3 gPosition;
        attribute vec2 gTexCoord0;
        uniform sampler2D vertexFrequencyData;
        uniform float vertexYOffset;
        uniform mat4 worldViewProjection;
        uniform float verticalScale;
        uniform float uLogR; // frequency ratio = nyquist / fMin (e.g., 24000/20)
        
        varying vec2 texCoord;
        varying vec3 color;
        
        // Google's HSV to RGB conversion
        vec3 convertHSVToRGB(float hue, float saturation, float lightness) {
          float chroma = lightness * saturation;
          float hueDash = hue / 60.0;
          float x = chroma * (1.0 - abs(mod(hueDash, 2.0) - 1.0));
          vec3 hsv = vec3(0.0);
          
          if(hueDash < 1.0) {
            hsv.r = chroma;
            hsv.g = x;
          } else if (hueDash < 2.0) {
            hsv.r = x;
            hsv.g = chroma;
          } else if (hueDash < 3.0) {
            hsv.g = chroma;
            hsv.b = x;
          } else if (hueDash < 4.0) {
            hsv.g = x;
            hsv.b = chroma;
          } else if (hueDash < 5.0) {
            hsv.r = x;
            hsv.b = chroma;
          } else if (hueDash < 6.0) {
            hsv.r = chroma;
            hsv.b = x;
          }
          
          return hsv;
        }
        
        void main() {
          // Log-frequency sampling across texture width for perceptual spacing
          // Map display x in [0,1] to normalized texture coord u in [0,1]
          // using normalized exponential curve with ratio r = uLogR = nyquist/fMin:
          // u = (r^x - 1) / (r - 1)
          float u = (pow(uLogR, gTexCoord0.x) - 1.0) / (uLogR - 1.0);
          vec4 sample = texture2D(vertexFrequencyData, vec2(u, gTexCoord0.y + vertexYOffset));
          vec4 newPosition = vec4(gPosition.x, gPosition.y + verticalScale * sample.a, gPosition.z, 1.0);
          gl_Position = worldViewProjection * newPosition;
          texCoord = gTexCoord0;
          
          float hue = 360.0 - ((newPosition.y / verticalScale) * 360.0);
          color = convertHSVToRGB(hue, 1.0, 1.0);
        }
      `;
      
      // Google's fragment shader (sonogram-fragment.shader)
      const fragmentShaderSource = `
        precision mediump float;
        
        varying vec2 texCoord;
        varying vec3 color;
        
        uniform vec4 backgroundColor;
        
        void main() {
          // Google's fade effect
          float fade = pow(cos((1.0 - texCoord.y) * 0.5 * 3.1415926535), 0.5);
          gl_FragColor = backgroundColor + vec4(fade * color, 1.0);
        }
      `;
      
      this.program = this.createProgram(vertexShaderSource, fragmentShaderSource);
      
      // Get locations
      this.locations = {
        position: gl.getAttribLocation(this.program, 'gPosition'),
        texCoord: gl.getAttribLocation(this.program, 'gTexCoord0'),
        vertexFrequencyData: gl.getUniformLocation(this.program, 'vertexFrequencyData'),
        vertexYOffset: gl.getUniformLocation(this.program, 'vertexYOffset'),
        worldViewProjection: gl.getUniformLocation(this.program, 'worldViewProjection'),
        verticalScale: gl.getUniformLocation(this.program, 'verticalScale'),
        backgroundColor: gl.getUniformLocation(this.program, 'backgroundColor'),
        uLogR: gl.getUniformLocation(this.program, 'uLogR'),
      };
    }
    
    createProgram(vertexSource, fragmentSource) {
      const gl = this.gl;
      
      const vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
      const fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
      
      const program = gl.createProgram();
      gl.attachShader(program, vertexShader);
      gl.attachShader(program, fragmentShader);
      gl.linkProgram(program);
      
      if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
        console.error('Program link error:', gl.getProgramInfoLog(program));
        return null;
      }
      
      return program;
    }
    
    createShader(type, source) {
      const gl = this.gl;
      const shader = gl.createShader(type);
      gl.shaderSource(shader, source);
      gl.compileShader(shader);
      
      if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
        console.error('Shader compilation error:', gl.getShaderInfoLog(shader));
        gl.deleteShader(shader);
        return null;
      }
      
      return shader;
    }
    
    createMesh() {
      const gl = this.gl;
      const width = this.sonogram3DWidth;
      const height = this.sonogram3DHeight;
      const size = this.sonogram3DGeometrySize;
      
      // Google's mesh generation - corrected coordinate system
      // X = time (left-right), Z = frequency (front-back), Y = amplitude (up-down)
      const vertices = new Float32Array(width * height * 3);
      const texCoords = new Float32Array(width * height * 2);
      
      for (let z = 0; z < height; z++) {
        for (let x = 0; x < width; x++) {
          const index = width * z + x;
          
          // Google's EXACT coordinate system - DON'T CHANGE THIS!
          vertices[3 * index + 0] = size * (x - width / 2) / width;   // X: frequency axis (x loop)  
          vertices[3 * index + 1] = 0;                                // Y: amplitude (modified by shader)
          vertices[3 * index + 2] = size * (z - height / 2) / height; // Z: time axis (z loop)
          
          // Google's EXACT texture coordinate mapping
          texCoords[2 * index + 0] = x / (width - 1);   // gTexCoord0.x = frequency (x loop)
          texCoords[2 * index + 1] = z / (height - 1);  // gTexCoord0.y = time (z loop)
        }
      }
      
      // Generate indices
      const indices = new Uint16Array((width - 1) * (height - 1) * 6);
      let idx = 0;
      for (let z = 0; z < height - 1; z++) {
        for (let x = 0; x < width - 1; x++) {
          const topLeft = z * width + x;
          const topRight = topLeft + 1;
          const bottomLeft = (z + 1) * width + x;
          const bottomRight = bottomLeft + 1;
          
          indices[idx++] = topLeft;
          indices[idx++] = topRight;
          indices[idx++] = bottomRight;
          indices[idx++] = topLeft;
          indices[idx++] = bottomRight;
          indices[idx++] = bottomLeft;
        }
      }
      
      this.numIndices = indices.length;
      
      // Create buffers
      this.vertexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, vertices, gl.STATIC_DRAW);
      
      this.texCoordBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);
      
      this.indexBuffer = gl.createBuffer();
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }
    
    setupEventListeners() {
      const canvas = this.canvas;
      
      canvas.addEventListener('mousedown', (e) => {
        this.dragging = true;
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        e.preventDefault();
      });
      
      canvas.addEventListener('mouseup', () => {
        this.dragging = false;
      });
      
      canvas.addEventListener('mousemove', (e) => {
        if (!this.dragging) return;
        
        const deltaX = (this.lastX - e.clientX) / this.scaleFactor;
        const deltaY = (this.lastY - e.clientY) / this.scaleFactor;
        
        // Google's rotation logic
        this.camera.yRot = (this.camera.yRot + deltaX) % 360;
        this.camera.xRot = Math.max(-90, Math.min(90, this.camera.xRot + deltaY));
        
        this.lastX = e.clientX;
        this.lastY = e.clientY;
        
        e.preventDefault();
      });
    }
    
    updateTexture(frequencyData) {
      const gl = this.gl;
      
      // Ensure texture width matches current analyser bin count
      if (!this.textureWidth || this.textureWidth !== frequencyData.length) {
        const binCount = frequencyData.length;
        this.textureWidth = binCount;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        const emptyData = new Uint8Array(binCount * this.TEXTURE_HEIGHT);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, binCount, this.TEXTURE_HEIGHT, 0, gl.ALPHA, gl.UNSIGNED_BYTE, emptyData);
      }
      
      // Convert float frequency data to uint8 for texture
      const uint8Data = new Uint8Array(frequencyData.length);
      const minDb = analyser.minDecibels;
      const maxDb = analyser.maxDecibels;
      
      for (let i = 0; i < frequencyData.length; i++) {
        const normalized = (frequencyData[i] - minDb) / (maxDb - minDb);
        uint8Data[i] = Math.round(Math.max(0, Math.min(1, normalized)) * 255);
      }
      
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, this.yOffset, frequencyData.length, 1, gl.ALPHA, gl.UNSIGNED_BYTE, uint8Data);
      
      this.yOffset = (this.yOffset + 1) % this.TEXTURE_HEIGHT;
    }
    
    render() {
      const gl = this.gl;
      const canvas = this.canvas;
      
      // Render frame
      
      // Setup viewport
      gl.viewport(0, 0, canvas.width, canvas.height);
      gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
      
      // Use shader program
      gl.useProgram(this.program);
      
      // Setup matrices with corrected transforms
      const projection = new Matrix4x4();
      projection.perspective(45, canvas.width / canvas.height, 0.1, 100);
      
      const view = new Matrix4x4();
      view.translate(this.camera.xT, this.camera.yT, this.camera.zT);
      view.rotate(this.camera.xRot, 1, 0, 0);
      view.rotate(this.camera.yRot, 0, 1, 0);
      view.rotate(this.camera.zRot, 0, 0, 1);
      
      const model = new Matrix4x4();
      // Identity model matrix - transformations handled in view
      
      const mvp = new Matrix4x4();
      mvp.multiply(projection);
      mvp.multiply(view);
      mvp.multiply(model);
      
      // Set uniforms
      gl.uniformMatrix4fv(this.locations.worldViewProjection, false, mvp.elements);
      gl.uniform1i(this.locations.vertexFrequencyData, 0);
      gl.uniform1f(this.locations.vertexYOffset, this.yOffset / (this.TEXTURE_HEIGHT - 1));
      gl.uniform1f(this.locations.verticalScale, this.sonogram3DGeometrySize / 3.5);
      gl.uniform4f(this.locations.backgroundColor, 0.08, 0.08, 0.08, 1.0);
      // Log frequency ratio r = fMax/fMin for logarithmic sampling. Use fMin=20 Hz.
      const fMin = 20.0;
      const nyquist = (audioCtx && audioCtx.sampleRate) ? (audioCtx.sampleRate/2) : 22050;
      const ratio = nyquist / fMin;
      gl.uniform1f(this.locations.uLogR, ratio);
      
      // Bind texture
      gl.activeTexture(gl.TEXTURE0);
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      // Bind vertex attributes
      gl.bindBuffer(gl.ARRAY_BUFFER, this.vertexBuffer);
      gl.enableVertexAttribArray(this.locations.position);
      gl.vertexAttribPointer(this.locations.position, 3, gl.FLOAT, false, 0, 0);
      
      gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
      gl.enableVertexAttribArray(this.locations.texCoord);
      gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);
      
      // Draw elements
      gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
      gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
      
      // Cleanup
      gl.disableVertexAttribArray(this.locations.position);
      gl.disableVertexAttribArray(this.locations.texCoord);
    }
    
    createTexture() {
      const gl = this.gl;
      
      // Create texture for frequency data (Google's approach)
      this.texture = gl.createTexture();
      gl.bindTexture(gl.TEXTURE_2D, this.texture);
      
      // Google's texture parameters
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
      gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
      
      // Allocate texture memory to exactly analyser bin count when available
      const binCount = (typeof analyser !== 'undefined' && analyser && analyser.frequencyBinCount) ? analyser.frequencyBinCount : 2048;
      this.textureWidth = binCount;
      const emptyData = new Uint8Array(binCount * this.TEXTURE_HEIGHT);
      gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, binCount, this.TEXTURE_HEIGHT, 0, gl.ALPHA, gl.UNSIGNED_BYTE, emptyData);
    }
  }
  
  // Temporal smoothing disabled to preserve detail (can be re-enabled)
  const TEMPORAL_SMOOTH = 0.0;
  let prevSpectrum = null;           // previous processed spectrum
  let lastRenderedSpectrum = null;   // last spectrum actually drawn (for interpolation)
  
  // Manual FFT buffers
  let hopSize = 0;
  let sampleWindow = null; // size = analyser.fftSize
  
  // 7-band guide frequencies (Hz) - consistent order low->high
  const bandEdges = [20, 60, 250, 500, 2000, 4000, 10000, 20000];
  const bandColors = ['#ff3b30','#ff9f0a','#ffd60a','#34c759','#32ade6','#5856d6','#bf5af2'];
  
  // Removed Speed control; scrolling uses fixed pixels-per-second derived from TIME_WINDOW_SEC
  
  // MATLAB-style chirp wrapper: methods linear | quadratic | logarithmic | hyperbolic
  function generateChirp(sr, durSec, f0, f1, method, phaseDeg, levelDb){
    const n = Math.floor(sr*durSec); const out = new Float32Array(n);
    const amp = dbToLin(levelDb);
    const phi0 = (phaseDeg||0) * Math.PI/180;
    const T = durSec;
    const df = (f1 - f0);
    for (let i=0;i<n;i++){
      const t = i/sr;
      let phase = 0;
      switch ((method||'linear').toLowerCase()){
        case 'linear': {
          // phi(t) = 2π ( f0 t + (df/2T) t^2 )
          phase = 2*Math.PI*( f0*t + 0.5*df*(t*t/T) );
          break;
        }
        case 'quadratic': {
          // f(t) = f0 + df*(t/T)^2 -> phi(t) = 2π( f0 t + df/(3T^2) t^3 )
          phase = 2*Math.PI*( f0*t + (df/(3*T*T))*t*t*t );
          break;
        }
        case 'logarithmic': {
          // Exponential frequency sweep
          const ratio = (f1<=0 || f0<=0) ? 1 : (f1/f0);
          const K = (ratio===1) ? 0 : (Math.log(ratio)/T);
          // phi(t) = 2π * (f0/K) (e^{K t} - 1)
          if (Math.abs(K) < 1e-12) {
            phase = 2*Math.PI*f0*t;
          } else {
            phase = 2*Math.PI*( (f0/K)*(Math.exp(K*t) - 1) );
          }
          break;
        }
        case 'hyperbolic': {
          // f(t) = (f0 f1 T) / (f1 T + (f0 - f1) t)
          const a = f0*f1*T;
          const b = f1*T;
          const c = (f0 - f1);
          // phi(t) = 2π * (a/c) * ln(b + c t) + C ; set C so phi(0)=0
          const denom0 = b;
          const denomt = b + c*t;
          if (Math.abs(c) < 1e-12 || denom0<=0 || denomt<=0){
            phase = 2*Math.PI*f0*t; // fallback
          } else {
            phase = 2*Math.PI * (a/c) * Math.log(denomt/denom0);
          }
          break;
        }
        default: {
          // fallback linear
          phase = 2*Math.PI*( f0*t + 0.5*df*(t*t/T) );
        }
      }
      out[i] = amp * Math.sin(phi0 + phase);
    }
    return out;
  }
  // Time-based scrolling accumulator
  let frameSkipCounter = 0;
  let lastRenderTimeMs = 0;
  let pixelAccumulator = 0;
  
  // ---------- Utils ----------
  function clamp(v, min, max){ return Math.max(min, Math.min(max, v)); }
  function lerp(a,b,t){ return a + (b-a)*t; }
  function hexToRgb(hex){
    const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return m ? [parseInt(m[1],16), parseInt(m[2],16), parseInt(m[3],16)] : [0,0,0];
  }
  
  // Enhanced colormaps with better dynamic range
  // Chrome Music Lab inspired color mapping - more vibrant and saturated
  const infernoAnchors = [
    [0.0, [5, 5, 15]],
    [0.1, [25, 15, 50]],
    [0.2, [45, 25, 85]],
    [0.3, [70, 15, 115]],
    [0.4, [100, 25, 125]],
    [0.5, [140, 40, 125]],
    [0.6, [200, 70, 100]],
    [0.7, [240, 110, 80]],
    [0.8, [255, 160, 25]],
    [0.9, [255, 200, 70]],
    [1.0, [255, 255, 180]]
  ];
  
  const viridisAnchors = [
    [0.0, [68, 1, 84]],
    [0.1, [59, 82, 139]],
    [0.2, [33, 145, 140]],
    [0.3, [94, 201, 98]],
    [0.4, [194, 223, 62]],
    [0.5, [253, 231, 37]],
    [0.6, [240, 249, 33]],
    [0.7, [202, 252, 51]],
    [0.8, [144, 215, 67]],
    [0.9, [94, 201, 98]],
    [1.0, [253, 231, 37]]
  ];
  
  // Additional perceptual colormaps (approximated anchors)
  const magmaAnchors = [
    [0.0, [0, 0, 3]],
    [0.1, [28, 16, 68]],
    [0.2, [79, 18, 123]],
    [0.3, [129, 37, 129]],
    [0.4, [181, 54, 122]],
    [0.5, [229, 80, 100]],
    [0.6, [251, 135, 97]],
    [0.7, [252, 181, 121]],
    [0.8, [252, 213, 160]],
    [0.9, [252, 236, 200]],
    [1.0, [252, 252, 253]]
  ];
  
  const plasmaAnchors = [
    [0.0, [13, 8, 135]],
    [0.1, [75, 3, 161]],
    [0.2, [125, 3, 168]],
    [0.3, [168, 34, 150]],
    [0.4, [203, 70, 121]],
    [0.5, [232, 113, 84]],
    [0.6, [249, 155, 57]],
    [0.7, [254, 196, 45]],
    [0.8, [240, 234, 67]],
    [0.9, [204, 248, 95]],
    [1.0, [240, 249, 33]]
  ];
  
  const cividisAnchors = [
    [0.0, [0, 32, 77]],
    [0.1, [0, 42, 104]],
    [0.2, [40, 52, 127]],
    [0.3, [84, 62, 134]],
    [0.4, [124, 74, 128]],
    [0.5, [159, 88, 112]],
    [0.6, [188, 106, 88]],
    [0.7, [210, 129, 62]],
    [0.8, [224, 158, 38]],
    [0.9, [231, 190, 25]],
    [1.0, [236, 220, 38]]
  ];
  
  // Google Chrome Music Lab exact HSV-based colormap
  const musiclabAnchors = [
    [0.0, [10, 0, 20]],     // Black/dark purple (silence)
    [0.1, [128, 0, 128]],   // Purple (hue ~300°)
    [0.2, [0, 0, 255]],     // Blue (hue 240°)
    [0.35, [0, 128, 255]],  // Light blue
    [0.5, [0, 255, 255]],   // Cyan (hue 180°)
    [0.65, [0, 255, 128]],  // Spring green
    [0.8, [0, 255, 0]],     // Green (hue 120°)
    [0.9, [128, 255, 0]],   // Yellow-green
    [0.95, [255, 255, 0]],  // Yellow (hue 60°)
    [1.0, [255, 128, 0]]    // Orange-red (hue 30°)
  ];
  
  function buildLUT(name, size=256){
    let anchors = infernoAnchors;
    if (name === 'viridis') anchors = viridisAnchors;
    else if (name === 'magma') anchors = magmaAnchors;
    else if (name === 'plasma') anchors = plasmaAnchors;
    else if (name === 'cividis') anchors = cividisAnchors;
    else if (name === 'musiclab') anchors = musiclabAnchors;
    const out = new Uint8ClampedArray(size*4);
    for(let i=0;i<size;i++){
      const t = i/(size-1);
      // Chrome Music Lab style: slight contrast enhancement
      const correctedT = Math.pow(t, 0.9);
      
      // find bracket
      let a=anchors[0], b=anchors[anchors.length-1];
      for(let j=1;j<anchors.length;j++){
        if(correctedT <= anchors[j][0]){ b = anchors[j]; a = anchors[j-1]; break; }
      }
      const span = (b[0]-a[0]) || 1e-6;
      const lt = clamp((correctedT - a[0]) / span, 0, 1);
      const rgb = [
        Math.round(lerp(a[1][0], b[1][0], lt)),
        Math.round(lerp(a[1][1], b[1][1], lt)),
        Math.round(lerp(a[1][2], b[1][2], lt))
      ];
      const k=i*4; out[k]=rgb[0]; out[k+1]=rgb[1]; out[k+2]=rgb[2]; out[k+3]=255;
    }
    return out;
  }
  
  let lut = buildLUT(els.colormap.value);
  
  // Create Hann window function
  function createHannWindow(size) {
    const window = new Float32Array(size);
    for (let i = 0; i < size; i++) {
      window[i] = 0.5 * (1 - Math.cos(2 * Math.PI * i / (size - 1)));
    }
    return window;
  }
  
  function drawScale(){
    const ctx = els.scaleCanvas.getContext('2d');
    const w = els.scaleCanvas.width, h=els.scaleCanvas.height;
    const img = ctx.createImageData(w,h);
    for(let y=0;y<h;y++){
      const t = 1 - y/(h-1);
      const cIdx = Math.round(t*255)*4;
      for(let x=0;x<w;x++){
        const k = (y*w + x)*4;
        img.data[k]=lut[cIdx];
        img.data[k+1]=lut[cIdx+1];
        img.data[k+2]=lut[cIdx+2];
        img.data[k+3]=255;
      }
    }
    ctx.putImageData(img,0,0);
  }
  
  // ---------- Settings (mic-only) ----------
  function saveSettings(){
    try {
      if (els.fftSize) localStorage.setItem('spec_fft', els.fftSize.value);
      if (els.colormap) localStorage.setItem('spec_cmap', els.colormap.value);
      if (els.floorDb) localStorage.setItem('spec_floor', els.floorDb.value);
      if (els.overlayBands) localStorage.setItem('spec_overlay', els.overlayBands.checked ? '1':'0');
      if (els.timeBtn) localStorage.setItem('spec_time', String(TIME_WINDOW_SEC));
      localStorage.setItem('spec_view', use3D ? '3d' : '2d');
    } catch (_) {}
  }
  
  function loadSettings(){
    try {
      const fft = localStorage.getItem('spec_fft'); if(fft && els.fftSize) els.fftSize.value=fft;
      const cm = localStorage.getItem('spec_cmap'); if(cm && els.colormap) els.colormap.value=cm;
      const fl = localStorage.getItem('spec_floor'); if(fl && els.floorDb) els.floorDb.value=fl;
      const ov = localStorage.getItem('spec_overlay'); if(ov!==null && els.overlayBands) els.overlayBands.checked = (ov==='1');
      const tw = localStorage.getItem('spec_time'); if (tw) TIME_WINDOW_SEC = parseInt(tw, 10) || 10;
      const vm = localStorage.getItem('spec_view');
      if (vm === '3d') use3D = true; else if (vm === '2d') use3D = false;
      updateTimeButton();
    } catch (_) {}
  }
  
  // ---------- Mic-only source management ----------
  
  function updateSourceUI(){
    // No-op: mic-only
  }
  
  async function listDevices(){
    const devices = await navigator.mediaDevices.enumerateDevices();
    const audioIns = devices.filter(d=>d.kind==='audioinput');
    els.deviceSelect.innerHTML = '';
    audioIns.forEach((d,i)=>{
      const opt = document.createElement('option');
      opt.value = d.deviceId; opt.textContent = d.label || `Input ${i+1}`;
      els.deviceSelect.appendChild(opt);
    });
  }
  
  async function start(){
    console.log('Start button clicked');
    saveSettings();
    els.startBtn.disabled = true; els.stopBtn.disabled = false;
    if (els.micToggle) els.micToggle.textContent = '⏸️ Stop Mic';
    
    console.log('Creating audio context...');
    if(!audioCtx) audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    console.log('Audio context state:', audioCtx.state);
    
    // Ensure context is running (autoplay policies)
    if (audioCtx.state !== 'running') {
      try { await audioCtx.resume(); console.log('Audio context resumed'); } catch(e) { console.error('Resume error:', e); }
    }
    
    // Do not force 3D here; respect current toggle state
  
    // Clean any previous graph
    if (sourceNode) { try{ sourceNode.disconnect(); }catch(_){} }
    if (mediaStream) { try{ mediaStream.getTracks().forEach(t=>t.stop()); }catch(_){} mediaStream = null; }
    // Always use microphone
      console.log('Setting up microphone...');
      const deviceId = els.deviceSelect.value || undefined;
      console.log('Device ID:', deviceId);
      
      mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: { 
          deviceId: deviceId ? { exact: deviceId } : undefined,
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }, 
        video: false
      });
      console.log('Got media stream:', mediaStream);
      
      // Update device list with actual names now that we have permission
      await listDevices();
      
      sourceNode = audioCtx.createMediaStreamSource(mediaStream);
      console.log('Created source node:', sourceNode);
      
      makeAnalyser();
      console.log('Made analyser:', analyser);
      
      sourceNode.connect(analyser);
      console.log('Connected source to analyser');
    
  
    startTime = audioCtx.currentTime;
    currentTime = startTime;
    
    // Try to initialize 3D renderer
    if (use3D && !webgl3DRenderer) {
      // Using els.spec3d canvas
      requestAnimationFrame(() => {
        try {
          console.log('Initializing 3D WebGL renderer (deferred)...');
          if (!els.spec3d) {
            throw new Error('3D canvas not found');
          }
          webgl3DRenderer = new WebGL3DRenderer(els.spec3d);
          console.log('3D renderer initialized successfully');
          // Keep 3D canvas hidden and render offscreen; show 2D + overlay
          els.spec2d.style.display = 'block';
          els.spec3d.style.display = 'none';
          if (els.overlay) els.overlay.style.display = 'block';
          // Update button text (no change in UX for now)
          const view3DToggle = document.getElementById('view3DToggle');
          if (view3DToggle) view3DToggle.textContent = '🖼️ 2D';
          onResize();
        } catch (e) {
          console.warn('3D initialization failed, falling back to 2D:', e.message);
          use3D = false;
          webgl3DRenderer = null;
          // Show 2D canvas, hide 3D canvas, restore overlay
          els.spec2d.style.display = 'block';
          // Using els.spec3d canvas
          if (els.spec3d) els.spec3d.style.display = 'none';
          if (els.overlay) els.overlay.style.display = 'block';
          // Update button text to reflect fallback
          const view3DToggle = document.getElementById('view3DToggle');
          if (view3DToggle) view3DToggle.textContent = '🧊 3D';
          onResize();
        }
      });
    }
    
    if (!use3D) {
      console.log('Drawing frequency grid...');
      // Ensure correct visibility when starting in 2D
      // Using els.spec3d canvas
      els.spec2d.style.display = 'block';
      if (els.spec3d) els.spec3d.style.display = 'none';
      if (els.overlay) els.overlay.style.display = 'block';
      // Clear background once for visibility
      const ctx = els.spec2d.getContext('2d');
      if (ctx) { ctx.fillStyle = '#000'; ctx.fillRect(0,0,els.spec2d.width, els.spec2d.height); }
      drawFrequencyGrid();
      onResize();
    }
    
    console.log('Starting animation loop...');
    loop();
  }
  
  function stop(){
    els.startBtn.disabled = false; els.stopBtn.disabled = true;
    if (els.micToggle) els.micToggle.textContent = '🎤 Mic';
    if(rafId) cancelAnimationFrame(rafId);
    if(sourceNode){ try{ sourceNode.disconnect(); }catch(e){} }
    if(mediaStream){ mediaStream.getTracks().forEach(t=>t.stop()); }
    sourceNode = null; mediaStream = null; analyser = null; freqData = null; rowToBin = [];
    timeBuffer = [];
    // Reset scrolling accumulators
    lastRenderTimeMs = 0;
    pixelAccumulator = 0;
    // Reset temporal state
    prevSpectrum = null;
    lastRenderedSpectrum = null;
  }
  
  function loop(){
    if(!analyser) {
      console.warn('No analyser in loop');
      return;
    }
    
    currentTime = audioCtx.currentTime;
  
    // Time-based scrolling calc
    const nowMs = performance.now();
    if (!lastRenderTimeMs) lastRenderTimeMs = nowMs;
    const dtSec = (nowMs - lastRenderTimeMs) / 1000;
    lastRenderTimeMs = nowMs;
  
    // Fetch current frequency data
    analyser.getFloatFrequencyData(freqData);
    // Debug: log first few values occasionally
    if (Math.random() < 0.01) {
      console.log('FreqData sample:', freqData.slice(0, 5));
      console.log('FreqData stats:', {
        min: Math.min(...freqData),
        max: Math.max(...freqData),
        avg: freqData.reduce((a,b) => a+b) / freqData.length,
        length: freqData.length
      });
    }
  
    // Sanitize: replace non-finite values (some browsers may return -Infinity)
    const minDbSafe = analyser ? analyser.minDecibels : -120;
    for (let i = 0; i < freqData.length; i++) {
      if (!isFinite(freqData[i])) freqData[i] = minDbSafe;
    }
  
    // Processing: direct copy for maximum detail (no spatial/bass shaping)
    const processedData = freqData.slice();
  
    // Temporal smoothing (EMA) towards previous frame
    let smoothed = processedData;
    if (!prevSpectrum || prevSpectrum.length !== processedData.length) {
      prevSpectrum = processedData.slice();
    } else {
      smoothed = new Float32Array(processedData.length);
      const a = TEMPORAL_SMOOTH; // weight on previous frame
      for (let i=0;i<processedData.length;i++){
        smoothed[i] = a * prevSpectrum[i] + (1 - a) * processedData[i];
      }
      prevSpectrum = smoothed;
    }
  
    // 3D Rendering Mode
    if (use3D && webgl3DRenderer) {
      console.log('Using 3D rendering path');
      // Update 3D texture and render
      webgl3DRenderer.updateTexture(freqData);
      webgl3DRenderer.render();
      // Mirror 3D canvas into 2D canvas for display
      // Using els.spec3d canvas
      const ctx2d = els.spec2d.getContext('2d');
      if (els.spec3d && ctx2d) {
        // Show 3D canvas directly, hide 2D canvas
        els.spec2d.style.display = 'none';
        if (els.overlay) els.overlay.style.display = 'block';
        els.spec3d.style.display = 'block';
      }
    } else {
      console.log('Using 2D rendering path, use3D:', use3D, 'webgl3DRenderer:', !!webgl3DRenderer);
      // 2D Canvas Fallback
      // Determine how many pixel columns to advance - Chrome Music Lab style smooth scrolling
      const spec = els.spec2d;
      const ctx = spec.getContext('2d');
      if (!ctx || spec.width === 0 || spec.height === 0 || spec.style.display === 'none') {
        console.warn('2D canvas not ready or hidden', {
          hasCtx: !!ctx,
          w: spec.width,
          h: spec.height,
          display: spec.style.display
        });
      }
      const pixelsPerSecond = spec.width / TIME_WINDOW_SEC;
      pixelAccumulator += dtSec * pixelsPerSecond;
      let columnsToRender = Math.floor(pixelAccumulator);
      if (columnsToRender > 0) pixelAccumulator -= columnsToRender;
      // Ensure smooth consistent scrolling
      columnsToRender = clamp(columnsToRender, 0, 8); // smaller steps for smoother animation
  
      const w = spec.width;
      if (columnsToRender > 0) {
        // Scroll existing image left by N pixels
        ctx.drawImage(spec, -columnsToRender, 0);
        // Interpolate spectra across the columns to avoid blocky jumps
        if (!lastRenderedSpectrum || lastRenderedSpectrum.length !== smoothed.length){
          lastRenderedSpectrum = smoothed.slice();
        }
        for (let i = 0; i < columnsToRender; i++) {
          const x = w - columnsToRender + i;
          const t = columnsToRender > 1 ? (i+1)/columnsToRender : 1;
          const interp = new Float32Array(smoothed.length);
          for (let k=0;k<smoothed.length;k++){
            interp[k] = lastRenderedSpectrum[k] + (smoothed[k] - lastRenderedSpectrum[k]) * t;
          }
          renderColumn(interp, x);
        }
        lastRenderedSpectrum = smoothed.slice();
      } else {
        // Live preview at the rightmost column every frame (no scroll)
        renderColumn(smoothed, w - 1);
        lastRenderedSpectrum = smoothed.slice();
      }
    } // End 2D rendering
  
    rafId = requestAnimationFrame(loop);
  }
  
  function renderColumn(freqDb, x){
    const spec = els.spec2d; const ctx = spec.getContext('2d');
    const w = spec.width, h = spec.height;
    
    // Debug rendering occasionally
    if (Math.random() < 0.01) {
      console.log('Rendering column at x:', x, 'canvas size:', w, 'x', h);
      console.log('Sample freqDb values:', freqDb.slice(0, 10));
      console.log('rowToBin sample:', Array.from(rowToBin.slice(0, 10)));
    }
  
    // Compute new column at given x with enhanced processing
    // Harmonize UI floor with analyser range
    const uiFloor = parseFloat(els.floorDb.value);
    const anaMin = analyser ? analyser.minDecibels : -120;
    const anaMax = analyser ? analyser.maxDecibels : -30;
    const floorDb = Math.min(uiFloor, anaMin);
    const ceilDb = anaMax;
    let range = ceilDb - floorDb;
    if (!(range > 0)) range = 1; // avoid div-by-zero
    const colImg = ctx.createImageData(1, h);
    lastColumn.length = h;
    
    for(let y=0;y<h;y++){
      const bin = rowToBin[y] || 0;
      let db = freqDb[bin];
      if(!isFinite(db)) db = floorDb;
      db = clamp(db, floorDb, ceilDb); // clamp to analyser visual range
      lastColumn[y] = db;
      
      // Chrome Music Lab style: enhanced contrast with slight gamma correction
      let t = (db - floorDb) / range; // 0..1
      t = Math.pow(t, 0.8); // slight gamma boost for more vibrant mid-tones
      t = clamp(t, 0, 1);
      
      const idx = Math.round(t * 255) * 4;
      const k = y * 4; // top=high freq, bottom=low freq
      colImg.data[k]   = lut[idx];
      colImg.data[k+1] = lut[idx+1];
      colImg.data[k+2] = lut[idx+2];
      colImg.data[k+3] = 255;
    }
    ctx.putImageData(colImg, x, 0);
  }
  
  function updateColormap(){
    lut = buildLUT(els.colormap.value);
    drawScale();
  }
  
  function onResize(){
    // Keep same pixel resolution, CSS scales width
    const wrap = els.spec2d.parentElement.getBoundingClientRect();
    // Maintain aspect ratio for better time resolution
    const newW = Math.max(800, Math.floor(wrap.width));
    const newH = Math.max(400, Math.floor(wrap.height));
    
    // Using els.spec3d canvas
    
    if(els.spec2d.width !== newW || els.spec2d.height !== newH){
      // Update both 2D and 3D canvas sizes
      els.spec2d.width = newW; els.overlay.width = newW;
      els.spec2d.height = newH; els.overlay.height = newH;
      
      if (els.spec3d) {
        els.spec3d.width = newW;
        els.spec3d.height = newH;
      }
      
      if(audioCtx && analyser) buildRowToBin();
      drawFrequencyGrid();
      
      // Update 3D renderer viewport if active
      if(use3D && webgl3DRenderer) {
        const gl = webgl3DRenderer.gl;
        gl.viewport(0, 0, newW, newH);
      }
    }
  }
  
  function snapshot(){
    const url = els.spec2d.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url; a.download = `spectrogram_${Date.now()}.png`; a.click();
  }
  
  function onMouseMove(ev){
    const rect = els.spec2d.getBoundingClientRect();
    const y = clamp(Math.round(ev.clientY - rect.top), 0, rect.height-1);
    const x = clamp(Math.round(ev.clientX - rect.left), 0, rect.width-1);
    
    // Map to canvas pixel row
    const row = clamp(Math.round((els.spec2d.height-1) * (y/(rect.height-1))), 0, els.spec2d.height-1);
    const nyquist = audioCtx ? audioCtx.sampleRate/2 : 22050;
    // Derive frequency from the actual FFT bin mapped for this row
    const N = analyser ? analyser.frequencyBinCount : 2048;
    const bin = rowToBin[row] || 0;
    // Bin center frequency consistent with buildRowToBin mapping
    const freq = (bin * nyquist) / N;
    
    // Calculate time offset
    const timeOffset = ((rect.width - x) / rect.width) * TIME_WINDOW_SEC;
    
    const db = lastColumn[row] !== undefined ? lastColumn[row].toFixed(1) : '—';
    els.readout.textContent = `Freq: ${freq.toFixed(1)} Hz | Level: ${db} dBFS | Time: -${timeOffset.toFixed(1)}s`;
  }
  
  function handleErrors(e){
    console.error(e);
    alert('Audio error: ' + (e.message || e));
  }
  
  // ---------- Init ----------
  async function init(){
    try{
      loadSettings();
      updateColormap(); drawScale();

      // Skip early permission request - will request when start is clicked
      await listDevices();
      
      // Mic toggle: start/stop microphone capture
      if (els.micToggle){
        els.micToggle.addEventListener('click', () => {
          // If currently running (analyser exists), stop; else start
          if (analyser && mediaStream) {
            stop();
          } else {
            start().catch(handleErrors);
          }
        });
      }

      els.startBtn.addEventListener('click', ()=>start().catch(handleErrors));
      els.stopBtn.addEventListener('click', ()=>stop());
      
      // 3D View toggle
    const view3DToggle = document.getElementById('view3DToggle');
    if (view3DToggle) {
      // Apply initial button text and canvas visibility from stored mode
      view3DToggle.textContent = use3D ? '🖼️ 2D' : '🧊 3D';
      // Using els.spec3d canvas
      if (use3D && els.spec3d) {
        els.spec2d.style.display = 'none';
        els.spec3d.style.display = 'block';
        if (els.overlay) els.overlay.style.display = 'none';
      } else {
        els.spec2d.style.display = 'block';
        if (els.spec3d) els.spec3d.style.display = 'none';
        if (els.overlay) els.overlay.style.display = 'block';
      }
      view3DToggle.addEventListener('click', () => {
        use3D = !use3D;
        view3DToggle.textContent = use3D ? '🖼️ 2D' : '🧊 3D';
          
          // Using els.spec3d canvas
          
          if (use3D && !webgl3DRenderer && analyser && els.spec3d) {
            requestAnimationFrame(() => {
              try {
                webgl3DRenderer = new WebGL3DRenderer(els.spec3d);
                console.log('3D renderer initialized via toggle');
              } catch (e) {
                console.warn('3D initialization failed:', e.message);
                use3D = false;
                view3DToggle.textContent = '🧊 3D';
                alert('3D mode requires WebGL support with vertex textures');
              }
            });
          }
          
          // Switch canvas visibility
          if (use3D && els.spec3d) {
            els.spec2d.style.display = 'none';
            els.spec3d.style.display = 'block';
            if (els.overlay) els.overlay.style.display = 'none';
          } else {
            els.spec2d.style.display = 'block';
            if (els.spec3d) els.spec3d.style.display = 'none';
            if (els.overlay) els.overlay.style.display = 'block';
          }
  
          // Clear and redraw 2D canvas
          const ctx = els.spec2d.getContext('2d');
          ctx.fillStyle = '#000';
          ctx.fillRect(0, 0, els.spec2d.width, els.spec2d.height);
          drawFrequencyGrid();
          onResize();
          // Persist updated view mode
          saveSettings();
      });
    }
      els.snapshotBtn.addEventListener('click', snapshot);
      els.fftSize.addEventListener('change', ()=>{ if(analyser){ makeAnalyser(); } saveSettings(); });
      els.colormap.addEventListener('change', ()=>{ updateColormap(); saveSettings(); });
      els.floorDb.addEventListener('change', saveSettings);
      els.overlayBands.addEventListener('change', ()=>{ drawFrequencyGrid(); saveSettings(); });
      if (els.timeBtn) els.timeBtn.addEventListener('click', toggleTimeWindow);

      window.addEventListener('resize', onResize);
      els.spec2d.addEventListener('mousemove', onMouseMove);

      onResize();
    }catch(e){ handleErrors(e); }
  }
  
  // Speed control removed
  
  function toggleTimeWindow(){
    const options = [5, 10, 15];
    const idx = options.indexOf(TIME_WINDOW_SEC);
    TIME_WINDOW_SEC = options[(idx + 1) % options.length];
    updateTimeButton();
    drawFrequencyGrid();
    saveSettings();
  }
  
  function updateTimeButton(){
    if (!els.timeBtn) return;
    els.timeBtn.setAttribute('data-time', String(TIME_WINDOW_SEC));
    els.timeBtn.title = `Time Window: ${TIME_WINDOW_SEC}s (click to toggle 5/10/15s)`;
  }
  
  
  init();