# Modular Architecture Guide

This document outlines the complete refactored modular architecture of the Qualia-NSS application, replacing the previous monolithic `app.js` (600+ lines) and `style.css` (800+ lines) files.

## Overview

The application has been refactored from monolithic files into a modular architecture with clear separation of concerns. This improves maintainability, debugging, collaboration, testing capabilities, and performance.

## Architecture Structure

```
src/
├── js/                         # JavaScript modular architecture
│   ├── app-core.js            # Core initialization & theme management (~40 lines)
│   ├── ui-utils.js            # UI utilities & scroll effects (~50 lines)
│   ├── sidebar-manager.js     # Sidebar templates & management (~150 lines)
│   ├── module-loader.js       # Module loading & templates (~200 lines)
│   └── navigation.js          # Navigation state & routing (~120 lines)
└── styles/                    # CSS modular architecture
    ├── core.css               # Variables, fonts, typography (~70 lines)
    ├── layout.css             # Main content, sidebar, grid (~120 lines)
    ├── navigation.css         # Header, navbar, theme toggle (~180 lines)
    ├── components.css         # Buttons, forms, controls (~200 lines)
    ├── utilities.css          # Scroll effects, utilities (~50 lines)
    ├── responsive.css         # Media queries, mobile (~60 lines)
    └── modules/               # Module-specific styles
        ├── module-content.css # Common module styles (~10 lines)
        └── speakers-spl.css   # SPL module styles (~80 lines)
```

## JavaScript Module Responsibilities

### 1. **app-core.js** - Core Application
**Purpose**: Application initialization and theme management
- Early global stubs to prevent onclick errors
- DOMContentLoaded event wrapper
- Theme toggle functionality (light/dark)
- Theme persistence via localStorage

**Key Functions**: 
- `applySavedTheme()`, `toggleTheme()`

### 2. **ui-utils.js** - UI Utilities
**Purpose**: Common UI utilities and visual effects
- Scroll fade functionality for sidebars
- Sidebar show/hide utilities
- Workflow item click handlers
- General UI helper functions

**Key Functions**: 
- `initializeScrollFade()`, `showSidebar()`, `hideSidebar()`

### 3. **sidebar-manager.js** - Sidebar Management
**Purpose**: Manages all sidebar content and templates
- HTML templates for all module sidebars
- Sidebar content for: speakers-spl, filters, cabinets, tests, spectrogram
- Provides `window.sidebarHTML` global object

**Key Data**: 
- `sidebarHTML` object with module-specific templates

### 4. **module-loader.js** - Module Loading
**Purpose**: Handles dynamic module loading and main content
- HTML templates for all module main content areas
- Dynamic script loading and module instantiation
- Module lifecycle management (load/destroy)
- Special case handling (e.g., spectrogram.js vs index.js)

**Key Functions**: 
- `loadModule()`, module HTML templates, script loading logic

### 5. **navigation.js** - Navigation Management
**Purpose**: Navigation state and routing
- Active navigation state management
- Module-to-navbar mapping
- Welcome page functionality
- Module navigation functions
- Auto-restore last opened module

**Key Functions**: 
- `setActiveNav()`, `showWelcome()`, `loadModule*()` functions

## CSS Module Responsibilities

### 1. **core.css** - Foundation Styles
**Purpose**: CSS variables, fonts, typography, and base elements
- CSS custom properties (theme variables)
- Google Fonts imports
- Body, typography (h1-h6, p, a)
- Footer styling

**Key Features**: 
- Light/dark theme variables
- Responsive typography scale
- Theme transition effects

### 2. **layout.css** - Layout System
**Purpose**: Main content area, sidebar, and grid layouts
- Content wrapper and main content
- Sidebar structure and styling
- Sidebar sections and headers
- Home page layouts

**Key Features**: 
- Flexbox-based layouts
- Sidebar responsive behavior
- Hidden scrollbars
- Home page specific styles

