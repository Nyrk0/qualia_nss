# Architecture Overview 🏗️

This document provides a comprehensive overview of the Qualia-NSS application architecture, designed for developers who want to understand, extend, or contribute to the project.

## 🎯 Design Philosophy

Qualia-NSS is built on these core principles:

1. **Pure Web Technologies**: No build process, npm, or external dependencies beyond CDN libraries
2. **Modular Architecture**: Self-contained modules with clear interfaces  
3. **Progressive Enhancement**: Graceful degradation for older browsers
4. **Educational Focus**: Code should be readable and well-documented
5. **Performance First**: Efficient algorithms and minimal resource usage

## 🏛️ High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     index.html (Entry Point)                │
├─────────────────────────────────────────────────────────────┤
│  Bootstrap CSS/JS  │  Chart.js  │  Marked.js  │  Custom CSS │
├─────────────────────────────────────────────────────────────┤
│                    Core JavaScript Modules                  │
│  app-core.js → ui-utils.js → sidebar-manager.js →          │
│  module-loader.js → navigation.js                           │
├─────────────────────────────────────────────────────────────┤
│                     Feature Modules                         │
│  speakers-spl/  │  filters/  │  cabinets/  │  7band/  │     │
│  spectrogram/   │   wiki/    │            │         │     │
├─────────────────────────────────────────────────────────────┤
│                   Web Audio API Layer                       │
│  getUserMedia()  │  AudioContext  │  AnalyserNode  │  FFT   │
├─────────────────────────────────────────────────────────────┤
│                 Browser Platform Services                   │
│  WebGL │  Canvas 2D │  File API │  Local Storage │  Fetch  │
└─────────────────────────────────────────────────────────────┘
```

## 📁 Directory Structure

```
qualia_nss/
├── index.html                 # Main application entry point
├── style.css                  # Global styles (being phased out)
├── assets/                    # Static assets (images, icons, data)
│   ├── src/
│   └── data/
├── src/                      # Core application source
│   ├── js/                   # Core JavaScript modules
│   │   ├── app-core.js       # Application initialization
│   │   ├── ui-utils.js       # UI utilities and effects
│   │   ├── sidebar-manager.js # Module sidebar templates
│   │   ├── module-loader.js  # Dynamic module loading
│   │   └── navigation.js     # Navigation and routing
│   ├── styles/               # Modular CSS architecture
│   │   ├── core.css          # CSS variables and theme system
│   │   ├── layout.css        # Layout and grid systems
│   │   ├── navigation.css    # Header and navbar styles
│   │   ├── components.css    # UI components and forms\n│   │   ├── utilities.css     # Helper classes\n│   │   ├── responsive.css    # Media queries\n│   │   └── modules/          # Module-specific styles\n│   ├── components/           # Reusable web components\n│   │   └── tone-control/     # Frequency slider component\n│   ├── core/                 # ES6 core modules (Phase 1-2)\n│   │   ├── config.js         # Application configuration\n│   │   ├── theme-manager.js  # Theme system\n│   │   └── component-registry.js # Component loading\n│   ├── utils/                # Utility modules\n│   │   └── mobile-detection.js # Device detection\n│   ├── 7band-levelmeter/     # Real-time level meter module\n│   ├── spectrogram/          # 3D WebGL spectrogram module\n│   └── wiki/                 # Documentation module\n└── dev/                      # Development resources\n    ├── st05-repo-wiki/       # Wiki implementation docs\n    └── todos/                # Project planning documents\n```

## ⚙️ Core Module System

