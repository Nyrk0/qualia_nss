'use strict';

// Shaders (inlined)
const commonVertexShader = `
  attribute vec3 gPosition;
  attribute vec2 gTexCoord0;
  varying vec2 texCoord;
  varying vec3 color;
  void main() {
    gl_Position = vec4(gPosition.x, gPosition.y, gPosition.z, 1.0);
    texCoord = gTexCoord0;
    color = vec3(1.0);
  }
`;

// Simple line shaders for axes/cube
const lineVertexShader = `
  attribute vec3 gPosition;
  uniform mat4 worldViewProjection;
  void main() {
    gl_Position = worldViewProjection * vec4(gPosition, 1.0);
  }
`;

const lineFragmentShader = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  uniform vec4 uColor;
  void main() {
    gl_FragColor = uColor;
  }
`;

const sonogramVertexShader = `
  attribute vec3 gPosition;
  attribute vec2 gTexCoord0;
  uniform sampler2D vertexFrequencyData;
  uniform float vertexYOffset;
  uniform mat4 worldViewProjection;
  uniform float verticalScale;
  uniform float hBase;        // base axis height
  uniform float dbfsOffset;   // calibration offset in dB
  varying vec2 texCoord;
  varying vec3 color;

  vec3 convertHSVToRGB(in float hue, in float saturation, in float lightness) {
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
    float x = pow(256.0, gTexCoord0.x - 1.0);
    vec4 sample = texture2D(vertexFrequencyData, vec2(x, gTexCoord0.y + vertexYOffset));
    // sample.a in [0,1] corresponds to -100..0 dBFS when analyser range is set to [-100, 0]
    float db = -100.0 + sample.a * 100.0;
    float dbCal = clamp(db + dbfsOffset, -100.0, 0.0);
    float y01 = (dbCal + 100.0) / 100.0; // 0..1
    float yScale = verticalScale * hBase;
    vec4 newPosition = vec4(gPosition.x, gPosition.y + yScale * y01, gPosition.z, 1.0);
    gl_Position = worldViewProjection * newPosition;
    texCoord = gTexCoord0;
    // Map hue using normalized height relative to full scaled height
    float hue = 360.0 - (y01 * 360.0);
    color = convertHSVToRGB(hue, 1.0, 1.0);
  }
`;

const sonogramFragmentShader = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  varying vec2 texCoord;
  uniform sampler2D frequencyData;
  uniform float yoffset;

  void main() {
    float x = pow(256.0, texCoord.x - 1.0);
    float y = texCoord.y + yoffset;
    vec4 sample = texture2D(frequencyData, vec2(x, y));
    float k = sample.a;
    // window fade (keeps tail visually pleasing)
    float fade = pow(cos((1.0 - texCoord.y) * 0.5 * 3.1415926535), 0.5);
    float value = k * fade; // 0..1 intensity

    // MusicLab HSV-based colormap
    float h = (1.0 - value) * 0.7; // Hue in [0,0.7]
    float s = 0.8;                 // Saturation
    float v = value > 0.1 ? 1.0 : 0.0; // thresholded value

    vec3 hsv = vec3(h, s, v);
    vec4 K = vec4(1.0, 2.0/3.0, 1.0/3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);

    gl_FragColor = vec4(rgb, 1.0);
  }
`;

// Matrix4x4 class
class Matrix4x4 {
    constructor() {
        this.elements = new Float32Array(16);
        this.loadIdentity();
    }

    scale(sx, sy, sz) {
        this.elements[0] *= sx;
        this.elements[1] *= sx;
        this.elements[2] *= sx;
        this.elements[3] *= sx;
        this.elements[4] *= sy;
        this.elements[5] *= sy;
        this.elements[6] *= sy;
        this.elements[7] *= sy;
        this.elements[8] *= sz;
        this.elements[9] *= sz;
        this.elements[10] *= sz;
        this.elements[11] *= sz;
        return this;
    }

    translate(tx, ty, tz) {
        this.elements[12] += this.elements[0] * tx + this.elements[4] * ty + this.elements[8] * tz;
        this.elements[13] += this.elements[1] * tx + this.elements[5] * ty + this.elements[9] * tz;
        this.elements[14] += this.elements[2] * tx + this.elements[6] * ty + this.elements[10] * tz;
        this.elements[15] += this.elements[3] * tx + this.elements[7] * ty + this.elements[11] * tz;
        return this;
    }

    rotate(angle, x, y, z) {
        let mag = Math.sqrt(x * x + y * y + z * z);
        let sinAngle = Math.sin(angle * Math.PI / 180.0);
        let cosAngle = Math.cos(angle * Math.PI / 180.0);
        if (mag > 0) {
            let xx, yy, zz, xy, yz, zx, xs, ys, zs;
            let oneMinusCos;
            let rotMat = new Matrix4x4();
            x /= mag;
            y /= mag;
            z /= mag;
            xx = x * x;
            yy = y * y;
            zz = z * z;
            xy = x * y;
            yz = y * z;
            zx = z * x;
            xs = x * sinAngle;
            ys = y * sinAngle;
            zs = z * sinAngle;
            oneMinusCos = 1.0 - cosAngle;
            rotMat.elements[0] = (oneMinusCos * xx) + cosAngle;
            rotMat.elements[1] = (oneMinusCos * xy) - zs;
            rotMat.elements[2] = (oneMinusCos * zx) + ys;
            rotMat.elements[3] = 0.0;
            rotMat.elements[4] = (oneMinusCos * xy) + zs;
            rotMat.elements[5] = (oneMinusCos * yy) + cosAngle;
            rotMat.elements[6] = (oneMinusCos * yz) - xs;
            rotMat.elements[7] = 0.0;
            rotMat.elements[8] = (oneMinusCos * zx) - ys;
            rotMat.elements[9] = (oneMinusCos * yz) + xs;
            rotMat.elements[10] = (oneMinusCos * zz) + cosAngle;
            rotMat.elements[11] = 0.0;
            rotMat.elements[12] = 0.0;
            rotMat.elements[13] = 0.0;
            rotMat.elements[14] = 0.0;
            rotMat.elements[15] = 1.0;
            this.multiply(rotMat);
        }
        return this;
    }

    frustum(left, right, bottom, top, nearZ, farZ) {
        let deltaX = right - left;
        let deltaY = top - bottom;
        let deltaZ = farZ - nearZ;
        let frust = new Matrix4x4();
        if ((nearZ <= 0.0) || (farZ <= 0.0) || (deltaX <= 0.0) || (deltaY <= 0.0) || (deltaZ <= 0.0)) return this;
        frust.elements[0] = 2.0 * nearZ / deltaX;
        frust.elements[1] = frust.elements[2] = frust.elements[3] = 0.0;
        frust.elements[5] = 2.0 * nearZ / deltaY;
        frust.elements[4] = frust.elements[6] = frust.elements[7] = 0.0;
        frust.elements[8] = (right + left) / deltaX;
        frust.elements[9] = (top + bottom) / deltaY;
        frust.elements[10] = -(nearZ + farZ) / deltaZ;
        frust.elements[11] = -1.0;
        frust.elements[14] = -2.0 * nearZ * farZ / deltaZ;
        frust.elements[12] = frust.elements[13] = frust.elements[15] = 0.0;
        this.multiply(frust);
        return this;
    }

