'use strict';

(function(){
  const qs = (sel) => document.querySelector(sel);

  const el = {
    canvas: qs('#spectrogram'),
    start: qs('#btn-start'),
    stop: qs('#btn-stop'),
    selFft: qs('#sel-fft'),
    rngSmooth: qs('#rng-smooth'),
    status: qs('#status'),
    fileWarn: qs('#file-warning')
  };

  const ctx2d = el.canvas.getContext('2d');
  const W = () => el.canvas.width;
  const H = () => el.canvas.height;

  // Offscreen canvas for circular scrolling without expensive blits
  const off = document.createElement('canvas');
  off.width = el.canvas.width; off.height = el.canvas.height;
  const offctx = off.getContext('2d');

  // Render state
  let audio = null; // {ctx, analyser, source, stream}
  let freqBins = null; // Uint8Array
  let running = false;
  let lastCol = 0; // current write x position (circular)
  let raf = 0;

  // Colormap (Turbo approximation)
  function turboColor(t){
    t = Math.min(1, Math.max(0, t));
    const r = 34.61 + t*(1172.33 + t*(-10793.56 + t*(33300.12 + t*(-38394.49 + t*14825.05))));
    const g = 23.31 + t*(557.33 + t*(1225.33 + t*(-3574.96 + t*(1883.36))));
    const b = 27.2 + t*(3211.1 + t*(-15327.97 + t*(27814.0 + t*(-22569.18 + t*6838.66))));
    return [
      Math.max(0, Math.min(255, r)),
      Math.max(0, Math.min(255, g)),
      Math.max(0, Math.min(255, b))
    ];
  }

  function setStatus(msg){ el.status.textContent = msg; }

  function insecureContextNote(){
    // file:// is not a secure context in most Chromium; Safari allows getUserMedia on file://
    const isFile = location.protocol === 'file:';
    const isSecure = location.protocol === 'https:' || isFile; // treat file as allowed
    if (!isSecure) return;
    if (isFile) el.fileWarn.style.display = '';
  }

  async function start(){
    if (running) return;
    try {
      insecureContextNote();
      setStatus('Requesting microphone permission…');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false }, video: false });
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const src = ctx.createMediaStreamSource(stream);
      const analyser = ctx.createAnalyser();
      analyser.fftSize = parseInt(el.selFft.value, 10);
      analyser.smoothingTimeConstant = parseFloat(el.rngSmooth.value);
      analyser.minDecibels = -100;
      analyser.maxDecibels = -20;
      src.connect(analyser);

      audio = { ctx, analyser, source: src, stream };
      freqBins = new Uint8Array(analyser.frequencyBinCount);
      running = true;
      el.start.disabled = true;
      el.stop.disabled = false;
      setStatus('Streaming…');
      lastCol = 0;

      // Clear canvases
      offctx.clearRect(0,0,off.width, off.height);
      ctx2d.clearRect(0,0,W(),H());

      tick();
    } catch (err){
      console.error(err);
      setStatus('Microphone error: ' + (err && err.message ? err.message : String(err)));
      // Helpful tips
      if (location.protocol === 'file:' && /NotAllowedError|Permission|denied/i.test(String(err))) {
        el.fileWarn.style.display = '';
      }
    }
  }

  function stop(){
    running = false;
    cancelAnimationFrame(raf);
    if (audio){
      try { audio.stream.getTracks().forEach(t => t.stop()); } catch(e){}
      try { audio.ctx.close(); } catch(e){}
      audio = null;
    }
    el.start.disabled = false;
    el.stop.disabled = true;
    setStatus('Stopped');
  }

  function resizeToCss(){
    // Keep backing store size in sync with CSS to preserve sharpness
    const dpr = Math.max(1, Math.min(2, window.devicePixelRatio || 1));
    const rect = el.canvas.getBoundingClientRect();
    const w = Math.max(320, Math.floor(rect.width * dpr));
    const h = Math.max(160, Math.floor(rect.height * dpr));
    if (el.canvas.width !== w || el.canvas.height !== h){
      el.canvas.width = w; el.canvas.height = h;
      off.width = w; off.height = h;
    }
  }

  function drawColumn(x, values){
    // values: Uint8Array length = H (we will map low->bottom, high->top)
    const h = H();
    const imageData = offctx.createImageData(1, h);
    const d = imageData.data;
    for (let i = 0; i < h; i++){
      // Map canvas y to frequency bin using logarithmic mapping
      const frac = i / (h - 1);
      const freqBin = Math.floor(frac * (values.length - 1));
      const v = values[freqBin] / 255; // 0..1
      // dynamic range compression
      const vv = Math.pow(v, 0.6);
      const [r,g,b] = turboColor(vv);
      const idx = (h - 1 - i) * 4; // low at bottom
      d[idx] = r; d[idx+1] = g; d[idx+2] = b; d[idx+3] = 255;
    }
    offctx.putImageData(imageData, x, 0);
  }

  function blitToMain(){
    const w = W(); const h = H();
    // Circular scroll: write at lastCol, newest on the right, visual scroll left -> right-to-left time
    const A = w - lastCol; // width from lastCol to end
    if (A > 0){ ctx2d.drawImage(off, lastCol, 0, A, h, 0, 0, A, h); }
    if (lastCol > 0){ ctx2d.drawImage(off, 0, 0, lastCol, h, A, 0, lastCol, h); }
  }

  function tick(){
    if (!running || !audio) return;
    raf = requestAnimationFrame(tick);
    resizeToCss();

    const an = audio.analyser;
    if (freqBins.length !== an.frequencyBinCount) freqBins = new Uint8Array(an.frequencyBinCount);
    an.getByteFrequencyData(freqBins);

    // Write next column into offscreen
    drawColumn(lastCol, freqBins);
    lastCol = (lastCol + 1) % W();

    // Present
    blitToMain();
  }

  // UI wiring
  el.start.addEventListener('click', start);
  el.stop.addEventListener('click', stop);
  el.selFft.addEventListener('change', () => {
    if (audio){ audio.analyser.fftSize = parseInt(el.selFft.value, 10); freqBins = new Uint8Array(audio.analyser.frequencyBinCount); }
  });
  el.rngSmooth.addEventListener('input', () => { if (audio) audio.analyser.smoothingTimeConstant = parseFloat(el.rngSmooth.value); });

  // Feature checks and hints
  if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia){
    setStatus('getUserMedia not supported in this browser');
  } else {
    setStatus('Idle — click Start Microphone');
  }

  // Expose stop on page hide to avoid hot mic
  document.addEventListener('visibilitychange', () => { if (document.hidden) stop(); });
})();
