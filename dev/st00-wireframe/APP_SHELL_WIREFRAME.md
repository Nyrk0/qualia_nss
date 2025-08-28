# App Shell Wireframe & Logic

This document outlines the visual layout and functional logic of the main application shell for Qualia-NSS.

---

## 1. Visual Layout

The application uses a flexible, single-page application (SPA) layout managed by a main header, a content area, and a footer.

```
+------------------------------------------------------------------------------+
| [QUALIA🍀NSS]      | [Speakers] [Filters] [Cabinets] [Tests] |    [💡]        |
+==============================================================================+
| +------------+      +------------------------------------------------------+ |
| |            |      |                                                      | |
| |  SIDEBAR   |      |               <--- MAIN CONTENT AREA --->            | |
| | (Module   |      |                                                      | |
| | Controls)  |      |                  (Module View)                       | |
| |            |      |                                                      | |
| +------------+      +------------------------------------------------------+ |
+------------------------------------------------------------------------------+
| (c) 2025 Qualia-NSS                                                          |
+------------------------------------------------------------------------------+
```

### Component Breakdown:

*   **Header:** A sticky top navbar containing the logo, main navigation links (Speakers, Filters, etc.), and a theme toggle.
*   **Content Wrapper:** A flexbox container that fills the space between the header and footer. It is dynamically populated with:
    *   **Sidebar (`#sidebar`):** A left-hand panel (280px width) that holds the primary controls for the currently active module. Its content is injected dynamically.
    *   **Main Content (`#main-content`):** The primary view area where the module's main interface (e.g., charts, visualizations) is rendered.
*   **Footer:** A minimal, single-line footer for copyright information.

---

## 2. Core Architectural Patterns

### 2.1. Module Loading & Layout Logic

The application functions as an SPA, loading modules into the main content area without page reloads.

*   **Module Selection:** When a user clicks a navigation link (e.g., "Speakers"), the `loadModule()` function in `app.js` is triggered.
*   **Dynamic Injection:**
    1.  The `loadModule()` function injects the appropriate sidebar HTML into the `#sidebar` div.
    2.  It injects the module's main view HTML into the `#main-content` div.
    3.  A corresponding JavaScript file for the module is loaded to handle its specific logic.
*   **Layout Management:**
    *   The main container, `#content-wrapper`, uses `display: flex` to position the sidebar and main content area side-by-side.
    *   The `#main-content` area is also a flex container, allowing the content within it to be structured flexibly.

### 2.2. Chart.js Resizing Pattern (Simplified Approach)

**Problem:** Chart.js components fail to resize correctly when browser viewport changes from narrow to wider layouts. From wider to narrow works acceptably, but narrow to wider requires page refresh to display correctly.

**Analysis:** Chart.js responsive behavior has timing issues with CSS flexbox recalculation. Complex timing solutions (ResizeObserver, nested requestAnimationFrame) add unnecessary complexity without fully solving the issue.

**Adopted Solution (Simplified Pattern):** Use the simplest approach that works for most use cases:

**CSS Requirements:**
```css
.chart-container {
  position: relative;
  flex: 1 1 auto;
  height: 100%;  /* Key: Use 100% not 'auto' for proper flexbox inheritance */
  min-height: 360px;
}
.chart-container canvas { 
  width: 100% !important; 
  height: 100% !important; 
  display: block; 
}
```

**JavaScript Implementation:**
```javascript
// Simple Chart.js setup - let it handle its own responsive behavior
this.chart = new Chart(ctx, {
  type: 'line',
  data: { datasets: [] },
  options: {
    responsive: true,
    maintainAspectRatio: false,
    resizeDelay: 100,  // Built-in debouncing for smoother resizing
    // ... other options
  }
});
```

**Known Limitation:** Narrow-to-wider viewport changes may still require manual page refresh. This limitation is accepted in favor of code simplicity and maintainability.

**Implementation Status:** Applied in `src/speakers-spl/` module as the standard pattern for Chart.js components.

---

## 3. Responsive Behavior

*   **Layout:** The primary layout is a two-column design with a fixed-width sidebar and a flexible main content area.
*   **Navbar:** The main navigation bar is designed to be responsive. On narrower screens (<768px), the text labels for the navigation links are hidden, showing only the icons to save space while maintaining functionality. The navbar itself never stacks vertically.