    perspective(fovy, aspect, nearZ, farZ) {
        let frustumH = Math.tan(fovy / 360.0 * Math.PI) * nearZ;
        let frustumW = frustumH * aspect;
        return this.frustum(-frustumW, frustumW, -frustumH, frustumH, nearZ, farZ);
    }

    ortho(left, right, bottom, top, nearZ, farZ) {
        let deltaX = right - left;
        let deltaY = top - bottom;
        let deltaZ = farZ - nearZ;
        let ortho = new Matrix4x4();
        if ((deltaX == 0.0) || (deltaY == 0.0) || (deltaZ == 0.0)) return this;
        ortho.elements[0] = 2.0 / deltaX;
        ortho.elements[12] = -(right + left) / deltaX;
        ortho.elements[5] = 2.0 / deltaY;
        ortho.elements[13] = -(top + bottom) / deltaY;
        ortho.elements[10] = -2.0 / deltaZ;
        ortho.elements[14] = -(nearZ + farZ) / deltaZ;
        this.multiply(ortho);
        return this;
    }

    multiply(right) {
        let tmp = new Matrix4x4();
        for (let i = 0; i < 4; i++) {
            tmp.elements[i * 4 + 0] = (this.elements[i * 4 + 0] * right.elements[0 * 4 + 0]) + (this.elements[i * 4 + 1] * right.elements[1 * 4 + 0]) + (this.elements[i * 4 + 2] * right.elements[2 * 4 + 0]) + (this.elements[i * 4 + 3] * right.elements[3 * 4 + 0]);
            tmp.elements[i * 4 + 1] = (this.elements[i * 4 + 0] * right.elements[0 * 4 + 1]) + (this.elements[i * 4 + 1] * right.elements[1 * 4 + 1]) + (this.elements[i * 4 + 2] * right.elements[2 * 4 + 1]) + (this.elements[i * 4 + 3] * right.elements[3 * 4 + 1]);
            tmp.elements[i * 4 + 2] = (this.elements[i * 4 + 0] * right.elements[0 * 4 + 2]) + (this.elements[i * 4 + 1] * right.elements[1 * 4 + 2]) + (this.elements[i * 4 + 2] * right.elements[2 * 4 + 2]) + (this.elements[i * 4 + 3] * right.elements[3 * 4 + 2]);
            tmp.elements[i * 4 + 3] = (this.elements[i * 4 + 0] * right.elements[0 * 4 + 3]) + (this.elements[i * 4 + 1] * right.elements[1 * 4 + 3]) + (this.elements[i * 4 + 2] * right.elements[2 * 4 + 3]) + (this.elements[i * 4 + 3] * right.elements[3 * 4 + 3]);
        }
        this.elements = tmp.elements;
        return this;
    }

    inverse() {
        let te = this.elements;
        let n11 = te[0], n12 = te[4], n13 = te[8], n14 = te[12];
        let n21 = te[1], n22 = te[5], n23 = te[9], n24 = te[13];
        let n31 = te[2], n32 = te[6], n33 = te[10], n34 = te[14];
        let n41 = te[3], n42 = te[7], n43 = te[11], n44 = te[15];

        let t11 = n23 * n34 * n42 - n24 * n33 * n42 + n24 * n32 * n43 - n22 * n34 * n43 - n23 * n32 * n44 + n22 * n33 * n44;
        let t12 = n14 * n33 * n42 - n13 * n34 * n42 - n14 * n32 * n43 + n12 * n34 * n43 + n13 * n32 * n44 - n12 * n33 * n44;
        let t13 = n13 * n24 * n42 - n14 * n23 * n42 + n14 * n22 * n43 - n12 * n24 * n43 - n13 * n22 * n44 + n12 * n23 * n44;
        let t14 = n14 * n23 * n32 - n13 * n24 * n32 - n14 * n22 * n33 + n12 * n24 * n33 + n13 * n22 * n34 - n12 * n23 * n34;

        let det = n11 * t11 + n21 * t12 + n31 * t13 + n41 * t14;
        if (det === 0) return this.loadIdentity();

        let detInv = 1 / det;

        let me = new Matrix4x4();
        me.elements[0] = t11 * detInv;
        me.elements[1] = (n24 * n33 * n41 - n23 * n34 * n41 - n24 * n31 * n43 + n21 * n34 * n43 + n23 * n31 * n44 - n21 * n33 * n44) * detInv;
        me.elements[2] = (n22 * n34 * n41 - n24 * n32 * n41 + n24 * n31 * n42 - n21 * n34 * n42 - n22 * n31 * n44 + n21 * n32 * n44) * detInv;
        me.elements[3] = (n23 * n32 * n41 - n22 * n33 * n41 - n23 * n31 * n42 + n21 * n33 * n42 + n22 * n31 * n43 - n21 * n32 * n43) * detInv;

        me.elements[4] = t12 * detInv;
        me.elements[5] = (n13 * n34 * n41 - n14 * n33 * n41 + n14 * n31 * n43 - n11 * n34 * n43 - n13 * n31 * n44 + n11 * n33 * n44) * detInv;
        me.elements[6] = (n14 * n32 * n41 - n12 * n34 * n41 - n14 * n31 * n42 + n11 * n34 * n42 + n12 * n31 * n44 - n11 * n32 * n44) * detInv;
        me.elements[7] = (n12 * n33 * n41 - n13 * n32 * n41 + n13 * n31 * n42 - n11 * n33 * n42 - n12 * n31 * n43 + n11 * n32 * n43) * detInv;

        me.elements[8] = t13 * detInv;
        me.elements[9] = (n14 * n23 * n41 - n13 * n24 * n41 - n14 * n21 * n43 + n11 * n24 * n43 + n13 * n21 * n44 - n11 * n23 * n44) * detInv;
        me.elements[10] = (n12 * n24 * n41 - n14 * n22 * n41 + n14 * n21 * n42 - n11 * n24 * n42 - n12 * n21 * n44 + n11 * n22 * n44) * detInv;
        me.elements[11] = (n13 * n22 * n41 - n12 * n23 * n41 - n13 * n21 * n42 + n11 * n23 * n42 + n12 * n21 * n43 - n11 * n22 * n43) * detInv;

        me.elements[12] = t14 * detInv;
        me.elements[13] = (n13 * n24 * n31 - n14 * n23 * n31 + n14 * n21 * n33 - n11 * n24 * n33 - n13 * n21 * n34 + n11 * n23 * n34) * detInv;
        me.elements[14] = (n14 * n22 * n31 - n12 * n24 * n31 - n14 * n21 * n32 + n11 * n24 * n32 + n12 * n21 * n34 - n11 * n22 * n34) * detInv;
        me.elements[15] = (n12 * n23 * n31 - n13 * n22 * n31 + n13 * n21 * n32 - n11 * n23 * n32 - n12 * n21 * n33 + n11 * n22 * n33) * detInv;

        return me;
    }

