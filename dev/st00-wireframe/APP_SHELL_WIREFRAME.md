# App Shell Wireframe & Logic

This document outlines the visual layout and functional logic of the main application shell for Qualia-NSS.

---

## 1. Visual Layout

This is a simple text-based wireframe to illustrate the main components of the user interface.

```
+------------------------------------------------------------------------------+
| [Logo] QUALIA-NSS   | [✓ Step 1] -> [✓ Step 2] -> [5 Project] |   [☀️/🌙]    |
+==============================================================================+
| [LEFT SIDEBAR]      |                                                        |
|                     |                                                        |
| (Hidden by Default) |          <--- MAIN CONTENT AREA --->                   |
|                     |                                                        |
| (Module UI Controls)|              (Module Visualization)                    |
|                     |                                                        |
|                     |                                                        |
+------------------------------------------------------------------------------+
| (c) 2025 Qualia-NSS                                                          |
+------------------------------------------------------------------------------+
```

### Component Breakdown:

*   **Header:**
    *   A single, sticky bar at the top with a blurred backdrop.
    *   **Left:** Contains the application logo and title ("QUALIA-NSS").
    *   **Center:** A workflow-style navigation bar showing steps (e.g., Speakers, SPL, Project).
    *   **Right:** Contains a theme toggle button (light/dark).

*   **Left Sidebar:**
    *   This area is dedicated to the User Interface (UI) for the currently active module.
    *   It is hidden by default and can be shown programmatically.
    *   It will be populated with controls, buttons, sliders, and options specific to a module.

*   **Main Content Area:**
    *   This is the largest section, where the main output or visualization of the active module is displayed.

*   **Footer:**
    *   A simple footer with copyright information.

---

## 2. Module Loading Logic

This section describes how the user will interact with the application.

*   When a user clicks a step in the **Header** workflow:
    1.  The application will fetch the module's components.
    2.  The module's UI controls are loaded into the **Left Sidebar**, and the sidebar is made visible.
    3.  The module's main visualization/content is loaded into the **Main Content Area**.
*   The Sidebar and Main Content are linked. Interacting with controls in the sidebar will update the visualization in the main content area in real-time.

---

## 3. Current Implementation Status (As of 2025-08-25)

*   **HTML Structure:** The core HTML structure (`index.html`) for the header, sidebar, main content, and footer is in place.
*   **CSS Styling:** A sophisticated theme system (`style.css`) with light and dark modes is fully implemented. The styles for the header, logo, and workflow navigation are well-developed.
*   **JavaScript Logic:** The `app.js` file contains:
    *   **Theme Management:** Logic to toggle and save the user's theme preference in `localStorage`.
    *   **Sidebar Management:** Functions (`showSidebar`, `hideSidebar`) exist to control the visibility of the sidebar by toggling a `.with-sidebar` class on the main content wrapper.
    *   **Workflow Clicks:** Basic click handlers are attached to the workflow items in the header, currently logging to the console.
*   **Modules:** The actual modules (Speakers, SPL, etc.) are not yet integrated. The sidebar and main content areas currently only contain placeholder content.
*   **Responsive Design:** Basic responsive styles are in place to handle smaller screens, stacking the main layout elements.

---

## 4. Responsive Behavior

*   **Sidebar:** The left sidebar will have a minimum and maximum width (e.g., min 250px, max 400px) to ensure usability.
*   **Small Screens:** On smaller screens (e.g., tablets, mobile), the layout currently stacks vertically. The sidebar appears above the main content when visible.