# Hybrid Development Workflow - Qualia-NSS

## Overview
Qualia-NSS uses a hybrid development approach optimizing for both modern ES6 module development and standalone prototyping capabilities.

## Development Contexts

### 🌐 **Main Application Development** 
**Environment**: Docker Desktop + HTTP Server  
**Protocol**: `http://localhost:8080/`  
**Architecture**: ES6 Modules  
**Use Cases**: Full application development, mobile theme testing, integrated features

```bash
# Docker Desktop (recommended)
docker run -d -p 8080:80 -v $(pwd):/usr/share/nginx/html nginx

# OR Python simple server
python3 -m http.server 8080

# Access: http://localhost:8080/
```

### 🧪 **Testing & Validation**
**Environment**: HTTP Server  
**Protocol**: `http://localhost:8080/tests/`  
**Architecture**: ES6 Modules + Test Framework  
**Use Cases**: Unit testing, component isolation, automated testing

```bash
# Same server as main app
# Access: http://localhost:8080/tests/
```

### ⚡ **Standalone Module Development**
**Environment**: Direct File Access  
**Protocol**: `file://`  
**Architecture**: Vanilla JavaScript  
**Location**: `/standalone-modules/`  
**Use Cases**: Quick prototyping, algorithm research, isolated experiments

```bash
# Direct file access - no server needed
open standalone-modules/7band-level-meter/index.html
open standalone-modules/comb-filtering/demo.html
```

## Directory Architecture

### **Production Structure**
```
qualia-nss/
├── src/                           # ES6 Modules (requires HTTP server)
│   ├── main.js                    # Application entry point [FUTURE]
│   ├── core/                      # Core system modules
│   │   ├── module-loader.js       # Enhanced with dynamic imports
│   │   ├── theme-manager.js       # Base theme management
│   │   └── mobile-theme-manager.js # Mobile-specific themes [FUTURE]
│   ├── utils/                     # Utility modules [FUTURE]
│   │   ├── mobile-detection.js    # Device detection
│   │   └── audio-utils.js         # Audio processing utilities
│   ├── themes/                    # Modular theme system [FUTURE]
│   │   ├── ios-theme.js           # iOS-specific styling
│   │   └── android-theme.js       # Android-specific styling
│   ├── components/                # Reusable web components
│   │   ├── registry.js            # Component registration [FUTURE]
│   │   └── tone-control/          # Enhanced with ES6 exports
│   ├── styles/                    # Modular CSS architecture
│   └── [modules]/                 # Feature modules (7band-levelmeter, spectrogram, etc.)
├── standalone-modules/            # Vanilla JS (file:// compatible)
│   ├── 7band-level-meter/         # Independent development/testing
│   ├── spectrum-analyzer/         # Isolated prototyping
│   ├── comb-filtering/            # Research modules
│   └── spectrogram/               # Algorithm experiments
├── tests/                         # Test suite (HTTP server)
│   ├── index.html                 # Test runner
│   ├── test-framework.js          # Custom testing framework
│   └── *.test.js                  # Test files
└── index.html                     # Main application entry
```

### **Development Context Usage**

#### **Main Application (`http://localhost:8080/`)**
```html
<!-- ES6 Modules - Future State -->
<script type="module" src="/src/main.js"></script>

<!-- Current Hybrid State -->
<script src="/src/js/app-core.js"></script>
<script src="/src/components/tone-control/tone-control.js"></script>
```

#### **Standalone Modules (`file://`)**
```html
<!-- Vanilla JavaScript - Self-contained -->
<script src="script.js"></script>
<script src="../../src/components/tone-control/tone-control.js"></script>
```

## Mobile Development Workflow

### **Device Detection & Themes**
```javascript
// ES6 module approach (main app)
import { MobileDetection } from '/src/utils/mobile-detection.js';

if (MobileDetection.isIOS) {
  const { IOSTheme } = await import('/src/themes/ios-theme.js');
  IOSTheme.apply();
} else if (MobileDetection.isAndroid) {
  const { AndroidTheme } = await import('/src/themes/android-theme.js');
  AndroidTheme.apply();
}
```

### **Responsive Component Loading**
```javascript
// Load mobile-optimized components
if (window.innerWidth < 768) {
  const { MobileToneControl } = await import('/src/components/mobile-tone-control/mobile-tone-control.js');
  customElements.define('tone-control', MobileToneControl);
} else {
  const { ToneControl } = await import('/src/components/tone-control/tone-control.js');
  customElements.define('tone-control', ToneControl);
}
```

## Development Patterns

### **Component Development Lifecycle**

