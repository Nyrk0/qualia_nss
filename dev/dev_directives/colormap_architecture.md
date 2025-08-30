# Colormap Architecture Guidelines

## Overview

This document establishes the architectural separation between **module colormaps** and **component colormaps** in the Qualia-NSS codebase to ensure consistency and prevent implementation confusion.

## Architecture Principles

### 1. **Two-Tier Colormap System**

**Module Colormaps** (Tier 1):
- Control visualization appearance (spectrogram, charts, graphs)
- User-selectable via UI controls
- Module-specific implementations
- Examples: Chrome Music Lab, Inferno, Viridis, Turbo

**Component Colormaps** (Tier 2):
- Control UI component colors (sliders, buttons, indicators)
- Built into components themselves
- Independent of module context
- Examples: Tone-control frequency-based colors

### 2. **Independence Principle**

> **CRITICAL RULE**: Module colormaps and component colormaps MUST remain completely separate systems.

**❌ Wrong Approach:**
```javascript
// DON'T: Module setting component colors
spectrogramModule.setToneControlColormap('turbo');

// DON'T: Component affecting module colors  
toneControl.colorForFrequency = spectrogramColorFunction;
```

**✅ Correct Approach:**
```javascript
// Module manages its own colormap
spectrogramModule.setVisualizationColormap('chrome-music-lab');

// Component manages its own colormap
toneControl.colormap = 'qualia7band'; // Built-in to component
```

## Implementation Guidelines

### Module Colormap Implementation

**For Visualization Modules:**
```javascript
class SpectrogramModule {
  constructor() {
    this.visualizationColormap = 'chrome-music-lab'; // Default
    this.availableColormaps = ['chrome-music-lab', 'inferno', 'viridis'];
  }
  
  setVisualizationColormap(colormap) {
    // Only affects visualization rendering
    this.visualizationColormap = colormap;
    this.updateVisualization();
  }
}
```

**Characteristics:**
- User-selectable via UI controls
- Affects data visualization only
- Module-specific available options
- Saved in user preferences/settings

### Component Colormap Implementation

**For UI Components:**
```javascript
class ToneControl extends HTMLElement {
  constructor() {
    this._colormap = 'qualia7band'; // Default built-in
    this.availableColormaps = ['qualia7band', 'googleturbo'];
  }
  
  set colormap(mode) {
    // Only affects component UI colors
    if (this.availableColormaps.includes(mode)) {
      this._colormap = mode;
      this._updateColor();
    }
  }
}
```

**Characteristics:**
- Built into component implementation
- Limited, curated color options
- Consistent across all module contexts
- Global user preference (future OAuth integration)

## Current Implementations

### ✅ Correct Examples

**Spectrogram Module:**
- **Module Colormap**: Chrome Music Lab (default), user can select Inferno, etc.
- **Component Colormap**: Tone-control uses built-in Qualia 7band colormap
- **Separation**: Module visualization colors ≠ tone control colors

**7band-level-meter Module:**
- **Module Colormap**: Uses band-specific visualization colors
- **Component Colormap**: Tone-control uses same built-in colormaps as everywhere else
- **Separation**: Band meter colors ≠ tone control colors

### ❌ Anti-Patterns to Avoid

```javascript
// WRONG: Module injecting colors into component
toneControl.colorForFrequency = (freq) => spectrogramModule.getColor(freq);

// WRONG: Component affecting module visualization  
spectrogramModule.colormap = toneControl.colormap;

// WRONG: Mixing colormap systems
const mixedColor = combineColors(moduleColor, componentColor);
```

## Future Development Rules

### Adding New Module Colormaps

1. **Create module-specific colormap system**
2. **Add user selection UI in module sidebar**
3. **Never inject module colors into components**
4. **Document available colormap options**

### Adding New Component Colormaps

1. **Add colormap to component's built-in options**
2. **Implement in component class, not externally**
3. **Ensure colormap works in all module contexts**
4. **Plan for global user preference storage**

### OAuth/Settings Integration Pattern

```javascript
// Future pattern for user settings
class UserSettings {
  constructor() {
    this.componentColormaps = {
      'tone-control': 'qualia7band', // Global component preference
      'level-meter': 'qualia7band'
    };
    this.moduleColormaps = {
      'spectrogram': 'chrome-music-lab', // Per-module preference
      '7band-meter': 'band-colors'
    };
  }
}
```

## Development Checklist

When working with colormaps:

- [ ] **Identify the scope**: Is this a module visualization or component UI?
- [ ] **Choose correct tier**: Module colormap or component colormap?
- [ ] **Maintain independence**: No cross-contamination between tiers
- [ ] **Follow existing patterns**: Use established implementation approaches
- [ ] **Document new colormaps**: Update this architecture guide
- [ ] **Test in multiple contexts**: Ensure component colormaps work across modules

## Error Prevention

**Before implementing colormap changes:**
1. **Read this document** to understand the architecture
2. **Identify which tier** your change affects
3. **Follow the correct implementation pattern**
4. **Test independence** - module changes shouldn't affect components
5. **Update documentation** if adding new colormap options

## References

- **Qualia 7band Colormap**: `modules/7band-level-meter/script.js` (bandDefs)
- **Google Turbo Colormap**: `src/7band-levelmeter/7band-level-meter.js` (turboAnchors)
- **Chrome Music Lab**: Spectrogram module implementation
- **Component Implementation**: `lib/components/tone-control/tone-control.js`

---

**Remember**: Colormaps are either for **visualization** (modules) or **UI components**, never both. Keep them separate!