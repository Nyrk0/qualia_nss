# Bug Report & Fix Plan: Canvas Fade/Shadow Effect

**File:** `standalone-modules/comb-filtering/index.html`
**Reported:** 2025-09-01

---

## 1. Issue Description

An unintentional fade/shadow effect is constantly visible on the main content's visualization canvas. This effect appears as a dark gradient at the bottom and right edges of the canvas area.

## 2. Root Cause Analysis

My investigation confirmed the visual effect is caused by static CSS rules applied to the axis label containers within the canvas overlay.

**File:** `standalone-modules/comb-filtering/css/styles.css`

**Problematic CSS Rules:**

1.  **Bottom Fade (Frequency Axis):**
    ```css
    .frequency-axis {
        /* ... other styles ... */
        background: linear-gradient(transparent, rgba(0,0,0,0.7));
    }
    ```

2.  **Right-Side Fade (Time Axis):**
    ```css
    .time-axis {
        /* ... other styles ... */
        background: linear-gradient(to left, rgba(0,0,0,0.7), transparent);
    }
    ```

These styles are applied unconditionally to the `.frequency-axis` and `.time-axis` divs, which are part of the main visualization area, not a scrollable sidebar.

## 3. Intended Behavior vs. Current Behavior

*   **Intended Behavior:** The user clarified that this fade effect is a "scroll hint" UI pattern. It should **only** appear on scrollable sidebar containers when their content overflows, indicating to the user that there is more content to see. Scrollbars themselves are permanently hidden.
*   **Current (Buggy) Behavior:** The effect is incorrectly and permanently applied to the main canvas, which is not a scrollable content area.

## 4. Proposed Fix

The fix involves removing the incorrect styling from the main canvas and outlining the correct implementation for the intended scroll-hint feature.

### Step 1: Immediate Fix (Remove Incorrect Styles)

The static `background` properties should be removed from the `.frequency-axis` and `.time-axis` rules in `css/styles.css`.

**Action:**
1.  **Read** `standalone-modules/comb-filtering/css/styles.css`.
2.  **Locate** the `.frequency-axis` and `.time-axis` rules.
3.  **Remove** the `background: linear-gradient(...)` line from both rules.
4.  **Write** the modified content back to the file.

This will immediately resolve the visual bug on the main content canvas.

### Step 2: Correctly Implement Scroll-Hint Feature (Future Enhancement)

To achieve the intended scroll-hint functionality on sidebars, a JavaScript-driven approach is required.

**Proposed Logic:**

1.  **Create a Utility Function:** In a suitable JavaScript file (e.g., `js/ui-components.js`), create a function `updateScrollHints(element)`.
2.  **Check for Overflow:** This function will check if `element.scrollHeight > element.clientHeight`.
3.  **Apply Classes:**
    *   If the element is scrolled to the top, add a `.has-scroll-bottom` class.
    *   If scrolled to the bottom, add a `.has-scroll-top` class.
    *   If scrolled in the middle, add both classes.
    *   If not overflowing, remove all classes.
4.  **Create CSS Rules:**
    ```css
    .control-sidebar.has-scroll-bottom::after {
        content: '';
        position: absolute;
        bottom: 0;
        left: 0;
        right: 0;
        height: 40px;
        background: linear-gradient(transparent, var(--surface-color));
        pointer-events: none;
    }

    .control-sidebar.has-scroll-top::before {
        content: '';
        position: absolute;
        top: 0;
        left: 0;
        right: 0;
        height: 40px;
        background: linear-gradient(var(--surface-color), transparent);
        pointer-events: none;
    }
    ```
5.  **Attach Event Listeners:** Call `updateScrollHints` on the `scroll` event for the sidebars and on window resize.

This implementation correctly applies the fade effect only when and where it's needed, fulfilling the original design intent. The immediate fix, however, is to remove the buggy styles from the main canvas.
