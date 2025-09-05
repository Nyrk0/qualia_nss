# AGENTS.md - AI Assistant Entry Point

**Project**: Qualia-NSS - Web-based Audio Analysis Toolkit  
**Last Updated**: 2025-09-05

---

## 🚀 Quick Start for AI Assistants

**For complete project context, execute this command:**

```bash
/Users/admin/Documents/Developer/qualia_nss/load-context.sh
```

This script loads all current development rules, architecture guides, and critical instructions dynamically.

---

## 🎯 Project Summary

Qualia-NSS is a professional web-based audio analysis toolkit built as a **modular SPA with vanilla JavaScript** (no frameworks, no build process).

**Core Technologies**: Vanilla JS (ES6+), Web Audio API, WebGL, Bootstrap 5 CSS-only

---

## 🚨 Critical Rules (Always Active)

### **MANDATORY USER APPROVAL BEFORE COMMITS** ⚠️
- **CRITICAL**: Get explicit user approval before ANY `git commit` or `git push`
- **Process**: Ask "May I commit and push these changes?" and wait for clear "yes"

### **Key Restrictions**
- **No HTTP servers for testing** - analyze code only, user verifies functionality
- **Theme-first styling** - use CSS variables from `src/styles/core.css`, no hardcoded values
- **ES6+ required** in `/src/` (except `/standalone-modules/` which allows prototyping freedom)

---

## 📋 Development Workflow

1. **Load full context**: Run the load-context.sh script above
2. **Plan tasks**: Use TodoWrite tool for complex work
3. **Follow architecture**: Modular SPA patterns, no inline styles
4. **Get approval**: Before any git operations

**Execute the load-context.sh script for complete project guidelines.**
