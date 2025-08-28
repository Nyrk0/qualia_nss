/* Minimal 3D Spectrogram - Stage 1 */

// Minimal mat4 and vec3 functions
function createMat4() { return new Float32Array(16); }
function createVec3() { return new Float32Array(3); }

function setIdentity(m) {
    m[0]=m[5]=m[10]=m[15]=1;
    m[1]=m[2]=m[3]=m[4]=m[6]=m[7]=m[8]=m[9]=m[11]=m[12]=m[13]=m[14]=0;
    return m;
}

function perspective(out, fovy, aspect, near, far) {
    const f = 1.0 / Math.tan(fovy / 2);
    out[0] = f / aspect; out[1] = 0; out[2] = 0; out[3] = 0;
    out[4] = 0; out[5] = f; out[6] = 0; out[7] = 0;
    out[8] = 0; out[9] = 0; out[10] = (far + near) / (near - far); out[11] = -1;
    out[12] = 0; out[13] = 0; out[14] = (2 * far * near) / (near - far); out[15] = 0;
    return out;
}

function subtractVec3(out, a, b) {
    out[0] = a[0] - b[0]; out[1] = a[1] - b[1]; out[2] = a[2] - b[2];
    return out;
}

function normalizeVec3(out, a) {
    const len = Math.sqrt(a[0]*a[0] + a[1]*a[1] + a[2]*a[2]);
    if (len > 0) {
        out[0] = a[0]/len; out[1] = a[1]/len; out[2] = a[2]/len;
    }
    return out;
}

function crossVec3(out, a, b) {
    out[0] = a[1]*b[2] - a[2]*b[1];
    out[1] = a[2]*b[0] - a[0]*b[2];
    out[2] = a[0]*b[1] - a[1]*b[0];
    return out;
}

function lookAt(out, eye, center, up) {
    const z = createVec3(); subtractVec3(z, eye, center); normalizeVec3(z, z);
    const x = createVec3(); crossVec3(x, up, z); normalizeVec3(x, x);
    const y = createVec3(); crossVec3(y, z, x); normalizeVec3(y, y);
    out[0] = x[0]; out[1] = y[0]; out[2] = z[0]; out[3] = 0;
    out[4] = x[1]; out[5] = y[1]; out[6] = z[1]; out[7] = 0;
    out[8] = x[2]; out[9] = y[2]; out[10] = z[2]; out[11] = 0;
    out[12] = -(x[0]*eye[0] + x[1]*eye[1] + x[2]*eye[2]);
    out[13] = -(y[0]*eye[0] + y[1]*eye[1] + y[2]*eye[2]);
    out[14] = -(z[0]*eye[0] + z[1]*eye[1] + z[2]*eye[2]);
    out[15] = 1;
    return out;
}

function multiplyMat4(out, a, b) {
    const a00 = a[0], a01 = a[1], a02 = a[2], a03 = a[3];
    const a10 = a[4], a11 = a[5], a12 = a[6], a13 = a[7];
    const a20 = a[8], a21 = a[9], a22 = a[10], a23 = a[11];
    const a30 = a[12], a31 = a[13], a32 = a[14], a33 = a[15];
    let b0 = b[0], b1 = b[1], b2 = b[2], b3 = b[3];
    out[0] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[1] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[2] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[3] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    b0 = b[4]; b1 = b[5]; b2 = b[6]; b3 = b[7];
    out[4] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[5] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[6] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[7] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    b0 = b[8]; b1 = b[9]; b2 = b[10]; b3 = b[11];
    out[8] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[9] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[10] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[11] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    b0 = b[12]; b1 = b[13]; b2 = b[14]; b3 = b[15];
    out[12] = b0*a00 + b1*a10 + b2*a20 + b3*a30;
    out[13] = b0*a01 + b1*a11 + b2*a21 + b3*a31;
    out[14] = b0*a02 + b1*a12 + b2*a22 + b3*a32;
    out[15] = b0*a03 + b1*a13 + b2*a23 + b3*a33;
    return out;
}

// Spectrogram class
class SpectrogramVisualizer {
    constructor() {
        this.canvas = document.getElementById('spectrogram-canvas');
        this.gl = this.canvas.getContext('webgl');
        if (!this.gl) throw new Error('WebGL not supported');
        this.meshWidth = 256;
        this.meshHeight = 128;
        this.heightScale = 1.0;
        this.currentColumn = 0;
        this.timeOffset = 0;
        this.lastUpdateTime = performance.now();
        this.updateInterval = 10000 / this.meshWidth; // ms per column for 10s span
        this.nyquist = 22050; // Default, updated later
        this.frequencyData = new Uint8Array(1024); // FFT 2048 / 2
        this.initGL();
        this.createTexture();
        this.setupAudio();
        this.animate();
    }

