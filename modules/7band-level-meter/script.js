document.addEventListener('DOMContentLoaded', () => {
    // DOM Elements
    const startBtn = document.getElementById('startBtn');
    const refreshBtn = document.getElementById('refreshDevices');
    const retryBtn = document.getElementById('retryBtn');
    const deviceSelect = document.getElementById('deviceSelect');
    const calOffsetInput = document.getElementById('calOffset');
    const calResetBtn = document.getElementById('calReset');
    const errorBox = document.getElementById('errorBox');
    const statusElement = document.getElementById('status');
    // Old single-bar elements are no longer present; keep null-safe refs
    const vuMeter = document.getElementById('vuMeter');
    const peakMeter = document.getElementById('peakMeter');
    const dbValueElement = document.getElementById('dbValue');
    const bandsContainer = document.getElementById('bandsContainer');
    
    // Audio context and analyzer
    let audioContext;
    let analyser;
    let microphone;
    let dataArray; // frequency-domain (kept for future use)
    let timeDataArray; // time-domain samples for RMS
    let rafId;
    let isRunning = false;
    let peakLevel = -100; // Track peak level in dB
    let peakTimer = null;
    // Throttle for numeric value updates (10 Hz)
    let lastValueUpdateMs = 0;
    // Tone generator state
    let toneOsc = null;
    let toneGain = null;
    let toneOn = false;
    let toneFreqHz = 1000;
    const TONE_TARGET_GAIN = 0.03; // final volume
    const TONE_RAMP_UP_MS = 60;
    const TONE_RAMP_DOWN_MS = 80;
    // Calibration and ballistics
    function getStoredCalOffset() {
        const v = localStorage.getItem('calOffsetDb');
        const n = v !== null ? parseFloat(v) : NaN;
        return Number.isFinite(n) ? n : 0;
    }
    let calibrationOffsetDb = 3.0; // Hardcoded calibration for 1kHz sine wave reference
    const bandSplOffsetDb = 0; // Add a fixed offset to convert per-band dBFS to dB SPL after you calibrate
    let smoothedDb = -100; // for VU-style averaging
    const attackTimeMs = 300; // VU ~300 ms rise
    const releaseTimeMs = 600; // a bit slower fall

    // 8-band definitions (7 bands + Total)
    const bandDefs = [
        { key: 'sub',   name: 'Sub‑bass',   f1: 20,   f2: 60,    color: '#8b0000' },
        { key: 'bass',  name: 'Bass',       f1: 60,   f2: 250,   color: '#dc143c' },
        { key: 'lowmid',name: 'Low Mid',    f1: 250,  f2: 500,   color: '#ff6347' },
        { key: 'mid',   name: 'Midrange',   f1: 500,  f2: 2000,  color: '#ff8c00' },
        { key: 'upmid', name: 'Upper Mid',  f1: 2000, f2: 4000,  color: '#32cd32' },
        { key: 'pres',  name: 'Presence',   f1: 4000, f2: 6000,  color: '#1e90ff' },
        { key: 'brill', name: 'Brilliance', f1: 6000, f2: 20000, color: '#9370db' },
        { key: 'total', name: 'Total',      f1: 20,   f2: 20000, color: '#808080' }
    ];

    // Per-band processing/DOM refs (7 filtered bands + 1 total unfiltered)
    const bands = bandDefs.map(def => ({ ...def, filter: null, analyser: null, elements: null, db: -100 }));

    // White noise generator for testing
    let whiteNoiseSource = null;
    let whiteNoiseGain = null;
    
    function generateWhiteNoise() {
        if (!audioContext) return null;
        
        const bufferSize = audioContext.sampleRate * 2; // 2 seconds
        const buffer = audioContext.createBuffer(1, bufferSize, audioContext.sampleRate);
        const data = buffer.getChannelData(0);
        
        // Generate white noise
        for (let i = 0; i < bufferSize; i++) {
            data[i] = (Math.random() * 2 - 1) * 0.1; // Low amplitude to avoid clipping
        }
        
        return buffer;
    }
    
    function startWhiteNoise() {
        if (!audioContext || whiteNoiseSource) return;
        
        const buffer = generateWhiteNoise();
        if (!buffer) return;
        
        whiteNoiseSource = audioContext.createBufferSource();
        whiteNoiseGain = audioContext.createGain();
        
        whiteNoiseSource.buffer = buffer;
        whiteNoiseSource.loop = true;
        whiteNoiseGain.gain.value = 0.05; // Adjust volume
        
        whiteNoiseSource.connect(whiteNoiseGain);
        whiteNoiseGain.connect(audioContext.destination);
        
        whiteNoiseSource.start();
        console.log('White noise started - check sum vs direct measurements');
    }
    
    function stopWhiteNoise() {
        if (whiteNoiseSource) {
            whiteNoiseSource.stop();
            whiteNoiseSource.disconnect();
            whiteNoiseSource = null;
        }
        if (whiteNoiseGain) {
            whiteNoiseGain.disconnect();
            whiteNoiseGain = null;
        }
        console.log('White noise stopped');
    }

    function createBandsUI() {
        if (!bandsContainer) return;
        bandsContainer.innerHTML = '';
        bandDefs.forEach(def => {
            const bandEl = document.createElement('div');
            bandEl.className = 'band';

            // Meter row: scale + bar
            const meterRow = document.createElement('div');
            meterRow.className = 'band-meter';

            // Scale (0 to -100) with 5 dB minor ticks
            const scale = document.createElement('div');
            scale.className = 'band-scale';
            for (let i = 0; i <= 10; i++) {
                const yPct = i * 10; // 0 at top, 100 at bottom
                const tick = document.createElement('div');
                tick.className = 'tick major';
                tick.style.top = `${yPct}%`;
                scale.appendChild(tick);

                const label = document.createElement('div');
                label.className = 'tick-label';
                label.style.top = `${yPct}%`;
                label.textContent = i === 0 ? '0' : `-${i * 10}`;
                scale.appendChild(label);

                // add minor tick halfway (e.g., -5, -15, ... -95)
                if (i < 10) {
                    const minor = document.createElement('div');
                    minor.className = 'tick minor';
                    minor.style.top = `${yPct + 5}%`;
                    scale.appendChild(minor);
                }
            }

            const bar = document.createElement('div');
            bar.className = 'band-bar';

            const fill = document.createElement('div');
            fill.className = 'band-fill';
            fill.style.backgroundColor = def.color;
            bar.appendChild(fill);

            // Peak hold line (1000ms true peak hold)
            const peakHold = document.createElement('div');
            peakHold.className = 'band-peak-hold';
            peakHold.style.color = def.color;
            bar.appendChild(peakHold);

            const label = document.createElement('div');
            label.className = 'band-label';
            label.textContent = def.name;

            const range = document.createElement('div');
            range.className = 'band-range';
            range.textContent = `${def.f1}-${def.f2} Hz`;

            const value = document.createElement('div');
            value.className = 'band-value';
            value.textContent = '— dBFS';
            meterRow.appendChild(scale);
            meterRow.appendChild(bar);
            bandEl.appendChild(meterRow);
            bandEl.appendChild(label);
            bandEl.appendChild(range);
            bandEl.appendChild(value);
            bandsContainer.appendChild(bandEl);
            const b = bands.find(x => x.key === def.key);
            if (b) b.elements = { fill, peakHold, value };
        });
    }
    
    // Initialize calibration UI with validation
    function validateCalibration(value) {
        const n = parseFloat(value);
        if (!Number.isFinite(n)) return { valid: false, error: 'Invalid number' };
        if (n < -60) return { valid: false, error: 'Min: -60 dBFS', clamped: -60 };
        if (n > 60) return { valid: false, error: 'Max: +60 dBFS', clamped: 60 };
        return { valid: true, value: n };
    }
    
    if (calOffsetInput) {
        calOffsetInput.value = calibrationOffsetDb.toFixed(1);
        
        calOffsetInput.addEventListener('input', () => {
            const result = validateCalibration(calOffsetInput.value);
            
            if (result.valid) {
                calibrationOffsetDb = result.value;
                localStorage.setItem('calOffsetDb', String(calibrationOffsetDb));
                calOffsetInput.style.borderColor = '#3a3a3a'; // reset to normal
                calOffsetInput.title = 'Calibration offset in dBFS';
            } else {
                calOffsetInput.style.borderColor = '#ff6b6b'; // red border for invalid
                calOffsetInput.title = result.error;
                
                if (result.clamped !== undefined) {
                    // Auto-clamp and update
                    calibrationOffsetDb = result.clamped;
                    localStorage.setItem('calOffsetDb', String(calibrationOffsetDb));
                    calOffsetInput.value = result.clamped.toFixed(1);
                    setTimeout(() => {
                        calOffsetInput.style.borderColor = '#3a3a3a';
                        calOffsetInput.title = 'Calibration offset in dBFS';
                    }, 2000);
                }
            }
        });
        
        calOffsetInput.addEventListener('blur', () => {
            // Ensure valid display on blur
            calOffsetInput.value = calibrationOffsetDb.toFixed(1);
            calOffsetInput.style.borderColor = '#3a3a3a';
            calOffsetInput.title = 'Calibration offset in dBFS';
        });
    }
    
    if (calResetBtn) {
        calResetBtn.addEventListener('click', () => {
            calibrationOffsetDb = 0;
            localStorage.setItem('calOffsetDb', '0');
            if (calOffsetInput) {
                calOffsetInput.value = '0.0';
                calOffsetInput.style.borderColor = '#3a3a3a';
                calOffsetInput.title = 'Calibration offset in dBFS';
            }
        });
    }
    
    // Initialize audio context and start/stop functionality
    async function toggleMeter() {
        if (isRunning) {
            stopMeter();
            startBtn.textContent = 'Start Microphone';
            if (statusElement) {
                statusElement.textContent = 'Microphone stopped';
                statusElement.style.color = '#888';
            }
        } else {
            try {
                await startMeter();
                startBtn.textContent = 'Stop Microphone';
                if (statusElement) {
                    statusElement.textContent = 'Microphone active';
                    statusElement.style.color = '#4CAF50';
                }
            } catch (err) {
                console.error('Error accessing microphone:', err);
                if (statusElement) {
                    statusElement.textContent = 'Error accessing microphone. Please check permissions.';
                    statusElement.style.color = '#F44336';
                }
                simulateVuMeter();
                // Reset bands
                bands.forEach(b => {
                    if (b.filter) try { b.filter.disconnect(); } catch(e){}
                    if (b.analyser) try { b.analyser.disconnect(); } catch(e){}
                    b.filter = null;
                    b.analyser = null;
                    b.db = -100;
                    if (b.elements) {
                        b.elements.fill.style.height = '0%';
                        b.elements.value.textContent = '— dBFS';
                    }
                });
            }
        }
        isRunning = !isRunning;
    }
    
    // Start the VU meter with microphone input
    async function startMeter() {
        try {
            // Create audio context
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Create analyser node
            analyser = audioContext.createAnalyser();
            analyser.fftSize = 2048;
            analyser.smoothingTimeConstant = 0.8;
            
            // Selected device (if any)
            const deviceId = deviceSelect && deviceSelect.value ? deviceSelect.value : undefined;
            const constraints = {
                audio: {
                    deviceId: deviceId ? { exact: deviceId } : undefined,
                    echoCancellation: false,
                    noiseSuppression: false,
                    autoGainControl: false
                }
            };
            // Get raw microphone stream
            const stream = await navigator.mediaDevices.getUserMedia(constraints);

            // Create media source
            microphone = audioContext.createMediaStreamSource(stream);
            
            // Connect microphone to analyser
            microphone.connect(analyser);
            
            // Create data arrays for audio analysis
            dataArray = new Uint8Array(analyser.frequencyBinCount);
            timeDataArray = new Uint8Array(analyser.fftSize);

            // Build bands UI if not built
            if (bandsContainer.innerHTML === '') {
                createBandsUI();
            }

            // Create per-band filters and analysers
            bands.forEach(b => {
                const an = audioContext.createAnalyser();
                an.fftSize = 2048;
                // Use minimal smoothing; we read time-domain RMS
                an.smoothingTimeConstant = 0.0;
                
                if (b.key === 'total') {
                    // Total band: direct connection without filtering
                    microphone.connect(an);
                    b.filter = null;
                    b.analyser = an;
                    b.data = new Float32Array(an.fftSize);
                } else {
                    // Filtered bands: create bandpass filter
                    const fc = Math.sqrt(b.f1 * b.f2);
                    const q = Math.max(0.5, fc / Math.max(1, (b.f2 - b.f1))); // avoid extreme Q
                    const filter = audioContext.createBiquadFilter();
                    filter.type = 'bandpass';
                    filter.frequency.value = fc;
                    filter.Q.value = q;

                    microphone.connect(filter);
                    filter.connect(an);

                    b.filter = filter;
                    b.analyser = an;
                    b.data = new Float32Array(an.fftSize);
                }
            });
            
            // Start the band-only update loop
            meterLoop();
            hideError();
            if (statusElement) statusElement.textContent = 'Listening…';

        } catch (err) {
            handleError(err);
            throw err;
        }
    }
    
    // Stop the VU meter and release resources
    function stopMeter() {
        if (rafId) {
            cancelAnimationFrame(rafId);
            rafId = null;
        }
        
        if (microphone) {
            microphone.disconnect();
            const tracks = microphone.mediaStream.getTracks();
            tracks.forEach(track => track.stop());
            microphone = null;
        }
        
        if (audioContext) {
            if (audioContext.state !== 'closed') {
                audioContext.close();
            }
            audioContext = null;
        }
        
        // Reset old single-bar UI if present (safe-guards)
        if (vuMeter) vuMeter.style.transform = 'scaleY(0)';
        if (peakMeter) peakMeter.style.display = 'none';
        if (dbValueElement) dbValueElement.textContent = '-∞ dBFS';
        
        if (peakTimer) {
            clearTimeout(peakTimer);
            peakTimer = null;
        }
    }
    
    // Band-only animation loop (no single-bar UI)
    function meterLoop() {
        if (!analyser) return;
        updateBands();
        rafId = requestAnimationFrame(meterLoop);
    }

    // Compute per-band RMS and update UI
    function updateBands() {
        const minDb = -100;
        const maxDb = 0;
        const nowPerf = (typeof performance !== 'undefined' && performance.now) ? performance.now() : Date.now();
        const shouldUpdateValues = (nowPerf - lastValueUpdateMs) >= 100; // ~10 Hz
        
        let totalFromBands = 0; // Sum of squared RMS from 7 bands (excluding total)
        let bandCount = 0;
        
        bands.forEach(b => {
            if (!b.analyser || !b.elements) return;
            // Use Float32 time-domain samples for RMS inside the band
            const an = b.analyser;
            if (!b.data) b.data = new Float32Array(an.fftSize);
            an.getFloatTimeDomainData(b.data);
            let sumSq = 0;
            for (let i = 0; i < b.data.length; i++) {
                const v = b.data[i]; // already [-1,1]
                sumSq += v * v;
            }
            const rms = Math.sqrt(sumSq / b.data.length);
            let db = rms > 0 ? 20 * Math.log10(rms) : -Infinity;
            db += calibrationOffsetDb;
            db = Math.max(minDb, Math.min(db, maxDb));

            // For sum calculation, exclude total band
            if (b.key !== 'total' && rms > 0) {
                totalFromBands += rms * rms; // Sum of squared RMS values
                bandCount++;
            }

            // Adaptive smoothing based on frequency range for optimal response
            const fc = Math.sqrt(b.f1 * b.f2);
            let fastAttack, fastRelease, vuAttack, vuRelease;
            
            if (fc < 500) {
                // Low frequencies: slower response
                fastAttack = 30; fastRelease = 40;
                vuAttack = 40; vuRelease = 50;
            } else if (fc < 2000) {
                // Mid frequencies: moderate response  
                fastAttack = 25; fastRelease = 35;
                vuAttack = 35; vuRelease = 45;
            } else {
                // High frequencies: faster response
                fastAttack = 20; fastRelease = 30;
                vuAttack = 30; vuRelease = 40;
            }

            // Fast smoothing for the main column (responsive visual feedback)
            if (!b.fastDb) b.fastDb = db;
            const fastAlpha = db > b.fastDb ? 1 - Math.exp(-1000 / (60 * fastAttack)) : 1 - Math.exp(-1000 / (60 * fastRelease));
            b.fastDb = b.fastDb + fastAlpha * (db - b.fastDb);

            // VU-style smoothing for hold line (stable reference)
            if (!b.vuDb) b.vuDb = db;
            const vuAlpha = db > b.vuDb ? 1 - Math.exp(-1000 / (60 * vuAttack)) : 1 - Math.exp(-1000 / (60 * vuRelease));
            b.vuDb = b.vuDb + vuAlpha * (db - b.vuDb);

            // True peak detection (instantaneous, no smoothing)
            if (!b.peakDb) b.peakDb = -100;
            if (db > b.peakDb) {
                b.peakDb = db;
                b.peakHoldTime = Date.now();
            }

            // Peak hold logic with 1000ms hold and decay
            const now = Date.now();
            if (b.peakHoldTime && (now - b.peakHoldTime) > 1000) {
                // Decay peak after 1000ms hold
                b.peakDb = Math.max(b.peakDb - 0.5, db); // 0.5 dB/frame decay, but never below current
            }

            // Update UI elements for fill, hold, peak hold
            const pct = Math.max(0, Math.min(100, ((b.fastDb - minDb) / (maxDb - minDb)) * 100));
            const peakPct = Math.max(0, Math.min(100, ((b.peakDb - minDb) / (maxDb - minDb)) * 100));

            if (b.elements && b.elements.fill && b.elements.peakHold && b.elements.value) {
                b.elements.fill.style.height = `${pct}%`;
                b.elements.peakHold.style.bottom = `${peakPct}%`;
                if (shouldUpdateValues) {
                    b.elements.value.textContent = `${b.fastDb.toFixed(1)} dBFS`;
                }
            }
        });
        if (shouldUpdateValues) {
            lastValueUpdateMs = nowPerf;
        }
        
        // Calculate sum-based total and compare with direct total measurement
        if (totalFromBands > 0 && bandCount > 0) {
            const sumBasedTotal = 20 * Math.log10(Math.sqrt(totalFromBands)) + calibrationOffsetDb;
            const totalBand = bands.find(b => b.key === 'total');
            const directTotal = totalBand ? totalBand.fastDb : -100;
            
            // Log comparison for debugging
            if (Math.abs(sumBasedTotal - directTotal) > 0.1) {
                console.log(`Sum vs Direct: ${sumBasedTotal.toFixed(1)} dB vs ${directTotal.toFixed(1)} dB (diff: ${(sumBasedTotal - directTotal).toFixed(1)} dB)`);
            }
        }
    }

    // Device handling
    async function initDevices() {
        try {
            if (!navigator.mediaDevices || !navigator.mediaDevices.enumerateDevices) return;
            const devices = await navigator.mediaDevices.enumerateDevices();
            const inputs = devices.filter(d => d.kind === 'audioinput');
            if (deviceSelect) {
                const prev = deviceSelect.value;
                deviceSelect.innerHTML = '';
                inputs.forEach((d, idx) => {
                    const opt = document.createElement('option');
                    opt.value = d.deviceId;
                    opt.textContent = d.label || `Microphone ${idx + 1}`;
                    deviceSelect.appendChild(opt);
                });
                // Restore previous selection if still present
                if (inputs.some(d => d.deviceId === prev)) {
                    deviceSelect.value = prev;
                }
            }
        } catch (err) {
            console.warn('enumerateDevices failed:', err);
        }
    }

    function handleError(err) {
        console.error('Error initializing audio:', err);
        const msg = (err && err.name === 'NotAllowedError') ?
            'Microphone permission was denied. Allow mic access in your browser settings and macOS Privacy > Microphone.' :
            (err && err.name === 'NotFoundError') ?
            'No microphone was found. Plug in a mic or select a different input device.' :
            (err && err.message) ? err.message : 'Unknown microphone error.';
        showError(msg);
        if (statusElement) statusElement.textContent = 'Error accessing microphone. Please check permissions.';
        if (retryBtn) retryBtn.style.display = 'inline-block';
    }

    function showError(text) {
        if (!errorBox) return;
        errorBox.textContent = text;
        errorBox.style.display = 'block';
    }

    function hideError() {
        if (!errorBox) return;
        errorBox.style.display = 'none';
        if (retryBtn) retryBtn.style.display = 'none';
    }
    
    // Update the peak meter position
    function updatePeakMeter(db) {
        const minDb = -100;
        const maxDb = 0;
        let level = ((db - minDb) / (maxDb - minDb)) * 100;
        level = Math.min(Math.max(level, 0), 100);
        
        peakMeter.style.display = 'block';
        peakMeter.style.top = `${100 - level}%`;
    }
    
    // Simulate VU meter for testing or when microphone is not available
    function simulateVuMeter() {
        // Generate a more realistic random level
        const baseLevel = 10 + Math.random() * 20; // Base noise level
        const peak = Math.random() < 0.1 ? Math.random() * 60 : 0; // Occasional peaks
        const level = Math.min(baseLevel + peak, 100);
        
        // Update VU meter
        vuMeter.style.transform = `scaleY(${level / 100})`;
        
        // Simulate dB value
        const db = -60 + (level / 100 * 60);
        dbValueElement.textContent = `${db.toFixed(1)} dB`;
        
        // Update peak randomly
        if (Math.random() < 0.05) {
            updatePeakMeter(db);
            if (peakTimer) clearTimeout(peakTimer);
            peakTimer = setTimeout(() => {
                peakMeter.style.display = 'none';
            }, 1000);
        }
        
        // Continue simulation
        rafId = requestAnimationFrame(simulateVuMeter);
    }
    
    // Ensure 7-band UI is rendered on load
    createBandsUI();
    // Populate device list on load
    initDevices();

    // Event Listeners
    startBtn.addEventListener('click', toggleMeter);
    if (refreshBtn) refreshBtn.addEventListener('click', initDevices);
    if (retryBtn) retryBtn.addEventListener('click', () => {
        hideError();
        if (isRunning) {
            toggleMeter();
        } else {
            startMeter().catch(handleError);
        }
    });
    if (navigator.mediaDevices && 'ondevicechange' in navigator.mediaDevices) {
        navigator.mediaDevices.ondevicechange = () => initDevices();
    }
    
    // Clean up on page unload
    window.addEventListener('beforeunload', () => {
        if (isRunning) {
            stopMeter();
        }
        stopTone();
    });
    
    // Initialize with meter stopped (null-safe)
    if (vuMeter) vuMeter.style.transform = 'scaleY(0)';
    if (peakMeter) peakMeter.style.display = 'none';
    
    // White noise test controls
    const whiteNoiseBtn = document.getElementById('whiteNoiseBtn');
    const stopNoiseBtn = document.getElementById('stopNoiseBtn');
    
    if (whiteNoiseBtn) whiteNoiseBtn.addEventListener('click', () => {
        startWhiteNoise();
        whiteNoiseBtn.style.display = 'none';
        if (stopNoiseBtn) stopNoiseBtn.style.display = 'inline-block';
    });
    
    if (stopNoiseBtn) stopNoiseBtn.addEventListener('click', () => {
        stopWhiteNoise();
        stopNoiseBtn.style.display = 'none';
        if (whiteNoiseBtn) whiteNoiseBtn.style.display = 'inline-block';
    });

    // -----------------------------
    // Tone generator controls
    // -----------------------------
    const toneSlider = document.getElementById('toneSlider');
    const toneFreqLabel = document.getElementById('toneFreq');
    const toneToggle = document.getElementById('toneToggle');

    const TONE_MIN = 20;
    const TONE_MAX = 20000;
    const LOG_MIN = Math.log(TONE_MIN);
    const LOG_MAX = Math.log(TONE_MAX);

    function sliderToFreq(val) {
        // Slider now uses normalized 0..1; map to frequency logarithmically
        const t = Math.max(0, Math.min(1, Number(val)));
        const f = Math.exp(LOG_MIN + (LOG_MAX - LOG_MIN) * t);
        return Math.max(TONE_MIN, Math.min(TONE_MAX, f));
    }

    function freqToSlider(freq) {
        // Inverse mapping: frequency (20..20000) to normalized 0..1
        const f = Math.max(TONE_MIN, Math.min(TONE_MAX, Number(freq)));
        const t = (Math.log(f) - LOG_MIN) / (LOG_MAX - LOG_MIN);
        return Math.max(0, Math.min(1, t));
    }

    // Precompute snap targets progressively:
    // - 100 Hz steps from 100 Hz to 10,000 Hz (inclusive)
    // - 1 kHz steps from 11,000 Hz to 20,000 Hz (inclusive)
    // Include a few common lows below 100 Hz for convenience
    const SNAP_TARGETS = (() => {
        const targets = new Set([20, 25, 31.5, 40, 50, 63, 80]);
        for (let v = 100; v <= 10000; v += 100) targets.add(v);
        for (let v = 11000; v <= 20000; v += 1000) targets.add(v);
        return Array.from(targets).filter(v => v >= TONE_MIN && v <= TONE_MAX).sort((a,b) => a-b);
    })();

    function snapFrequency(freq) {
        const f = Math.max(TONE_MIN, Math.min(TONE_MAX, Number(freq)));
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

    function ensureAudioContext() {
        if (!audioContext) {
            audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        return audioContext;
    }

    function bandColorForFreq(freq) {
        // Find the first band (excluding total) whose range includes freq
        const band = bandDefs.find(b => b.key !== 'total' && freq >= b.f1 && freq <= b.f2);
        if (band && band.color) return band.color;
        const total = bandDefs.find(b => b.key === 'total');
        return (total && total.color) ? total.color : '#808080';
    }

    function updateToneUI(freq) {
        // Update label text
        if (toneFreqLabel) toneFreqLabel.textContent = `${Math.round(freq)} Hz`;
        // Update slider accent color to reflect band color
        if (toneSlider) {
            const color = bandColorForFreq(freq);
            toneSlider.style.setProperty('--tone-color', color);
        }
    }

    function startTone() {
        if (toneOn) return;
        const ctx = ensureAudioContext();
        if (ctx.state === 'suspended') {
            ctx.resume().catch(() => {});
        }
        toneOsc = ctx.createOscillator();
        toneGain = ctx.createGain();
        toneOsc.type = 'sine';
        toneOsc.frequency.value = toneFreqHz;
        // start silent and ramp up
        const now = ctx.currentTime;
        toneGain.gain.cancelScheduledValues(now);
        toneGain.gain.setValueAtTime(0, now);
        toneOsc.connect(toneGain);
        toneGain.connect(ctx.destination);
        toneOsc.start();
        // Smooth ramp to target gain
        toneGain.gain.linearRampToValueAtTime(TONE_TARGET_GAIN, now + TONE_RAMP_UP_MS / 1000);
        toneOn = true;
        if (toneToggle) toneToggle.textContent = '🔊';
    }

    function stopTone() {
        if (!toneOn) return;
        const ctx = ensureAudioContext();
        const now = ctx.currentTime;
        if (toneGain) {
            // ramp down smoothly to zero
            try {
                toneGain.gain.cancelScheduledValues(now);
                const current = toneGain.gain.value;
                toneGain.gain.setValueAtTime(current, now);
                toneGain.gain.linearRampToValueAtTime(0, now + TONE_RAMP_DOWN_MS / 1000);
            } catch (e) {}
        }
        // stop and disconnect slightly after ramp completes
        const stopAt = now + (TONE_RAMP_DOWN_MS / 1000) + 0.01;
        setTimeout(() => {
            try { if (toneOsc) toneOsc.stop(); } catch(e) {}
            try { if (toneOsc) toneOsc.disconnect(); } catch(e) {}
            try { if (toneGain) toneGain.disconnect(); } catch(e) {}
            toneOsc = null;
            toneGain = null;
        }, (TONE_RAMP_DOWN_MS + 10));
        toneOn = false;
        if (toneToggle) toneToggle.textContent = '🔈';
    }

    if (toneSlider) {
        // Initialize to EXACT 1000 Hz and set slider position accordingly
        toneFreqHz = 1000;
        toneSlider.value = String(freqToSlider(toneFreqHz));
        updateToneUI(toneFreqHz);
        toneSlider.addEventListener('input', () => {
            let f = sliderToFreq(toneSlider.value);
            const snapped = snapFrequency(f);
            if (snapped !== f) {
                // update slider to exact snapped position to make it sticky
                toneSlider.value = String(freqToSlider(snapped));
                f = snapped;
            }
            toneFreqHz = f;
            updateToneUI(toneFreqHz);
            if (toneOn && toneOsc) {
                toneOsc.frequency.setTargetAtTime(toneFreqHz, audioContext ? audioContext.currentTime : 0, 0.01);
            }
        });
    }

    if (toneToggle) {
        toneToggle.addEventListener('click', () => {
            if (toneOn) {
                stopTone();
            } else {
                startTone();
            }
        });
    }
});
