# 03.2: Specialized Colormap Architecture

**Version:** 1.0
**Date:** 2025-09-01
**Status:** ACTIVE

## 1. Overview

This document establishes the architectural separation between **module colormaps** and **component colormaps** in the Qualia-NSS codebase to ensure consistency and prevent implementation confusion.

## 2. Architecture Principles

### 2.1. Two-Tier Colormap System

**Module Colormaps (Tier 1):**
*   Control visualization appearance (spectrogram, charts, graphs).
*   Are user-selectable via UI controls.
*   Have module-specific implementations.
*   Examples: Chrome Music Lab, Inferno, Viridis, Turbo.

**Component Colormaps (Tier 2):**
*   Control UI component colors (sliders, buttons, indicators).
*   Are built into the components themselves.
*   Are independent of the module context.
*   Example: The `qualia7band` colormap for the tone-control.

### 2.2. Independence Principle

> **CRITICAL RULE**: Module colormaps and component colormaps MUST remain completely separate systems.

**A module's visualization colormap must never affect the color of a UI component, and a component's colormap must never affect a module's data visualization.**

---

## 3. Implementation Guidelines

### Module Colormap Implementation
*   Managed within the visualization module's class.
*   Affects data visualization only.
*   Options are specific to the module and saved in user preferences.

```javascript
// For Visualization Modules
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

### Component Colormap Implementation
*   Built directly into the component's implementation.
*   Has a limited, curated set of color options.
*   Is consistent across all module contexts.

```javascript
// For UI Components
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

---

## 4. Development Checklist

When working with colormaps:

*   [ ] **Identify the scope**: Is this a module visualization or a UI component?
*   [ ] **Choose the correct tier**: Module colormap or component colormap?
*   [ ] **Maintain independence**: Ensure no cross-contamination between the two tiers.
*   [ ] **Follow existing patterns**: Use the implementation approaches shown above.
*   [ ] **Test in multiple contexts**: Ensure component colormaps work correctly across all modules.

**Remember**: Colormaps are either for **visualization** (modules) or **UI components** (components), never both. Keep them separate.
