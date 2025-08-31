/**
 * @fileoverview Tone Control Web Component
 * UI-only component: frequency slider + speaker toggle
 * Emits events and exposes properties; host application controls audio
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <style>
    :host { 
      display: block; 
      font-family: inherit; 
      color: var(--tone-color, #9aa6b2);
      width: 100%; /* Use full available width */
    }
    
    .container { 
      display: grid; 
      grid-template-columns: 1fr auto; 
      gap: 8px; 
      align-items: center; 
      width: 100%;
      box-sizing: border-box;
    }
    
    .slider-container { 
      position: relative;
      width: 100%;
      padding: 0;
      margin: 0;
    }
    
    .info-container { 
      display: flex; 
      gap: 8px; 
      align-items: center; 
      white-space: nowrap;
    }

    /* Fixed slider styling */
    input[type="range"] { 
      width: 100%; 
      height: 14px;
      -webkit-appearance: none; 
      appearance: none; 
      background: transparent;
      outline: none;
      margin: 0;
      padding: 0;
      cursor: pointer;
    }
    
    /* WebKit track - contained within bounds */
    input[type="range"]::-webkit-slider-runnable-track {
      height: 6px; 
      background: #26303b;
      border-radius: 3px;
      border: none;
      outline: none;
    }
    
    /* WebKit thumb */
    input[type="range"]::-webkit-slider-thumb {
      -webkit-appearance: none; 
      width: 14px; 
      height: 14px; 
      margin-top: -4px; 
      border-radius: 50%; 
      background: currentColor; 
      border: 0; 
      box-shadow: none;
      cursor: pointer;
    }
    
    /* Firefox track */
    input[type="range"]::-moz-range-track {
      height: 6px; 
      background: #26303b;
      border-radius: 3px;
      border: none;
      outline: none;
    }
    
    /* Firefox thumb */
    input[type="range"]::-moz-range-thumb { 
      width: 14px; 
      height: 14px; 
      border-radius: 50%; 
      background: currentColor; 
      border: 0; 
      box-shadow: none;
      cursor: pointer;
    }

    /* Icon button */
    .btn { 
      padding: 6px 8px; 
      line-height: 1; 
      background: #2a2a2a; 
      color: currentColor; 
      border: 1px solid #3a3a3a; 
      border-radius: 6px; 
      cursor: pointer;
    }
    
    .btn.icon svg { 
      display: block; 
      width: 16px; 
      height: 16px; 
      fill: currentColor; 
      stroke: none; 
    }
    
    .btn.icon.active { 
      box-shadow: 0 0 0 2px rgba(255,255,255,0.08) inset; 
      background: #2a3440; 
    }

    .label { 
      font-variant-numeric: tabular-nums; 
      opacity: 0.9; 
      font-size: 12px;
      min-width: 60px;
      text-align: right;
      color: inherit; /* Keep default text color */
    }
    
    /* Apply frequency color only to slider */
    input[type="range"] {
      color: var(--frequency-color, currentColor);
    }
  </style>
  
  <div class="container">
    <div class="slider-container">
      <input id="slider" type="range" min="0" max="1" step="0.001" value="0.566" aria-label="Sine frequency (Hz)">
    </div>
    <div class="info-container">
      <span id="label" class="label">1000 Hz</span>
      <button id="toggle" class="btn icon" title="Toggle tone" aria-label="Toggle tone" aria-pressed="false"></button>
    </div>
  </div>
