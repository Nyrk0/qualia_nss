# App Shell Wireframe & Logic

This document outlines the visual layout and functional logic of the main application shell for Qualia-NSS.

---

## 1. Visual Layout

This is a simple text-based wireframe to illustrate the main components of the user interface.

```
+------------------------------------------------------------------------------+
| [QUALIA🍀NSS]      | [Speakers] [Filters] [Cabinets] [Tests] |    [💡]        |
+==============================================================================+
|                     |                                                        |
|                     |          <--- MAIN CONTENT AREA --->                   |
|                     |                                                        |
|                     |              (Module Content)                          |
|                     |                                                        |
|                     |                                                        |
+------------------------------------------------------------------------------+
| (c) 2025 Qualia-NSS                                                          |
+------------------------------------------------------------------------------+
```

### Component Breakdown:

*   **Header:**
    *   A single, sticky navbar with Bootstrap styling and electric blue (#0088ff) theming.
    *   **Left:** QUALIA🍀NSS logo with clover icon, shows active state with electric blue border.
    *   **Center:** Horizontal navbar with icon + text for Speakers, Filters, Cabinets, Tests modules.
    *   **Right:** Lightbulb theme toggle button for light/dark mode switching.

*   **Main Content Area:**
    *   Full-width content area where modules are dynamically loaded via SPA routing.
    *   No sidebar - modules inject their controls directly into main content.

*   **Footer:**
    *   Minimal footer with reduced height and font size for copyright.

---

## 2. Module Loading Logic

Single Page Application (SPA) routing system without page reloads:

*   When a user clicks a navbar module (Speakers, Filters, Cabinets, Tests):
    1.  The clicked item gets electric blue border active state while others remain neutral.
    2.  HTML content is injected from embedded templates in `app.js`.
    3.  Module JavaScript is dynamically loaded from `src/{module}/index.js`.
    4.  Module class is instantiated and initialized with event binding.
*   Module cleanup: Previous module instance is destroyed before loading new one.
*   Landing page: QUALIA logo shows active state, main content shows welcome message.

---

## 3. Current Implementation Status (As of 2025-08-26)

*   **HTML Structure:** Complete navbar with Bootstrap integration, logo with clover icon, theme toggle.
*   **CSS Styling:** Electric blue (#0088ff) theme system with consistent hover states:
    *   Neutral gray (#666) border hover for all interactive elements
    *   Electric blue border for active states (no font color/weight changes)
    *   Responsive design with icon-only navbar on narrow screens
*   **JavaScript Logic:** 
    *   **Theme Management:** Light/dark mode toggle with localStorage persistence
    *   **SPA Routing:** Embedded HTML templates with dynamic module loading
    *   **Active State Management:** `setActiveNav()` function for consistent styling
*   **Modules:** Four complete modules with control interfaces:
    *   **Speakers:** Type selection, impedance configuration, analysis controls
    *   **Filters:** Filter type, cutoff frequency, Q factor with live displays  
    *   **Cabinets:** Cabinet type, volume, port parameters with conditional controls
    *   **Tests:** Test type, signal selection, amplitude control with start/stop
*   **Security:** Directory listing protection via `.htaccess` with proper routing

---

## 4. Responsive Behavior

*   **Sidebar:** 280px width with electric blue header, contains all module controls
    *   Speakers: Driver selection buttons, analysis progress bars
    *   Filters: Filter bank buttons, animated FFT display bars
    *   Cabinets: Cabinet model selection, volume calculator badges
    *   Tests: Test suite controls, real-time signal status dots
    *   Global: Reset controls and system-wide functions
*   **Navbar:** Forced horizontal layout that never stacks vertically
*   **Small Screens:** Text labels hidden on screens <768px, icons remain visible
*   **Module Content:** Full-width responsive controls with proper form layouts
*   **Layout:** Two-column design with sidebar + main content area