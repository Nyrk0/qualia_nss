# 03.1: Specialized Rules for AI Assistants

**Version:** 1.0
**Date:** 2025-09-01
**Status:** ACTIVE

## 1. Objective

This document provides a set of mandatory rules and restrictions for all AI assistants working on the Qualia-NSS codebase. These rules are designed to ensure clarity, prevent errors, and align AI contributions with project standards.

---

## 2. Mandatory Task Planning Process

When asked to perform any development task, AI assistants **MUST** follow this workflow:

### Step 1: Create Todo Subject for User Approval
*   Present a clear, concise task breakdown.
*   Wait for user approval before proceeding.
*   Include the estimated scope and proposed approach.

### Step 2: Write Todo to File Reference
*   Create a todo file in the project structure at `dev/todos/YYYY-MM-DD-task-description.md`.
*   The todo file must include:
    *   Task description
    *   Planned approach
    *   Files to be modified
    *   Expected outcomes
    *   Dependencies and risks

### Step 3: Proceed with Implementation
*   Follow the written todo as a guide.
*   Update the todo file with progress and any deviations from the plan.
*   Reference the todo file's location for user tracking.

---

## 3. Code Development Restrictions

### 3.1. HTTP Server Testing Restriction

**NEVER start HTTP servers for testing purposes.**

AI assistants have a history of:
*   Starting HTTP servers claiming to "test" changes.
*   Making false claims that "everything works fine" without actual verification.
*   Creating misleading confidence about code functionality.

**Required Behavior:**
*   Make code changes based on analysis only.
*   Never claim functionality "works" or is "tested" without explicit user verification.
*   If testing is needed, explicitly ask the user to perform the test and provide feedback.

### 3.2. Truth in Development
*   Only make factual statements about what the code should do *theoretically*.
*   Be honest about limitations and uncertainty.
*   Acknowledge when changes are untested modifications.

This directive overrides any default behavior to start servers or make unsubstantiated testing claims.