    loadIdentity() {
        for (let i = 0; i < 16; i++)
            this.elements[i] = 0;
        this.elements[0] = 1.0;
        this.elements[5] = 1.0;
        this.elements[10] = 1.0;
        this.elements[15] = 1.0;
        return this;
    }
}

// CameraController class
class CameraController {
    constructor(element) {
        this.xRot = 0;
        this.yRot = 0;
        this.zRot = 0;
        this.xT = 0;
        this.yT = 0;
        this.zT = 0;
    }
}

// Player class (supports 'wet' mic input and 'dry' internal tone)
class Player {
    constructor() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0;
        // Map analyser byte output to -100..0 dBFS so sample.a->dB is linear
        this.analyser.minDecibels = -100;
        this.analyser.maxDecibels = 0;
        // Mix feeds the analyser only
        this.mix = this.context.createGain();
        this.mix.gain.value = 1.0;
        this.mix.connect(this.analyser);

        // State
        this.mode = 'wet'; // 'wet' (mic) or 'dry' (internal)
        this.active = false;
        this.input = null;     // current source node (MediaStreamSource or Gain for dry chain)
        this.stream = null;    // MediaStream
        this.osc = null;       // deprecated
        this.dryGain = null;   // deprecated
        // Microphone DSP options (defaults for measurement)
        this.micOptions = { echoCancellation: false, noiseSuppression: false, autoGainControl: false };
    }

    setMode(mode) {
        if (mode !== 'dry' && mode !== 'wet') return;
        if (this.mode === mode) return;
        this.mode = mode;
        if (this.active) {
            // restart with new mode
            this.stop();
            this.start();
        }
    }

    start() {
        if (this.active) return;
        if (this.context.state === 'suspended') this.context.resume();
        if (this.mode === 'wet') {
            this._startWet();
        } else {
            this._startDry();
        }
        this.active = true;
    }

    stop() {
        // Disconnect and cleanup any existing input/streams for both modes
        if (this.input) { try { this.input.disconnect(); } catch(e){} this.input = null; }
        if (this.stream) {
            try { this.stream.getTracks().forEach(t => t.stop()); } catch(e){}
            this.stream = null;
        }
        if (this.osc) { try { this.osc.stop(); } catch(e){} try { this.osc.disconnect(); } catch(e){} this.osc = null; }
        if (this.dryGain) { try { this.dryGain.disconnect(); } catch(e){} this.dryGain = null; }
        this.active = false;
    }

    _startWet() {
        // Mic capture, honoring current UI-selected DSP options
        const constraints = { audio: { 
            echoCancellation: !!this.micOptions.echoCancellation,
            noiseSuppression: !!this.micOptions.noiseSuppression,
            autoGainControl: !!this.micOptions.autoGainControl
        } };
        navigator.mediaDevices.getUserMedia(constraints)
            .then(stream => this._onWetStream(stream))
            .catch(err => this.onStreamError(err));
    }

    setMicOptions(opts) {
        this.micOptions = { ...this.micOptions, ...opts };
        if (this.active && this.mode === 'wet') {
            // Restart mic with new constraints
            this.stop();
            this.start();
        }
    }

    _onWetStream(stream) {
        this.stream = stream;
        this.input = this.context.createMediaStreamSource(stream);
        this.input.connect(this.mix);
    }

    _startDry() {
        // Capture system/tab output via display media audio (no mic)
        // Browser will prompt user to choose a tab/window/screen with audio.
        const gdm = navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia;
        if (gdm) {
            gdm.call(navigator.mediaDevices, { audio: true, video: false })
                .then(stream => {
                    this.stream = stream;
                    const src = this.context.createMediaStreamSource(stream);
                    this.input = src;
                    // Route ONLY to analyser (no destination) to avoid echo
                    src.connect(this.mix);
                })
                .catch(err => {
                    console.warn('getDisplayMedia audio capture denied/unavailable; Dry will remain silent (no injected signal).', err);
                    // Do nothing: analyser will show noise floor / silence
                });
        } else {
            console.warn('getDisplayMedia not supported; Dry will remain silent (no injected signal).');
            // Do nothing
        }
    }

    live() {
        // Toggle start/stop in current mode
        if (this.active) {
            this.stop();
        } else {
            this.start();
        }
    }

    onStreamError(e) {
        console.error('Error getting microphone input:', e);
    }

    getAnalyserNode() {
        return this.analyser;
    }
}

// AnalyserView class
class AnalyserView {
    constructor(canvas) {
        this.canvas = canvas;
        this.analysisType = 2; // ANALYSISTYPE_3D_SONOGRAM
        this.sonogram3DWidth = 256;
        this.sonogram3DHeight = 256;
        this.sonogram3DGeometrySize = 9.5;
        this.freqByteData = null;
        this.texture = null;
        this.TEXTURE_HEIGHT = 256;
        this.yoffset = 0;
        this.backgroundColor = [0.08, 0.08, 0.08, 1];
        this.foregroundColor = [0, 0.7, 0, 1];
        this.isRendering = false;
        this.hBase = 3.0; // base Y extent of cube/axis before verticalScale
        // Initialize tick-related state BEFORE GL creates buffers that depend on it
        this.sampleRate = 48000; // default until mic starts
        this._initAxisLabelOverlays();
        // Time estimation for Z-axis seconds labels
        this._fpsEMA = 60; // start with 60fps assumption
        this._lastFrameTs = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        this._zTickStepSec = 1; // default 1s steps
        this._lastTickRebuildTs = this._lastFrameTs;
        this.initGL();
    }

    getAvailableContext(canvas, contextList) {
        if (canvas.getContext) {
            for (let i = 0; i < contextList.length; ++i) {
            try {
                let context = canvas.getContext(contextList[i], { antialias: true });
                if (context !== null) return context;
            } catch (ex) { }
                try {
                    let context = canvas.getContext(contextList[i], { antialias: true });
                    if (context !== null) return context;
                } catch (ex) { }
            }
        }
        return null;
    }

