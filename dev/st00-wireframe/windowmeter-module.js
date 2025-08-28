/**
 * WindowMeter - A debugging tool for analyzing resize behavior in web applications
 * 
 * Shows real-time dimensions of DOM elements from innermost to outermost:
 * Canvas → Container → Section → Grid → Viewer → Module → Main → Wrapper → Window
 * 
 * Usage:
 *   const wm = new WindowMeter();
 *   wm.init('#sidebar-container'); // Inject into any container
 *   wm.destroy(); // Cleanup when done
 */
class WindowMeter {
  constructor() {
    this._timer = null;
    this._disposers = [];
    this._lastMeasurements = null;
    this.container = null;
  }

  init(containerSelector = '#sidebar') {
    this.container = document.querySelector(containerSelector);
    if (!this.container) {
      console.error('WindowMeter: Container not found:', containerSelector);
      return;
    }

    // Inject HTML
    this._injectHTML();

    // Start monitoring
    this._timer = setInterval(() => this._updateMeasurements(), 100);
    this._disposers.push(() => clearInterval(this._timer));

    // Window resize for immediate feedback
    const onResize = () => this._updateMeasurements();
    window.addEventListener('resize', onResize);
    this._disposers.push(() => window.removeEventListener('resize', onResize));

    // Wire snapshot button
    const snapshotBtn = document.getElementById('wm-snapshot-btn');
    if (snapshotBtn) {
      const onSnapshot = () => this._takeSnapshot();
      snapshotBtn.addEventListener('click', onSnapshot);
      this._disposers.push(() => snapshotBtn.removeEventListener('click', onSnapshot));
    }

    // Initial update
    setTimeout(() => this._updateMeasurements(), 100);
  }

  destroy() {
    this._disposers.forEach(fn => { try { fn(); } catch(_) {} });
    this._disposers = [];
    if (this._timer) {
      clearInterval(this._timer);
      this._timer = null;
    }
    const wmContainer = document.getElementById('windowmeter-container');
    if (wmContainer) wmContainer.remove();
    this.container = null;
  }

  _injectHTML() {
    const html = `
      <div id="windowmeter-container" class="sidebar-section">
        <h4 style="font-size:0.8rem; margin-bottom:0.5rem;"><i class="bi bi-rulers me-1"></i>WindowMeter</h4>
        <div id="windowmeter-table" style="font-size:0.7rem; font-family:monospace;">
          <table style="width:100%; border-collapse:collapse;">
            <thead>
              <tr style="border-bottom:1px solid var(--bs-border-color);">
                <th style="text-align:left; padding:2px;">Element</th>
                <th style="text-align:right; padding:2px;">W</th>
                <th style="text-align:right; padding:2px;">H</th>
              </tr>
            </thead>
            <tbody>
              <tr><td>1. Canvas</td><td id="wm-canvas-w">-</td><td id="wm-canvas-h">-</td></tr>
              <tr><td>2. Container</td><td id="wm-container-w">-</td><td id="wm-container-h">-</td></tr>
              <tr><td>3. Section</td><td id="wm-section-w">-</td><td id="wm-section-h">-</td></tr>
              <tr><td>4. Grid</td><td id="wm-grid-w">-</td><td id="wm-grid-h">-</td></tr>
              <tr><td>5. Viewer</td><td id="wm-viewer-w">-</td><td id="wm-viewer-h">-</td></tr>
              <tr><td>6. Module</td><td id="wm-module-w">-</td><td id="wm-module-h">-</td></tr>
              <tr><td>7. Main</td><td id="wm-main-w">-</td><td id="wm-main-h">-</td></tr>
              <tr><td>8. Wrapper</td><td id="wm-wrapper-w">-</td><td id="wm-wrapper-h">-</td></tr>
              <tr><td>9. Window</td><td id="wm-window-w">-</td><td id="wm-window-h">-</td></tr>
              <tr style="border-top:1px solid var(--bs-border-color);"><td><b>Chart.js</b></td><td id="wm-chart-w">-</td><td id="wm-chart-h">-</td></tr>
            </tbody>
          </table>
          <div style="margin-top:0.5rem; padding:0.25rem; background:var(--bs-secondary-bg); border-radius:0.25rem;">
            <div>Status: <span id="wm-status">Ready</span></div>
            <div>Change: <span id="wm-change">-</span></div>
            <button id="wm-snapshot-btn" style="margin-top:0.5rem; padding:0.25rem 0.5rem; background:var(--bs-primary); color:white; border:none; border-radius:0.25rem; font-size:0.7rem; width:100%; cursor:pointer;">
              📸 Snapshot PNG
            </button>
          </div>
        </div>
      </div>
    `;
    this.container.insertAdjacentHTML('beforeend', html);
  }

