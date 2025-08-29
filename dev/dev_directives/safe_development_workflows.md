# Safe Development Workflows

This document outlines two primary strategies for modifying code. The goal is to ensure that all changes are safe, reversible, and clear, preventing catastrophic failures during development.

---

## Strategy 1: In-Place Replacement Method

This strategy is for modifying critical, central files where the filename must remain unchanged.

**When to Use:**
- Modifying core application shell files (e.g., `index.html`, `app.js`, `style.css`).
- Small to medium-sized changes where the risk of breaking dependencies is high if the filename is altered.

**Workflow:**
1.  **Understand First:** Read the entire content of the file(s) to be modified to ensure a full understanding of their function and context.
2.  **Create Revert Point:** Before any modification, create a backup of the original file (e.g., `app.js` -> `app.js_bckp`). This is your instant undo.
3.  **Prepare In-Memory:** Generate the complete and final content of the modified file in memory.
4.  **Write & Overwrite:** Write the new content to the original file, overwriting it.
5.  **Verify:** Test the application. If it fails, immediately restore the original file from the backup.


## Strategy 2: Staged-Incremental Method

This strategy is for developing new features or making significant changes to self-contained components in discrete, versioned steps.

**When to Use:**
- Developing new modules or components (e.g., a new analyzer, a specific UI widget).
- Making large, complex changes to an existing module where isolating the work is beneficial.
- When development can be paired with versioned documentation (e.g., `spectrogram-v2-prd.md`).

**Workflow:**
1.  **Establish Baseline:** Start with a stable, working version of the component files (e.g., `module-v1.html`, `module-v1.js`).
2.  **Create New Stage:** To begin new work, copy the baseline files to a new version (e.g., `module-v2.html`, `module-v2.js`).
3.  **Develop in Isolation:** All new changes occur *only* in the `v2` files. The `v2.html` is updated to use `v2.js`.
4.  **Preserve Fallback:** The `v1` files are never touched. They remain a known-good version that the application can be pointed back to instantly if `v2` proves unstable.

---

## General Directives

These rules apply to **both** strategies:

*   **Check Before Creating:** Do not create new files and/or directories before first checking if they already exist.
*   **Backup Over Recreation:** It is always easier to delete a temporary backup file (`_bckp`) than to recreate a complex file from memory or source control history.
*   **Error Handling:** When a mistake happens, acknowledge it concisely and immediately adopt a new approach. Do not repeat a failed pattern.

---

**Note:** This document serves as a preliminary approach to the later implementation of Windsurf's rules.
*Source SOT:* [https://windsurf.com/editor/directory](https://windsurf.com/editor/directory)
