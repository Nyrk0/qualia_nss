document.addEventListener('DOMContentLoaded', () => {
  // DOM
  const startBtn = document.getElementById('startBtn');
  const stopBtn = document.getElementById('stopBtn');
  const statusEl = document.getElementById('status');
  const errorBox = document.getElementById('errorBox');
  const canvas = document.getElementById('spectrumCanvas');
  const ctx = canvas.getContext('2d');
  // Generator UI
  const toneSlider = document.getElementById('toneSlider');
  const toneFreqLabel = document.getElementById('toneFreq');
  const toneToggle = document.getElementById('toneToggle');
  const whiteToggle = document.getElementById('whiteToggle');
  const pinkToggle = document.getElementById('pinkToggle');
  const brownToggle = document.getElementById('brownToggle');
  // Visualization UI
  const lineOnlyBtn = document.getElementById('lineOnlyBtn');
  const fftDownBtn = document.getElementById('fftDownBtn');
  const fftUpBtn = document.getElementById('fftUpBtn');
  const fftSizeLabel = document.getElementById('fftSizeLabel');
  const smoothingBtn = document.getElementById('smoothingBtn');

  // Audio
  let audioCtx = null;
  let analyser = null;
  let micSource = null;
  let freqBins = null; // Float32Array of dB values
  let rafId = null;
  let isRunning = false;
  let lineOnly = true;

  // Generator state
  let toneOsc = null;
  let toneGain = null;
  let toneOn = false;
  let toneFreqHz = 1000;
  const TONE_TARGET_GAIN = 0.03;
  const TONE_RAMP_UP_MS = 60;
  const TONE_RAMP_DOWN_MS = 80;

  let whiteNode = null, whiteGain = null, whiteOn = false;
  let pinkNode = null, pinkGain = null, pinkOn = false;
  let brownNode = null, brownGain = null, brownOn = false;

  // DPI scaling
  function setupCanvasDPI() {
    if (!canvas) return;
    const dpr = Math.max(1, window.devicePixelRatio || 1);
    const cssW = canvas.clientWidth || 960;
    const cssH = canvas.clientHeight || 320;
    canvas.width = Math.max(1, Math.floor(cssW * dpr));
    canvas.height = Math.max(1, Math.floor(cssH * dpr));
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.scale(dpr, dpr);
  }

  // Smoothing presets (global)
  const SMOOTH_STEPS = [0, 0.1, 0.3, 0.5];
  let smoothingIndex = 3; // default 0.5
  let currentSmoothing = SMOOTH_STEPS[smoothingIndex];
  function applySmoothing(idx) {
    smoothingIndex = Math.max(0, Math.min(SMOOTH_STEPS.length - 1, idx));
    currentSmoothing = SMOOTH_STEPS[smoothingIndex];
    if (smoothingBtn) smoothingBtn.textContent = `Smooth: ${currentSmoothing}`;
    if (analyser) analyser.smoothingTimeConstant = currentSmoothing;
  }
  
  setupCanvasDPI();
  window.addEventListener('resize', setupCanvasDPI);

  function setStatus(text, color = '#a9b0b7') {
    if (statusEl) { statusEl.textContent = text; statusEl.style.color = color; }
  }
  function showError(msg) {
    if (!errorBox) return;
    errorBox.hidden = false;
    errorBox.textContent = msg;
  }
  function hideError() {
    if (!errorBox) return;
    errorBox.hidden = true;
    errorBox.textContent = '';
  }

  // Ensure audio context (shared for mic and generators)
  function ensureAudioCtx() {
    if (!audioCtx) {
      audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    if (audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
    return audioCtx;
  }

  const FFT_STEPS = [2048, 4096, 8192, 16384, 32768];
  let fftIndex = 2; // default -> 8192

  function applyFftSize(size) {
    fftIndex = Math.max(0, Math.min(FFT_STEPS.length - 1, FFT_STEPS.indexOf(size) >= 0 ? FFT_STEPS.indexOf(size) : fftIndex));
    if (fftSizeLabel) fftSizeLabel.textContent = String(FFT_STEPS[fftIndex]);
    if (fftDownBtn) fftDownBtn.disabled = (fftIndex === 0);
    if (fftUpBtn) fftUpBtn.disabled = (fftIndex === FFT_STEPS.length - 1);
    if (analyser) {
      analyser.fftSize = FFT_STEPS[fftIndex];
      freqBins = new Float32Array(analyser.frequencyBinCount);
    }
  }

  async function startMic() {
    if (isRunning) return;
    hideError();
    try {
      ensureAudioCtx();
      analyser = audioCtx.createAnalyser();
      analyser.fftSize = FFT_STEPS[fftIndex]; // default resolution
      analyser.smoothingTimeConstant = currentSmoothing; // configurable smoothing
      analyser.minDecibels = -100;
      analyser.maxDecibels = -20;

      const constraints = {
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      micSource = audioCtx.createMediaStreamSource(stream);
      micSource.connect(analyser);

      freqBins = new Float32Array(analyser.frequencyBinCount);
      isRunning = true;
      startBtn.disabled = true;
      stopBtn.disabled = false;
      setStatus('Microphone active', '#66cc88');
      drawLoop();
    } catch (err) {
      console.error(err);
      showError(
        (err && err.name === 'NotAllowedError') ? 'Mic permission denied. Allow access in browser/macos settings.' :
        (err && err.name === 'NotFoundError') ? 'No microphone found.' :
        (err && err.message) || 'Unknown microphone error.'
      );
      setStatus('Error', '#ff6b6b');
      stopBtn.disabled = true;
      startBtn.disabled = false;
    }
  }

  function stopMic() {
    if (!isRunning) return;
    if (rafId) { cancelAnimationFrame(rafId); rafId = null; }
    if (micSource) {
      try {
        const tracks = micSource.mediaStream.getTracks();
        tracks.forEach(t => { try { t.stop(); } catch (_) {} });
      } catch (_) {}
      try { micSource.disconnect(); } catch (_) {}
      micSource = null;
    }
    // Keep audioCtx alive for generators
    analyser = null;
    freqBins = null;
    isRunning = false;
    startBtn.disabled = false;
    stopBtn.disabled = true;
    setStatus('Idle');
    // Clear canvas
    ctx.clearRect(0, 0, canvas.clientWidth || 960, canvas.clientHeight || 320);
  }

  function hzToBin(hz) {
    if (!audioCtx || !analyser) return 0;
    const binHz = audioCtx.sampleRate / analyser.fftSize;
    return Math.max(0, Math.min(analyser.frequencyBinCount - 1, Math.floor(hz / binHz)));
  }

  function drawGrid(w, h, minDb, maxDb) {
    ctx.save();
    ctx.strokeStyle = 'rgba(255,255,255,0.06)';
    ctx.lineWidth = 1;
    const fMin = 20, fMax = 20000;

    // Vertical grid lines at log-spaced frequency ticks
    const fTicks = [20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];
    for (const f of fTicks) {
      const t = Math.log(f / fMin) / Math.log(fMax / fMin);
      const x = Math.round(t * w) + 0.5;
      ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, h); ctx.stroke();
    }

    // Horizontal grid lines at dB ticks
    const dbStep = 20; // 0, -20, -40, ...
    for (let db = 0; db >= -100; db -= dbStep) {
      if (db < maxDb && db > minDb) {
        const y = Math.round(((db - maxDb) / (minDb - maxDb)) * h) + 0.5;
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y); ctx.stroke();
      }
    }

    // Frequency tick labels at bottom
    ctx.fillStyle = '#8fa1b3';
    ctx.font = '12px system-ui, -apple-system, Segoe UI, Roboto, Helvetica, Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'bottom';
    for (const f of fTicks) {
      const t = Math.log(f / fMin) / Math.log(fMax / fMin);
      const x = t * w;
      const label = f >= 1000 ? `${(f/1000).toFixed(f%1000?1:0)}k` : `${f}`;
      ctx.fillText(label, x, h - 4);
    }

    // dB labels on left
    ctx.textAlign = 'left'; ctx.textBaseline = 'middle';
    for (let db = 0; db >= -100; db -= dbStep) {
      if (db < maxDb && db > minDb) {
        const y = ((db - maxDb) / (minDb - maxDb)) * h;
        ctx.fillText(`${db}`, 6, y);
      }
    }
    ctx.restore();
  }

  function drawLoop() {
    if (!isRunning || !analyser || !freqBins) return;

    analyser.getFloatFrequencyData(freqBins);
    const w = canvas.clientWidth || 960;
    const h = canvas.clientHeight || 320;

    // Background
    ctx.fillStyle = '#0b0d10';
    ctx.fillRect(0, 0, w, h);

    // Grid and labels using analyser dB range
    const minDb = analyser.minDecibels;
    const maxDb = analyser.maxDecibels;
    drawGrid(w, h, minDb, maxDb);

    // Spectrum curve (log-frequency mapping)
    const fMin = 20, fMax = 20000;
    const N = freqBins.length; // analyser.frequencyBinCount
    const binHz = (audioCtx ? audioCtx.sampleRate : 48000) / (analyser ? analyser.fftSize : 2048);

    ctx.beginPath();
    for (let x = 0; x < w; x++) {
      const t = x / Math.max(1, (w - 1));
      const f = fMin * Math.pow(fMax / fMin, t);
      const idx = Math.max(0, Math.min(N - 1, Math.floor(f / binHz)));
      let db = freqBins[idx];
      if (!isFinite(db)) db = minDb;
      db = Math.max(minDb, Math.min(maxDb, db));
      const y = ((db - maxDb) / (minDb - maxDb)) * h;
      if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.strokeStyle = '#66ccff';
    ctx.lineWidth = 1; // thinner spectrum line
    ctx.stroke();

    // Fill under curve (optional)
    if (!lineOnly) {
      ctx.lineTo(w, h); ctx.lineTo(0, h); ctx.closePath();
      const fillG = ctx.createLinearGradient(0, 0, 0, h);
      fillG.addColorStop(0, 'rgba(102,204,255,0.35)');
      fillG.addColorStop(1, 'rgba(102,204,255,0.06)');
      ctx.fillStyle = fillG;
      ctx.fill();
    }

    rafId = requestAnimationFrame(drawLoop);
  }

  // -----------------------------
  // Tone and noise generators
  // -----------------------------
  const TONE_MIN = 20;
  const TONE_MAX = 20000;
  const LOG_MIN = Math.log(TONE_MIN);
  const LOG_MAX = Math.log(TONE_MAX);

  function sliderToFreq(val) {
    const t = Math.max(0, Math.min(1, Number(val)));
    const f = Math.exp(LOG_MIN + (LOG_MAX - LOG_MIN) * t);
    return Math.max(TONE_MIN, Math.min(TONE_MAX, f));
  }

  function freqToSlider(freq) {
    const f = Math.max(TONE_MIN, Math.min(TONE_MAX, Number(freq)));
    const t = (Math.log(f) - LOG_MIN) / (LOG_MAX - LOG_MIN);
    return Math.max(0, Math.min(1, t));
  }

  const SNAP_TARGETS = (() => {
    const targets = new Set([20, 25, 31.5, 40, 50, 63, 80]);
    for (let v = 100; v <= 10000; v += 100) targets.add(v);
    for (let v = 11000; v <= 20000; v += 1000) targets.add(v);
    return Array.from(targets).filter(v => v >= TONE_MIN && v <= TONE_MAX).sort((a,b) => a-b);
  })();

  function snapFrequency(freq) {
    const f = Math.max(TONE_MIN, Math.min(TONE_MAX, Number(freq)));
    let best = f, bestDelta = Infinity;
    for (const t of SNAP_TARGETS) {
      const tol = Math.max(0.5, 0.005 * t);
      const d = Math.abs(f - t);
      if (d < tol && d < bestDelta) { best = t; bestDelta = d; }
    }
    return best;
  }

  function updateToneUI(freq) {
    if (toneFreqLabel) toneFreqLabel.textContent = `${Math.round(freq)} Hz`;
  }

  function startTone() {
    if (toneOn) return;
    const ac = ensureAudioCtx();
    toneOsc = ac.createOscillator();
    toneGain = ac.createGain();
    toneOsc.type = 'sine';
    toneOsc.frequency.value = toneFreqHz;
    const now = ac.currentTime;
    toneGain.gain.cancelScheduledValues(now);
    toneGain.gain.setValueAtTime(0, now);
    toneOsc.connect(toneGain);
    toneGain.connect(ac.destination);
    toneOsc.start();
    toneGain.gain.linearRampToValueAtTime(TONE_TARGET_GAIN, now + TONE_RAMP_UP_MS / 1000);
    toneOn = true;
    if (toneToggle) { toneToggle.textContent = '🔊'; toneToggle.classList.add('active'); }
  }

  function stopTone() {
    if (!toneOn) return;
    const ac = ensureAudioCtx();
    const now = ac.currentTime;
    try {
      toneGain.gain.cancelScheduledValues(now);
      const cur = toneGain.gain.value;
      toneGain.gain.setValueAtTime(cur, now);
      toneGain.gain.linearRampToValueAtTime(0, now + TONE_RAMP_DOWN_MS / 1000);
    } catch (_) {}
    setTimeout(() => {
      try { toneOsc.stop(); } catch(_) {}
      try { toneOsc.disconnect(); } catch(_) {}
      try { toneGain.disconnect(); } catch(_) {}
      toneOsc = null; toneGain = null;
    }, TONE_RAMP_DOWN_MS + 10);
    toneOn = false;
    if (toneToggle) { toneToggle.textContent = '🔈'; toneToggle.classList.remove('active'); }
  }

  function createWhiteBuffer(ac, seconds = 2) {
    const len = Math.max(1, Math.floor(ac.sampleRate * seconds));
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }

  // Paul Kellet pink noise filter approximation
  function createPinkNode(ac) {
    const bufferSize = 1024;
    const node = ac.createScriptProcessor ? ac.createScriptProcessor(bufferSize, 1, 1) : new AudioWorkletNode(ac, 'not-implemented');
    // Fallback to ScriptProcessor only (supported in Chrome), simple pink approximation
    let b0=0, b1=0, b2=0, b3=0, b4=0, b5=0, b6=0;
    node.onaudioprocess = e => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < out.length; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        b3 = 0.86650 * b3 + white * 0.3104856;
        b4 = 0.55000 * b4 + white * 0.5329522;
        b5 = -0.7616 * b5 - white * 0.0168980;
        out[i] = b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362;
        out[i] *= 0.11; // gain trim
        b6 = white * 0.115926;
      }
    };
    return node;
  }

  function createBrownNode(ac) {
    const bufferSize = 1024;
    const node = ac.createScriptProcessor ? ac.createScriptProcessor(bufferSize, 1, 1) : new AudioWorkletNode(ac, 'not-implemented');
    let lastOut = 0;
    node.onaudioprocess = e => {
      const out = e.outputBuffer.getChannelData(0);
      for (let i = 0; i < out.length; i++) {
        const white = Math.random() * 2 - 1;
        const y = (lastOut + (0.02 * white)) / 1.02;
        lastOut = y;
        out[i] = y * 3.5; // gain trim
      }
    };
    return node;
  }

  function startWhite() {
    if (whiteOn) return;
    const ac = ensureAudioCtx();
    whiteGain = ac.createGain();
    whiteGain.gain.value = 0;
    const src = ac.createBufferSource();
    src.buffer = createWhiteBuffer(ac);
    src.loop = true;
    src.connect(whiteGain); whiteGain.connect(ac.destination);
    src.start();
    const now = ac.currentTime; whiteGain.gain.linearRampToValueAtTime(0.03, now + 0.06);
    whiteNode = src; whiteOn = true; if (whiteToggle) whiteToggle.classList.add('active');
  }
  function stopWhite() {
    if (!whiteOn) return;
    const ac = ensureAudioCtx(); const now = ac.currentTime;
    try { whiteGain.gain.linearRampToValueAtTime(0, now + 0.08); } catch(_) {}
    setTimeout(() => { try { whiteNode.stop(); } catch(_) {}; try { whiteNode.disconnect(); } catch(_) {}; try { whiteGain.disconnect(); } catch(_) {}; whiteNode=null; whiteGain=null; }, 100);
    whiteOn = false; if (whiteToggle) whiteToggle.classList.remove('active');
  }

  function startPink() {
    if (pinkOn) return;
    const ac = ensureAudioCtx();
    pinkGain = ac.createGain(); pinkGain.gain.value = 0;
    const node = createPinkNode(ac);
    node.connect(pinkGain); pinkGain.connect(ac.destination);
    const now = ac.currentTime; pinkGain.gain.linearRampToValueAtTime(0.03, now + 0.06);
    pinkNode = node; pinkOn = true; if (pinkToggle) pinkToggle.classList.add('active');
  }
  function stopPink() {
    if (!pinkOn) return;
    const ac = ensureAudioCtx(); const now = ac.currentTime;
    try { pinkGain.gain.linearRampToValueAtTime(0, now + 0.08); } catch(_) {}
    setTimeout(() => { try { pinkNode.disconnect(); } catch(_) {}; try { pinkGain.disconnect(); } catch(_) {}; pinkNode=null; pinkGain=null; }, 100);
    pinkOn = false; if (pinkToggle) pinkToggle.classList.remove('active');
  }

  function startBrown() {
    if (brownOn) return;
    const ac = ensureAudioCtx();
    brownGain = ac.createGain(); brownGain.gain.value = 0;
    const node = createBrownNode(ac);
    node.connect(brownGain); brownGain.connect(ac.destination);
    const now = ac.currentTime; brownGain.gain.linearRampToValueAtTime(0.03, now + 0.06);
    brownNode = node; brownOn = true; if (brownToggle) brownToggle.classList.add('active');
  }
  function stopBrown() {
    if (!brownOn) return;
    const ac = ensureAudioCtx(); const now = ac.currentTime;
    try { brownGain.gain.linearRampToValueAtTime(0, now + 0.08); } catch(_) {}
    setTimeout(() => { try { brownNode.disconnect(); } catch(_) {}; try { brownGain.disconnect(); } catch(_) {}; brownNode=null; brownGain=null; }, 100);
    brownOn = false; if (brownToggle) brownToggle.classList.remove('active');
  }

  // Initialize slider and UI
  if (toneSlider) {
    toneFreqHz = 1000;
    toneSlider.value = String(freqToSlider(toneFreqHz));
    updateToneUI(toneFreqHz);
    toneSlider.addEventListener('input', () => {
      let f = sliderToFreq(toneSlider.value);
      const snapped = snapFrequency(f);
      if (snapped !== f) {
        toneSlider.value = String(freqToSlider(snapped));
        f = snapped;
      }
      toneFreqHz = f; updateToneUI(toneFreqHz);
      if (toneOn && toneOsc) {
        const ac = ensureAudioCtx();
        toneOsc.frequency.setTargetAtTime(toneFreqHz, ac.currentTime, 0.01);
      }
    });

  // Smoothing control
  const SMOOTH_STEPS = [0, 0.1, 0.3, 0.5];
  let smoothingIndex = 3; // default 0.5
  let currentSmoothing = SMOOTH_STEPS[smoothingIndex];
  function applySmoothing(idx) {
    smoothingIndex = Math.max(0, Math.min(SMOOTH_STEPS.length - 1, idx));
    currentSmoothing = SMOOTH_STEPS[smoothingIndex];
    if (smoothingBtn) smoothingBtn.textContent = `Smooth: ${currentSmoothing}`;
    if (analyser) analyser.smoothingTimeConstant = currentSmoothing;
  }
  if (smoothingBtn) {
    smoothingBtn.textContent = `Smooth: ${currentSmoothing}`;
    smoothingBtn.addEventListener('click', () => {
      const next = (smoothingIndex + 1) % SMOOTH_STEPS.length;
      applySmoothing(next);
    });
  }
  }

  if (toneToggle) toneToggle.addEventListener('click', () => { toneOn ? stopTone() : startTone(); });
  if (whiteToggle) whiteToggle.addEventListener('click', () => { whiteOn ? stopWhite() : startWhite(); });
  if (pinkToggle) pinkToggle.addEventListener('click', () => { pinkOn ? stopPink() : startPink(); });
  if (brownToggle) brownToggle.addEventListener('click', () => { brownOn ? stopBrown() : startBrown(); });

  // Visualization controls
  if (lineOnlyBtn) {
    lineOnlyBtn.addEventListener('click', () => {
      lineOnly = !lineOnly;
      lineOnlyBtn.classList.toggle('active', lineOnly);
      lineOnlyBtn.textContent = lineOnly ? 'Line only' : 'Line + fill';
    });
  }

  // FFT controls
  if (fftSizeLabel) fftSizeLabel.textContent = String(FFT_STEPS[fftIndex]);
  if (fftDownBtn) fftDownBtn.disabled = (fftIndex === 0);
  if (fftUpBtn) fftUpBtn.disabled = (fftIndex === FFT_STEPS.length - 1);
  if (fftDownBtn) fftDownBtn.addEventListener('click', () => {
    if (fftIndex > 0) {
      fftIndex -= 1;
      applyFftSize(FFT_STEPS[fftIndex]);
    }
  });
  if (fftUpBtn) fftUpBtn.addEventListener('click', () => {
    if (fftIndex < FFT_STEPS.length - 1) {
      fftIndex += 1;
      applyFftSize(FFT_STEPS[fftIndex]);
    }
  });

  // Controls
  startBtn.addEventListener('click', startMic);
  stopBtn.addEventListener('click', stopMic);

  // Cleanup
  window.addEventListener('beforeunload', () => {
    stopMic();
    stopTone(); stopWhite(); stopPink(); stopBrown();
  });
});
