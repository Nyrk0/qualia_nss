# UI/UX Development Directive

**Version:** 1.0
**Date:** 2025-08-30

## 1. Objective

This document establishes the official UI/UX development standards for the Qualia-NSS application. The purpose of this directive is to ensure that all future development maintains a consistent, minimalist, high-quality, and maintainable user experience. Adherence to these rules is mandatory for all UI-related code contributions.

## 2. Core Principle: Theme First

**All styling MUST derive from the central theme file.**

-   **Single Source of Truth:** The file `src/styles/theme.css` is the single source of truth for all design tokens (colors, fonts, spacing, etc.).
-   **No Hardcoded Values:** The use of hardcoded, literal values for colors (e.g., `#FFF`, `rgb(0,0,0)`), font sizes (e.g., `15px`), or spacing (e.g., `margin: 10px`) is strictly forbidden.

## 3. Styling Rules

### 3.1. Colors

-   Always use the color variables defined in `theme.css`.
-   **Example:**
    ```css
    /* CORRECT */
    .my-component {
      color: var(--text-color);
      background-color: var(--panel-background);
      border: 1px solid var(--border-color);
    }

    /* INCORRECT */
    .my-component {
      color: #e0e0e0;
      background-color: #1e1e1e;
    }
    ```

### 3.2. Typography & Semantic Hierarchy

-   The base font for the application is defined by `--font-family-base`. Do not introduce new font families.
-   All `font-size` declarations must use the `rem`-based variables (e.g., `--font-size-sm`, `--font-size-base`, `--font-size-lg`).
-   **HTML tags and visual styles MUST follow this hierarchy to ensure accessibility and SEO best practices:**
    -   **H1:** The largest size, for the primary page title only (e.g., "Welcome", or the loaded module's name like "Spectrogram").
    -   **H2:** A secondary heading size, to be used for sidebar titles and major section titles within the main content.
    -   **H3:** A tertiary heading size, for sidebar subtitles and corresponding subsection titles within the main content.
    -   **H4, H5, H6:** Available for deeper nesting within main content areas as needed.
    -   **Navbar Links:** Must remain as `<a>` tags for semantic correctness. Their visual weight is similar to an H2, but they are navigation elements, not headings.

### 3.3. Spacing & Layout

-   All `margin`, `padding`, `gap`, and layout-related distances must use the `--spacing-unit` variables.
-   **Example:**
    ```css
    /* CORRECT */
    .my-panel {
      padding: var(--spacing-md); /* 16px */
      margin-bottom: var(--spacing-lg); /* 32px */
    }

    /* INCORRECT */
    .my-panel {
      padding: 15px;
      margin-bottom: 30px;
    }
    ```

## 4. Component & Module Development

### 4.1. No Inline Styles

-   The `style` attribute is forbidden in HTML (`<div style="...">`). All styling information belongs in `.css` files.
-   **Rationale:** Inline styles are not reusable, cannot be themed, and have high specificity that makes maintenance difficult.

### 4.2. Prefer Reusability

-   Before writing new CSS, check existing stylesheets (`components.css`, `utilities.css`) for a class that already provides the desired functionality.

### 4.3. Module-Specific Styles

-   If a component or style is used **only** within a single module, its CSS should be placed in a stylesheet within that module's directory (e.g., `src/spectrogram/styles.css`).
-   Do not add single-use, module-specific styles to global files like `components.css` or `layout.css`.

## 5. JavaScript and Styling

-   JavaScript **must not** directly set style properties (e.g., `element.style.color = 'red';`).
-   The role of JavaScript is to manage state by toggling classes on elements. The styling associated with those classes is defined purely in CSS.
-   **Example:**
    ```javascript
    // CORRECT
    element.classList.add('is-active');
    element.classList.remove('is-disabled');

    // INCORRECT
    element.style.fontWeight = 'bold';
    element.style.opacity = '0.5';
    ```

## 6. Documentation

-   When a new, complex component is created, its HTML structure and the purpose of its CSS classes should be briefly documented in that module's `README.md` or a similar design document.

## 7. Pre-Commit Checklist for UI Changes

Before committing any code that touches the UI, verify the following:

-   [ ] **No hardcoded values:** All colors, fonts, and spacing use variables from `theme.css`.
-   [ ] **No inline styles:** The `style` attribute has not been used in any HTML.
-   [ ] **Responsive:** The component or change works as expected on both mobile and desktop viewport sizes.
-   [ ] **Theme-aware:** The component or change works correctly in both light and dark themes.
-   [ ] **Consistent:** The new UI feels like a natural part of the existing application.

---

# Web Components Standards (Integrated)

# Web Components Curation Directive

## Overview
Maintain centralized, curated web components in `/src/components/` as the single source of truth for all reusable UI components across the Qualia-NSS project.

## Directory Structure

```
/src/components/
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
1. Create component in `/src/components/[name]/`
2. Follow naming convention: `[name]-[type].js` (e.g., `tone-control.js`)
3. Add documentation in `README.md`
4. Test across multiple modules
5. Update this directive with component details

### **Updating Existing Components** 
1. **Always edit `/src/components/` version first** (source of truth)
2. Test changes thoroughly
3. Copy to any temporary `/modules/` versions if needed
4. Remove temporary copies after integration

### **Integration Pattern**
```html
<!-- In module HTML files -->
<script src="../../src/components/tone-control/tone-control.js"></script>

<!-- In main index.html (for global availability) -->
<script src="src/components/tone-control/tone-control.js"></script>
```

## Current Components Inventory

### **tone-control** ✅ **CURATED**
- **Location**: `/src/components/tone-control/tone-control.js`
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
- Edit components in `/src/components/` only
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