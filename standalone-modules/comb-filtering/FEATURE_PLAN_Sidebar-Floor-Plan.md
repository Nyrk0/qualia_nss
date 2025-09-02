# Feature Implementation Plan: Sidebar Mini Floor Plan

**File:** `standalone-modules/comb-filtering/FEATURE_PLAN_Sidebar-Floor-Plan.md`
**Date:** 2025-09-01

---

## 1. Objective

To enhance the user interface of the Comb-Filtering Tool by adding a simplified, interactive "Mini Floor Plan" to the control sidebar. This component will mirror the state of the main floor plan and provide an alternative way to manipulate the listener's position.

## 2. Key Features

1.  **UI Component:** A new section in the left sidebar displaying a simplified floor plan.
2.  **Iconography:**
    *   Uses Bootstrap Icons for all elements.
    *   A "person" icon represents the listener, with an "arrows-move" icon to indicate draggability.
    *   "speaker" icons represent the four speakers (Set A and Set B).
3.  **State Synchronization:**
    *   Speaker icons will be neutral-colored when OFF and green when ON, reflecting the state of the main speaker toggles.
    *   Set B speaker icons will be rotated 180 degrees to face the listener.
4.  **Interactivity:**
    *   The listener icon will be draggable within the mini floor plan's boundaries.
    *   Dragging the listener in the mini-map will update its position in the main canvas floor plan in real-time.
    *   All related distance and delay labels will update automatically as the listener is moved.

## 3. Implementation Steps

### Phase 1: HTML Structure

**File:** `standalone-modules/comb-filtering/index.html`

1.  Add a new `<div class="sidebar-section">` to the `control-sidebar` (left panel).
2.  Create a container `<div class="mini-floor-plan">` inside the new section.
3.  Add five `<i>` elements with appropriate Bootstrap Icon classes for the listener and four speakers. Assign unique IDs for easy access (e.g., `#mini-listener`, `#mini-speaker-a-left`).
    *   Listener: `<i class="bi bi-person-fill listener-icon"></i><i class="bi bi-arrows-move move-hint"></i>`
    *   Speakers: `<i class="bi bi-speaker-fill speaker-icon"></i>`

### Phase 2: CSS Styling

**File:** `standalone-modules/comb-filtering/css/styles.css`

1.  Style the `.mini-floor-plan` container (e.g., `position: relative`, `background-color`, `border`, `height`).
2.  Style the `.listener-icon` and `.speaker-icon` elements (e.g., `position: absolute`, `font-size`, `cursor`).
3.  Create utility classes for speaker states:
    *   `.speaker-off { color: var(--text-muted); }`
    *   `.speaker-on { color: var(--status-green); }`
4.  Create a utility class to invert the Set B speakers:
    *   `.speaker-inverted { transform: rotate(180deg); }`
5.  Style the `.move-hint` icon to appear on hover over the listener.

### Phase 3: JavaScript Logic

**File:** `standalone-modules/comb-filtering/js/comb-filter-tool.js`

1.  **Initialization (`init` method):**
    *   Get DOM references for all new mini floor plan elements.
    *   Add the `.speaker-inverted` class to the Set B mini icons.
    *   Call a new `syncMiniFloorPlanState()` function to set the initial ON/OFF colors.
    *   Set up event listeners for the main speaker toggles to call `syncMiniFloorPlanState()` on change.
    *   Set up drag-and-drop event listeners (`mousedown`, `mousemove`, `mouseup`) for the listener icon.

2.  **State Synchronization (`syncMiniFloorPlanState` function):**
    *   Create a new function that checks the `.checked` property of the main speaker toggle inputs (`#speaker-a`, `#speaker-b`).
    *   Based on the state, toggle the `.speaker-on` and `.speaker-off` classes on the corresponding mini floor plan speaker icons.

3.  **Drag-and-Drop Logic:**
    *   On `mousedown` on the listener icon, set a flag `isDraggingMiniListener = true`.
    *   On `mousemove` (if `isDraggingMiniListener` is true):
        *   Calculate the mouse position relative to the `.mini-floor-plan` container.
        *   Constrain the position within the container's bounds.
        *   Convert the pixel position to a normalized percentage (0.0 to 1.0) for both X and Y axes.
        *   Update the `left` and `top` CSS properties of the listener icon.
        *   **Crucially, call the main floor plan's update method** (e.g., `this.floorplan.setListenerPosition(normalizedX, normalizedY)`), passing the normalized coordinates. This will trigger the main canvas to redraw and all calculations to re-run.
    *   On `mouseup` (anywhere on the window), set `isDraggingMiniListener = false`.

## 4. Backup Plan

Before implementation, the following files will be backed up by creating copies with a `_bckp` suffix:
1.  `standalone-modules/comb-filtering/index.html`
2.  `standalone-modules/comb-filtering/css/styles.css`
3.  `standalone-modules/comb-filtering/js/comb-filter-tool.js`

This ensures a safe rollback point in case of any issues during implementation.