    initGL() {
        this.gl = this.getAvailableContext(this.canvas, ['webgl', 'experimental-webgl']);
        const gl = this.gl;

        this.has3DVisualizer = (gl.getParameter(gl.MAX_VERTEX_TEXTURE_IMAGE_UNITS) > 0);
        if (!this.has3DVisualizer) {
            alert('Your browser does not support vertex shaders textures, which are required for this demo.');
            return;
        }

        this.cameraController = new CameraController(this.canvas);
        // JS-only defaults (page-load):
        this.cameraController.xRot = -90;
        this.cameraController.yRot = 0;
        this.cameraController.zRot = 270;
        this.cameraController.xT = 0;
        this.cameraController.yT = -3.5;
        this.cameraController.zT = -7.5; // Use this for zoom

        this.verticalScale = 3.5; // Initial vertical scale

        gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
        gl.enable(gl.DEPTH_TEST);

        // Ensure viewport matches current canvas backing store
        gl.viewport(0, 0, this.canvas.width, this.canvas.height);

        this.init3DGeometry();
        this.initShaders();
        this.initAxesBuffers();
    }

    init3DGeometry() {
        const gl = this.gl;
        const sonogram3DWidth = this.sonogram3DWidth;
        const sonogram3DHeight = this.sonogram3DHeight;
        const sonogram3DGeometrySize = this.sonogram3DGeometrySize;

        let numVertices = sonogram3DWidth * sonogram3DHeight;
        if (numVertices > 65536) throw 'Sonogram 3D resolution is too high';

        let vertices = new Float32Array(numVertices * 3);
        let texCoords = new Float32Array(numVertices * 2);

        for (let z = 0; z < sonogram3DHeight; z++) {
            for (let x = 0; x < sonogram3DWidth; x++) {
                vertices[3 * (sonogram3DWidth * z + x) + 0] = sonogram3DGeometrySize * (x - sonogram3DWidth / 2) / sonogram3DWidth;
                vertices[3 * (sonogram3DWidth * z + x) + 1] = 0;
                vertices[3 * (sonogram3DWidth * z + x) + 2] = sonogram3DGeometrySize * (z - sonogram3DHeight / 2) / sonogram3DHeight;
                texCoords[2 * (sonogram3DWidth * z + x) + 0] = x / (sonogram3DWidth - 1);
                texCoords[2 * (sonogram3DWidth * z + x) + 1] = z / (sonogram3DHeight - 1);
            }
        }

        this.vbo3DTexCoordOffset = vertices.byteLength;
        this.sonogram3DVBO = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.sonogram3DVBO);
        gl.bufferData(gl.ARRAY_BUFFER, this.vbo3DTexCoordOffset + texCoords.byteLength, gl.STATIC_DRAW);
        gl.bufferSubData(gl.ARRAY_BUFFER, 0, vertices);
        gl.bufferSubData(gl.ARRAY_BUFFER, this.vbo3DTexCoordOffset, texCoords);

        this.sonogram3DNumIndices = (sonogram3DWidth - 1) * (sonogram3DHeight - 1) * 6;
        let indices = new Uint16Array(this.sonogram3DNumIndices);
        let idx = 0;
        for (let z = 0; z < sonogram3DHeight - 1; z++) {
            for (let x = 0; x < sonogram3DWidth - 1; x++) {
                indices[idx++] = z * sonogram3DWidth + x;
                indices[idx++] = z * sonogram3DWidth + x + 1;
                indices[idx++] = (z + 1) * sonogram3DWidth + x + 1;
                indices[idx++] = z * sonogram3DWidth + x;
                indices[idx++] = (z + 1) * sonogram3DWidth + x + 1;
                indices[idx++] = (z + 1) * sonogram3DWidth + x;
            }
        }

