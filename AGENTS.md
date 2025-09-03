# AGENTS.md - Universal AI Assistant Instructions

**Project**: Qualia-NSS - Web-based Audio Analysis Toolkit  
**Version**: 3.0  
**Compatible**: Claude, Gemini, GPT, and other AI assistants  
**Last Updated**: 2025-09-03

---

## 🎯 Project Overview

Qualia-NSS is a professional web-based audio analysis toolkit for audio engineering applications. It functions as a **modular single-page application (SPA)** built with vanilla JavaScript, avoiding frameworks for maximum compatibility and performance.

### Core Technologies
- **Frontend**: Vanilla JavaScript (ES6+), HTML5, CSS3
- **UI Framework**: Bootstrap 5 (CSS-only) with custom themeable system
- **Audio Processing**: Web Audio API for real-time analysis
- **Graphics**: WebGL (3D spectrogram), Chart.js (2D plotting)
- **Architecture**: Modular SPA with dynamic module loading

### Key Features
- 3D WebGL Spectrogram with Google Chrome Music Lab implementation
- Real-time 7-band psychoacoustic level meter
- Professional frequency domain processing
- Progressive Web App (PWA) with mobile optimization

---

## 📚 Development Rules & Guides

All development rules have been consolidated into the `/dev/RULES/` directory. Please refer to these documents as the single source of truth.

- **`dev/RULES/01_CORE_WORKFLOW.md`**: The complete development workflow, including staged development, safety protocols, AI assistant rules, debugging, and deployment.
- **`dev/RULES/02_UI_UX_STANDARDS.md`**: All standards for UI/UX, including the theme-first principle, component architecture, and styling rules.
- **`dev/RULES/03_ARCHITECTURE_GUIDE.md`**: The complete guide to the application's modular architecture, including JavaScript/CSS structure, module responsibilities, loading order, and documentation pipelines.

---

## 🔧 Development Commands

### Starting the Application
```bash
# Recommended: HTTP server (required for ES6 modules)
python3 -m http.server 8080
# or
npx http-server -p 8080

# Access: http://localhost:8080/
```

### No Build Process Required
- Pure vanilla JavaScript with ES6 modules
- No package.json, npm scripts, or build tools required
- Changes take effect immediately after browser refresh
- Direct file opening has limited functionality due to CORS

---

## 🏗️ Core Architecture Snippets

### JavaScript Load Order (CRITICAL)
1. `src/js/app-core.js`
2. `src/js/ui-utils.js`  
3. `src/js/sidebar-manager.js`
4. `src/js/module-loader.js`
5. `src/js/navigation.js`

### CSS Load Order (CRITICAL)
1. `src/styles/core.css`
2. `src/styles/layout.css`
3. `src/styles/navigation.css`
4. `src/styles/components.css`
5. `src/styles/utilities.css`
6. `src/styles/responsive.css`
7. `src/styles/modules/*.css`

### Module Lifecycle Pattern
```javascript
class NewModuleModule {
    constructor() { /* Initialize state */ }
    async init() { /* Setup UI, events, load data */ }
    destroy() { /* Cleanup resources */ }
}
window.NewModuleModule = NewModuleModule; // Global exposure REQUIRED
```

---

## 🎨 Mandatory UI/UX Rules

- **Theme First**: ALL styling MUST use CSS variables from `src/styles/core.css`. No hardcoded colors, fonts, or spacing.
- **Inline Styles**: Forbidden in main app | ALLOWED in `/standalone-modules/` for prototyping.
- **Semantic Hierarchy**: Use `<h1>` -> `<h2>` -> `<h3>` correctly.
- **JavaScript & Styles**: JS toggles classes; CSS defines the styles for those classes. JS must not directly manipulate `element.style`.

---

## 🚨 Critical AI Assistant Rules

### **MANDATORY USER APPROVAL BEFORE COMMITS** ⚠️
- **CRITICAL REQUIREMENT**: ALL AI assistants MUST obtain explicit user approval before ANY git commit or push operations.
- **Process**: Present a summary of changes and ask "May I commit and push these changes?". Wait for a clear "yes" or "approve".

### **HTTP Server Testing Restriction**
- **NEVER start HTTP servers for testing purposes.**
- Make code changes based on analysis only. Do not claim functionality "works" without explicit user verification.

### **Task Planning Process**
1.  **Propose a Plan**: Create a todo subject for user approval.
2.  **Document the Plan**: Write the approved plan to a file in `dev/todos/`.
3.  **Implement**: Follow the plan.

---

**This file serves as the single source of truth for all AI assistants working with Qualia-NSS. Follow these guidelines exactly to maintain architectural coherence and quality standards.**