`;

function clamp(v, lo, hi) { return Math.min(hi, Math.max(lo, v)); }
function toFixedHz(hz) { return `${Math.round(hz)} Hz`; }

// Default log mapping 20..20000 Hz
const FMIN = 20;
const FMAX = 20000;
const LOG_FMIN = Math.log10(FMIN);
const LOG_FMAX = Math.log10(FMAX);

function sliderToFreq(val) {
  const v = typeof val === 'number' ? val : parseFloat(val || '0');
  const logF = LOG_FMIN + (LOG_FMAX - LOG_FMIN) * clamp(v, 0, 1);
  return Math.pow(10, logF);
}

function freqToSlider(hz) {
  const h = clamp(hz, FMIN, FMAX);
  const t = (Math.log10(h) - LOG_FMIN) / (LOG_FMAX - LOG_FMIN);
  return clamp(t, 0, 1);
}

// Advanced frequency snapping from original 7band-level-meter implementation
const SNAP_TARGETS = (() => {
  const targets = new Set([20, 25, 31.5, 40, 50, 63, 80]);
  for (let v = 100; v <= 10000; v += 100) targets.add(v);
  for (let v = 11000; v <= 20000; v += 1000) targets.add(v);
  return Array.from(targets).filter(v => v >= FMIN && v <= FMAX).sort((a,b) => a-b);
})();

function snapFrequency(freq) {
  const f = clamp(Number(freq), FMIN, FMAX);
  // Relative tolerance: 0.5% of target, but at least 0.5 Hz
  let best = f;
  let bestDelta = Infinity;
  for (const t of SNAP_TARGETS) {
    const tol = Math.max(0.5, 0.005 * t);
    const d = Math.abs(f - t);
    if (d < tol && d < bestDelta) {
      best = t;
      bestDelta = d;
    }
  }
  return best;
}

// Built-in colormap support for tone-control component
const QUALIA_7BAND_COLORMAP = [
  { f1: 20,   f2: 60,    color: '#8b0000' }, // Sub-bass: Dark red
  { f1: 60,   f2: 250,   color: '#dc143c' }, // Bass: Crimson  
  { f1: 250,  f2: 500,   color: '#ff6347' }, // Low Mid: Tomato
  { f1: 500,  f2: 2000,  color: '#ff8c00' }, // Midrange: Dark orange
  { f1: 2000, f2: 4000,  color: '#32cd32' }, // Upper Mid: Lime green
  { f1: 4000, f2: 6000,  color: '#1e90ff' }, // Presence: Dodger blue
  { f1: 6000, f2: 20000, color: '#9370db' }, // Brilliance: Medium purple
];

const GOOGLE_TURBO_COLORMAP = [
  { f: 20,      color: '#30123b' }, // Dark purple
  { f: 34.6,    color: '#3a2b7a' }, // Purple  
  { f: 122.5,   color: '#4145ab' }, // Blue
  { f: 433.5,   color: '#1a9641' }, // Green
  { f: 1537.8,  color: '#a2d048' }, // Yellow-green
  { f: 4898.8,  color: '#f99e1a' }, // Orange
  { f: 10954.5, color: '#d03a3f' }, // Red
  { f: 20000,   color: '#7a0403' }, // Dark red
];

function getColorFromQualia7Band(freq) {
  const band = QUALIA_7BAND_COLORMAP.find(b => freq >= b.f1 && freq <= b.f2);
  return band ? band.color : '#808080';
}

function getColorFromGoogleTurbo(freq) {
  // Linear interpolation between turbo anchor points
  const f = clamp(freq, FMIN, FMAX);
  
  // Find the two closest anchor points
  let lower = GOOGLE_TURBO_COLORMAP[0];
  let upper = GOOGLE_TURBO_COLORMAP[GOOGLE_TURBO_COLORMAP.length - 1];
  
  for (let i = 0; i < GOOGLE_TURBO_COLORMAP.length - 1; i++) {
    if (f >= GOOGLE_TURBO_COLORMAP[i].f && f <= GOOGLE_TURBO_COLORMAP[i + 1].f) {
      lower = GOOGLE_TURBO_COLORMAP[i];
      upper = GOOGLE_TURBO_COLORMAP[i + 1];
      break;
    }
  }
  
  // Simple interpolation - return closest color for now
  const distToLower = Math.abs(f - lower.f);
  const distToUpper = Math.abs(f - upper.f);
  return distToLower < distToUpper ? lower.color : upper.color;
}

/**
 * Tone Control Web Component
 * @class ToneControl
 * @extends HTMLElement
 * @fires ToneControl#frequency-changed - When frequency slider changes
 * @fires ToneControl#speaker-toggled - When speaker button is clicked
 */
class ToneControl extends HTMLElement {
  /**
   * Observed attributes for the component
   * @static
   * @returns {string[]} Array of attribute names to observe
   */
  static get observedAttributes() { return ['value', 'active', 'label']; }

  constructor() {
    super();
    this._frequency = 1000;
    this._active = false;
    this._colormap = 'qualia7band'; // Default colormap: 'qualia7band' or 'googleturbo'
    this._colorForFrequency = null; // optional host-injected function(Hz)=>color

    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));

    this.$slider = this.shadowRoot.getElementById('slider');
    this.$toggle = this.shadowRoot.getElementById('toggle');
    this.$label = this.shadowRoot.getElementById('label');

    // Init UI
    this._updateLabel();
    this._updateColor();
    this._renderIcon();
  }

  connectedCallback() {
    // Event wiring
    this.$slider.addEventListener('input', this._onSlider);
    this.$toggle.addEventListener('click', this._onToggle);

    // Ensure 1kHz default and sync slider
    if (!this.hasAttribute('value')) {
      this._frequency = 1000; // Force 1kHz default
    }
    this.$slider.value = String(freqToSlider(this._frequency));
    this._updateLabel();
    this._updateColor();
  }

  disconnectedCallback() {
    this.$slider.removeEventListener('input', this._onSlider);
    this.$toggle.removeEventListener('click', this._onToggle);
  }

  attributeChangedCallback(name, oldV, newV) {
    if (oldV === newV) return;
    if (name === 'value') {
      const v = parseFloat(newV);
      this.frequency = sliderToFreq(isNaN(v) ? 0.566 : v);
    } else if (name === 'active') {
      this.active = newV !== null && newV !== 'false';
    } else if (name === 'label') {
      this.label = newV;
    }
  }

  // Properties
  get frequency() { return this._frequency; }
  set frequency(hz) {
    const f = clamp(Number(hz) || 1000, FMIN, FMAX);
    if (f === this._frequency) return;
    this._frequency = f;
    // Reflect slider + label + color
    if (this.$slider) this.$slider.value = String(freqToSlider(f));
    this._updateLabel();
    this._updateColor();
    this._emit('frequencychange', { frequency: this._frequency, value: parseFloat(this.$slider.value) });
  }

  get active() { return this._active; }
  set active(on) {
    const v = !!on;
    if (v === this._active) return;
    this._active = v;
    this._renderIcon();
    this._emit('toggle', { active: this._active });
    this._emit(this._active ? 'start' : 'stop', { frequency: this._frequency });
    // reflect attribute for CSS hooks if needed
    if (this._active) this.setAttribute('active', ''); else this.removeAttribute('active');
  }

  get label() { return this._labelText || toFixedHz(this._frequency); }
  set label(text) {
    this._labelText = text || '';
    this._updateLabel();
  }

  get colorForFrequency() { return this._colorForFrequency; }
  set colorForFrequency(fn) {
    this._colorForFrequency = typeof fn === 'function' ? fn : null;
    this._updateColor();
  }

  get colormap() { return this._colormap; }
  set colormap(mode) {
    const validModes = ['qualia7band', 'googleturbo'];
    if (validModes.includes(mode)) {
      this._colormap = mode;
      this._updateColor();
    }
  }

  // Private
  _onSlider = (e) => {
    const v = parseFloat(e.target.value);
    let hz = sliderToFreq(v);
    console.log(`Slider input: raw frequency ${hz.toFixed(1)}Hz`);
    
    // Apply frequency snapping from original implementation
    const snapped = snapFrequency(hz);
    console.log(`Snapped frequency: ${snapped.toFixed(1)}Hz`);
    
    if (Math.abs(snapped - hz) > 0.1) { // Only update if meaningful change
      hz = snapped;
      console.log(`Updating slider position to reflect snapped frequency: ${hz}Hz`);
      // Update slider position to reflect snapped frequency
      if (this.$slider) {
        this.$slider.value = String(freqToSlider(hz));
      }
    }
    
    this._frequency = hz; // internal, avoid double event by calling setters redundantly
    this._updateLabel();
    this._updateColor();
    this._emit('frequencychange', { frequency: hz, value: freqToSlider(hz) });
  }

  _onToggle = () => {
    this.active = !this._active;
  }

  _updateLabel() {
    if (!this.$label) return;
    this.$label.textContent = this._labelText || toFixedHz(this._frequency);
  }

  _updateColor() {
    let color;
    
    if (this._colorForFrequency) {
      // Use host-injected color function if provided (for compatibility)
      color = this._colorForFrequency(this._frequency);
      console.log(`Using injected color for ${this._frequency}Hz: ${color}`);
    } else {
      // Use built-in colormap
      if (this._colormap === 'googleturbo') {
        color = getColorFromGoogleTurbo(this._frequency);
        console.log(`Using Google Turbo color for ${this._frequency}Hz: ${color}`);
      } else {
        // Default: Qualia 7band
        color = getColorFromQualia7Band(this._frequency);
        console.log(`Using Qualia 7band color for ${this._frequency}Hz: ${color}`);
      }
    }
    
    const c = color || getComputedStyle(this).getPropertyValue('--tone-color') || '#9aa6b2';
    console.log(`Final color applied: ${c}`);
    
    // Apply frequency color only to slider (for thumb), not the whole component
    if (this.$slider) {
      this.$slider.style.setProperty('--frequency-color', String(c).trim());
      this.$slider.style.color = String(c).trim();
    }
    
    // Apply color to toggle button
    if (this.$toggle) {
      this.$toggle.style.color = String(c).trim();
    }
  }

  _renderIcon() {
    if (!this.$toggle) return;
    const onIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10v4h3l4 4V6L6 10H3z"></path>
        <path d="M16.5 12a2.5 2.5 0 0 0-1.5-2.3v4.6c.9-.4 1.5-1.3 1.5-2.3z"></path>
        <path d="M19 12c0 2.5-1.5 4.6-3.5 5.5v-11C17.5 6.4 19 9.5 19 12z"></path>
      </svg>`;
    const offIcon = `
      <svg viewBox="0 0 24 24" aria-hidden="true">
        <path d="M3 10v4h3l4 4V6L6 10H3z"></path>
      </svg>`;
    this.$toggle.innerHTML = this._active ? onIcon : offIcon;
    this.$toggle.classList.toggle('active', !!this._active);
    this.$toggle.setAttribute('aria-pressed', this._active ? 'true' : 'false');
  }

  _emit(type, detail) { this.dispatchEvent(new CustomEvent(type, { bubbles: true, composed: true, detail })); }
}

customElements.define('tone-control', ToneControl);

// ES6 Module Exports (Phase 2 - Component System Modernization)
export { ToneControl };
export { getColorFromQualia7Band, getColorFromGoogleTurbo };
export { sliderToFreq, freqToSlider, snapFrequency };
export const SNAP_TARGETS = SNAP_TARGETS;
export const QUALIA_7BAND_COLORMAP = QUALIA_7BAND_COLORMAP;
export const GOOGLE_TURBO_COLORMAP = GOOGLE_TURBO_COLORMAP;

// Global Compatibility (maintains existing behavior)
if (typeof window !== 'undefined') {
  window.ToneControl = ToneControl;
  window.getColorFromQualia7Band = getColorFromQualia7Band;
  window.getColorFromGoogleTurbo = getColorFromGoogleTurbo;
  window.sliderToFreq = sliderToFreq;
  window.freqToSlider = freqToSlider;
  window.snapFrequency = snapFrequency;
}