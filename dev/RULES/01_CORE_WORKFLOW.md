# 01: Core Development Workflow

**Version:** 2.0
**Date:** 2025-09-03
**Status:** ACTIVE

## 1. Objective

This document establishes the complete development workflow pipeline for the Qualia-NSS project. It covers the entire lifecycle from planning to deployment, incorporating staged development, safe code modification strategies, and documentation requirements. Adherence to this workflow is mandatory.

---

## 2. The Development Pipeline

This pipeline ensures consistency, quality, and adherence to established directives.

### 2.1. CRITICAL: dev_stages Protection Rule

**🚨 ABSOLUTELY FORBIDDEN: Never delete or move the `dev/dev_stages/` directory.**

The `dev_stages` folder is **CRITICAL INFRASTRUCTURE** containing:
- **KISS Methodology**: Keep It Simple Stable - iterative development approach
- **Stage-based Development**: Small, focused functionality implementations
- **Reference Architecture**: Historical decisions and implementation patterns
- **Human Architect Context**: Essential documentation for project continuity
- **AI Assistant References**: Critical context for understanding project evolution

**Protection Requirements:**
- `dev/dev_stages/` and ALL subdirectories are **PROTECTED**
- Any operation that could delete, move, or restructure `dev_stages` is **STRICTLY PROHIBITED**
- Stages contain iterative approach documentation that MUST be preserved
- Each stage (st00-st06) represents critical development methodology steps

**Before ANY git operations that might affect dev_stages:**
1. Verify `dev/dev_stages/` exists and is intact
2. If missing, restore from git history immediately
3. Never proceed with commits that delete stage directories

### 2.2. Pre-Development Phase

#### Requirements Analysis
1.  **Review Existing Directives**: Check all relevant documents in `dev/RULES/`, including UI/UX standards and architecture guides.
2.  **Consult dev_stages**: Reference relevant stage documentation for methodology and patterns.
3.  **Architectural Assessment**: Identify affected modules/components and determine if architectural changes are needed.
4.  **Impact Analysis**: List all files to be modified and assess potential breaking changes.

#### Planning Phase
1.  **Create Task List**: Use a structured format (e.g., `dev/todos/YYYY-MM-DD-task.md`) to break down the task.
2.  **Design Alignment Check**: Verify the plan aligns with semantic HTML, CSS variable usage, and existing component patterns.

### 2.3. Development Phase

#### KISS Staged Development Methodology
All development MUST follow the **Keep It Simple Stable** staged approach documented in `dev/dev_stages/`.

**Core Principles:**
*   **Small Functionality Focus**: Each development cycle targets one small, specific functionality
*   **Iterative Approach**: Features are revisited and refined through multiple stages
*   **Stage Documentation**: Reference existing stages (st00-st08) for methodology patterns
*   **Stability Checkpoints**: Each stage results in a stable, working state before progression

**Stage Reference System:**
*   **st00-wireframe**: UI/UX foundation and wireframe patterns
*   **st01-backend-server**: Docker backend architecture, API integration, and server-side processing patterns
*   **st02-modularization**: Component separation and modular architecture
*   **st03-documentation-system**: Documentation and wiki integration patterns
*   **st04-spectrogram**: Audio visualization implementation patterns
*   **st05-mic-calibration**: Hardware interface patterns
*   **st06-comb-filtering**: Audio processing algorithm patterns
*   **st07-psychoacoustics**: Advanced audio analysis patterns
*   **st08-pwa**: Progressive web app and mobile optimization patterns

**Implementation Guidelines:**
*   **Stage Definition**: Break down large tasks into logical, testable stages following dev_stages patterns
*   **Methodology Consultation**: Always reference relevant stage documentation before implementation
*   **Checkpoints**: Each stage should result in a stable, working state
*   **Rollback Capability**: Ensure there is always a clear path to revert to a previous known-good state

#### Safe Code Modification Strategies

**Strategy 1: In-Place Replacement (For Critical Core Files)**
1.  **Understand First**: Read the entire file to be modified.
2.  **Create Revert Point**: Create a backup of the original file (e.g., `app.js` -> `app.js_bckp`).
3.  **Write & Overwrite**: Write the complete new content to the original file.
4.  **Verify & Rollback**: Test. If it fails, restore from the backup immediately.

**Strategy 2: Staged-Incremental (For New Features/Components)**
1.  **Establish Baseline**: Start with a stable version (e.g., `module-v1.js`).
2.  **Create New Stage**: Copy baseline files to a new version (e.g., `module-v2.js`).
3.  **Develop in Isolation**: All new work occurs in the `v2` files.
4.  **Preserve Fallback**: The `v1` files are never touched and remain a stable fallback.

#### ES6+ Compliance Requirements (MANDATORY)

**⚠️ EXCEPTION: `/standalone-modules/` directory is EXEMPT from ES6 requirements**
- Standalone modules serve as development/testing environments
- May use vanilla JS patterns (var, function declarations, string concatenation)
- Files in `/standalone-modules/` are simplified development sources

**All OTHER JavaScript code (mainly `/src/` directory) MUST use ES6+ features and patterns:**