#### **1. Prototype Phase (Standalone)**
```bash
# Create in standalone-modules for quick iteration
cd standalone-modules/new-component/
touch index.html script.js style.css

# Open directly in browser
open index.html  # file:// protocol
```

#### **2. Integration Phase (Main App)**
```bash
# Move to main application
mkdir src/components/new-component/
# Convert to ES6 exports, add to component registry
```

#### **3. Testing Phase**
```bash
# Add tests
touch tests/new-component.test.js
# Run via http://localhost:8080/tests/
```

### **Hybrid Component Pattern**
```javascript
// component.js - Works in both contexts
class ComponentName extends HTMLElement {
  constructor() {
    super();
    // Implementation
  }
}

// ES6 export for main app
export { ComponentName };

// Global registration for standalone modules
customElements.define('component-name', ComponentName);

// Backward compatibility during migration
if (typeof window !== 'undefined') {
  window.ComponentName = ComponentName;
}
```

## Migration Workflow (ES6 Modules)

### **Phase 1: Foundation (Week 1)**
```javascript
// Create new utility modules
// src/utils/mobile-detection.js
export const MobileDetection = {
  isIOS: () => /iPad|iPhone|iPod/.test(navigator.userAgent),
  isAndroid: () => /Android/.test(navigator.userAgent),
  isMobile: () => window.innerWidth < 768
};

// Maintain global compatibility
window.MobileDetection = MobileDetection;
```

### **Phase 2: Components (Week 2)**
```javascript
// Convert components to hybrid exports
// src/components/tone-control/tone-control.js
export class ToneControl extends HTMLElement { /* existing code */ }
customElements.define('tone-control', ToneControl);
window.ToneControl = ToneControl; // Temporary compatibility
```

### **Phase 3: Core Modules (Week 3)**
```javascript
// Modernize core application logic
// src/core/module-loader.js
import { MobileDetection } from '/src/utils/mobile-detection.js';

export class ModuleLoader {
  static async loadModule(name, options = {}) {
    // Enhanced with mobile support
    if (options.mobile && MobileDetection.isMobile) {
      return await import(`/src/modules/${name}/mobile-${name}.js`);
    }
    return await import(`/src/modules/${name}/${name}.js`);
  }
}
```

### **Phase 4: Pure ES6 (Week 4)**
```javascript
// src/main.js - Single entry point
import { QualiaApp } from '/src/core/app.js';
import { registerComponents } from '/src/components/registry.js';

class Application {
  async init() {
    await registerComponents();
    const app = new QualiaApp();
    await app.init();
  }
}

new Application().init();
```

## Testing Strategies

### **Unit Testing (ES6 Modules)**
```javascript
// tests/component.test.js
import { ToneControl } from '/src/components/tone-control/tone-control.js';

describe('ToneControl Component', () => {
  it('should initialize with default frequency', () => {
    const component = new ToneControl();
    expect.toEqual(component.frequency, 1000);
  });
});
```

### **Integration Testing (Hybrid)**
```javascript
// Test both global and module access
describe('Component Accessibility', () => {
  it('should be available globally', () => {
    expect.toBeTruthy(window.ToneControl);
  });
  
  it('should be importable as ES6 module', async () => {
    const { ToneControl } = await import('/src/components/tone-control/tone-control.js');
    expect.toBeTruthy(ToneControl);
  });
});
```

### **Standalone Testing (File Protocol)**
```html
<!-- standalone-modules/component/test.html -->
<!DOCTYPE html>
<html>
<head><title>Component Test</title></head>
<body>
  <component-name></component-name>
  <script src="component.js"></script>
  <script>
    // Vanilla JS testing
    console.assert(customElements.get('component-name'), 'Component registered');
  </script>
</body>
</html>
```

## Best Practices

### **Development Environment**
- ✅ **Use Docker Desktop for main development**: Consistent HTTP server environment
- ✅ **Keep standalone modules isolated**: Independent of main application changes
- ✅ **Test in both contexts**: Ensure components work in all environments
- ✅ **Use relative paths in standalone modules**: Maintain file:// compatibility

### **Code Organization**
- ✅ **Progressive enhancement**: Start vanilla, migrate to ES6
- ✅ **Backward compatibility during migration**: Gradual transition
- ✅ **Clear separation**: Main app vs. standalone vs. testing
- ✅ **Consistent naming**: Match component names across contexts

### **Mobile Development**
- ✅ **Device detection**: Use user agent and viewport detection
- ✅ **Progressive loading**: Load mobile components conditionally
- ✅ **Theme adaptation**: iOS/Android specific styling
- ✅ **Touch optimization**: Mobile-specific event handling

This hybrid approach provides the flexibility of rapid prototyping with the power of modern module architecture, optimized for Docker Desktop development and mobile-first feature enhancement.