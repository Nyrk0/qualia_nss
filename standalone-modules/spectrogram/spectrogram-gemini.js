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

const sonogramVertexShader = `
  attribute vec3 gPosition;
  attribute vec2 gTexCoord0;
  uniform sampler2D vertexFrequencyData;
  uniform float vertexYOffset;
  uniform mat4 worldViewProjection;
  uniform float verticalScale;
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
    vec4 newPosition = vec4(gPosition.x, gPosition.y + verticalScale * sample.a, gPosition.z, 1.0);
    gl_Position = worldViewProjection * newPosition;
    texCoord = gTexCoord0;
    float hue = 360.0 - ((newPosition.y / verticalScale) * 360.0);
    color = convertHSVToRGB(hue, 1.0, 1.0);
  }
`;

const sonogramFragmentShader = `
  #ifdef GL_ES
  precision mediump float;
  #endif
  varying vec2 texCoord;
  varying vec3 color;
  uniform sampler2D frequencyData;
  uniform vec4 foregroundColor;
  uniform vec4 backgroundColor;
  uniform float yoffset;

  void main() {
    float x = pow(256.0, texCoord.x - 1.0);
    float y = texCoord.y + yoffset;
    vec4 sample = texture2D(frequencyData, vec2(x, y));
    float k = sample.a;
    float fade = pow(cos((1.0 - texCoord.y) * 0.5 * 3.1415926535), 0.5);
    k *= fade;
    gl_FragColor = backgroundColor + vec4(k * color, 1.0);
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

// Player class (mic only)
class Player {
    constructor() {
        window.AudioContext = window.AudioContext || window.webkitAudioContext;
        this.context = new AudioContext();
        this.analyser = this.context.createAnalyser();
        this.analyser.fftSize = 2048;
        this.analyser.smoothingTimeConstant = 0;
        this.mix = this.context.createGain();
        this.mix.connect(this.analyser);
        // this.analyser.connect(this.context.destination); // Removed to prevent mic feedback
    }

    live() {
        if (this.context.state === 'suspended') {
            this.context.resume();
        }
        if (this.input) {
            this.input.disconnect();
            this.input = null;
            return;
        }
        navigator.mediaDevices.getUserMedia({ audio: true })
            .then(stream => this.onStream(stream))
            .catch(err => this.onStreamError(err));
    }

    onStream(stream) {
        this.input = this.context.createMediaStreamSource(stream);
        this.input.connect(this.mix);
        this.stream = stream;
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
        this.initGL();
    }

    getAvailableContext(canvas, contextList) {
        if (canvas.getContext) {
            for (let i = 0; i < contextList.length; ++i) {
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
        this.cameraController.xRot = -180;
        this.cameraController.yRot = 270;
        this.cameraController.zRot = 90;
        this.cameraController.xT = 0;
        this.cameraController.yT = -2;
        this.cameraController.zT = -2;

        gl.clearColor(this.backgroundColor[0], this.backgroundColor[1], this.backgroundColor[2], this.backgroundColor[3]);
        gl.enable(gl.DEPTH_TEST);

        this.init3DGeometry();
        this.initShaders();
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

    initShaders() {
        const gl = this.gl;
        this.sonogram3DShader = this.createShaderProgram(sonogramVertexShader, sonogramFragmentShader);
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

        gl.uniform1i(shader.vertexFrequencyDataLoc, 0);
        let normalizedYOffset = this.yoffset / (this.TEXTURE_HEIGHT - 1);
        gl.uniform1f(shader.yoffsetLoc, normalizedYOffset);
        let discretizedYOffset = Math.floor(normalizedYOffset * (this.sonogram3DHeight - 1)) / (this.sonogram3DHeight - 1);
        gl.uniform1f(shader.vertexYOffsetLoc, discretizedYOffset);
        gl.uniform1f(shader.verticalScaleLoc, this.sonogram3DGeometrySize / 3.5);

        let projection = new Matrix4x4();
        projection.perspective(55, this.canvas.width / this.canvas.height, 1, 100);
        let view = new Matrix4x4();
        view.translate(0, 0, -9.0);
        let model = new Matrix4x4();
        model.rotate(this.cameraController.xRot, 1, 0, 0);
        model.rotate(this.cameraController.yRot, 0, 1, 0);
        model.rotate(this.cameraController.zRot, 0, 0, 1);
        model.translate(this.cameraController.xT, this.cameraController.yT, this.cameraController.zT);

        let mvp = new Matrix4x4();
        mvp.multiply(model);
        mvp.multiply(view);
        mvp.multiply(projection);
        gl.uniformMatrix4fv(shader.worldViewProjectionLoc, false, mvp.elements);

        gl.uniform4fv(shader.foregroundColorLoc, this.foregroundColor);
        gl.uniform4fv(shader.backgroundColorLoc, this.backgroundColor);

        gl.enableVertexAttribArray(vertexLoc);
        gl.vertexAttribPointer(vertexLoc, 3, gl.FLOAT, false, 0, 0);
        gl.enableVertexAttribArray(texCoordLoc);
        gl.vertexAttribPointer(texCoordLoc, 2, gl.FLOAT, false, 0, this.vbo3DTexCoordOffset);

        gl.clear(gl.COLOR_BUFFER_BIT | gl.DEPTH_BUFFER_BIT);
        gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, this.sonogram3DIBO);
        gl.drawElements(gl.TRIANGLES, this.sonogram3DNumIndices, gl.UNSIGNED_SHORT, 0);

        gl.disableVertexAttribArray(vertexLoc);
        gl.disableVertexAttribArray(texCoordLoc);
    }
}

// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    const startButton = document.getElementById('start-button');
    const canvas = document.getElementById('spectrogram');
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;

    const analyserView = new AnalyserView(canvas);
    const player = new Player();

    startButton.addEventListener('click', () => {
        player.live();
        analyserView.setAnalyserNode(player.getAnalyserNode());
        analyserView.initByteBuffer();
        analyserView.start();
        startButton.style.display = 'none';
    });

    window.addEventListener('resize', () => {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    });
});
