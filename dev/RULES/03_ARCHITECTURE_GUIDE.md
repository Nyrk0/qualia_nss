# 03: Application Architecture Guide

**Version:** 2.0
**Date:** 2025-09-03
**Status:** ACTIVE

## 1. Overview

This document outlines the complete refactored modular architecture of the Qualia-NSS application. This architecture improves maintainability, debugging, collaboration, and performance.

### 1.1. KISS Development Methodology Integration

The architecture is built upon the **Keep It Simple Stable (KISS)** methodology documented in `dev/dev_stages/`. This approach ensures:

**Stage-Based Development Pattern:**
```
dev/dev_stages/
├── st00-wireframe/          # Foundation: UI/UX wireframes and app shell
├── st01-backend-server/     # Infrastructure: Docker backend, APIs, database
├── st02-modularization/     # Architecture: Component separation patterns
├── st03-documentation-system/ # Content: Wiki integration and documentation
├── st04-spectrogram/        # Feature: Audio visualization implementation
├── st05-mic-calibration/    # Hardware: Device interface patterns
├── st06-comb-filtering/     # Processing: Audio algorithm implementation
├── st07-psychoacoustics/    # Advanced: Psychoacoustic analysis
└── st08-pwa/               # Enhancement: Progressive web app features
```

**Core Development Principles:**
- **Small Functionality Focus**: Each stage targets specific, limited functionality
- **Iterative Refinement**: Features are revisited and enhanced across stages
- **Reference Architecture**: Stage documentation provides implementation patterns
- **Stability Checkpoints**: Each stage maintains working, testable state

**Implementation Reference System:**
- **Before implementing**: Consult relevant stage documentation for patterns
- **During development**: Follow stage-specific architectural decisions
- **After implementation**: Document stage evolution and methodology updates

## 2. Architecture Structure

```
src/
├── js/                         # JavaScript modular architecture
│   ├── app-core.js            # Core initialization & theme management
│   ├── ui-utils.js            # UI utilities & scroll effects
│   ├── sidebar-manager.js     # Sidebar templates & management
│   ├── module-loader.js       # Module loading & templates
│   └── navigation.js          # Navigation state & routing
└── styles/                    # CSS modular architecture
    ├── core.css               # Variables, fonts, typography
    ├── layout.css             # Main content, sidebar, grid
    ├── navigation.css         # Header, navbar, theme toggle
    ├── components.css         # Buttons, forms, controls
    ├── utilities.css          # Scroll effects, utilities
    ├── responsive.css         # Media queries, mobile
    └── modules/               # Module-specific styles
```

## 3. JavaScript Module Responsibilities

*   **`app-core.js`**: Application initialization, theme management, and global stubs.
*   **`ui-utils.js`**: Common UI utilities like scroll effects and sidebar visibility.
*   **`sidebar-manager.js`**: Manages all sidebar HTML templates for different modules.
*   **`module-loader.js`**: Handles dynamic loading of module content and scripts.
*   **`navigation.js`**: Manages navigation state, routing, and restoring the last opened module.

## 4. CSS Module Responsibilities

*   **`core.css`**: Foundation styles, including CSS variables for themes, fonts, and typography.
*   **`layout.css`**: Defines the main application layout, including the content wrapper, sidebar, and grid systems.
*   **`navigation.css`**: Styles for the header, main navbar, logo, and theme toggle.
*   **`components.css`**: Styles for all reusable UI components like buttons, forms, and controls.
*   **`utilities.css`**: Helper classes for effects like scroll fade and other utilities.
*   **`responsive.css`**: Contains all media queries for responsive adjustments on tablet and mobile.
*   **`modules/`**: Directory for styles that are specific to a single module.

## 5. Loading Order

Files must be loaded in a specific order in `index.html` to respect dependencies.

### JavaScript Loading Order
1.  `app-core.js`
2.  `ui-utils.js`
3.  `sidebar-manager.js`
4.  `module-loader.js`
5.  `navigation.js`

### CSS Loading Order
1.  `core.css`
2.  `layout.css`
3.  `navigation.css`
4.  `components.css`
5.  `utilities.css`
6.  `responsive.css`
7.  `modules/*.css`

## 6. Specialized Architectures

### Colormap Architecture

A two-tier system separates visualization colors from UI colors.

*   **Module Colormaps (Tier 1):** Control visualization appearance (e.g., spectrogram colors). They are user-selectable and module-specific.
*   **Component Colormaps (Tier 2):** Control UI component colors (e.g., `tone-control` sliders). They are built into the components and are independent of the module.

> **CRITICAL RULE**: Module colormaps and component colormaps MUST remain completely separate systems.

### Documentation Pipeline

1.  **Implement Code**: Write and test new features.
2.  **Update Documentation (MANDATORY)**: After testing, update the core architecture documents in `dev/RULES/`, then module-specific `README.md` files, and finally inline code comments (JSDoc).
3.  **Validate Consistency**: Before committing, ensure code and documentation are aligned.

## 7. Development Guidelines

### 7.1. Stage-Driven Development Process

**Before Any Implementation:**
1. **Consult dev_stages**: Review relevant stage documentation for patterns and methodology
2. **Reference Implementation**: Study existing stage implementations for architectural consistency
3. **Small Functionality Focus**: Ensure changes target specific, limited functionality per KISS principles

**Development Pattern:**
*   **Adding New Modules**: Requires adding templates to `sidebar-manager.js` and `module-loader.js`, creating a module-specific CSS file, and updating `navigation.js`.
*   **Modifying Existing Modules**: Edits should be made in the file corresponding to the module's responsibility (e.g., theme changes in `app-core.js`, layout changes in `layout.css`).
*   **Stage Documentation**: Update relevant stage documentation to reflect architectural evolution

### 7.2. KISS Implementation Guidelines

**Iterative Approach Requirements:**
- Each implementation cycle must be small and focused
- Features should be revisited and refined across multiple development cycles
- Maintain working, testable state at each checkpoint
- Document methodology decisions for future reference

**Stage Reference Integration:**
- **st00-wireframe**: For UI/UX foundation and layout changes
- **st01-backend-server**: For Docker backend architecture, API integration, and server-side processing patterns
- **st02-modularization**: For component architecture and separation patterns  
- **st03-documentation-system**: For documentation and wiki integration approaches
- **st04-spectrogram**: For audio visualization implementation patterns
- **st05-mic-calibration**: For hardware interface and calibration patterns
- **st06-comb-filtering**: For audio processing and algorithm implementation
- **st07-psychoacoustics**: For advanced audio analysis and psychoacoustic features
- **st08-pwa**: For progressive web app and mobile optimization patterns