        this.sonogram3DIBO = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sonogram3DIBO);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);
    }

    initAxesBuffers() {
        const gl = this.gl;
        // Extents based on the sonogram plane
        const w = this.sonogram3DGeometrySize;
        const h = this.hBase * this.verticalScale; // scale cube height with verticalScale
        const d = this.sonogram3DGeometrySize;

        // Axes lines from origin
        this.axesVBO = gl.createBuffer();
        this._rebuildAxesBox();

        // Bounding box (gray) around the sonogram plane extents
        this.boxVBO = gl.createBuffer();
        // box vertices are populated in _rebuildAxesBox()

        // Tick buffers (generated later when labels created)
        this.tickVBO = gl.createBuffer();
        this.tickVertexCount = 0;
        this._rebuildTicks();
    }

    _rebuildAxesBox() {
        const gl = this.gl;
        if (!gl) return;
        const w = this.sonogram3DGeometrySize;
        const d = this.sonogram3DGeometrySize;
        const h = this.hBase * this.verticalScale;

        // Axes vertices
        const axes = new Float32Array([
            // X axis (red)
            0, 0, 0,   w * 0.55, 0, 0,
            // Y axis (green)
            0, 0, 0,   0, h, 0,
            // Z axis (blue)
            0, 0, 0,   0, 0, d * 0.55,
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.axesVBO);
        gl.bufferData(gl.ARRAY_BUFFER, axes, gl.DYNAMIC_DRAW);

        // Bounding box around sonogram extents
        const x0 = -w * 0.5, x1 = w * 0.5;
        const z0 = -d * 0.5, z1 = d * 0.5;
        const y0 = 0.0, y1 = h;
        const box = new Float32Array([
            // bottom rectangle (y0)
            x0, y0, z0,   x1, y0, z0,
            x1, y0, z0,   x1, y0, z1,
            x1, y0, z1,   x0, y0, z1,
            x0, y0, z1,   x0, y0, z0,
            // top rectangle (y1)
            x0, y1, z0,   x1, y1, z0,
            x1, y1, z0,   x1, y1, z1,
            x1, y1, z1,   x0, y1, z1,
            x0, y1, z1,   x0, y1, z0,
            // vertical edges
            x0, y0, z0,   x0, y1, z0,
            x1, y0, z0,   x1, y1, z0,
            x1, y0, z1,   x1, y1, z1,
            x0, y0, z1,   x0, y1, z1,
        ]);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.boxVBO);
        gl.bufferData(gl.ARRAY_BUFFER, box, gl.DYNAMIC_DRAW);
        this.boxVertexCount = box.length / 3;
    }

    _initAxisLabelOverlays() {
        // create container for labels as absolutely positioned children of canvas parent
        const container = this.canvas.parentElement;
        this.labelContainer = document.createElement('div');
        Object.assign(this.labelContainer.style, {
            position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none',
        });
        container.appendChild(this.labelContainer);

        // Psychoacoustic 7-band boundaries and centers from 7band-level-meter
        this.bandDefs = [
            { key: 'sub',   name: 'Sub-bass',   f1: 20,   f2: 60 },
            { key: 'bass',  name: 'Bass',       f1: 60,   f2: 250 },
            { key: 'lowmid',name: 'Low Mid',    f1: 250,  f2: 500 },
            { key: 'mid',   name: 'Midrange',   f1: 500,  f2: 2000 },
            { key: 'upmid', name: 'Upper Mid',  f1: 2000, f2: 4000 },
            { key: 'pres',  name: 'Presence',   f1: 4000, f2: 6000 },
            { key: 'brill', name: 'Brilliance', f1: 6000, f2: 20000 }
        ];
        const boundaries = [20,60,250,500,2000,4000,6000,20000];
        const centers = this.bandDefs.map(b => Math.sqrt(b.f1*b.f2));
        this.xTickDefs = [];
        // Boundary ticks (numeric labels)
        for (const hz of boundaries) {
            this.xTickDefs.push({ hz, label: hz>=1000? (hz/1000)+'k' : String(hz), kind: 'boundary' });
        }
        // Center ticks (no text label, tick only)
        for (let i=0;i<this.bandDefs.length;i++) {
            const b = this.bandDefs[i];
            const hz = Math.sqrt(b.f1*b.f2);
            this.xTickDefs.push({ hz, label: null, kind: 'center' });
        }
        // Y-axis dBFS ticks: -100..0 every 10 dB
        this.yTicksDb = [];
        for (let db=-100; db<=0; db+=10) this.yTicksDb.push(db);
        this.dbfsOffset = 0; // adjustable via UI
        // Z ticks in seconds computed dynamically in _rebuildZTicksSeconds()
        this.zTicksSeconds = [0,1,2,3,4,5];

        this.tickLabels = { x: [], y: [], z: [] };
        const createLabel = (text) => {
            const el = document.createElement('span');
            el.textContent = text;
            Object.assign(el.style, { position: 'absolute', color: '#ddd', fontSize: '11px', transform: 'translate(-50%, -50%)', textShadow: '0 0 2px #000' });
            this.labelContainer.appendChild(el);
            return el;
        };
        // Build initial elements: only create X labels for ticks that have a non-empty label
        this.tickLabels.x = [];
        for (const t of this.xTickDefs) {
            if (t.label) {
                t.labelEl = createLabel(t.label);
                this.tickLabels.x.push(t.labelEl);
            } else {
                t.labelEl = null;
            }
        }
        this.tickLabels.y = this.yTicksDb.map(db => createLabel(String(db)));
        this.tickLabels.z = this.zTicksSeconds.map(sec => createLabel(sec===0? '0s' : `-${sec}s`));
    }

    setSampleRate(sr) {
        this.sampleRate = sr;
        this._rebuildTicks();
    }

    _freqToU(freqHz) {
        // Map frequency to normalized bin position [0..1]
        const nyquist = this.sampleRate / 2;
        const f = Math.max(1e-9, Math.min(freqHz, nyquist));
        const fNorm = f / nyquist;
        // In the shader we sample with: x = pow(256.0, u - 1.0)
        // So u = 1 + log(fNorm)/log(256)
        const u = 1 + (Math.log(fNorm) / Math.log(256.0));
        // clamp to [0,1]
        return Math.max(0, Math.min(1, u));
    }

    _rebuildTicks() {
        const gl = this.gl;
        if (!gl) return;
        const w = this.sonogram3DGeometrySize;
        const d = this.sonogram3DGeometrySize;
        const h = this.hBase * this.verticalScale;
        const verts = [];

        // X-axis ticks at the front edge (z = -d/2), from y=0 to small height
        const zFront = -d * 0.5;
        const tickH = 0.2;
        for (const t of this.xTickDefs) {
            const u = this._freqToU(t.hz);
            const x = (u - 0.5) * w;
            const hX = t.kind === 'center' ? tickH*1.7 : tickH;
            verts.push(x, 0, zFront,  x, hX, zFront);
        }

        // Y-axis ticks (left-front edge at x=-w/2, z=zFront), values in dBFS
        const xLeft = -w * 0.5;
        const yMax = h; // visual box height scales with VS
        const minDb = -100, maxDb = 0;
        for (const db of this.yTicksDb) {
            const t = (db - minDb) / (maxDb - minDb);
            const y = t * yMax;
            verts.push(xLeft, y, zFront,  xLeft + 0.25, y, zFront);
        }

        // Z-axis ticks (center line at x=0), time in seconds from oldest (front) to now (back)
        // 0s at back (z = +d/2), -T s at front (z = -d/2)
        this._rebuildZTICKS_seconds_only();
        for (const sec of this.zTicksSeconds) {
            const p = 1 - (sec / Math.max(0.001, this._historySeconds || 1));
            const z = -d * 0.5 + p * d;
            verts.push(0, 0, z,  0, 0.25, z);
        }

        const data = new Float32Array(verts);
        gl.bindBuffer(gl.ARRAY_BUFFER, this.tickVBO);
        gl.bufferData(gl.ARRAY_BUFFER, data, gl.DYNAMIC_DRAW);
        this.tickVertexCount = data.length / 3;
    }

    initShaders() {
        const gl = this.gl;
        this.sonogram3DShader = this.createShaderProgram(sonogramVertexShader, sonogramFragmentShader);
        this.lineShader = this.createShaderProgram(lineVertexShader, lineFragmentShader);
        if (this.lineShader) {
            this.lineShader.gPositionLoc = gl.getAttribLocation(this.lineShader, 'gPosition');
            this.lineShader.worldViewProjectionLoc = gl.getUniformLocation(this.lineShader, 'worldViewProjection');
            this.lineShader.uColorLoc = gl.getUniformLocation(this.lineShader, 'uColor');
        }
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        let vertexShader = this.createShader(gl.VERTEX_SHADER, vertexSource);
        let fragmentShader = this.createShader(gl.FRAGMENT_SHADER, fragmentSource);
        let program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Unable to initialize the shader program: ' + gl.getProgramInfoLog(program));
            return null;
        }
        program.gPositionLoc = gl.getAttribLocation(program, 'gPosition');
        program.gTexCoord0Loc = gl.getAttribLocation(program, 'gTexCoord0');
        program.frequencyDataLoc = gl.getUniformLocation(program, 'frequencyData');
        program.foregroundColorLoc = gl.getUniformLocation(program, 'foregroundColor');
        program.backgroundColorLoc = gl.getUniformLocation(program, 'backgroundColor');
        program.yoffsetLoc = gl.getUniformLocation(program, 'yoffset');
        program.vertexFrequencyDataLoc = gl.getUniformLocation(program, 'vertexFrequencyData');
        program.vertexYOffsetLoc = gl.getUniformLocation(program, 'vertexYOffset');
        program.verticalScaleLoc = gl.getUniformLocation(program, 'verticalScale');
        // New uniforms for calibrated dBFS mapping
        program.hBaseLoc = gl.getUniformLocation(program, 'hBase');
        program.dbfsOffsetLoc = gl.getUniformLocation(program, 'dbfsOffset');
        program.worldViewProjectionLoc = gl.getUniformLocation(program, 'worldViewProjection');
        return program;
    }

    createShader(type, source) {
        const gl = this.gl;
        let shader = gl.createShader(type);
        gl.shaderSource(shader, source);
        gl.compileShader(shader);
        if (!gl.getShaderParameter(shader, gl.COMPILE_STATUS)) {
            console.error('An error occurred compiling the shaders: ' + gl.getShaderInfoLog(shader));
            gl.deleteShader(shader);
            return null;
        }
        return shader;
    }

    initByteBuffer() {
        const gl = this.gl;
        if (!this.freqByteData || this.freqByteData.length !== this.analyser.frequencyBinCount) {
            this.freqByteData = new Uint8Array(this.analyser.frequencyBinCount);
            if (this.texture) gl.deleteTexture(this.texture);
            this.texture = gl.createTexture();
            gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.CLAMP_TO_EDGE);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.REPEAT);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
            gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
            let tmp = new Uint8Array(this.freqByteData.length * this.TEXTURE_HEIGHT);
            gl.texImage2D(gl.TEXTURE_2D, 0, gl.ALPHA, this.freqByteData.length, this.TEXTURE_HEIGHT, 0, gl.ALPHA, gl.UNSIGNED_BYTE, tmp);
        }
    }

    setAnalyserNode(analyser) {
        this.analyser = analyser;
    }

    start() {
        this.isRendering = true;
        this.draw_();
    }

    stop() {
        this.isRendering = false;
    }

    draw_() {
        if (!this.isRendering) return;
        this.doFrequencyAnalysis();
        requestAnimationFrame(() => this.draw_());
    }

    doFrequencyAnalysis() {
        this.analyser.smoothingTimeConstant = 0;
        this.analyser.getByteFrequencyData(this.freqByteData);
        this.drawGL();
    }

    drawGL() {
        const gl = this.gl;
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.pixelStorei(gl.UNPACK_ALIGNMENT, 1);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, 0, this.yoffset, this.freqByteData.length, 1, gl.ALPHA, gl.UNSIGNED_BYTE, this.freqByteData);
        this.yoffset = (this.yoffset + 1) % this.TEXTURE_HEIGHT;

        gl.bindBuffer(gl.ARRAY_BUFFER, this.sonogram3DVBO);
        const shader = this.sonogram3DShader;
        gl.useProgram(shader);

        let vertexLoc = shader.gPositionLoc;
        let texCoordLoc = shader.gTexCoord0Loc;

        // Ensure both vertex and fragment shader samplers point to texture unit 0
        gl.uniform1i(shader.vertexFrequencyDataLoc, 0);
        if (shader.frequencyDataLoc) gl.uniform1i(shader.frequencyDataLoc, 0);
        let normalizedYOffset = this.yoffset / (this.TEXTURE_HEIGHT - 1);
        gl.uniform1f(shader.yoffsetLoc, normalizedYOffset);
        let discretizedYOffset = Math.floor(normalizedYOffset * (this.sonogram3DHeight - 1)) / (this.sonogram3DHeight - 1);
        gl.uniform1f(shader.vertexYOffsetLoc, discretizedYOffset);
        gl.uniform1f(shader.verticalScaleLoc, this.verticalScale);
        if (shader.hBaseLoc) gl.uniform1f(shader.hBaseLoc, this.hBase);
        if (shader.dbfsOffsetLoc) gl.uniform1f(shader.dbfsOffsetLoc, this.dbfsOffset || 0);

        let projection = new Matrix4x4();
        projection.perspective(55, this.canvas.width / this.canvas.height, 1, 100);
        let view = new Matrix4x4();
        view.translate(0, 0, this.cameraController.zT);
        let model = new Matrix4x4();
        model.rotate(this.cameraController.xRot, 1, 0, 0);
        model.rotate(this.cameraController.yRot, 0, 1, 0);
        model.rotate(this.cameraController.zRot, 0, 0, 1);
        // Avoid double-applying zT: camera distance handled in 'view'. Only apply x/y here.
        model.translate(this.cameraController.xT, this.cameraController.yT, 0);

        this.model = model;
        this.view = view;
        this.projection = projection;

        let mvp = new Matrix4x4();
        mvp.multiply(model);
        mvp.multiply(view);
        mvp.multiply(projection);
        this.mvp = mvp;
        gl.uniformMatrix4fv(shader.worldViewProjectionLoc, false, mvp.elements);

        if (shader.foregroundColorLoc) gl.uniform4fv(shader.foregroundColorLoc, this.foregroundColor);
        if (shader.backgroundColorLoc) gl.uniform4fv(shader.backgroundColorLoc, this.backgroundColor);

        gl.enableVertexAttribArray(vertexLoc);
        gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, this.vbo3DTexCoordOffset);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sonogram3DIBO);
        gl.drawElements(gl.TRIANGLES, this.sonogram3DNumIndices, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(vertexLoc);
        gl.disableVertexAttribArray(texCoordLoc);

        // Draw axes and bounding box using line shader
        if (this.lineShader) {
            gl.useProgram(this.lineShader);
            gl.uniformMatrix4fv(this.lineShader.worldViewProjectionLoc, false, mvp.elements);

            gl.enableVertexAttribArray(this.lineShader.gPositionLoc);

            // Axes: X red, Y green, Z blue (2-vertex lines each, packed)
            gl.bindBuffer(gl.ARRAY_BUFFER, this.axesVBO);
            gl.vertexAttribPointer(this.lineShader.gPositionLoc, 3, gl.FLOAT, false, 0, 0);
            // X
            gl.uniform4f(this.lineShader.uColorLoc, 1.0, 0.2, 0.2, 1.0);
            gl.drawArrays(gl.LINES, 0, 2);
            // Y
            gl.uniform4f(this.lineShader.uColorLoc, 0.2, 1.0, 0.2, 1.0);
            gl.drawArrays(gl.LINES, 2, 2);
            // Z
            gl.uniform4f(this.lineShader.uColorLoc, 0.2, 0.6, 1.0, 1.0);
            gl.drawArrays(gl.LINES, 4, 2);

            // Box in gray
            gl.bindBuffer(gl.ARRAY_BUFFER, this.boxVBO);
            gl.vertexAttribPointer(this.lineShader.gPositionLoc, 3, gl.FLOAT, false, 0, 0);
            gl.uniform4f(this.lineShader.uColorLoc, 0.7, 0.7, 0.7, 0.6);
            gl.drawArrays(gl.LINES, 0, this.boxVertexCount);

            // Ticks (white)
            if (this.tickVertexCount > 0) {
                gl.bindBuffer(gl.ARRAY_BUFFER, this.tickVBO);
                gl.vertexAttribPointer(this.lineShader.gPositionLoc, 3, gl.FLOAT, false, 0, 0);
                gl.uniform4f(this.lineShader.uColorLoc, 1.0, 1.0, 1.0, 0.9);
                gl.drawArrays(gl.LINES, 0, this.tickVertexCount);
            }

            gl.disableVertexAttribArray(this.lineShader.gPositionLoc);
        }

        // Update label positions in screen space
        this.mvp = mvp; // store for projection helper
        this._updateLabelPositions();

        // Update FPS EMA and periodically rebuild ticks (for Z seconds scale)
        const now = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const dt = Math.max(1, now - this._lastFrameTs);
        const fps = 1000 / dt;
        this._fpsEMA = this._fpsEMA * 0.9 + fps * 0.1;
        this._lastFrameTs = now;
        if (now - this._lastTickRebuildTs > 500) { // every 0.5s
            this._rebuildTicks();
            this._lastTickRebuildTs = now;
        }
    }

    _projectToScreen(x, y, z) {
        // Multiply by MVP
        const e = this.mvp.elements;
        const X = e[0]*x + e[4]*y + e[8]*z + e[12];
        const Y = e[1]*x + e[5]*y + e[9]*z + e[13];
        const Z = e[2]*x + e[6]*y + e[10]*z + e[14];
        const W = e[3]*x + e[7]*y + e[11]*z + e[15];
        if (W === 0) return null;
        const ndcX = X / W, ndcY = Y / W; // [-1,1]
        // Canvas backing size to CSS size ratio
        const dpr = window.devicePixelRatio || 1;
        const cssW = this.canvas.width / dpr;
        const cssH = this.canvas.height / dpr;
        const px = (ndcX * 0.5 + 0.5) * cssW;
        const py = (-ndcY * 0.5 + 0.5) * cssH;
        return [px, py];
    }

    _updateLabelPositions() {
        if (!this.labelContainer) return;
        const w = this.sonogram3DGeometrySize;
        const d = this.sonogram3DGeometrySize;
        const zFront = -d * 0.5;
        const xLeft = -w * 0.5;

        // X labels: position only those ticks that have label elements
        for (let i = 0; i < this.xTickDefs.length; i++) {
            const t = this.xTickDefs[i];
            if (!t.labelEl) continue;
            const u = this._freqToU(t.hz);
            const x = (u - 0.5) * w;
            const p = this._projectToScreen(x, 0.0, zFront);
            if (p) {
                t.labelEl.style.left = `${p[0]}px`;
                t.labelEl.style.top = `${p[1] + 10}px`;
                t.labelEl.style.display = 'block';
            }
        }

        // Y labels
        const minDb = -100, maxDb = 0;
        const yMax = this.hBase * this.verticalScale;
        for (let i = 0; i < this.yTicksDb.length; i++) {
            const db = this.yTicksDb[i];
            const t = (db - minDb) / (maxDb - minDb);
            const yv = t * yMax;
            const p = this._projectToScreen(xLeft, yv, zFront);
            if (p) {
                const el = this.tickLabels.y[i];
                el.textContent = `${db}`;
                el.style.left = `${p[0] - 12}px`;
                el.style.top = `${p[1]}px`;
                el.style.display = 'block';
            }
        }

        // Z labels
        for (let i = 0; i < this.zTicksSeconds.length; i++) {
            const sec = this.zTicksSeconds[i];
            const pFrac = 1 - (sec / Math.max(0.001, this._historySeconds || 1));
            const pz = -d * 0.5 + pFrac * d;
            const p = this._projectToScreen(0, 0.0, pz);
            if (p) {
                const el = this.tickLabels.z[i];
                el.textContent = sec===0? '0s' : `-${sec}s`;
                el.style.left = `${p[0]}px`;
                el.style.top = `${p[1] + 10}px`;
                el.style.display = 'block';
            }
        }
    }

    _rebuildZTICKS_seconds_only() {
        // Estimate history seconds based on texture height (rows) and FPS EMA
        const rows = this.TEXTURE_HEIGHT || 256;
        const fps = Math.max(1, this._fpsEMA || 60);
        this._historySeconds = rows / fps;
        const step = this._zTickStepSec || 1;
        const ticks = [];
        for (let s = 0; s <= Math.floor(this._historySeconds); s += step) ticks.push(s);
        if (ticks.length === 0 || ticks[ticks.length-1] !== 0) ticks.push(0);
        // Rebuild labels if count changed
        if (!this.tickLabels || !this.tickLabels.z) return;
        if (this.tickLabels.z.length !== ticks.length) {
            // Remove old labels
            this.tickLabels.z.forEach(el => { try { el.remove(); } catch(e){} });
            this.tickLabels.z = ticks.map(sec => {
                const el = document.createElement('span');
                el.textContent = sec===0? '0s' : `-${sec}s`;
                Object.assign(el.style, { position: 'absolute', color: '#ddd', fontSize: '11px', transform: 'translate(-50%, -50%)', textShadow: '0 0 2px #000' });
                this.labelContainer.appendChild(el);
                return el;
            });
        }
        this.zTicksSeconds = ticks;
    }
}

// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const controls = document.getElementById('controls');
    const canvas = document.getElementById('spectrogram');
    const container = document.getElementById('canvas-container') || canvas.parentElement;

    const resizeCanvas = (gl) => {
        const dpr = window.devicePixelRatio || 1;
        const w = Math.floor(container.clientWidth);
        const h = Math.floor(container.clientHeight);
        // CSS size
        canvas.style.width = w + 'px';
        canvas.style.height = h + 'px';
        // Backing store size (HiDPI aware)
        const bw = Math.floor(w * dpr);
        const bh = Math.floor(h * dpr);
        if (canvas.width !== bw || canvas.height !== bh) {
            canvas.width = bw;
            canvas.height = bh;
            if (gl) gl.viewport(0, 0, bw, bh);
        }
    };

    const analyserView = new AnalyserView(canvas);
    // Initial sizing after GL is created
    resizeCanvas(analyserView.gl);
    const player = new Player();

    // --- Control Listeners ---
    // Match IDs defined in index-gemini-v3.html
    const xRot = document.getElementById('rotX');
    const yRot = document.getElementById('rotY');
    const zRot = document.getElementById('rotZ');
    const yPos = document.getElementById('posY');
    const zPos = document.getElementById('posZ');
    const vScale = document.getElementById('vScale');
    const dbfsOffset = document.getElementById('dbfsOffset');
    const sourceDry = document.getElementById('sourceDry');
    const sourceWet = document.getElementById('sourceWet');
    const micEchoCancellation = document.getElementById('micEchoCancellation');
    const micNoiseSuppression = document.getElementById('micNoiseSuppression');
    const micAutoGainControl = document.getElementById('micAutoGainControl');

    // Value display spans
    const xRotVal = document.getElementById('rotX-value');
    const yRotVal = document.getElementById('rotY-value');
    const zRotVal = document.getElementById('rotZ-value');
    const yPosVal = document.getElementById('posY-value');
    const zPosVal = document.getElementById('posZ-value');
    const vScaleVal = document.getElementById('vScale-value');

    // Helper to set both control and its display value
    const setVal = (inputEl, spanEl, value) => {
        if (inputEl) inputEl.value = value;
        if (spanEl) spanEl.textContent = String(value);
    };

    // Guard against nulls; update controller and display
    if (xRot) xRot.addEventListener('input', e => {
        const v = Number(e.target.value);
        analyserView.cameraController.xRot = v;
        if (xRotVal) xRotVal.textContent = String(v);
    });
    if (yRot) yRot.addEventListener('input', e => {
        const v = Number(e.target.value);
        analyserView.cameraController.yRot = v;
        if (yRotVal) yRotVal.textContent = String(v);
    });
    if (zRot) zRot.addEventListener('input', e => {
        const v = Number(e.target.value);
        analyserView.cameraController.zRot = v;
        if (zRotVal) zRotVal.textContent = String(v);
    });
    if (yPos) yPos.addEventListener('input', e => {
        const v = Number(e.target.value);
        analyserView.cameraController.yT = v;
        if (yPosVal) yPosVal.textContent = String(v);
    });
    if (zPos) zPos.addEventListener('input', e => {
        const v = Number(e.target.value);
        analyserView.cameraController.zT = v;
        if (zPosVal) zPosVal.textContent = String(v);
    });
    if (vScale) {
        vScale.addEventListener('input', () => {
            const v = parseFloat(vScale.value);
            const valSpan = document.getElementById('vScale-value');
            if (valSpan) valSpan.textContent = v.toFixed(1);
            analyserView.verticalScale = v;
            // Rebuild axes/box and tick buffers to reflect new height
            analyserView._rebuildAxesBox();
            analyserView._rebuildTicks();
        });
    }

    if (dbfsOffset) {
        dbfsOffset.addEventListener('input', () => {
            const v = parseFloat(dbfsOffset.value);
            if (!isNaN(v)) {
                analyserView.dbfsOffset = v;
                // dBFS offset may affect future amplitude-to-dB conversions; ticks are static.
                analyserView._rebuildTicks();
            }
        });
    }

    // Set initial slider and display values from camera
    setVal(xRot, xRotVal, analyserView.cameraController.xRot);
    setVal(yRot, yRotVal, analyserView.cameraController.yRot);
    setVal(zRot, zRotVal, analyserView.cameraController.zRot);
    setVal(yPos, yPosVal, analyserView.cameraController.yT);
    setVal(zPos, zPosVal, analyserView.cameraController.zT);
    setVal(vScale, vScaleVal, analyserView.verticalScale);

    // Source radio handlers
    if (sourceDry) sourceDry.addEventListener('change', () => {
        if (sourceDry.checked) player.setMode('dry');
    });
    if (sourceWet) sourceWet.addEventListener('change', () => {
        if (sourceWet.checked) player.setMode('wet');
    });

    // Mic DSP handlers
    const pushMicOptions = () => player.setMicOptions({
        echoCancellation: !!(micEchoCancellation && micEchoCancellation.checked),
        noiseSuppression: !!(micNoiseSuppression && micNoiseSuppression.checked),
        autoGainControl: !!(micAutoGainControl && micAutoGainControl.checked),
    });
    if (micEchoCancellation) micEchoCancellation.addEventListener('change', pushMicOptions);
    if (micNoiseSuppression) micNoiseSuppression.addEventListener('change', pushMicOptions);
    if (micAutoGainControl) micAutoGainControl.addEventListener('change', pushMicOptions);

    startButton.addEventListener('click', () => {
        // Ensure mode matches selected radio at start
        if (sourceDry && sourceDry.checked) player.setMode('dry');
        if (sourceWet && sourceWet.checked) player.setMode('wet');
        // Apply initial mic options from UI before starting
        pushMicOptions();
        player.live();
        analyserView.setAnalyserNode(player.getAnalyserNode());
        // Update frequency axis to device sample rate
        if (player && player.context && player.context.sampleRate) {
            analyserView.setSampleRate(player.context.sampleRate);
        }
        analyserView.initByteBuffer();
        analyserView.start();
        startButton.style.display = 'none';
        // Reveal controls panel (matches CSS that uses width/padding/visibility)
        controls.style.visibility = 'visible';
        controls.style.width = '260px';
        controls.style.padding = '15px';
    });

    // Resize on window resize and container size changes
    window.addEventListener('resize', () => resizeCanvas(analyserView.gl));
    if ('ResizeObserver' in window) {
        const ro = new ResizeObserver(() => resizeCanvas(analyserView.gl));
        ro.observe(container);
    }

    canvas.addEventListener('click', event => {
        if (!analyserView.isRendering) return;

        const rect = canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const mouseX = (x / canvas.width) * 2 - 1;
        const mouseY = -(y / canvas.height) * 2 + 1;

        const ray_nds = [mouseX, mouseY, -1, 1];

        const inv_mvp = analyserView.mvp.inverse();
        let ray_world = [
            inv_mvp.elements[0] * ray_nds[0] + inv_mvp.elements[4] * ray_nds[1] + inv_mvp.elements[8] * ray_nds[2] + inv_mvp.elements[12] * ray_nds[3],
            inv_mvp.elements[1] * ray_nds[0] + inv_mvp.elements[5] * ray_nds[1] + inv_mvp.elements[9] * ray_nds[2] + inv_mvp.elements[13] * ray_nds[3],
            inv_mvp.elements[2] * ray_nds[0] + inv_mvp.elements[6] * ray_nds[1] + inv_mvp.elements[10] * ray_nds[2] + inv_mvp.elements[14] * ray_nds[3],
            inv_mvp.elements[3] * ray_nds[0] + inv_mvp.elements[7] * ray_nds[1] + inv_mvp.elements[11] * ray_nds[2] + inv_mvp.elements[15] * ray_nds[3]
        ];

        if (ray_world[3] !== 0) {
            ray_world[0] /= ray_world[3];
            ray_world[1] /= ray_world[3];
            ray_world[2] /= ray_world[3];
        }

        const cameraPos = [0, 0, 0]; // Simplified camera position in view space
        let invView = new Matrix4x4();
        invView.multiply(analyserView.model);
        invView.multiply(analyserView.view);
        invView = invView.inverse();

        const cam_world = [
            invView.elements[12],
            invView.elements[13],
            invView.elements[14]
        ];

        const rayDir = [ray_world[0] - cam_world[0], ray_world[1] - cam_world[1], ray_world[2] - cam_world[2]];

        // Ray-plane intersection (plane y=0)
        const t = -cam_world[1] / rayDir[1];
        const intersectX = cam_world[0] + t * rayDir[0];
        const intersectZ = cam_world[2] + t * rayDir[2];

        console.log(`Clicked at 3D coordinates: X=${intersectX.toFixed(2)}, Y=0, Z=${intersectZ.toFixed(2)}`);
    });
});