**REQUIRED ES6+ Features:**
```javascript
// ✅ MANDATORY: ES6 Modules
export { ClassName, functionName };
import { Component } from './component.js';

// ✅ MANDATORY: ES6 Classes
class ModuleClass {
    constructor() {}
    async init() {}
    destroy() {}
}

// ✅ MANDATORY: const/let (NO var)
const config = { setting: true };
let mutableValue = 'initial';

// ✅ MANDATORY: Arrow functions for callbacks
element.addEventListener('click', (e) => this.handleEvent(e));

// ✅ MANDATORY: Template literals for HTML
const html = `<div class="${className}">${content}</div>`;

// ✅ MANDATORY: Destructuring assignments
const { frequency, active } = e.detail;

// ✅ MANDATORY: Async/await for promises
async init() {
    await customElements.whenDefined('component-name');
    this.setupEvents();
}
```

**FORBIDDEN Legacy Patterns (except in `/standalone-modules/`):**
```javascript
// ❌ FORBIDDEN: var declarations (EXCEPT /standalone-modules/)
var oldStyle = 'deprecated';

// ❌ FORBIDDEN: function declarations for callbacks (EXCEPT /standalone-modules/)
function handleClick() {} // Use arrow functions instead

// ❌ FORBIDDEN: String concatenation for HTML (EXCEPT /standalone-modules/)
var html = '<div class="' + className + '">' + content + '</div>';

// ❌ FORBIDDEN: Non-module scripts (EXCEPT /standalone-modules/)
<script src="script.js"></script> // Use type="module"

// ❌ FORBIDDEN: Callback hell (EXCEPT /standalone-modules/)
getUser(id, function(user) {
    getProfile(user, function(profile) {
        // Use async/await instead
    });
});
```

### 2.3. Hybrid Development Contexts

Be aware of the two primary development environments.

*   **Main Application (`http://` protocol)**: For integrated, full-application development using ES6 modules. Requires a local server.
*   **Standalone Modules (`file://` protocol)**: For quick prototyping, research, and isolated experiments using vanilla JavaScript. Does not require a server.

### 2.4. Testing & Quality Assurance Phase

All changes must be tested against the following criteria:
*   **UI/UX Compliance**: No hardcoded values, no inline styles, correct semantic hierarchy.
*   **Cross-Browser Testing**: Chrome, Firefox, Safari, Edge.
*   **Responsive Testing**: Desktop, Tablet, and Mobile viewports.
*   **Theme Testing**: Light and Dark themes must be fully functional.

### 2.5. Documentation Phase (MANDATORY)

Documentation must be updated *after* code is tested and confirmed working.

1.  **Update Core Architecture Documents**: Modify `03_ARCHITECTURE_GUIDE.md` and other relevant guides first.
2.  **Update Module-Specific Documentation**: Update `README.md` files or other local docs.
3.  **Update Code Documentation**: Update JSDoc and inline comments.
4.  **Run Consistency Checks**: Before committing, ensure code and documentation are aligned.

---

## 3. Specialized Protocols

### 3.1. Systematic Debugging Methodology

When debugging persistent issues that resist initial fixes, **STOP and SYSTEMATIZE**.

**Decision Point:** Has this issue persisted after 2+ attempted fixes?
*   **NO** → Continue with standard debugging.
*   **YES** → **MANDATORY** → Activate Systematic Debugging Protocol.

**Protocol:**
1.  **Document the Issue**: Create a critical issue report detailing attempts, symptoms, and assumptions.
2.  **Verify Source Truth**: Check the integrity of source data (e.g., file content, encoding) before debugging the code that processes it.
3.  **Analyze Environment**: Test across different browsers, verify library versions, and check external dependencies.
4.  **Evaluate Alternatives**: Research and test different libraries, tools, or architectural patterns.

### 3.2. AI Assistant Rules

**Task Planning Process (MANDATORY):**
1.  **Propose Plan**: Present a clear task breakdown for user approval.
2.  **Document Plan**: Create a todo file in `dev/todos/YYYY-MM-DD-task-description.md`.
3.  **Implement**: Follow the written todo as a guide.

**Critical Restrictions:**
*   **No Server Testing**: Never start HTTP servers for testing. Make changes based on analysis only and ask the user to verify.
*   **Factual Statements Only**: Do not claim functionality "works" or is "tested" without explicit user verification.
*   **Commit Approval**: AI assistants MUST obtain explicit user approval before any `git commit` or `git push` operations.

### 3.3. Deployment

#### GitHub Actions FTPS Deployment
- **Trigger**: Automatically deploys on push to `main` branch or manual trigger.
- **Protocol**: Uses FTPS (not SFTP).
- **Secrets**: Requires `SFTP_HOST`, `SFTP_USERNAME`, `SFTP_PASSWORD`, `SFTP_REMOTE_PATH` repository secrets.
- **Exclusions**: Excludes `dev/`, `docs/`, `.git*`, `.github/**`, etc.

#### Docker Development Environment
- A `Dockerfile` is provided for creating a local development environment with PHP, Apache, and MariaDB.
- Use `docker build -t qualia-nss .` and `docker run -d -p 8080:80 -v "$(pwd)":/var/www/html qualia-nss`.
- This is for development only and enables features like the PHP-based wiki TOC generator.
