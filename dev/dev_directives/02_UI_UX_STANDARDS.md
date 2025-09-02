# 02: UI/UX Standards and Components

**Version:** 1.0
**Date:** 2025-09-01
**Status:** ACTIVE

## 1. Objective

This document establishes the official UI/UX development standards and component architecture for the Qualia-NSS application. Its purpose is to ensure a consistent, high-quality, and maintainable user experience. Adherence is mandatory.

---

## 2. Core Principle: Theme First

**All styling MUST derive from the central theme file.**

*   **Single Source of Truth**: The file `src/styles/core.css` is the single source of truth for all design tokens (colors, fonts, spacing, etc.).
*   **No Hardcoded Values**: The use of hardcoded, literal values for colors (e.g., `#FFF`), font sizes (e.g., `15px`), or spacing (e.g., `margin: 10px`) is strictly forbidden.

---

## 3. Styling Rules

### 3.1. Colors
Always use the color variables defined in `core.css`.
```css
/* CORRECT */
.my-component {
  color: var(--text-color);
  background-color: var(--panel-bg-color);
}
```

### 3.2. Typography & Semantic Hierarchy
*   The base font is defined by `--font-family-base`.
*   All `font-size` declarations must use `rem`-based variables (e.g., `--font-size-base`).
*   **HTML tags MUST follow this semantic hierarchy:**
    *   **H1:** Primary page/module title.
    *   **H2:** Sidebar titles and major section titles.
    *   **H3:** Sidebar subtitles and subsection titles.
    *   **H4, H5, H6:** Deeper nesting as needed.
    *   **Navbar Links:** Must remain `<a>` tags.

### 3.3. Spacing & Layout
All `margin`, `padding`, and `gap` distances must use the `--spacing-unit` variables.
```css
/* CORRECT */
.my-panel {
  padding: var(--spacing-md); /* 16px */
}
```

---

## 4. Web Components Architecture

### 4.1. Centralized Curation
All reusable UI components are maintained in `/src/components/` as the single source of truth.

### 4.2. Component Standards
1.  **Vanilla JavaScript Only**: Components must be self-contained and framework-agnostic. Use `customElements.define()` for registration.
2.  **Shadow DOM Architecture**: Components must use the Shadow DOM for encapsulation.
3.  **CSS Isolation**: All styles must be contained within the component's `<style>` tag and use CSS custom properties for theming.

### 4.3. Curation Workflow
*   **Adding Components**: Create new components in `/src/components/[name]/` with a `README.md`.
*   **Updating Components**: Always edit the version in `/src/components/` first. Propagate changes outwards.
*   **Integration**: Load components via `<script>` tag in the necessary HTML files.

### 4.4. Current Components Inventory
*   **`tone-control`**: Production-ready, located at `/src/components/tone-control/tone-control.js`.

---

## 5. General UI Development Rules

### 5.1. No Inline Styles
The `style` attribute is forbidden in HTML (`<div style="...">`).

### 5.2. Prefer Reusability
Before writing new CSS, check existing stylesheets (`components.css`, `utilities.css`) for a class that already provides the desired functionality.

### 5.3. Module-Specific Styles
If a style is used **only** within a single module, its CSS should be placed in a stylesheet within that module's directory.

### 5.4. JavaScript and Styling
JavaScript's role is to manage state by toggling classes (e.g., `element.classList.add('is-active')`). It **must not** directly set style properties (e.g., `element.style.color = 'red'`).

