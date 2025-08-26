# Development Plan

This document outlines the development roadmap and priorities for Qualia-NSS.

## Milestones

1.  **M1: Core Application Shell**: Develop the main application structure, including the module loader, audio manager, and UI shell.
2.  **M2: Module Integration**: Integrate the existing standalone modules (`spectrogram`, `7band-level-meter`, etc.) into the core application.
3.  **M3: Data Handling**: Implement robust handling for user-uploaded SPL data and live audio input.
4.  **M4: MVP Release**: Polish the user experience, fix bugs, and deploy an initial version.

## Phase 1: Minimum Viable Product (MVP)

The goal for the MVP is to create a unified application that combines the core analysis modules into a cohesive user experience.

*   **Tasks**:
    *   [ ] Define core technology stack (framework, build tools).
    *   [ ] Implement the application shell (M1).
    *   [ ] Integrate `spl_analyzer_standalone` as the first module.
    *   [ ] Integrate the `spectrogram` module.
    *   [ ] Add a file input system for CSV/TXT data.
    *   [ ] Basic UI styling and layout.

## Future Goals

*   Real-time collaboration features.
*   Advanced psychoacoustic modeling.
*   Integration with hardware measurement tools.
*   User accounts and project saving.
