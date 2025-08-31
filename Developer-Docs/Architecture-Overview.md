# Architecture Overview

This document provides a high-level overview of the Qualia-NSS application architecture.

## Core Principles

-   **Modular SPA:** The application is a Single-Page Application (SPA) with a modular design. Each audio analysis tool is a self-contained module.
-   **Vanilla JS:** The entire frontend is built with vanilla JavaScript (ES6+), HTML, and CSS, with no reliance on large frameworks like React or Vue.
-   **Centralized Theming:** All styling is controlled by a central theme file (`src/styles/theme.css`) using CSS Variables for easy customization and consistency.

For more detailed information, please refer to the other documents in this section.