### 3. **navigation.css** - Navigation System
**Purpose**: Header, navbar, logo, and theme toggle
- Header and main navbar
- Logo and branding
- Navigation items and states
- Theme toggle button
- Bootstrap navbar integration

**Key Features**: 
- Sticky header behavior
- Active state management
- Theme-aware icon colors
- Horizontal-only navbar (no stacking)

### 4. **components.css** - UI Components
**Purpose**: Buttons, forms, controls, and interactive elements
- Control groups and labels
- Sidebar buttons (all variants)
- Primary/secondary buttons
- Workflow items
- FFT display components
- Form controls and inputs

**Key Features**: 
- Consistent button styling
- Interactive hover states
- Form element theming
- Status indicators

### 5. **utilities.css** - Helper Classes
**Purpose**: Scroll effects, utilities, and helper functions
- Scroll fade container system
- Hidden scrollbar utilities
- Visual effect gradients

**Key Features**: 
- Reusable scroll fade effects
- Cross-browser scrollbar hiding
- Theme-aware gradients

### 6. **responsive.css** - Media Queries
**Purpose**: Responsive design and mobile adaptations
- Mobile navbar adaptations
- Tablet and desktop breakpoints
- Component responsive behavior

**Key Features**: 
- Icon-only mobile navigation
- Flexible sidebar sizing
- Mobile-optimized layouts

### 7. **modules/** - Module-Specific Styles
**Purpose**: Styles specific to individual modules
- `module-content.css`: Common module container styles
- `speakers-spl.css`: SPL analysis module specific styles
- Additional module CSS files as needed

## Loading Order

Both JavaScript and CSS files must be loaded in specific orders to maintain dependencies.

### JavaScript Loading Order
```html
<script src="src/js/app-core.js"></script>      <!-- 1. Core initialization -->
<script src="src/js/ui-utils.js"></script>      <!-- 2. UI utilities -->
<script src="src/js/sidebar-manager.js"></script> <!-- 3. Sidebar templates -->
<script src="src/js/module-loader.js"></script>  <!-- 4. Module loading -->
<script src="src/js/navigation.js"></script>     <!-- 5. Navigation (depends on loadModule) -->
```

### CSS Loading Order
```html
<!-- Foundation first -->
<link rel="stylesheet" href="src/styles/core.css">

<!-- Structure -->
<link rel="stylesheet" href="src/styles/layout.css">
<link rel="stylesheet" href="src/styles/navigation.css">

<!-- Components -->
<link rel="stylesheet" href="src/styles/components.css">

<!-- Utilities and responsive -->
<link rel="stylesheet" href="src/styles/utilities.css">
<link rel="stylesheet" href="src/styles/responsive.css">

<!-- Modules -->
<link rel="stylesheet" href="src/styles/modules/module-content.css">
<link rel="stylesheet" href="src/styles/modules/speakers-spl.css">
```

## Dependencies Between Modules

### JavaScript Dependencies
```
navigation.js → module-loader.js (needs window.loadModule)
module-loader.js → sidebar-manager.js (needs window.sidebarHTML)
module-loader.js → ui-utils.js (needs window.initializeScrollFade)
All modules → app-core.js (provides global stubs)
```

### CSS Dependencies
```
All modules → core.css (requires CSS variables)
layout.css → core.css (uses theme variables)
navigation.css → core.css (uses theme variables)
components.css → core.css (uses theme variables)
utilities.css → core.css (uses theme variables)
responsive.css → layout.css, navigation.css (overrides breakpoints)
modules/*.css → core.css (uses theme variables)
```

## Benefits of Modular Architecture

