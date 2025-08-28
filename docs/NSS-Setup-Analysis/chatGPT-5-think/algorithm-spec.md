https://chatgpt.com/c/68ab48b8-1858-8325-b5c6-7ea85edaa30e

Awesome—here’s a concise, implementation-ready **algorithm spec** for a browser-based measurement webapp that (1) generates test signals, (2) records with the device mic, and (3) computes **time delay**, **reverberance (RT60/EDT)**, and **comb-filtering** metrics.

---

# 0) Overview (Data Flow)

1. **Generate Test Signal** (ESS sweep; optional pink noise / bursts).
2. **Playback** via Web Audio → device output → room + speakers.
3. **Record** mic via `getUserMedia` → `Float32Array` of samples.
4. **Deconvolve** recording with inverse sweep → **Impulse Response (IR)**.
5. **Analyze** IR:

   * Direct arrivals & **time delay** (ms)
   * **RT60/EDT** via Schroeder energy decay
   * **Comb-filter** notches & inferred delay from notch spacing
6. **Report** JSON + optional WAV exports (recording, IR).

---

# 1) Signal Generation

## 1.1 Exponential Sine Sweep (ESS)

* **Inputs**:
  `fs` (sample rate), `dur` (s), `f1`, `f2` (Hz), `amp` (0–1)
* **Formulas** (Lenzi/Farina style):

  * `L = dur * fs` (samples)
  * `K = dur / ln(f2/f1)`
  * Sweep phase: `phi[n] = 2π f1 * K * (exp(n/(fs*K)) - 1)`
  * Sweep: `s[n] = amp * sin(phi[n])`, `n = 0..L-1`
* **Inverse filter** (time-reversed sweep with amplitude pre-emphasis):

  * `w[n] = s[L-1-n] * exp(-n/(fs*K))`
* **Output**: `s` (ESS), `w` (inverse)

**Parameters (defaults):**
`f1=30 Hz`, `f2=20000 Hz`, `dur=8–12 s`, `amp=−6 dBFS`.

**Notes:** Longer sweeps improve SNR; keep `amp` safe from clipping.

## 1.2 Alternatives (optional)

* **Pink noise** (for quick spectrum sanity check).
* **Tone bursts** (diagnostics).
  Use only ESS for IR/RT60 calculations.

---

# 2) Recording

* **Mic access**: `navigator.mediaDevices.getUserMedia({ audio: { sampleRate: fs, channelCount: 1 }})`
* **Buffering**: AudioWorklet or `MediaRecorder` → `Float32Array`.
* **Sync**: Start recording **before** playback (lead-in 0.5 s). Stop after sweep + 1–2 s tail.
* **Preprocessing**:

  * DC removal: `x = x - mean(x)`
  * Optional high-pass 20 Hz (biquad) to remove rumble
  * Optional Hann fade-in/out (first/last 256 samples)

---

# 3) Deconvolution → Impulse Response (IR)

## 3.1 FFT-based deconvolution

* Zero-pad `x` (recording) and `w` (inverse) to length `N = nextPow2(len(x)+len(w)-1)`
* Compute: `X = FFT(x)`, `W = FFT(w)`
* Regularized division (or convolution):

  * `Y = X * conj(W) / (|W|^2 + ε)` with `ε = 1e-8 .. 1e-6`
* IR: `h = IFFT(Y).real`

## 3.2 IR cleanup

* **Find IR onset** (peak of absolute value around first arrivals).
* **Window**: Keep `h[t0-5 ms : t0+T]` (e.g., T = 1.5–2.5 s depending on room).
* **Normalize**: `h = h / max(|h|)`

**Outputs**: `h` (mono IR), `t0` (first-arrival index).

---

# 4) Time Delay Estimation (Set A vs Set B)

## 4.1 Direct-arrival picking

* Smooth absolute IR: `e[n] = abs(h[n])` then moving RMS (e.g., 0.2–0.5 ms window).
* Detect **first significant peak** after noise floor (threshold `θ = 6–10 dB` over median of pre-arrival noise).
* Save `tA` (time of front set A arrival), `tB` (time of side/back set B arrival).

  * If only one device IR exists, measure with **two runs**: (A-only, B-only), or use **stereo** recording if available.

## 4.2 Delay

* `Δt_ms = 1000 * (tB - tA) / fs`
* Confidence metric: inter-peak SNR & peak sharpness (local kurtosis).

---

# 5) Reverberance (RT60/EDT) via Schroeder Integration

