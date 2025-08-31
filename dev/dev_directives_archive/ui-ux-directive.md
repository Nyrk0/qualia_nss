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