    initGL() {
        const gl = this.gl;
        gl.clearColor(0, 0, 0, 1);
        gl.enable(gl.DEPTH_TEST);

        const vertexShaderCode = `
attribute vec2 position;
attribute vec2 texCoord;
uniform mat4 modelViewMatrix;
uniform mat4 projectionMatrix;
uniform sampler2D audioTexture;
uniform float timeOffset;
uniform float heightScale;
varying vec4 vColor;
void main() {
    vec4 audioSample = texture2D(audioTexture, vec2(fract(texCoord.x + timeOffset), texCoord.y));
    vec4 pos = vec4(position.x, audioSample.r * heightScale, position.y, 1.0);
    gl_Position = projectionMatrix * modelViewMatrix * pos;
    vColor = vec4(audioSample.rrr, 1.0);
}
        `;

        const fragmentShaderCode = `
precision mediump float;
varying vec4 vColor;
void main() {
    vec3 color = vec3(0.0);
    float value = vColor.r;
    float h = (1.0 - value) * 0.7;
    float s = 0.8;
    float v = value > 0.1 ? 1.0 : 0.0;
    vec3 hsv = vec3(h, s, v);
    vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
    vec3 p = abs(fract(hsv.xxx + K.xyz) * 6.0 - K.www);
    vec3 rgb = hsv.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), hsv.y);
    gl_FragColor = vec4(rgb, 1.0);
}
        `;

        const vs = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vs, vertexShaderCode);
        gl.compileShader(vs);
        if (!gl.getShaderParameter(vs, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(vs));

        const fs = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fs, fragmentShaderCode);
        gl.compileShader(fs);
        if (!gl.getShaderParameter(fs, gl.COMPILE_STATUS)) console.error(gl.getShaderInfoLog(fs));

        this.program = gl.createProgram();
        gl.attachShader(this.program, vs);
        gl.attachShader(this.program, fs);
        gl.linkProgram(this.program);
        if (!gl.getProgramParameter(this.program, gl.LINK_STATUS)) console.error(gl.getProgramInfoLog(this.program));

        this.locations = {
            position: gl.getAttribLocation(this.program, 'position'),
            texCoord: gl.getAttribLocation(this.program, 'texCoord'),
            modelViewMatrix: gl.getUniformLocation(this.program, 'modelViewMatrix'),
            projectionMatrix: gl.getUniformLocation(this.program, 'projectionMatrix'),
            audioTexture: gl.getUniformLocation(this.program, 'audioTexture'),
            timeOffset: gl.getUniformLocation(this.program, 'timeOffset'),
            heightScale: gl.getUniformLocation(this.program, 'heightScale')
        };

        // Generate mesh
        const positions = new Float32Array(this.meshWidth * this.meshHeight * 2);
        const texCoords = new Float32Array(this.meshWidth * this.meshHeight * 2);
        const indices = new Uint16Array((this.meshWidth - 1) * (this.meshHeight - 1) * 6);

        for (let y = 0; y < this.meshHeight; y++) {
            for (let x = 0; x < this.meshWidth; x++) {
                const i = y * this.meshWidth + x;
                positions[i * 2] = (x / (this.meshWidth - 1) * 2) - 1; // x: -1 left to 1 right
                positions[i * 2 + 1] = (y / (this.meshHeight - 1) * 2) - 1; // y: -1 bottom (low Hz) to 1 top (high Hz)
                texCoords[i * 2] = x / this.meshWidth;
                texCoords[i * 2 + 1] = y / this.meshHeight;
            }
        }

        let idx = 0;
        for (let y = 0; y < this.meshHeight - 1; y++) {
            for (let x = 0; x < this.meshWidth - 1; x++) {
                const a = y * this.meshWidth + x;
                const b = a + 1;
                const c = a + this.meshWidth;
                const d = c + 1;
                indices[idx++] = a; indices[idx++] = b; indices[idx++] = c;
                indices[idx++] = b; indices[idx++] = d; indices[idx++] = c;
            }
        }