1. **Maintainability** - Each file has a single, clear responsibility
2. **Debugging** - Issues are easier to locate within specific modules
3. **Collaboration** - Multiple developers can work on different aspects simultaneously
4. **Testing** - Individual components can be unit tested in isolation
5. **Performance** - Better caching, potential lazy loading, HTTP/2 optimization
6. **Code Reuse** - Components can be imported by other parts of the application
7. **Organization** - Clear separation between layout, components, themes
8. **Scalability** - Easy to add new modules without affecting existing code

## Development Guidelines

### Adding New Modules
1. **JavaScript**: Add HTML template to `sidebar-manager.js` and `module-loader.js`
2. **CSS**: Create new file in `src/styles/modules/` following naming convention
3. **Navigation**: Add mapping in `navigation.js` and update navbar HTML
4. **Integration**: Add `<link>` and `<script>` tags in correct order in `index.html`
5. **Dependencies**: Use theme variables from `core.css`, follow existing patterns

### Modifying Existing Modules
**JavaScript**:
- **Theme changes**: Edit `app-core.js`
- **Sidebar content**: Edit `sidebar-manager.js`
- **Main content**: Edit `module-loader.js`
- **Navigation**: Edit `navigation.js`
- **UI effects**: Edit `ui-utils.js`

**CSS**:
- **Theme/Variables**: Edit `core.css`
- **Layout structure**: Edit `layout.css` 
- **Navigation/Header**: Edit `navigation.css`
- **UI components**: Edit `components.css`
- **Responsive behavior**: Edit `responsive.css`
- **Module-specific**: Edit appropriate module file

### Code Organization Patterns
- **JavaScript**: Use consistent function naming, global namespace management
- **CSS**: Use CSS custom properties, BEM-like naming, consistent indentation
- **Dependencies**: Maintain loading order, verify all dependencies
- **Comments**: Comment major sections clearly in both JS and CSS

## Safe Development

- Follow existing safe development workflows
- Create backups before major changes: `cp app.js app.js_bckp`, `cp style.css style.css_bckp`
- Test loading order dependencies
- Verify all global functions are properly exposed
- Test theme switching works across all modules
- Check responsive behavior on different screen sizes

## Migration Notes

### From Monolithic to Modular
**JavaScript**:
1. **Current**: `<script src="app.js"></script>`
2. **Modular**: 5 separate script tags as shown in Loading Order

**CSS**:
1. **Current**: `<link rel="stylesheet" href="style.css">`
2. **Modular**: 8 separate link tags as shown in Loading Order

The modular versions provide identical functionality with improved structure and organization.

## Browser Compatibility

- **JavaScript**: ES5+ compatibility, uses modern DOM APIs
- **CSS**: Uses CSS custom properties (IE 11+ support), Flexbox, CSS Grid
- **Fallbacks**: Graceful degradation for older browsers
- **Progressive Enhancement**: Core functionality works, enhanced features layer on

## Performance Considerations

### Loading
- **HTTP/2**: Multiple small files load efficiently
- **Caching**: Better granular cache invalidation
- **Conditional Loading**: Potential to load only needed modules
- **Total Size**: Equivalent to original monolithic files

### Runtime
- **JavaScript**: No performance impact vs monolithic approach
- **CSS**: Maintained existing specificity hierarchy and rendering performance
- **Memory**: Similar memory footprint with better organization

## Future Enhancements

### JavaScript
- **ES6 Modules**: Convert to ES6 import/export when browser support allows
- **Lazy Loading**: Load modules on-demand rather than all templates upfront
- **TypeScript**: Add type safety for better development experience
- **Testing Framework**: Unit tests for individual modules

### CSS
- **CSS Modules**: Consider CSS-in-JS for component isolation
- **PostCSS**: Add build-time processing for optimization
- **CSS Variables**: Expand theme system with more granular controls
- **Critical CSS**: Inline above-the-fold styles for performance

### Combined
- **Build Process**: Potential bundling for production optimization
- **Component Library**: Extract reusable components across JS/CSS
- **Design System**: Formalize component patterns and guidelines
- **Automated Testing**: Integration tests for the complete modular system