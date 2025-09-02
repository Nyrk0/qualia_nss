# 03.3: Specialized Systematic Debugging Methodology

**Version:** 1.0
**Date:** 2025-08-31
**Status:** ACTIVE

## 1. Core Principle

When debugging persistent issues that resist initial fixes, **STOP and SYSTEMATIZE** before continuing with ad-hoc solutions. This structured approach prevents wasted time on incorrect assumptions and leads to faster, more effective resolutions.

## 2. The "Rombo Decision Maker" Framework

This framework dictates when to switch from standard debugging to a systematic protocol.

### Decision Point 1: Issue Persistence Check
**Question:** Has this issue persisted after 2+ attempted fixes?
*   **NO** → Continue with standard debugging.
*   **YES** → **MANDATORY** → Activate Systematic Debugging Protocol.

### Decision Point 2: Root Cause Analysis
**Question:** Do we understand the *exact* root cause of this issue?
*   **YES** → Proceed with a targeted fix.
*   **NO** → **MANDATORY** → Execute the Deep Investigation Protocol.

---

## 3. Systematic Debugging Protocol

### Phase 1: Issue Documentation (MANDATORY)
1.  **Create a Critical Issue Report**:
    *   Document all attempted fixes and their results.
    *   Identify patterns in failure (e.g., "always fails on mobile").
    *   Capture exact error symptoms with screenshots or logs.
    *   List all assumptions made so far.
2.  **Request External Perspective**:
    *   Assign the issue to an external agent (like another AI) or a peer for a fresh look.
    *   Clearly document the investigation scope.

### Phase 2: Deep Investigation (MANDATORY)

#### The "Source Truth Principle"
The first step is *always* to verify the integrity of the source data before debugging the code that processes it.

1.  **Source Truth Verification**:
    *   Check the actual source data/files (e.g., Markdown content, database records, config files).
    *   Verify assumptions about data integrity (e.g., character encoding, file format).
    *   Trace the complete data flow pipeline from source to output.
    *   Log intermediate states at each processing step to pinpoint where corruption occurs.
2.  **Environment Analysis**:
    *   Test across different environments (e.g., browsers, operating systems).
    *   Verify library versions and configurations.
    *   Check for external dependencies that might be causing issues.

### Phase 3: Alternative Approach Evaluation
1.  **Research Alternative Solutions**:
    *   Investigate different libraries, tools, or architectural patterns.
    *   Evaluate the pros and cons of each alternative.
2.  **Proof of Concept (PoC)**:
    *   Create minimal, isolated test cases to validate assumptions about a potential solution.
    *   Compare the results of the PoC with the current failing approach.

---

## 4. Quick Decision Checklist

Before spending more time on a persistent bug, answer these questions:

*   [ ] **Persistence Check**: Has this bug survived two or more fix attempts?
*   [ ] **Source Truth Check**: Have I personally verified that the source data/content is 100% correct and not corrupted?
*   [ ] **External Perspective Check**: Have I requested a review from another person or AI agent?
*   [ ] **Alternative Approach Check**: Have I researched and considered a fundamentally different way to solve this?

**If ANY checkbox is unchecked → STOP and complete that step before proceeding.**
