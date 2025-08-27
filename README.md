# Qualia-NSS: Near-field Speaker Simulator

This project is a web-based audio analysis tool designed to simulate and visualize near-field speaker behavior. It provides a suite of modules for in-depth audio analysis, including spectrograms, spectrum analyzers, and psychoacoustic modeling.

## Features

*   **7-Band Psychoacoustic Analysis**: Visualize audio across 7 critical psychoacoustic bands.
*   **Spectrogram Visualization**: Analyze the frequency content of audio signals over time.
*   **Comb Filtering Detection**: Identify and analyze comb filtering artifacts.
*   **SPL Curve Analysis**: Upload and analyze Sound Pressure Level (SPL) data from various sources.

## Modules

The project is composed of several standalone and integrated modules:

*   `7band-level-meter`
*   `comb-filtering`
*   `spectrogram`
*   `spectrum-analyzer`

## Getting Started

You can run the app either via a simple HTTP server or directly from the file system.

### Option A: Serve over HTTP (recommended)
- Python: `python3 -m http.server 8080`
- Node: `npx http-server -p 8080`
- Open http://localhost:8080/

### Option B: Open via file://
- Some browsers block `fetch()` for local files (origin `null`).
- Modules in `src/` gracefully fallback by inlining their HTML fragments when `fetch` is blocked, so you can still test without a server.
- For production-like behavior, prefer Option A.

---

*This project is under active development. See the [Development Plan](DEVELOPMENT_PLAN.md) for more details.*
