# GEMINI Project Context: Qualia-NSS

## 1. Project Overview

Qualia-NSS is a professional, web-based audio analysis toolkit designed for audio engineering applications. It functions as a **modular single-page application (SPA)** built with vanilla JavaScript, HTML, and CSS, avoiding frameworks like React or Vue for maximum compatibility and performance.

-   **Purpose:** To provide real-time visualization and measurement tools like a 3D Spectrogram, 7-Band Level Meter, Spectrum Analyzer, and more.
-   **Architecture:** The application uses a modular architecture where different analysis tools are loaded dynamically into a persistent shell. Core logic is handled by a set of cooperating JavaScript modules (`app-core.js`, `module-loader.js`, `navigation.js`, `sidebar-manager.js`).
-   **Technologies:**
    -   **Frontend:** Vanilla JavaScript (ES6+), HTML5, CSS3
    -   **UI/Styling:** Bootstrap 5 (CSS only) for layout and components, with a custom, themeable styling system built on CSS Variables.
    -   **Audio:** Web Audio API for all real-time audio processing.
    -   **Graphics:** WebGL for the 3D Spectrogram, and Chart.js for 2D plotting.

## 2. Building and Running

This project does not have a JavaScript build step (e.g., Webpack, Vite). It can be run directly in the browser.

-   **Recommended Method:** Run a local HTTP server from the project root.

    ```bash
    # Using Python
    python3 -m http.server

    # Or using Node.js
    npx http-server
    ```
    Then open `http://localhost:8000` (or the port specified) in your browser.

-   **Alternative:** Open the `index.html` file directly in the browser. Note that some browser security features (CORS) might limit functionality when running from `file:///`.

-   **Scripts:** The `package.json` contains scripts (`docs:generate`, `build:wiki`) that are related to documentation generation with JSDoc and Docsify, not for building the application itself.

## 3. Development Conventions

The project follows a set of strict development directives to ensure consistency and quality.

### 3.1. UI/UX and Styling

-   **Theme First:** All styling is centralized in `src/styles/`. The file `src/styles/theme.css` is the single source of truth for all design tokens (colors, fonts, spacing).
-   **No Hardcoded Values:** Using literal color values or `px` sizes is forbidden. All styles must use the provided CSS variables.
-   **No Inline Styles:** The `style` attribute is forbidden in HTML. All styles must be in `.css` files.
-   **Semantic Hierarchy:** The application uses a strict semantic HTML and visual hierarchy:
    -   **H1:** Primary page/module title.
    -   **H2:** Sidebar titles and major content sections.
    -   **H3:** Sidebar subtitles and content subsections.
    -   **Navbar Links:** Styled with significant visual weight but remain as `<a>` tags for semantic correctness.

### 3.2. Modularity

-   The application is composed of modules that are loaded dynamically by `src/js/module-loader.js`.
-   Each module has a corresponding HTML template in `module-loader.js` and a sidebar template in `sidebar-manager.js`.
-   Module-specific JavaScript should be encapsulated and expose an `init()` and `destroy()` method for lifecycle management.

### 3.3. Documentation

-   Architectural changes **must** be documented before or alongside code changes, as per `dev/dev_directives/documentation_pipeline.md`.
-   Key architectural documents are located in `dev/st00-wireframe/` and `dev/dev_directives/`.
