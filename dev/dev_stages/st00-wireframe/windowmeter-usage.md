# WindowMeter Module Usage

## Overview
WindowMeter is a debugging tool that shows real-time dimensions of DOM elements in a hierarchical chain, perfect for diagnosing resize issues in responsive web applications.

## Features
- **Real-time monitoring** of 10 element levels (Canvas → Window)
- **Change detection** with before/after values
- **PNG snapshot** capability for documentation
- **Flexible integration** into any sidebar or container
- **Chart.js aware** - automatically detects Chart.js instances

## Quick Start

### 1. Include the module
```html
<script src="dev/st00-wireframe/windowmeter-module.js"></script>
```

### 2. Basic usage
```javascript
// Create and initialize
const windowMeter = new WindowMeter();
windowMeter.init('#sidebar'); // Inject into sidebar

// Later, cleanup when done
windowMeter.destroy();
```

### 3. Custom container
```javascript
// Inject into any container
const wm = new WindowMeter();
wm.init('.debug-panel'); // Custom selector
```

## Integration Examples

### In a module's init() method:
```javascript
class MyModule {
  init() {
    // Your module initialization...
    
    // Add WindowMeter for debugging
    if (window.location.search.includes('debug')) {
      this.windowMeter = new WindowMeter();
      this.windowMeter.init('#sidebar');
    }
  }
  
  destroy() {
    if (this.windowMeter) {
      this.windowMeter.destroy();
    }
  }
}
```

### As a global debug tool:
```javascript
// Add to app.js for global access
window.enableWindowMeter = () => {
  if (!window._windowMeter) {
    window._windowMeter = new WindowMeter();
    window._windowMeter.init('#sidebar');
  }
};

window.disableWindowMeter = () => {
  if (window._windowMeter) {
    window._windowMeter.destroy();
    window._windowMeter = null;
  }
};

// Usage in console:
// enableWindowMeter()  - turn on
// disableWindowMeter() - turn off
```

## Element Detection

The WindowMeter automatically detects elements using flexible selectors:

| Level | Primary Selector | Fallback Selector |
|-------|-----------------|-------------------|
| Canvas | `#spl-chart` | `canvas` |
| Container | `.spl-chart-container` | `.chart-container` |
| Section | `.spl-chart-section` | `.chart-section` |
| Grid | `.spl-main-grid` | `.main-grid` |
| Viewer | `.spl-viewer` | `.viewer` |
| Module | `.module-content` | - |
| Main | `#main-content` | - |
| Wrapper | `#content-wrapper` | - |
| Window | `window` | - |
| Chart.js | Auto-detected | Multiple strategies |

## Chart.js Detection

WindowMeter uses multiple strategies to find Chart.js instances:

1. `window.Chart?.instances?.[0]` - Chart.js global registry
2. `window.speakersChart` - Named instance
3. `window.currentChart` - Generic current instance
4. `window.Chart.instances` - Instance collection

## Snapshot Feature

Click "📸 Snapshot PNG" to generate a downloadable image with:
- Current timestamp
- All element dimensions
- Status and change information
- Clean monospace formatting

## Styling

WindowMeter uses CSS variables for theming:
- `--bs-border-color` - Table borders
- `--bs-secondary-bg` - Status panel background  
- `--bs-primary` - Button color
- Font: `monospace` for precise alignment

## Debugging Tips

### Common Issues:
1. **All zeros**: Elements not found - check selectors
2. **No Chart.js data**: Chart instance not detected - add to global scope
3. **No updates**: Timer not running - check console for errors

### Best Practices:
1. **Enable conditionally**: Only in debug mode
2. **Always cleanup**: Call `destroy()` when done
3. **Take snapshots**: Document problematic states
4. **Monitor console**: Check for detection messages

## File Structure
```
dev/st00-wireframe/
├── windowmeter-module.js    # Main module
├── windowmeter-usage.md     # This documentation
└── APP_SHELL_WIREFRAME.md   # Architecture notes
```

---

*WindowMeter helped solve the Chart.js Retina resize issues by revealing the 2x pixel scaling mystery! 🔍*