        this.positionBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);

        this.texCoordBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.bufferData(gl.ARRAY_BUFFER, texCoords, gl.STATIC_DRAW);

        this.indexBuffer = gl.createBuffer();
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, indices, gl.STATIC_DRAW);

        this.numIndices = indices.length;
    }

    createTexture() {
        const gl = this.gl;
        this.texture = gl.createTexture();
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texImage2D(gl.TEXTURE_2D, 0, gl.RGBA, this.meshWidth, this.meshHeight, 0, gl.RGBA, gl.UNSIGNED_BYTE, null);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MIN_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_MAG_FILTER, gl.LINEAR);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_S, gl.REPEAT);
        gl.texParameteri(gl.TEXTURE_2D, gl.TEXTURE_WRAP_T, gl.CLAMP_TO_EDGE);
    }

    async setupAudio() {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
            this.audioCtx = new AudioContext();
            this.nyquist = this.audioCtx.sampleRate / 2;
            this.source = this.audioCtx.createMediaStreamSource(stream);
            this.analyser = this.audioCtx.createAnalyser();
            this.analyser.fftSize = 2048;
            this.analyser.smoothingTimeConstant = 0.8;
            this.analyser.minDecibels = -100;
            this.analyser.maxDecibels = -20;
            this.source.connect(this.analyser);
            this.frequencyData = new Uint8Array(this.analyser.frequencyBinCount);
        } catch (e) {
            console.error('Audio setup error:', e);
        }
    }

    updateTexture(now) {
        if (!this.analyser) return;
        const gl = this.gl;
        this.analyser.getByteFrequencyData(this.frequencyData);
        const columnData = new Uint8Array(this.meshHeight * 4);
        for (let i = 0; i < this.meshHeight; i++) {
            const frac = i / (this.meshHeight - 1); // 0 bottom low, 1 top high
            const f = 20 * Math.pow((this.nyquist / 20), frac);
            const linearPos = Math.floor(f * (this.frequencyData.length - 1) / this.nyquist);
            const value = this.frequencyData[linearPos] || 0;
            const idx = i * 4;
            columnData[idx] = value; columnData[idx + 1] = value; columnData[idx + 2] = value; columnData[idx + 3] = 255;
        }
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.texSubImage2D(gl.TEXTURE_2D, 0, this.currentColumn, 0, 1, this.meshHeight, gl.RGBA, gl.UNSIGNED_BYTE, columnData);
        this.currentColumn = (this.currentColumn + 1) % this.meshWidth;
        this.timeOffset = -this.currentColumn / this.meshWidth; // Negative for flow to left, latest right
        this.lastUpdateTime = now;
    }

    render() {
        const gl = this.gl;
        const w = this.canvas.width;
        const h = this.canvas.height;
        gl.viewport(0, 0, w, h);
        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);

        gl.useProgram(this.program);

        // Matrices
        const projection = createMat4();
        perspective(projection, Math.PI / 4, w / h, 0.1, 100); // 45° FOV

        const modelView = createMat4();
        const eye = createVec3(); eye[0]=0; eye[1]=2; eye[2]=3; // Camera position
        const center = createVec3(); center[0]=0; center[1]=0; center[2]=0;
        const up = createVec3(); up[0]=0; up[1]=1; up[2]=0;
        lookAt(modelView, eye, center, up);

        gl.uniformMatrix4fv(this.locations.projectionMatrix, false, projection);
        gl.uniformMatrix4fv(this.locations.modelViewMatrix, false, modelView);

        gl.uniform1f(this.locations.timeOffset, this.timeOffset);
        gl.uniform1f(this.locations.heightScale, this.heightScale);

        gl.activeTexture(gl.TEXTURE0);
        gl.bindTexture(gl.TEXTURE_2D, this.texture);
        gl.uniform1i(this.locations.audioTexture, 0);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.positionBuffer);
        gl.vertexAttribPointer(this.locations.position, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.locations.position);

        gl.bindBuffer(gl.ARRAY_BUFFER, this.texCoordBuffer);
        gl.vertexAttribPointer(this.locations.texCoord, 2, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(this.locations.texCoord);

        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.indexBuffer);
        gl.drawElements(gl.TRIANGLES, this.numIndices, gl.UNSIGNED_SHORT, 0);
    }

    resize() {
        const displayWidth = window.innerWidth;
        const displayHeight = window.innerHeight;
        if (this.canvas.width !== displayWidth || this.canvas.height !== displayHeight) {
            this.canvas.width = displayWidth;
            this.canvas.height = displayHeight;
        }
    }

    animate = () => {
        requestAnimationFrame(this.animate);
        this.resize();
        const now = performance.now();
        if (now - this.lastUpdateTime >= this.updateInterval) {
            this.updateTexture(now);
        }
        this.render();
    }
}

new SpectrogramVisualizer();