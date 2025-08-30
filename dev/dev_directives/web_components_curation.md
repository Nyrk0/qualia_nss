# Web Components Curation Directive

## Overview
Maintain centralized, curated web components in `/lib/components/` as the single source of truth for all reusable UI components across the Qualia-NSS project.

## Directory Structure

```
/lib/components/
├── tone-control/
│   ├── tone-control.js          # ✅ Source component (vanilla JS)
│   ├── README.md               # Usage documentation  
│   └── examples/               # Usage examples
├── [future-component]/
│   ├── [component].js
│   ├── README.md
│   └── examples/
```

## Component Standards

### 1. **Vanilla JavaScript Only**
- ❌ No ES6 modules/imports in components
- ✅ Use `customElements.define()` for registration
- ✅ Self-contained with all dependencies included

### 2. **Shadow DOM Architecture**
```javascript
class ComponentName extends HTMLElement {
  constructor() {
    super();
    this.attachShadow({ mode: 'open' });
    this.shadowRoot.appendChild(TEMPLATE.content.cloneNode(true));
  }
}
```

### 3. **CSS Isolation**
- ✅ All styles in component's `<style>` tag
- ✅ Use CSS custom properties for theming
- ✅ Avoid global style dependencies

### 4. **Color Management**
- ✅ Frequency-based colors: Apply only to interactive elements (sliders, buttons)
- ✅ Text labels: Keep default theme colors (`color: inherit`)
- ✅ Use `colorForFrequency` callback pattern for dynamic coloring

## Curation Workflow

### **Adding New Components**
1. Create component in `/lib/components/[name]/`
2. Follow naming convention: `[name]-[type].js` (e.g., `tone-control.js`)
3. Add documentation in `README.md`
4. Test across multiple modules
5. Update this directive with component details

### **Updating Existing Components** 
1. **Always edit `/lib/components/` version first** (source of truth)
2. Test changes thoroughly
3. Copy to any temporary `/modules/` versions if needed
4. Remove temporary copies after integration

### **Integration Pattern**
```html
<!-- In module HTML files -->
<script src="../../lib/components/tone-control/tone-control.js"></script>

<!-- In main index.html (for global availability) -->
<script src="lib/components/tone-control/tone-control.js"></script>
```

## Current Components Inventory

### **tone-control** ✅ **CURATED**
- **Location**: `/lib/components/tone-control/tone-control.js`
- **Status**: Production ready with all fixes applied
- **Features**: 
  - ✅ Fixed slider background artifacts
  - ✅ Frequency-based slider thumb coloring
  - ✅ Text labels maintain theme colors
  - ✅ Logarithmic 20Hz-20kHz frequency mapping
  - ✅ Event-based communication (`frequencychange`, `toggle`)
- **Used in**: 7band-levelmeter, spectrogram (planned)
- **Integration**: Loaded globally in `index.html`

## Development Rules

### **DO**
- Edit components in `/lib/components/` only
- Test across all consuming modules before committing
- Document all public APIs and events
- Use semantic versioning comments for major changes
- Keep components framework-agnostic

### **DON'T**
- Create duplicate versions in `/modules/` or other locations
- Use ES6 imports/exports within components
- Depend on external CSS frameworks within components
- Change component APIs without updating all consumers

## Integration Testing

Before releasing component updates:

1. **Test in 7band-levelmeter**: Verify colormap integration
2. **Test in spectrogram**: Verify 3D visualization compatibility
3. **Test theming**: Check light/dark theme compatibility
4. **Test responsive**: Verify behavior across screen sizes
5. **Browser compatibility**: Test Chrome, Firefox, Safari

## Future Components Pipeline

- `frequency-analyzer` - Real-time FFT analysis component
- `level-meter` - Individual band level meter
- `waveform-display` - Time-domain waveform visualization
- `eq-band` - Individual EQ band control

## Maintenance Schedule

- **Monthly**: Review component usage across modules
- **Per release**: Validate all components work with latest changes
- **As needed**: Update components based on user feedback

---

**Last Updated**: 2025-01-21  
**Maintained by**: Qualia-NSS Development Team  
**Status**: Active Directive