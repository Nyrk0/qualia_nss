# Standalone Modules - Qualia-NSS

## Overview
Standalone modules are **completely self-contained** implementations that work with the `file://` protocol for rapid prototyping, algorithm research, and isolated development.

## Key Principle: True Independence
✅ **Self-contained**: No external dependencies  
✅ **File protocol**: Works via `file://` - no server needed  
✅ **Inline components**: All dependencies embedded directly  
✅ **Vanilla JavaScript**: No ES6 imports or modules  

## Directory Structure
```
standalone-modules/
├── 7band-level-meter/        # Level meter with inline tone-control
├── spectrum-analyzer/         # Real-time spectrum analysis
├── comb-filtering/           # Acoustic comb-filter detection
└── spectrogram/              # Various spectrogram implementations
```

## Usage

### Quick Development
```bash
# Open directly in browser - no server needed
open standalone-modules/7band-level-meter/index.html
open standalone-modules/spectrum-analyzer/index.html
```

### Integration Testing
```bash
# Test components before main app integration
open standalone-modules/component-name/index.html
```

## Standalone Implementation Pattern

### ❌ **Wrong: External Dependencies**
```html
<!-- BAD: Depends on external modules -->
<script type="module" src="../../src/components/tone-control.js"></script>
```

### ✅ **Correct: Inline Self-Contained**
```html
<!-- GOOD: Everything embedded inline -->
<script>
  // Complete component implementation inline
  class StandaloneToneControl extends HTMLElement {
    // Full implementation here
  }
  customElements.define('tone-control', StandaloneToneControl);
</script>
```

## Component Inlining Strategy

### 1. **Copy Core Functionality**
Take the essential parts of components and embed them directly:
```javascript
// Simplified, inline version
class StandaloneComponent extends HTMLElement {
  constructor() {
    super();
    // Essential functionality only
  }
}
```

### 2. **Remove Complex Features**
- Remove advanced colormap logic
- Simplify event handling
- Reduce configuration options
- Keep only core functionality

### 3. **Maintain API Compatibility**
```javascript
// Same events and properties as main component
this.dispatchEvent(new CustomEvent('frequencychange', { 
  detail: { frequency: this._frequency } 
}));
```

## Development Workflow

### 1. **Prototype Phase**
- Create standalone version first
- Test functionality in isolation
- Iterate quickly with file:// protocol

### 2. **Component Development**
- Build components as standalone first
- Test all edge cases
- Validate API design

### 3. **Integration Phase**
- Move to main application (`src/components/`)
- Add ES6 exports and advanced features
- Maintain backward compatibility

## Current Standalone Modules

### **7band-level-meter** ✅
- **Status**: Complete standalone implementation
- **Features**: Inline tone-control component, 7-band visualization
- **Use**: Level meter testing and development
- **Opens**: `file://` protocol directly

### **spectrum-analyzer** ✅
- **Status**: Standalone spectrum analysis
- **Features**: Real-time FFT, frequency visualization
- **Use**: Spectrum analysis research

### **comb-filtering** ✅
- **Status**: Research implementation
- **Features**: Comb filter detection algorithms
- **Use**: Acoustic analysis research

### **spectrogram** ✅
- **Status**: Multiple implementation variants
- **Features**: Various spectrogram algorithms
- **Use**: Algorithm comparison and research

## Best Practices

### ✅ **Do**
- Keep components simple and focused
- Embed all dependencies inline
- Test with `file://` protocol
- Maintain API compatibility with main components
- Use clear, descriptive names

### ❌ **Don't**
- Reference external modules or components
- Use ES6 imports/exports
- Depend on HTTP server functionality
- Add complex build processes
- Create circular dependencies

## Testing Standalone Modules

### Manual Testing
```bash
# Open directly - should work immediately
open standalone-modules/module-name/index.html
```

### Integration Testing
1. Test standalone functionality first
2. Verify all features work in isolation
3. Check browser compatibility
4. Validate component APIs

## Migration to Main App

When moving from standalone to main application:

1. **Extract to separate file**: `src/components/component-name/`
2. **Add ES6 exports**: `export class ComponentName`
3. **Enhanced features**: Advanced theming, mobile support
4. **Maintain compatibility**: Keep same API for existing code

This approach ensures rapid development cycles while maintaining the ability to integrate into the main application architecture.