### Loading Order (Critical)\n\nThe core JavaScript modules must load in this exact order due to dependencies:\n\n```javascript\n// 1. Application initialization and global stubs\napp-core.js          // Theme management, early function stubs\n\n// 2. UI utilities and effects  \nui-utils.js          // Scroll effects, UI helpers\n\n// 3. Module infrastructure\nsidebar-manager.js   // Sidebar HTML templates for each module\nmodule-loader.js     # Module loading logic and templates\nnavigation.js        # Navigation state and module routing\n```\n\n### Module Lifecycle\n\nEach feature module follows this pattern:\n\n```javascript\nclass ModuleNameModule {\n    constructor() {\n        // Initialize module state\n    }\n    \n    async init() {\n        // Set up UI, event listeners, load data\n        // Return promise for async operations\n    }\n    \n    destroy() {\n        // Clean up resources, remove event listeners\n        // Called when switching to another module\n    }\n}\n\n// Global exposure required for module loader\nwindow.ModuleNameModule = ModuleNameModule;\n```\n\n### Module Registration\n\nModules are registered in three places:\n\n1. **HTML Template** (`module-loader.js`):\n```javascript\nconst moduleHTML = {\n    'module-name': `<div class=\"module-content\">...</div>`\n};\n```\n\n2. **Sidebar Template** (`sidebar-manager.js`):\n```javascript\nconst sidebarHTML = {\n    'module-name': `<div class=\"sidebar-content\">...</div>`  \n};\n```\n\n3. **Navigation Function** (`navigation.js`):\n```javascript\nwindow.loadModuleName = () => window.loadModule('module-name');\n```\n\n## 🎨 CSS Architecture\n\n### Modular CSS System\n\nThe CSS is organized as a dependency chain:\n\n```css\n/* 1. Foundation - CSS variables and theme system */\ncore.css            /* Required by all other CSS files */\n\n/* 2. Structure - Layout and major components */\nlayout.css          /* Main content areas, sidebar */\nnavigation.css      /* Header, navbar, navigation */\ncomponents.css      /* Buttons, forms, UI elements */\n\n/* 3. Enhancement - Utilities and responsive design */\nutilities.css       /* Helper classes, effects */\nresponsive.css      /* Media queries, mobile adaptations */\n\n/* 4. Modules - Module-specific styles */\nmodules/module-content.css    /* Base module styling */\nmodules/speakers-spl.css      /* Speakers module */\nmodules/wiki.css              /* Documentation module */\n```\n\n### Theme System\n\nBased on CSS custom properties with automatic light/dark switching:\n\n```css\n:root {\n    /* Dark theme (default) */\n    --bg-color: #1a1a1a;\n    --text-color: #e0e0e0;\n    --primary-color: #00aaff;\n}\n\nbody.light-theme {\n    /* Light theme overrides */\n    --bg-color: #ffffff;\n    --text-color: #333333;\n    --primary-color: #0088cc;\n}\n```\n\n## 🔊 Audio Processing Pipeline\n\n### Web Audio API Integration\n\nAll modules use a consistent audio processing approach:\n\n```javascript\n// 1. Initialize Audio Context\nconst audioContext = new (window.AudioContext || window.webkitAudioContext)();\n\n// 2. Get user media (microphone)\nconst stream = await navigator.mediaDevices.getUserMedia({ audio: true });\nconst source = audioContext.createMediaStreamSource(stream);\n\n// 3. Create analyzer node\nconst analyser = audioContext.createAnalyser();\nanalyser.fftSize = 2048; // Configurable\nsource.connect(analyser);\n\n// 4. Process audio in animation loop\nfunction processAudio() {\n    const dataArray = new Float32Array(analyser.frequencyBinCount);\n    analyser.getFloatFrequencyData(dataArray);\n    \n    // Module-specific processing here\n    \n    requestAnimationFrame(processAudio);\n}\n```\n\n### Frequency Analysis\n\nStandardized frequency analysis utilities:\n\n- **FFT Size**: Configurable (512, 1024, 2048, 4096)\n- **Sample Rate**: Typically 44.1kHz or 48kHz\n- **Frequency Bins**: `frequencyBinCount = fftSize / 2`\n- **Frequency Resolution**: `sampleRate / fftSize` Hz per bin\n\n## 🧩 Component System (Phase 2)\n\n### Web Components\n\nReusable components using Web Components API:\n\n```javascript\nclass ToneControl extends HTMLElement {\n    static get observedAttributes() { \n        return ['value', 'active', 'colormap']; \n    }\n    \n    constructor() {\n        super();\n        this.attachShadow({ mode: 'open' });\n    }\n    \n    connectedCallback() {\n        // Component mounted to DOM\n    }\n    \n    attributeChangedCallback(name, oldValue, newValue) {\n        // Attribute changed\n    }\n}\n\ncustomElements.define('tone-control', ToneControl);\n```\n\n### Component Registry (ES6 Migration)\n\nCentralized component loading system:\n\n```javascript\nimport { ComponentRegistry } from '/src/core/component-registry.js';\n\nconst registry = new ComponentRegistry();\nregistry.register('tone-control', {\n    path: '/src/components/tone-control/tone-control.js',\n    dependencies: []\n});\n\n// Load component\nconst { ToneControl } = await registry.load('tone-control');\n```\n\n## 📊 Data Flow Patterns\n\n### Module Communication\n\nModules communicate through:\n\n1. **Global Events**: \n```javascript\nwindow.dispatchEvent(new CustomEvent('moduleEvent', { \n    detail: { data: 'value' } \n}));\n```\n\n2. **Shared State**:\n```javascript\nwindow.currentModule = { name: 'spectrogram', instance: moduleInstance };\n```\n\n3. **localStorage**:\n```javascript\nlocalStorage.setItem('lastModule', 'spectrogram');\n```\n\n### Audio Data Flow\n\n```\nMicrophone → getUserMedia() → MediaStreamSource → AnalyserNode → \nFloat32Array → Module Processing → Visualization/Analysis\n```\n\n## 🔧 Extension Points\n\n### Adding New Modules\n\n1. **Create Module Directory**: `src/new-module/`\n2. **Implement Module Class**: Following lifecycle pattern\n3. **Add Templates**: HTML and sidebar templates\n4. **Register Navigation**: Add to navigation.js\n5. **Add Styles**: Create module-specific CSS\n6. **Test Integration**: Ensure loading and cleanup work\n\n### Adding New Components\n\n1. **Create Component**: `src/components/component-name/`\n2. **Implement Web Component**: Using standard APIs\n3. **Register Component**: Add to component registry\n4. **Add Styles**: Scoped within shadow DOM\n5. **Document Usage**: Add examples and API docs\n\n### Extending Audio Processing\n\n1. **Create Audio Utility**: `src/utils/audio-utility.js`\n2. **Follow Web Audio Patterns**: Use standard nodes\n3. **Add Error Handling**: Graceful degradation\n4. **Performance Optimization**: Minimize GC pressure\n5. **Cross-browser Testing**: Ensure compatibility\n\n## 🚀 Performance Considerations\n\n### JavaScript Optimization\n\n- **Minimal Dependencies**: Only essential external libraries\n- **Lazy Loading**: Modules load on demand\n- **Memory Management**: Clean up audio contexts and event listeners\n- **RequestAnimationFrame**: Smooth animations and analysis\n\n### CSS Optimization\n\n- **CSS Variables**: Dynamic theming without JS\n- **Minimal Reflows**: Efficient layout changes\n- **GPU Acceleration**: Transform3d for smooth animations\n- **Mobile Optimization**: Touch-friendly controls\n\n### Audio Performance\n\n- **Efficient FFT**: Optimal buffer sizes\n- **Worker Threads**: Heavy processing off main thread (future)\n- **WebGL Acceleration**: 3D visualizations (spectrogram)\n- **Minimal Latency**: Real-time processing optimizations\n\n## 🔍 Debugging and Development\n\n### Browser Console\n\nExtensive logging for development:\n\n```javascript\nconsole.log('✓ Module loaded successfully');\nconsole.warn('⚠️ Microphone permission needed');\nconsole.error('❌ Audio context creation failed');\n```\n\n### Development Tools\n\n- **Phase 1 Test**: `/src/core/es6-test.html`\n- **Phase 2 Test**: `/src/core/phase2-test.html`  \n- **Audio Inspector**: Browser dev tools → Audio tab\n- **Performance Monitor**: Chrome DevTools → Performance\n\n---\n\n**Next Document**: [Module Development Guide](02-Module-Development.md) →\n\n*This document is part of the comprehensive Qualia-NSS developer documentation.*