  _updateMeasurements() {
    const elements = {
      canvas: document.querySelector('#spl-chart') || document.querySelector('canvas'),
      container: document.querySelector('.spl-chart-container') || document.querySelector('.chart-container'),
      section: document.querySelector('.spl-chart-section') || document.querySelector('.chart-section'),
      grid: document.querySelector('.spl-main-grid') || document.querySelector('.main-grid'),
      viewer: document.querySelector('.spl-viewer') || document.querySelector('.viewer'),
      module: document.querySelector('.module-content'),
      main: document.querySelector('#main-content'),
      wrapper: document.querySelector('#content-wrapper'),
      window: window
    };

    const measurements = {};
    Object.keys(elements).forEach(key => {
      const el = elements[key];
      if (key === 'window') {
        measurements[key] = { w: window.innerWidth, h: window.innerHeight };
      } else if (el) {
        measurements[key] = { w: el.clientWidth || 0, h: el.clientHeight || 0 };
      } else {
        measurements[key] = { w: 0, h: 0 };
      }
    });

    // Add Chart.js dimensions if available (flexible chart detection)
    const chart = window.Chart?.instances?.[0] || this._findChartInstance();
    if (chart && chart.canvas) {
      measurements['chart'] = { 
        w: chart.canvas.width || 0, 
        h: chart.canvas.height || 0 
      };
    } else {
      measurements['chart'] = { w: 0, h: 0 };
    }

    // Update table
    Object.keys(measurements).forEach(key => {
      const { w, h } = measurements[key];
      const wEl = document.getElementById(`wm-${key}-w`);
      const hEl = document.getElementById(`wm-${key}-h`);
      if (wEl) wEl.textContent = w;
      if (hEl) hEl.textContent = h;
    });

    // Detect changes and update status
    if (this._lastMeasurements) {
      const changes = [];
      Object.keys(measurements).forEach(key => {
        const curr = measurements[key];
        const prev = this._lastMeasurements[key] || { w: 0, h: 0 };
        if (curr.w !== prev.w) changes.push(`${key}:w ${prev.w}→${curr.w}`);
        if (curr.h !== prev.h) changes.push(`${key}:h ${prev.h}→${curr.h}`);
      });

      const statusEl = document.getElementById('wm-status');
      const changeEl = document.getElementById('wm-change');
      if (changes.length > 0) {
        if (statusEl) statusEl.textContent = 'Resizing';
        if (changeEl) changeEl.textContent = changes.slice(0, 2).join(', ');
      } else {
        if (statusEl) statusEl.textContent = 'Stable';
      }
    }

    this._lastMeasurements = measurements;
  }

  _findChartInstance() {
    // Try to find chart instance in common global locations
    if (window.speakersChart) return window.speakersChart;
    if (window.currentChart) return window.currentChart;
    if (window.Chart?.instances) return Object.values(window.Chart.instances)[0];
    return null;
  }

  _takeSnapshot() {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    
    canvas.width = 300;
    canvas.height = 450;
    
    // Fill background
    ctx.fillStyle = getComputedStyle(document.body).backgroundColor || '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    
    // Set text properties
    ctx.fillStyle = getComputedStyle(document.body).color || '#000000';
    ctx.font = '12px monospace';
    
    const timestamp = new Date().toLocaleString();
    
    // Draw content
    ctx.fillText('WindowMeter Snapshot', 10, 20);
    ctx.fillText(timestamp, 10, 40);
    ctx.fillText('─'.repeat(30), 10, 55);
    
    ctx.fillText('Element', 10, 75);
    ctx.fillText('Width', 180, 75);
    ctx.fillText('Height', 230, 75);
    ctx.fillText('─'.repeat(30), 10, 85);
    
    // Draw table data
    let y = 100;
    const rows = [
      '1. Canvas', '2. Container', '3. Section', '4. Grid', 
      '5. Viewer', '6. Module', '7. Main', '8. Wrapper', '9. Window', 'Chart.js'
    ];
    
    rows.forEach((label, index) => {
      const ids = ['canvas', 'container', 'section', 'grid', 'viewer', 'module', 'main', 'wrapper', 'window', 'chart'];
      const wEl = document.getElementById(`wm-${ids[index]}-w`);
      const hEl = document.getElementById(`wm-${ids[index]}-h`);
      const w = wEl ? wEl.textContent : '-';
      const h = hEl ? hEl.textContent : '-';
      
      if (label === 'Chart.js') {
        ctx.fillText('─'.repeat(30), 10, y - 5);
        y += 5;
      }
      
      ctx.fillText(label, 10, y);
      ctx.fillText(w, 180, y);
      ctx.fillText(h, 230, y);
      y += 15;
    });
    
    // Add status
    const statusEl = document.getElementById('wm-status');
    const changeEl = document.getElementById('wm-change');
    const status = statusEl ? statusEl.textContent : 'Unknown';
    const change = changeEl ? changeEl.textContent : 'None';
    
    ctx.fillText('─'.repeat(30), 10, y + 10);
    ctx.fillText(`Status: ${status}`, 10, y + 30);
    ctx.fillText(`Change: ${change}`, 10, y + 45);
    
    // Download
    canvas.toBlob((blob) => {
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `windowmeter-${Date.now()}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      
      // Visual feedback
      const btn = document.getElementById('wm-snapshot-btn');
      if (btn) {
        const originalText = btn.textContent;
        btn.textContent = '✓ Saved!';
        setTimeout(() => btn.textContent = originalText, 2000);
      }
    }, 'image/png');
  }
}

// Export for use
window.WindowMeter = WindowMeter;