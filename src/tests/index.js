// Import the fixed tone-control component
import { ToneControl } from '../modules/tone-control.js';

(function(){
  class TestsModule {
    constructor(){
      this.root = null;
      this._handlers = [];
      this._disposers = [];
      this.audioContext = null;
      this.microphone = null;
      this.globalAnalyser = null;
      this.rafId = null;
      this.calibrationOffsetDb = 3.0;
      this.lastValueUpdateMs = 0;
      this.whiteNoiseSource = null;
      this.whiteNoiseGain = null;
      this.toneOsc = null;
      this.toneGain = null;
      this.toneOn = false;
      this.toneFreqHz = 1000;
      this.bands = null; // array of {key,f1,f2,color, analyser, filter, data, elements}
      // Colormap anchors for tone slider coloring and gradient (log-scale interpolation)
      // Extremes and specified band middles
      this._colormapAnchors = [
        { f: 20, color: '#7a0403' },        // extreme low (deep red)
        { f: 40, color: '#d03a3f' },        // Sub-bass (red)
        { f: 122.5, color: '#f99e1a' },     // Bass (orange)
        { f: 353.6, color: '#f4e61e' },     // Low Mid (yellow)
        { f: 1000, color: '#32cd32' },      // Midrange (green)
        { f: 2828.4, color: '#1ea1fa' },    // Upper Mid (cyan)
        { f: 4898.8, color: '#4145ab' },    // Presence (blue)
        { f: 14000, color: '#9370db' },     // Brilliance (violet, brighter)
        { f: 20000, color: '#e9acff' }      // extreme high (soft bright violet)
      ];
      // Turbo anchors sampled across the Turbo gradient (low->high: purple->red)
      this._turboAnchors = [
        { f: 20, color: '#30123b' },
        { f: 34.6, color: '#3a2b7a' },
        { f: 122.5, color: '#4145ab' },
        { f: 353.6, color: '#1ea1fa' },
        { f: 1000, color: '#20c997' },
        { f: 2828.4, color: '#f4e61e' },
        { f: 4898.8, color: '#f99e1a' },
        { f: 10954.5, color: '#d03a3f' },
        { f: 20000, color: '#7a0403' }
      ];
      this.colormapMode = 'band';
    }

    async init(){
      this.root = document.getElementById('tests-root');
      if (!this.root) return;

      // Insert fragment (inline to avoid fetch/CORS issues)
      this.root.innerHTML = await this._inlineFragment();

      // Ensure styles present
      this._ensureStyles();

      // Cache elements (scoped)
      const $ = (sel)=> this.root.querySelector(sel);
      this.els = {
        startBtn: $('#startBtn'),
        refreshBtn: $('#refreshDevices'),
        retryBtn: $('#retryBtn'),
        deviceSelect: $('#deviceSelect'),
        colormapSelect: document.getElementById('colormapSelect') || $('#colormapSelect'),
        calOffsetInput: $('#calOffset'),
        calResetBtn: $('#calReset'),
        errorBox: $('#errorBox'),
        bandsContainer: $('#bandsContainer'),
        whiteNoiseBtn: $('#whiteNoiseBtn'),
        stopNoiseBtn: $('#stopNoiseBtn'),
        toneControl: $('#toneControl')
      };

      // Build bands model
      this.bandDefs = [
        { key: 'sub',   name: 'Sub‑bass',   f1: 20,   f2: 60,    color: '#8b0000' },
        { key: 'bass',  name: 'Bass',       f1: 60,   f2: 250,   color: '#dc143c' },
        { key: 'lowmid',name: 'Low Mid',    f1: 250,  f2: 500,   color: '#ff6347' },
        { key: 'mid',   name: 'Midrange',   f1: 500,  f2: 2000,  color: '#ff8c00' },
        { key: 'upmid', name: 'Upper Mid',  f1: 2000, f2: 4000,  color: '#32cd32' },
        { key: 'pres',  name: 'Presence',   f1: 4000, f2: 6000,  color: '#1e90ff' },
        { key: 'brill', name: 'Brilliance', f1: 6000, f2: 20000, color: '#9370db' },
        { key: 'total', name: 'Total',      f1: 20,   f2: 20000, color: '#808080' }
      ];
      this.bands = this.bandDefs.map(def => ({ ...def, analyser: null, filter: null, data: null, elements: null, fastDb: -100, vuDb: -100, peakDb: -100 }));

      this._createBandsUI();
      // Apply initial colormap to bands
      this._applyColormapToBands();
      await this._initDevices();

      // Wire events
      this._on(this.els.startBtn, 'click', ()=> this._toggleMeter());
      this._on(this.els.refreshBtn, 'click', ()=> this._initDevices());
      this._on(this.els.retryBtn, 'click', ()=> { this._hideError(); this._startMeter().catch(e=>this._handleError(e)); });

      // Calibration input
      if (this.els.calOffsetInput){
        this.els.calOffsetInput.value = this.calibrationOffsetDb.toFixed(1);
        this._on(this.els.calOffsetInput, 'input', ()=>{
          const v = parseFloat(this.els.calOffsetInput.value);
          if (!Number.isFinite(v)) return; 
          this.calibrationOffsetDb = Math.max(-60, Math.min(60, v));
        });
      }
      if (this.els.calResetBtn){
        this._on(this.els.calResetBtn, 'click', ()=>{
          this.calibrationOffsetDb = 0;
          if (this.els.calOffsetInput) this.els.calOffsetInput.value = '0.0';
        });
      }

      // White noise controls
      this._on(this.els.whiteNoiseBtn, 'click', ()=>{ this._startWhiteNoise(); this.els.whiteNoiseBtn.style.display='none'; if (this.els.stopNoiseBtn) this.els.stopNoiseBtn.style.display='inline-block'; });
      this._on(this.els.stopNoiseBtn, 'click', ()=>{ this._stopWhiteNoise(); this.els.stopNoiseBtn.style.display='none'; if (this.els.whiteNoiseBtn) this.els.whiteNoiseBtn.style.display='inline-block'; });

      // Tone controls
      this._bindColormapSelector();
      if (!this.els.colormapSelect){
        // Sidebar may load after module; retry shortly
        setTimeout(()=> this._bindColormapSelector(), 300);
        setTimeout(()=> this._bindColormapSelector(), 1000);
      }
      // Re-bind if sidebar content is replaced by module loader later
      const sidebarEl = document.getElementById('sidebar');
      if (sidebarEl && !this._sidebarObserver){
        this._sidebarObserver = new MutationObserver(()=>{
          // If colormapSelect was re-created, rebind
          const current = document.getElementById('colormapSelect');
          if (current && current !== this.els.colormapSelect){
            this._bindColormapSelector();
          }
          // Also refresh preview if it exists
          this._updateColormapPreview();
        });
        this._sidebarObserver.observe(sidebarEl, { childList: true, subtree: true });
      }
      if (this.els.toneControl){
        this.toneFreqHz = 1000;
        this.els.toneControl.frequency = this.toneFreqHz;
        // Set color function for frequency-based coloring
        this.els.toneControl.colorForFrequency = (freq) => this._colorForFreq(freq);
        
        this._on(this.els.toneControl, 'frequencychange', (e) => {
          const freq = e.detail.frequency;
          const snapped = this._snapFrequency(freq);
          if (snapped !== freq) {
            this.els.toneControl.frequency = snapped;
          } else {
            this.toneFreqHz = snapped;
            if (this.toneOn && this.toneOsc && this.audioContext){ 
              this.toneOsc.frequency.setTargetAtTime(this.toneFreqHz, this.audioContext.currentTime, 0.01); 
            }
          }
        });
        
        this._on(this.els.toneControl, 'toggle', (e) => {
          e.detail.active ? this._startTone() : this._stopTone();
        });
      }

      // Device change listener (global API)
      if (navigator.mediaDevices && 'ondevicechange' in navigator.mediaDevices){
        const fn = ()=> this._initDevices();
        navigator.mediaDevices.addEventListener('devicechange', fn);
        this._disposers.push(()=> navigator.mediaDevices.removeEventListener('devicechange', fn));
      }

      // Unload cleanup
      const onBeforeUnload = ()=>{ this.destroy(); };
      window.addEventListener('beforeunload', onBeforeUnload);
      this._disposers.push(()=> window.removeEventListener('beforeunload', onBeforeUnload));
    }

    destroy(){
      if (this.rafId) cancelAnimationFrame(this.rafId), this.rafId=null;
      this._handlers.forEach(({el,type,fn})=> el && el.removeEventListener(type, fn));
      this._handlers = [];
      this._disposers.forEach(fn=>{ try{ fn(); }catch(_){} });
      this._disposers = [];
      this._stopWhiteNoise();
      this._stopTone(true);
      this._stopMeter(true);
      if (this.root) this.root.innerHTML = '';
      this.root = null;
    }

    _ensureStyles(){
      if (document.getElementById('tests-styles')) return;
      const link = document.createElement('link');
      link.id = 'tests-styles'; link.rel='stylesheet'; link.href='src/tests/styles.css';
      document.head.appendChild(link);
    }

    _inlineFragment(){
      // The module template already inserted a root. We return the inner fragment for the meter UI.
      // We reuse the same markup as src/tests/index.html
      return fetch('src/tests/index.html').then(r=>r.text()).catch(()=>{
        return `<div class="container">
  <h1>7‑Band Level Meter</h1>
  <div class="bands-section">
    <div class="controls controls-row">
      <select id="deviceSelect" aria-label="Input device">
        <option value="">Select microphone...</option>
      </select>
      <button id="refreshDevices">Refresh</button>
      <button id="startBtn">Start Microphone</button>
      <button id="retryBtn" style="display:none;">Retry</button>
      <label for="calOffset" class="cal-label" style="margin-left:8px;white-space:nowrap;">Cal (dBFS):</label>
      <input id="calOffset" type="number" step="0.1" value="0" aria-label="Calibration offset in dBFS" style="width:48px;">
      <button id="calReset" title="Reset calibration to 0 dB">Reset</button>
      <button id="whiteNoiseBtn">Start White Noise</button>
      <button id="stopNoiseBtn" style="display:none;">Stop Noise</button>
    </div>
    <div id="errorBox" class="error-box" role="alert" style="display:none"></div>
    <div id="bandsContainer" class="bands-container"></div>
    <div class="tone-control-container" aria-label="Sine tone generator controls">
      <tone-control id="toneControl" value="0.566" aria-label="Sine frequency control"></tone-control>
    </div>
  </div>
</div>`;
      });
    }

    _on(el, type, fn){ if (!el) return; el.addEventListener(type, fn); this._handlers.push({el,type,fn}); }

    async _initDevices(){
      try{
        const sel = this.els.deviceSelect;
        if (!navigator.mediaDevices?.enumerateDevices || !sel) return;
        const devices = await navigator.mediaDevices.enumerateDevices();
        const inputs = devices.filter(d=> d.kind==='audioinput');
        const prev = sel.value; sel.innerHTML='';
        inputs.forEach((d,idx)=>{
          const opt=document.createElement('option'); opt.value=d.deviceId; opt.textContent=d.label || `Microphone ${idx+1}`; sel.appendChild(opt);
        });
        if (inputs.some(d=> d.deviceId===prev)) sel.value=prev;
      }catch(e){ /* no-op */ }
    }

    async _toggleMeter(){
      if (this.audioContext){
        this._stopMeter();
        if (this.els.startBtn) this.els.startBtn.textContent = 'Start Microphone';
      } else {
        try{ await this._startMeter(); if (this.els.startBtn) this.els.startBtn.textContent = 'Stop Microphone'; this._hideError(); }
        catch(e){ this._handleError(e); }
      }
    }

    async _startMeter(){
      this.audioContext = new (window.AudioContext||window.webkitAudioContext)();
      this.globalAnalyser = this.audioContext.createAnalyser();
      this.globalAnalyser.fftSize = 2048; this.globalAnalyser.smoothingTimeConstant = 0.8;

      const deviceId = this.els.deviceSelect && this.els.deviceSelect.value ? this.els.deviceSelect.value : undefined;
      const constraints = { audio: { deviceId: deviceId? {exact: deviceId}: undefined, echoCancellation:false, noiseSuppression:false, autoGainControl:false } };
      const stream = await navigator.mediaDevices.getUserMedia(constraints);
      this.microphone = this.audioContext.createMediaStreamSource(stream);
      this.microphone.connect(this.globalAnalyser);

      // Per-band analysers
      this.bands.forEach(b=>{
        const an = this.audioContext.createAnalyser(); an.fftSize=2048; an.smoothingTimeConstant=0.0; b.analyser = an; b.data = new Float32Array(an.fftSize);
        if (b.key==='total'){ this.microphone.connect(an); b.filter=null; }
        else {
          const fc = Math.sqrt(b.f1*b.f2); const q = Math.max(0.5, fc/ Math.max(1, (b.f2-b.f1)));
          const filter = this.audioContext.createBiquadFilter(); filter.type='bandpass'; filter.frequency.value=fc; filter.Q.value=q;
          this.microphone.connect(filter); filter.connect(an); b.filter=filter;
        }
      });

      this._meterLoop();
    }

    _stopMeter(force){
      if (this.rafId) cancelAnimationFrame(this.rafId), this.rafId=null;
      try{
        if (this.microphone){ const tracks=this.microphone.mediaStream.getTracks(); tracks.forEach(t=>t.stop()); this.microphone.disconnect(); }
      }catch(_){}
      this.microphone=null;
      try{ if (this.audioContext && this.audioContext.state!=='closed'){ this.audioContext.close(); } }catch(_){}
      this.audioContext=null; this.globalAnalyser=null;
      if (!force && this.els.startBtn) this.els.startBtn.textContent='Start Microphone';
    }

    _meterLoop(){
      this._updateBands();
      this.rafId = requestAnimationFrame(()=> this._meterLoop());
    }

    _updateBands(){
      const minDb=-100, maxDb=0; const nowPerf = (performance?.now? performance.now(): Date.now()); const shouldUpdateValues = (nowPerf - this.lastValueUpdateMs) >= 100;
      this.bands.forEach(b=>{
        if (!b.analyser || !b.elements) return;
        b.analyser.getFloatTimeDomainData(b.data);
        let sumSq=0; for (let i=0;i<b.data.length;i++){ const v=b.data[i]; sumSq += v*v; }
        const rms = Math.sqrt(sumSq/b.data.length);
        let db = rms>0 ? 20*Math.log10(rms) : -Infinity; db += this.calibrationOffsetDb; db = Math.max(minDb, Math.min(db, maxDb));

        // Smooth
        if (b.fastDb===undefined) b.fastDb=db; const fastAlpha = db> b.fastDb ? 1 - Math.exp(-1000/(60*25)) : 1 - Math.exp(-1000/(60*35)); b.fastDb = b.fastDb + fastAlpha*(db - b.fastDb);
        if (b.vuDb===undefined) b.vuDb=db; const vuAlpha = db> b.vuDb ? 1 - Math.exp(-1000/(60*35)) : 1 - Math.exp(-1000/(60*45)); b.vuDb = b.vuDb + vuAlpha*(db - b.vuDb);
        if (b.peakDb===undefined) b.peakDb=-100; if (db> b.peakDb){ b.peakDb = db; b.peakHoldTime = Date.now(); }
        const now = Date.now(); if (b.peakHoldTime && (now - b.peakHoldTime) > 1000){ b.peakDb = Math.max(b.peakDb - 0.5, db); }

        const pct = Math.max(0, Math.min(100, ((b.fastDb - minDb)/(maxDb - minDb))*100));
        const peakPct = Math.max(0, Math.min(100, ((b.peakDb - minDb)/(maxDb - minDb))*100));
        b.elements.fill.style.height = `${pct}%`;
        b.elements.peakHold.style.bottom = `${peakPct}%`;
        if (shouldUpdateValues){ b.elements.value.textContent = `${b.fastDb.toFixed(1)} dBFS`; }
      });
      if (shouldUpdateValues) this.lastValueUpdateMs = nowPerf;
    }

    _createBandsUI(){
      const container = this.els.bandsContainer; if (!container) return; container.innerHTML='';
      this.bandDefs.forEach(def=>{
        const bandEl = document.createElement('div'); bandEl.className='band';
        const meterRow = document.createElement('div'); meterRow.className='band-meter';
        const scale = document.createElement('div'); scale.className='band-scale';
        for (let i=0;i<=10;i++){
          const yPct = i*10; const tick=document.createElement('div'); tick.className='tick major'; tick.style.top = `${yPct}%`; scale.appendChild(tick);
          const label=document.createElement('div'); label.className='tick-label'; label.style.top = `${yPct}%`; label.textContent = i===0? '0': `-${i*10}`; scale.appendChild(label);
          if (i<10){ const minor=document.createElement('div'); minor.className='tick minor'; minor.style.top = `${yPct+5}%`; scale.appendChild(minor); }
        }
        const bar=document.createElement('div'); bar.className='band-bar';
        const fill=document.createElement('div'); fill.className='band-fill'; fill.style.backgroundColor = def.color; bar.appendChild(fill);
        const peakHold=document.createElement('div'); peakHold.className='band-peak-hold'; peakHold.style.color = def.color; bar.appendChild(peakHold);
        const label=document.createElement('div'); label.className='band-label'; label.textContent = def.name;
        const range=document.createElement('div'); range.className='band-range'; range.textContent = `${def.f1}-${def.f2} Hz`;
        const value=document.createElement('div'); value.className='band-value'; value.textContent='— dBFS';
        meterRow.appendChild(scale); meterRow.appendChild(bar); bandEl.appendChild(meterRow); bandEl.appendChild(label); bandEl.appendChild(range); bandEl.appendChild(value); container.appendChild(bandEl);
        const b = this.bands.find(x=> x.key===def.key); if (b) b.elements = { fill, peakHold, value };
      });
    }

    _handleError(err){ console.error('Error initializing audio:', err); this._showError((err && err.message) || 'Microphone error'); if (this.els.retryBtn) this.els.retryBtn.style.display='inline-block'; }
    _showError(text){ if (!this.els.errorBox) return; this.els.errorBox.textContent = text; this.els.errorBox.style.display='block'; }
    _hideError(){ if (!this.els.errorBox) return; this.els.errorBox.style.display='none'; if (this.els.retryBtn) this.els.retryBtn.style.display='none'; }

    // White noise
    _generateWhiteNoise(){ if (!this.audioContext) return null; const bufSize=this.audioContext.sampleRate*2; const buffer=this.audioContext.createBuffer(1, bufSize, this.audioContext.sampleRate); const data=buffer.getChannelData(0); for (let i=0;i<bufSize;i++){ data[i]=(Math.random()*2-1)*0.1; } return buffer; }
    _startWhiteNoise(){ if (!this.audioContext || this.whiteNoiseSource) return; const buffer=this._generateWhiteNoise(); if (!buffer) return; const src=this.audioContext.createBufferSource(); const gain=this.audioContext.createGain(); src.buffer=buffer; src.loop=true; gain.gain.value=0.05; src.connect(gain); gain.connect(this.audioContext.destination); src.start(); this.whiteNoiseSource=src; this.whiteNoiseGain=gain; }
    _stopWhiteNoise(){ try{ if (this.whiteNoiseSource){ this.whiteNoiseSource.stop(); this.whiteNoiseSource.disconnect(); } }catch(_){} this.whiteNoiseSource=null; try{ if (this.whiteNoiseGain){ this.whiteNoiseGain.disconnect(); } }catch(_){} this.whiteNoiseGain=null; }

    // Tone generator
    _ensureAudio(){ if (!this.audioContext) this.audioContext = new (window.AudioContext||window.webkitAudioContext)(); return this.audioContext; }
    // Colormap utilities
    _hexToRgb(hex){ const h = hex.replace('#',''); const bigint=parseInt(h,16); return { r:(bigint>>16)&255, g:(bigint>>8)&255, b:bigint&255 }; }
    _rgbToHex({r,g,b}){ const toHex=(v)=> Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2,'0'); return `#${toHex(r)}${toHex(g)}${toHex(b)}`; }
    _interpColor(c1, c2, t){ const a=this._hexToRgb(c1), b=this._hexToRgb(c2); return this._rgbToHex({ r:a.r+(b.r-a.r)*t, g:a.g+(b.g-a.g)*t, b:a.b+(b.b-a.b)*t }); }
    _bindColormapSelector(){
      const el = document.getElementById('colormapSelect');
      if (!el) return false;
      this.els.colormapSelect = el;
      // Respect current UI selection; sync internal state from control
      this.colormapMode = el.value || this.colormapMode;
      // Apply immediately on bind
      this._updateToneUI(this.toneFreqHz);
      this._updateSliderGradient();
      this._updateColormapPreview();
      this._applyColormapToBands();
      this._on(el, 'change', ()=>{
        this.colormapMode = el.value;
        this._updateToneUI(this.toneFreqHz);
        this._updateSliderGradient();
        this._updateColormapPreview();
        this._applyColormapToBands();
      });
      return true;
    }
    _applyColormapToBands(){
      if (!this.bands) return;
      // Color each band's bar by the color at its center frequency
      this.bands.forEach(b=>{
        if (!b.elements) return;
        if (b.key === 'total'){
          // Keep Total neutral
          b.elements.fill.style.backgroundColor = '#808080';
          b.elements.peakHold.style.color = '#808080';
          return;
        }
        const fc = Math.sqrt(b.f1 * b.f2);
        const color = this._colorForFreq(fc);
        b.elements.fill.style.backgroundColor = color;
        b.elements.peakHold.style.color = color;
      });
    }
    _updateColormapPreview(){
      const preview = document.getElementById('colormapPreview');
      if (!preview) return;
      const stops = this._buildGradientStops(96); // very smooth preview
      preview.style.backgroundImage = `linear-gradient(to right, ${stops.join(', ')})`;
    }
    _buildGradientStops(count=32){
      // Build a visually consistent preview across the full 20 Hz–20 kHz span
      let anchors;
      if (this.colormapMode === 'band'){
        // Use the full QUALIA anchors including 20 Hz and 20 kHz so the right end stays bright violet
        anchors = this._colormapAnchors;
      } else if (this.colormapMode === 'turbo' || this.colormapMode === 'turbo-rev' || this.colormapMode === 'turbo-google'){
        // Frequencies ascending; reverse COLORS only for turbo-rev
        const centersTurbo = [
          { f: 34.6,    color: '#30123b' }, // purple
          { f: 122.5,   color: '#4145ab' }, // blue
          { f: 353.6,   color: '#1ea1fa' }, // cyan
          { f: 1000,    color: '#20c997' }, // green
          { f: 2828.4,  color: '#f4e61e' }, // yellow
          { f: 4898.8,  color: '#f99e1a' }, // orange
          { f: 10954.5, color: '#d03a3f' }, // red
        ];
        if (this.colormapMode === 'turbo'){
          anchors = centersTurbo;
        } else {
          const colors = [...centersTurbo.map(a=>a.color)].reverse();
          anchors = centersTurbo.map((a, i)=> ({ f: a.f, color: colors[i] }));
        }
      } else {
        anchors = this._currentAnchors();
      }
      if (!anchors || anchors.length === 0) return ['#444', '#bbb'];
      // Normalize anchor frequencies to 0..1 in LOG domain (matches slider)
      const fmin = anchors[0].f;
      const fmax = anchors[anchors.length-1].f;
      const LOG_MIN = Math.log(fmin);
      const LOG_MAX = Math.log(fmax);
      const norm = (f)=> (Math.log(f) - LOG_MIN) / (LOG_MAX - LOG_MIN);
      // Precompute arrays in log domain
      const points = anchors.map(a=>({ t: norm(a.f), color: a.color }));
      const stops = [];
      for (let i=0;i<count;i++){
        const t = i/(count-1);
        // Find surrounding anchor points
        let j=1; while (j < points.length && points[j].t < t) j++;
        if (j<=0){
          stops.push(points[0].color);
          continue;
        }
        if (j>=points.length){
          const last = points[points.length-1];
          stops.push(last.color);
          continue;
        }
        const p0 = points[j-1];
        const p1 = points[j];
        const lt = (t - p0.t) / Math.max(1e-6, (p1.t - p0.t));
        const col = this._interpColor(p0.color, p1.color, lt);
        stops.push(col);
      }
      return stops;
    }
    _currentAnchors(){
      if (this.colormapMode === 'turbo') return this._turboAnchors;
      if (this.colormapMode === 'turbo-rev' || this.colormapMode === 'turbo-google'){
        // Keep frequencies ascending, reverse colors only
        const colors = [...this._turboAnchors.map(a=>a.color)].reverse();
        return this._turboAnchors.map((a, i)=> ({ f: a.f, color: colors[i] }));
      }
      return this._colormapAnchors; // 'band'
    }
    _colorForFreq(freq){
      const f = Math.max(20, Math.min(20000, Number(freq)));
      const anchors = this._currentAnchors();
      let i=0; while (i<anchors.length && anchors[i].f < f) i++;
      if (i<=0) return anchors[0].color; if (i>=anchors.length) return anchors[anchors.length-1].color;
      const left = anchors[i-1], right = anchors[i];
      const lf = Math.log(f), ll = Math.log(left.f), lr = Math.log(right.f);
      const t = (lf - ll) / (lr - ll);
      return this._interpColor(left.color, right.color, Math.max(0, Math.min(1, t)));
    }
    _generateOneThirdOctaveStops(){
      // Generate 1/3-octave spaced stops from 20 Hz to 20 kHz (inclusive)
      const stops = [];
      const TONE_MIN=20, TONE_MAX=20000;
      const ratio = Math.pow(2, 1/3); // ~1.2599 per 1/3 octave
      let f = TONE_MIN;
      while (f <= TONE_MAX){
        const color = this._colorForFreq(f);
        const pos = this._freqToSlider(f) * 100;
        stops.push({ pos, color });
        f *= ratio;
      }
      // Ensure endpoints are exact and include specified anchors explicitly
      const addAnchor = (freq, color)=>{ const pos=this._freqToSlider(freq)*100; stops.push({pos, color}); };
      this._currentAnchors().forEach(a=> addAnchor(a.f, a.color));
      addAnchor(TONE_MIN, this._colorForFreq(TONE_MIN));
      addAnchor(TONE_MAX, this._colorForFreq(TONE_MAX));
      // Sort and collapse near-duplicate positions
      stops.sort((a,b)=> a.pos - b.pos);
      const merged=[]; const EPS=0.05; // percent threshold
      for (const s of stops){ if (merged.length===0 || Math.abs(s.pos - merged[merged.length-1].pos) > EPS) merged.push(s); }
      const arr = merged.map(s=> `${s.color} ${s.pos.toFixed(2)}%`);
      // Guarantee explicit 0% and 100% endpoints to avoid rendering gaps
      if (arr.length){
        const first = arr[0];
        const last = arr[arr.length-1];
        if (!/^.*\s0(\.00)?%$/.test(first)){
          const c0 = merged[0].color;
          arr.unshift(`${c0} 0%`);
        }
        if (!/^.*\s100(\.00)?%$/.test(last)){
          const cN = merged[merged.length-1].color;
          arr.push(`${cN} 100%`);
        }
      }
      return arr;
    }
    _updateSliderGradient(){
      if (!this.els.toneSlider) return;
      const stops = this._generateOneThirdOctaveStops();
      const gradient = `linear-gradient(to right, ${stops.join(', ')})`;
      // Apply via CSS var consumed by track pseudos to avoid UA repaint flashes
      const el = this.els.toneSlider;
      el.style.setProperty('--tone-gradient', gradient);
      // Ensure the track's solid fallback matches the rightmost color
      const endColor = this._colorForFreq(20000);
      el.style.setProperty('--tone-end', endColor);
      // Fallback background for engines ignoring the var on track
      el.style.background = gradient;
      el.style.willChange = 'background-image';
    }
    _bandColorForFreq(freq){ return this._colorForFreq(freq); }
    _updateToneUI(freq){
      if (this.els.toneFreqLabel) this.els.toneFreqLabel.textContent = `${Math.round(freq)} Hz`;
      if (this.els.toneSlider){
        const color=this._colorForFreq(freq);
        this.els.toneSlider.style.setProperty('--tone-color', color);
        if (this.els.toneToggle){
          this.els.toneToggle.style.color = color;
          this._renderToneIcon();
        }
      }
    }
    _renderToneIcon(){
      if (!this.els.toneToggle) return;
      // Inline SVG that follows currentColor so it can be tinted
      const onIcon = `
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3z"/>
          <path fill="currentColor" d="M16.5 8.5a1 1 0 0 1 1.4 1.4 3.5 3.5 0 0 0 0 4.9 1 1 0 1 1-1.4 1.4 5.5 5.5 0 0 1 0-7.7z"/>
          <path fill="currentColor" d="M19 6a1 1 0 0 1 1.4 1.4 7.5 7.5 0 0 0 0 10.6A1 1 0 1 1 19 19 9.5 9.5 0 0 1 19 6z"/>
        </svg>`;
      const offIcon = `
        <svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true">
          <path fill="currentColor" d="M3 10v4h4l5 4V6L7 10H3z"/>
        </svg>`;
      this.els.toneToggle.innerHTML = this.toneOn ? onIcon : offIcon;
    }
    _startTone(){ if (this.toneOn) return; const ctx=this._ensureAudio(); if (ctx.state==='suspended'){ try{ ctx.resume(); }catch(_){} } const osc=ctx.createOscillator(); const gain=ctx.createGain(); osc.type='sine'; osc.frequency.value=this.toneFreqHz; const now=ctx.currentTime; gain.gain.cancelScheduledValues(now); gain.gain.setValueAtTime(0, now); osc.connect(gain); gain.connect(ctx.destination); osc.start(); gain.gain.linearRampToValueAtTime(0.03, now + 0.06); this.toneOn=true; this.toneOsc=osc; this.toneGain=gain; this._renderToneIcon(); }
    _stopTone(force){ if (!this.toneOn && !force) return; const ctx=this._ensureAudio(); const now=ctx.currentTime; if (this.toneGain){ try{ this.toneGain.gain.cancelScheduledValues(now); const current=this.toneGain.gain.value; this.toneGain.gain.setValueAtTime(current, now); this.toneGain.gain.linearRampToValueAtTime(0, now + 0.08); }catch(_){} } setTimeout(()=>{ try{ if (this.toneOsc) this.toneOsc.stop(); }catch(_){} try{ if (this.toneOsc) this.toneOsc.disconnect(); }catch(_){} try{ if (this.toneGain) this.toneGain.disconnect(); }catch(_){} this.toneOsc=null; this.toneGain=null; }, 100); this.toneOn=false; this._renderToneIcon(); }

    // Slider mapping and snapping
    _sliderToFreq(val){ const TONE_MIN=20, TONE_MAX=20000; const LOG_MIN=Math.log(TONE_MIN), LOG_MAX=Math.log(TONE_MAX); const t=Math.max(0, Math.min(1, Number(val))); const f=Math.exp(LOG_MIN + (LOG_MAX-LOG_MIN)*t); return Math.max(TONE_MIN, Math.min(TONE_MAX, f)); }
    _freqToSlider(freq){ const TONE_MIN=20, TONE_MAX=20000; const LOG_MIN=Math.log(TONE_MIN), LOG_MAX=Math.log(TONE_MAX); const f=Math.max(TONE_MIN, Math.min(TONE_MAX, Number(freq))); const t=(Math.log(f)-LOG_MIN)/(LOG_MAX-LOG_MIN); return Math.max(0, Math.min(1, t)); }
    _snapFrequency(freq){ const TONE_MIN=20, TONE_MAX=20000; const targets=new Set([20,25,31.5,40,50,63,80]); for (let v=100; v<=10000; v+=100) targets.add(v); for (let v=11000; v<=20000; v+=1000) targets.add(v); let best=freq, bestDelta=Infinity; targets.forEach(t=>{ const tol=Math.max(0.5, 0.005*t); const d=Math.abs(freq-t); if (d<tol && d<bestDelta){ best=t; bestDelta=d; } }); return Math.max(TONE_MIN, Math.min(TONE_MAX, best)); }
  }

  window.TestsModule = TestsModule;
})();
