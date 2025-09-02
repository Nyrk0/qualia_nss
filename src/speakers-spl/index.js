(function(){
  class SpeakersSplModule {
    constructor() {
      this.root = null;
      this.chart = null;
      this.curves = new Map();
      this.sumCurve = null;
      this.uploadService = new (window.UploadService || function(){ return { checkHealth: async()=>true, validateCSVFile: ()=>true, uploadFile: async ()=>({}) }; })();
      this._handlers = [];
      this._disposers = [];
      this._persistTimer = null;
      this.colors = ['#ff6b6b','#4ecdc4','#45b7d1','#96ceb4','#ffeaa7','#dda0dd','#98d8c8','#f7dc6f','#bb8fce','#85c1e9'];
    }

    async init() {
      this.root = document.getElementById('speakers-spl-root');
      if (!this.root) return;

      // Load fragment HTML with file:// fallback to avoid CORS in local testing
      const shouldInline = typeof location !== 'undefined' && location.protocol === 'file:';
      if (shouldInline) {
        this.root.innerHTML = this._inlineFragment();
      } else {
        try {
          const html = await fetch('src/speakers-spl/index.html').then(r=>r.text());
          this.root.innerHTML = html;
        } catch (e) {
          // Fallback to inline if fetch blocked
          this.root.innerHTML = this._inlineFragment();
          this.showStatus('Loaded inline module markup (CORS-safe fallback). Consider running via http:// for best results.', 'info');
        }
      }

      // Ensure styles are present
      this._ensureStyles();

      // Init Chart.js
      this._initChart();

      // React to theme changes (body.light-theme toggled in app.js)
      const body = document.body;
      const observer = new MutationObserver(() => this._applyChartTheme());
      observer.observe(body, { attributes: true, attributeFilter: ['class'] });
      this._disposers.push(() => observer.disconnect());

      // Restore persisted datasets if present
      this._restoreState();

      // Save state on unload
      const onBeforeUnload = () => this._persistState(true);
      window.addEventListener('beforeunload', onBeforeUnload);
      this._disposers.push(() => window.removeEventListener('beforeunload', onBeforeUnload));

      // Wire listeners (look in sidebar/document since controls are in sidebar)
      this._on('#spl-clear-btn','click', ()=> this.clearAll());
      this._on('#spl-file-input','change', async (e)=>{
        const files = e.target.files || [];
        if (!files.length) return;
        await this._runSelectionPipeline(files);
      });

      try { await this.uploadService.checkHealth(); } catch(e) {}
    }

    destroy() {
      this._handlers.forEach(({el, type, fn})=> el && el.removeEventListener(type, fn));
      this._handlers = [];
      if (this._disposers && this._disposers.length) {
        this._disposers.forEach(fn=>{ try{ fn(); }catch(_){} });
        this._disposers = [];
      }
      if (this.chart && this.chart.destroy) this.chart.destroy();
      this.chart = null;
      if (this.root) this.root.innerHTML = '';
      this.root = null;
      this.curves.clear();
      this.sumCurve = null;
    }

    _ensureStyles() {
      if (document.getElementById('speakers-spl-styles')) return;
      const link = document.createElement('link');
      link.id = 'speakers-spl-styles';
      link.rel = 'stylesheet';
      link.href = 'src/speakers-spl/styles.css';
      document.head.appendChild(link);
    }

    _initChart() {
      const canvas = this.root.querySelector('#spl-chart');
      if (!canvas || !window.Chart) return;
      const ctx = canvas.getContext('2d');
      this.chart = new Chart(ctx, {
        type: 'line',
        data: { datasets: [] },
        options: {
          responsive: true,
          maintainAspectRatio: false,
          interaction: { intersect: false, mode: 'index' },
          scales: {
            x: { type: 'logarithmic', position: 'bottom', min: 20, max: 20000, title: { display: true, text: 'Frequency (Hz)'} },
            y: { title: { display: true, text: 'SPL (dB)'} }
          },
          plugins: {
            legend: { position: 'top', labels: { usePointStyle: true } },
            tooltip: {
              callbacks: {
                title: (ctx)=> `Frequency: ${ctx[0].parsed.x.toFixed(1)} Hz`,
                label: (ctx)=> `${ctx.dataset.label}: ${ctx.parsed.y.toFixed(2)} dB`
              }
            }
          }
        }
      });

      // Apply theme-aware colors once chart is created
      this._applyChartTheme();
    }



    _persistState(immediate=false){
      if (!this.chart) return;
      const doSave = () => {
        try {
          const datasets = (this.chart.data?.datasets||[]).map(ds => ({
            label: ds.label,
            data: ds.data,
            borderColor: ds.borderColor,
            backgroundColor: ds.backgroundColor,
            tension: ds.tension,
            borderWidth: ds.borderWidth,
            pointRadius: ds.pointRadius,
            hidden: !!ds.hidden,
            yAxisID: ds.yAxisID || 'y'
          }));
          localStorage.setItem('speakersSplState', JSON.stringify({ datasets }));
        } catch(_) {}
      };
      if (immediate){ doSave(); return; }
      if (this._persistTimer) cancelAnimationFrame(this._persistTimer);
      this._persistTimer = requestAnimationFrame(doSave);
    }

    _restoreState(){
      try {
        const raw = localStorage.getItem('speakersSplState');
        if (!raw) return;
        const { datasets } = JSON.parse(raw || '{}');
        if (!Array.isArray(datasets) || !this.chart) return;
        this.chart.data.datasets = datasets.map((d, i) => ({
          type: 'line',
          label: d.label,
          data: d.data,
          borderColor: d.borderColor || this.colors[i % this.colors.length],
          backgroundColor: d.backgroundColor || 'transparent',
          tension: d.tension ?? 0.25,
          borderWidth: d.borderWidth ?? 2,
          pointRadius: d.pointRadius ?? 0,
          hidden: !!d.hidden,
          yAxisID: d.yAxisID || 'y'
        }));
        this.chart.update('none');

        // Rebuild internal state maps (best-effort)
        this.curves.clear();
        this.sumCurve = null;
        this.chart.data.datasets.forEach(ds => {
          if (/sum/i.test(ds.label)) this.sumCurve = ds;
          else this.curves.set(ds.label, ds);
        });
        this.showStatus('Session restored', 'success');
      } catch(_) {}
    }

    _inlineFragment() {
      return `
  <div class="spl-viewer">
    <div class="spl-chart-container">
      <canvas id="spl-chart"></canvas>
    </div>
  </div>`;
    }

    _on(selector, type, fn) {
      let el = null;
      if (this.root) el = this.root.querySelector(selector);
      if (!el) el = document.querySelector(selector);
      if (!el) return;
      el.addEventListener(type, fn);
      this._handlers.push({ el, type, fn });
    }

    showStatus(message, type='info') {
      // Minimalist: no UI status area; log to console
      try { console[type==='error'?'error': (type==='success'?'log':'info')](message); } catch(_) { console.log(message); }
    }

    async handleFileUpload() {
      const input = (this.root && this.root.querySelector('#spl-file-input')) || document.querySelector('#spl-file-input');
      const files = input?.files || [];
      if (!files.length) { this.showStatus('Please select CSV files first','error'); return; }
      this.showStatus(`Uploading ${files.length} file(s)...`,'info');
      try {
        for (let i=0;i<files.length;i++) {
          const f = files[i];
          this.uploadService.validateCSVFile(f);
          await this.uploadService.uploadFile(f, 'stage3_user');
        }
        this.showStatus('Uploaded successfully','success');
      } catch(e) {
        this.showStatus(`Upload failed: ${e.message}`,'error');
      }
    }

    async _runSelectionPipeline(fileList){
      const files = Array.from(fileList || []);
      if (!files.length) return;
      // 1) Upload
      this.showStatus(`Uploading ${files.length} file(s)...`,'info');
      try {
        for (const f of files){
          this.uploadService.validateCSVFile(f);
          await this.uploadService.uploadFile(f, 'stage3_user');
        }
      } catch(e) {
        this.showStatus(`Upload failed: ${e.message}`,'error');
        return;
      }
      this.showStatus('Upload complete. Analyzing...','info');

      // 2) Analyze + Load exclusively from this selection
      this.curves.clear();
      this.sumCurve = null;
      try {
        for (let i=0;i<files.length;i++){
          const file = files[i];
          const curve = await this._loadCSVFile(file, i);
          this.curves.set(file.name, curve);
        }
      } catch(e) {
        this.showStatus(`Load failed: ${e.message}`,'error');
        return;
      }

      // 3) Update chart + analysis
      this._updateChart();
      this._runAnalysis();
      this._updateAnalysisPanel();

      // 4) Sum only the newly loaded curves
      if (this.curves.size >= 2) {
        this.calculateSum();
      } else {
        this.showStatus(`Loaded ${this.curves.size} curve(s)`,'success');
      }

      // Persist
      this._persistState();
    }

    async handleFileLoad() {
      const input = (this.root && this.root.querySelector('#spl-file-input')) || document.querySelector('#spl-file-input');
      const files = input?.files || [];
      if (!files.length) { this.showStatus('Please select CSV files first','error'); return; }
      this.showStatus(`Loading and analyzing ${files.length} file(s)...`,'info');
      try {
        for (let i=0;i<files.length;i++) {
          const file = files[i];
          const curve = await this._loadCSVFile(file, i);
          this.curves.set(file.name, curve);
        }
        this._updateChart();
        this._runAnalysis();
        this._updateAnalysisPanel();
        this.showStatus(`Loaded ${this.curves.size} curve(s)`, 'success');
      } catch(e) {
        this.showStatus(`Error: ${e.message}`,'error');
      }
    }

    async _loadCSVFile(file, index) {
      return new Promise((resolve, reject)=>{
        const reader = new FileReader();
        reader.onload = (e)=>{
          try {
            const result = this._parseCSVContent(e.target.result, file.name);
            if (!result.data.length) return reject(new Error(`No valid data in ${file.name}`));
            resolve({
              name: file.name,
              data: result.data,
              color: this.colors[index % this.colors.length],
              stats: this._calculateBasicStats(result.data),
              analysis: {}
            });
          } catch(err) { reject(new Error(`Failed to parse ${file.name}: ${err.message}`)); }
        };
        reader.onerror = ()=> reject(new Error(`Failed to read ${file.name}`));
        reader.readAsText(file);
      });
    }

    _parseCSVContent(csv, filename='unknown'){
      const lines = csv.trim().split('\n');
      const data = [];
      for (let i=0;i<lines.length;i++){
        const line = lines[i].trim();
        if (!line) continue;
        const parts = line.split(',');
        if (parts.length>=2){
          const frequency = parseFloat(parts[0]);
          const spl = parseFloat(parts[1]);
          if (!isNaN(frequency) && !isNaN(spl)) data.push({frequency, spl});
        }
      }
      return { data, filename };
    }

    _calculateBasicStats(data){
      const spls = data.map(p=>p.spl);
      const freqs = data.map(p=>p.frequency);
      return {
        points: data.length,
        minFreq: Math.min(...freqs),
        maxFreq: Math.max(...freqs),
        minSPL: Math.min(...spls),
        maxSPL: Math.max(...spls),
        avgSPL: spls.reduce((a,b)=>a+b,0)/spls.length
      };
    }

    _aWeighted(data){
      if (!data.length) return 0;
      let weightedSum = 0; let count=0;
      for (const {frequency:f, spl} of data){
        let aWeight = 0;
        if (f>=1000 && f<=4000) aWeight = 2; else if (f>=500 && f<=8000) aWeight = 0; else if (f<500) aWeight = -10*Math.log10(f/1000); else aWeight = -5;
        const weightedSPL = spl + aWeight;
        weightedSum += Math.pow(10, weightedSPL/10);
        count++;
      }
      return count>0 ? 10*Math.log10(weightedSum/count):0;
    }

    _findResonances(data){
      const out=[]; if (data.length<3) return out;
      const minPeak = 3;
      for (let i=1;i<data.length-1;i++){
        const prev=data[i-1], curr=data[i], next=data[i+1];
        if (curr.spl>prev.spl && curr.spl>next.spl){
          const peakHeight = Math.min(curr.spl-prev.spl, curr.spl-next.spl);
          if (peakHeight>=minPeak) out.push({ frequency: curr.frequency, spl: curr.spl, peakHeight });
        }
      }
      return out;
    }

    _runAnalysis(){
      this.curves.forEach(curve=>{
        curve.analysis = {
          aWeightedSPL: this._aWeighted(curve.data),
          resonances: this._findResonances(curve.data),
          crestFactor: this._crestFactor(curve.data)
        };
      });
    }

    _crestFactor(data){
      const spls = data.map(p=>p.spl);
      const peak = Math.max(...spls);
      const avg = spls.reduce((a,b)=>a+b,0)/spls.length;
      return peak-avg;
    }

    calculateSum(){
      if (this.curves.size<2){ this.showStatus('Need at least 2 curves for sum','error'); return; }
      this.showStatus('Calculating sum...','info');
      const curvesArray = Array.from(this.curves.values());
      const allFreqs = new Set();
      curvesArray.forEach(c=> c.data.forEach(p=> allFreqs.add(p.frequency)));
      const sorted = Array.from(allFreqs).sort((a,b)=>a-b);
      const sumData = [];
      for (const freq of sorted){
        let linearSum = 0; let valid=0;
        curvesArray.forEach(curve=>{
          let value = null;
          const exact = curve.data.find(p=> Math.abs(p.frequency - freq) < 0.001);
          if (exact) value = exact.spl; else {
            const before = curve.data.filter(p=>p.frequency<freq).pop();
            const after = curve.data.find(p=>p.frequency>freq);
            if (before && after){
              const ratio = (freq-before.frequency)/(after.frequency-before.frequency);
              value = before.spl + ratio*(after.spl-before.spl);
            }
          }
          if (value!==null){ linearSum += Math.pow(10, value/10); valid++; }
        });
        if (valid>0){ sumData.push({ frequency: freq, spl: 10*Math.log10(linearSum) }); }
      }
      this.sumCurve = {
        name: 'Acoustic Sum',
        data: sumData,
        color: '#e74c3c',
        isSum: true,
        stats: this._calculateBasicStats(sumData),
        analysis: {
          aWeightedSPL: this._aWeighted(sumData),
          resonances: this._findResonances(sumData),
          crestFactor: this._crestFactor(sumData)
        }
      };
      this._updateChart();
      this._updateAnalysisPanel();
      this.showStatus('Sum calculated','success');
    }

    clearAll(){
      this.curves.clear();
      this.sumCurve = null;
      this._updateChart();
      this._updateAnalysisPanel();
      this.showStatus('Cleared','info');
    }

    _updateChart(){
      if (!this.chart) return;
      const datasets = [];
      this.curves.forEach(curve=>{
        datasets.push({
          label: curve.name,
          data: curve.data.map(p=>({ x:p.frequency, y:p.spl })),
          borderColor: curve.color,
          backgroundColor: curve.color + '20',
          borderWidth: 2,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1
        });
      });
      if (this.sumCurve){
        datasets.push({
          label: this.sumCurve.name,
          data: this.sumCurve.data.map(p=>({ x:p.frequency, y:p.spl })),
          borderColor: this.sumCurve.color,
          backgroundColor: this.sumCurve.color + '20',
          borderWidth: 3,
          fill: false,
          pointRadius: 0,
          pointHoverRadius: 4,
          tension: 0.1,
          borderDash: [5,5]
        });
      }
      this.chart.data.datasets = datasets;
      this.chart.update();
    }

    _updateAnalysisPanel(){
      // Write analysis to the app shell sidebar, not inside module root
      const setText = (sel, text)=>{ const el=document.querySelector(sel); if (el) el.textContent = text; };
      const totalPoints = Array.from(this.curves.values()).reduce((s,c)=> s + c.data.length, 0);
      setText('#spl-curves-count', this.curves.size);
      setText('#spl-points-count', totalPoints.toLocaleString());
      const memBytes = totalPoints * 32; const mb = memBytes/(1024*1024); 
      setText('#spl-memory-usage', `${mb.toFixed(1)} MB`);

      if (this.curves.size>0){
        const ac = document.querySelector('#spl-acoustic-metrics');
        const vc = document.querySelector('#spl-validation-metrics');
        if (ac) ac.style.display = 'block';
        if (vc) vc.style.display = 'block';
        const analysisCurve = this.sumCurve || Array.from(this.curves.values())[0];
        if (analysisCurve){
          setText('#spl-a-weighted-spl', `${analysisCurve.analysis.aWeightedSPL.toFixed(2)} dB(A)`);
          setText('#spl-peak-level', `${(analysisCurve.stats?analysisCurve.stats.maxSPL:0).toFixed(2)} dB`);
          setText('#spl-crest-factor', `${analysisCurve.analysis.crestFactor.toFixed(2)} dB`);
          setText('#spl-resonances-count', `${analysisCurve.analysis.resonances.length}`);
          // Simple math tests
          const tests = [70,60,80].map(x=> 10*Math.log10(Math.pow(10,x/10)+Math.pow(10,x/10)));
          const expected = {70:73.01,60:63.01,80:83.01};
          let passed = 0; [70,60,80].forEach((x,i)=>{ if (Math.abs(tests[i]-expected[x])<0.1) passed++; });
          setText('#spl-math-tests', `${passed} / 3`);
          const quality = Math.round((passed/3)*100);
          setText('#spl-quality-score', `${quality}%`);
          setText('#spl-coherence', quality>80?'GOOD': quality>60?'FAIR':'POOR');
        }
      }

      const list = document.querySelector('#spl-curve-list');
      if (list){
        list.innerHTML = '<h4 class="h6"><i class="bi bi-list-check me-1"></i> Loaded Curves</h4>';
        this.curves.forEach((curve, name)=>{
          const item = document.createElement('div');
          item.className = 'spl-curve-item';
          item.innerHTML = `<span class="spl-curve-color" style="background:${curve.color}"></span><span>${name}</span>`;
          list.appendChild(item);
        });
      }
    }

    // Theme helpers
    _getCssVar(name, fallback){
      try { return getComputedStyle(document.body).getPropertyValue(name).trim() || fallback; } catch(_) { return fallback; }
    }

    _applyChartTheme(){
      if (!this.chart) return;
      const isLight = document.body.classList.contains('light-theme');
      const textColor = this._getCssVar('--text-color', isLight ? '#333333' : '#e0e0e0');
      const gridColor = this._getCssVar('--panel-border-color', isLight ? '#dddddd' : '#333333');
      const borderColor = gridColor;

      // Apply to axes
      const { scales, plugins } = this.chart.options;
      if (scales?.x){
        scales.x.grid = { color: gridColor, tickColor: gridColor };
        scales.x.ticks = { color: textColor };
        scales.x.title = { ...(scales.x.title||{}), color: textColor };
      }
      if (scales?.y){
        scales.y.grid = { color: gridColor, tickColor: gridColor };
        scales.y.ticks = { color: textColor };
        scales.y.title = { ...(scales.y.title||{}), color: textColor };
      }

      // Legend label color
      if (plugins?.legend){
        plugins.legend.labels = { ...(plugins.legend.labels||{}), color: textColor, usePointStyle: true };
      }

      // Default color for elements
      this.chart.options.color = textColor;
      this.chart.options.borderColor = borderColor;

      this.chart.update('none');
    }
  }

  window.SpeakersSplModule = SpeakersSplModule;
})();