## 5.1 Energy decay curve (EDC)

* **Square IR**: `p[n] = h[n]^2`
* **Reverse cumulative sum**:
  `E[n] = sum_{k=n}^{end} p[k]`
* Convert to dB:
  `L[n] = 10 * log10(E[n] / max(E))`

## 5.2 Linear-region fitting

* **EDT**: linear fit on `0 → -10 dB` region, scaled to −60 dB.
* **T20**: fit `-5 → -25 dB`, extrapolate to −60: `RT60 = 3 * T20`
* **T30**: fit `-5 → -35 dB`, extrapolate to −60: `RT60 = 2 * T30`
* Use robust linear regression (RANSAC or Theil–Sen) to mitigate outliers.
* Report: `EDT`, `T20`, `T30`, `fit_R²`, chosen bands (see §7).

**Edge cases:** If decay range < 20 dB, mark RT60 unreliable.

---

# 6) Comb-Filtering Detection

## 6.1 Frequency response

* Window IR to early part (e.g., 0–50 ms) for **direct + early reflections** response.
* FFT magnitude: `H(f) = 20*log10(|FFT(windowed_h)|)`

## 6.2 Notch detection

* Smooth `H(f)` with 1/6-octave moving average → `H_s(f)`
* Residual: `R(f) = H(f) - H_s(f)`
* Find local minima where `R(f) < −D_min` (e.g., `D_min = 3–6 dB`) and prominence threshold.

## 6.3 Periodicity → delay

* Compute **autocorrelation** across frequency of `R(f)` in Hz domain or cepstrum-like approach:

  * Uniformly re-sample `R` on linear-Hz grid `f_i`.
  * `C(τ_f) = sum_i R(f_i) * R(f_i + τ_f)`
  * Peak `τ_f*` (Hz) → notch spacing.
  * **Delay estimate**: `τ_delay (s) ≈ 1 / τ_f*`, `ms = 1000 / τ_f*`
* Compare `τ_delay` to §4 result; report agreement (±15%).

## 6.4 Severity metric (optional)

* `severity = (count of notches deeper than D_min within band) / bandwidth`
* Report per band (e.g., 100–2k Hz), flag if severity > threshold.

---

# 7) Band-limited Metrics (1/1 or 1/3 Octave)

To cope with phone mic response, compute **band-limited RT60 & comb severity**:

* Create octave / third-octave filters (IIR or FFT filterbank).
* For each band `b`:

  * Bandpass the IR → `h_b`
  * Repeat §5 for RT60\_b, and §6 for comb severity in that band.
* Recommended bands: 125, 250, 500, 1k, 2k Hz (and 4k if SNR allows).
* For your design (no duplication >2 kHz), prioritize ≤2 kHz bands.

---

# 8) Pseudocode (High-Level)

```pseudo
function measureSession(params):
  s, w = generateESS(fs, dur, f1, f2, amp)
  playAndRecord(s, leadIn=0.5s, tail=2s) -> x
  x = preprocess(x)

  h = deconvolveFFT(x, w, eps)
  t0 = findIROnset(h)

  delay = {}
  if mode == "A_only" or "B_only":
      store for cross-run comparison
  else:
      (tA, tB) = detectDirectArrivals(h)
      delay.ms = 1000*(tB - tA)/fs
      delay.confidence = peakSNR(h)

  rt = {}
  (EDT, T20, T30, R2) = schroederRT60(h, fs)
  rt = { EDT, T20, T30, R2 }

  comb = {}
  H = magFFT(windowEarly(h, 0..50ms))
  notches = findNotches(H)
  spacingHz, delayCombMs = periodicityToDelay(notches)
  severity = combSeverity(notches)
  comb = { notches, delayCombMs, severity }

  bands = perOctaveBands(h, fs)  // optional band-limited RT60 + comb

  return reportJSON(params, delay, rt, comb, bands)
```

---

# 9) Numerical & Implementation Notes

* **Buffer sizes**: choose FFT `N` as power-of-2 ≥ `len(x)+len(w)`.
* **Regularization** `ε`: tune to suppress inverse instabilities.
* **Windowing**: Hann for early window and for spectral smoothing.
* **Time pickers**: sub-sample precision via quadratic interpolation around peaks.
* **Averaging**: allow `M` sweeps; average recordings before deconvolution (or average IRs).
* **Clock drift**: rely on single device clock; avoid split playback/record devices in web contexts.
* **Levels**: show input peak and DR; warn if clipping or too low (< −40 dBFS).
* **Privacy**: run entirely client-side; no network needed.

