// modules/tone-control.js
// Fixed Tone Control Web Component: frequency slider + speaker toggle
// UI-only: emits events and exposes properties; host controls audio.

const TEMPLATE = document.createElement('template');
TEMPLATE.innerHTML = `
  <style>
    :host { 
      display: block; 
      font-family: inherit; 
      color: var(--tone-color, #9aa6b2);
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

export class ToneControl extends HTMLElement {
  static get observedAttributes() { return ['value', 'active', 'label']; }

  constructor() {
    super();
    this._frequency = 1000;
    this._active = false;
    this._colorForFrequency = null; // host-injected function(Hz)=>color

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

    // Sync slider to frequency if host set it before connect
    this.$slider.value = String(freqToSlider(this._frequency));
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

  // Private
  _onSlider = (e) => {
    const v = parseFloat(e.target.value);
    const hz = sliderToFreq(v);
    this._frequency = hz; // internal, avoid double event by calling setters redundantly
    this._updateLabel();
    this._updateColor();
    this._emit('frequencychange', { frequency: hz, value: v });
  }

  _onToggle = () => {
    this.active = !this._active;
  }

  _updateLabel() {
    if (!this.$label) return;
    this.$label.textContent = this._labelText || toFixedHz(this._frequency);
  }

  _updateColor() {
    const color = this._colorForFrequency ? this._colorForFrequency(this._frequency) : null;
    const c = color || getComputedStyle(this).getPropertyValue('--tone-color') || '#9aa6b2';
    this.style.setProperty('--tone-color', String(c).trim());
    // color drives slider thumb and icon via currentColor
    this.style.color = String(c).trim();
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