---

# 10) Outputs (Report Schema)

```json
{
  "meta": {
    "fs": 48000,
    "sweep": { "f1": 30, "f2": 20000, "duration_s": 10, "repeats": 3 },
    "device": { "userAgent": "...", "platform": "web" },
    "timestamp": "2025-08-24T17:00:00Z"
  },
  "delay": {
    "tA_ms": 7.2,
    "tB_ms": 11.9,
    "delta_ms": 4.7,
    "confidence": 0.86
  },
  "reverberance": {
    "EDT_s": 0.31,
    "T20_s": 0.36,
    "T30_s": 0.38,
    "fit_R2": 0.97,
    "notes": "T30 valid; decay span 32 dB"
  },
  "comb": {
    "delay_from_spacing_ms": 4.6,
    "spacing_hz": 217.0,
    "severity": 0.22,
    "notches": [
      { "freq_hz": 217, "depth_db": -7.5 },
      { "freq_hz": 434, "depth_db": -6.1 }
    ]
  },
  "bands": [
    { "center_hz": 125, "RT60_s": 0.42, "comb_severity": 0.18 },
    { "center_hz": 250, "RT60_s": 0.39, "comb_severity": 0.24 },
    { "center_hz": 500, "RT60_s": 0.36, "comb_severity": 0.20 },
    { "center_hz": 1000, "RT60_s": 0.34, "comb_severity": 0.10 },
    { "center_hz": 2000, "RT60_s": 0.31, "comb_severity": 0.05 }
  ]
}
```

---

# 11) UI/UX Requirements (brief)

* **Generator panel**: ESS settings, level meter, “Repeat count”.
* **Record panel**: Start/Stop, status, input peak/SNR warnings.
* **Results**:

  * IR plot with marked arrivals (tA, tB)
  * EDC with fitted lines and reported EDT/T20/T30
  * Spectrum with notches annotated; inferred comb delay
  * Band table (125–2k Hz) for RT60 + comb severity
* **Exports**: WAV (IR + recording), JSON report, PNG plots.

---

# 12) Validation & Acceptance

* **Synthetic test**: generate virtual room response with known delay `Δt` (e.g., convolve sweep with two impulses at 0 and Δt); accept if delay error < **±0.2 ms** for Δt ≤ 10 ms.
* **RT60 check**: with simulated exponential decays of known slope; accept if |error| < **10%** for T20/T30.
* **Comb check**: inject known dual-path delay; accept if inferred delay within **±10%** and notches detected at correct multiples within **±1/6-oct**.
* **Mobile**: verify stability down to 44.1 kHz and with mic AGC ON/OFF (advise user to disable AGC if device allows).

---

# 13) Minimal API (internal)

```ts
// generation
generateESS(fs:number, dur:number, f1:number, f2:number, amp:number): { sweep: Float32Array, inv: Float32Array }

// record
recordBuffer(duration_s:number, fs:number): Promise<Float32Array>

// deconvolution
deconvolveFFT(x:Float32Array, inv:Float32Array, eps:number): Float32Array // -> IR

// analysis
estimateArrivals(ir:Float32Array, fs:number): { tA:number, tB:number, confidence:number }
schroederRT60(ir:Float32Array, fs:number, method:"T20"|"T30"|"EDT"|"auto"): { EDT:number, T20:number, T30:number, fitR2:number }
combAnalysis(ir:Float32Array, fs:number, early_ms:number): { notches: Notch[], spacingHz:number, delayMs:number, severity:number }
bandAnalysis(ir:Float32Array, fs:number, bands:number[]): BandResult[]

// report
buildReport(meta:Meta, delay:Delay, rev:Rev, comb:Comb, bands:Band[]): Report
```

---

# 14) Notes for Your Setup (A vs B, FsB = ½ FsA)

* Expect **comb notches** primarily **below \~2 kHz** (by design), so emphasize band analysis 125–2k Hz.
* Delay measured (§4) should correlate with comb spacing (§6): `Δt ≈ 1/Δf`.
* Because Set B extends to 2 kHz max, run an additional **A-only** sweep to isolate A arrival (`tA`) if needed, then **B-only** to get `tB`. The **both-on** sweep validates comb predictions.

---

If you want, I can convert this into a **starter TypeScript project** (Web Audio + small FFT lib + plotting) with the core functions stubbed and a minimal UI.
