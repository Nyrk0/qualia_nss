# 00: Rules Index & Session Startup

**Purpose**: Central index for all development rules and session startup confirmation  
**Last Updated**: 2025-09-05  
**Status**: ACTIVE

---

## 🚀 Session Startup Status

**✅ Context Loaded**: Project rules loaded successfully  
**🏗️ Architecture**: Modular SPA with Vanilla JavaScript (no frameworks, no build process)  
**📁 Working Directory**: `/Users/admin/Documents/Developer/qualia_nss`  

---

## 🚨 Critical Rules (Always Active)

**🛑 MANDATORY USER APPROVAL BEFORE COMMITS**
- Get explicit user approval before ANY `git commit` or `git push`
- Process: Ask "May I commit and push these changes?" and wait for clear "yes"

**⚠️ Development Restrictions:**
- **No HTTP servers for testing** - analyze code only, user verifies functionality
- **Theme-first styling** - use CSS variables from `src/styles/core.css`, no hardcoded values
- **ES6+ required** in `/src/` (except `/standalone-modules/` allows prototyping freedom)
- **Inline styles forbidden** in main app | ALLOWED in `/standalone-modules/` for prototyping

---

## 📚 Core Rule Files (Load Order)

### Development Rules:
1. **`01_CORE_WORKFLOW.md`** - Development workflow, safety protocols, debugging methodologies
2. **`02_UI_UX_STANDARDS.md`** - UI/UX standards, theme-first principle, styling rules
3. **`03_ARCHITECTURE_GUIDE.md`** - Modular architecture, JS/CSS structure, documentation standards

### Critical Context:
4. **`dev/dev_stages/`** - KISS methodology documentation (MUST NEVER be deleted/moved)
   - Contains essential iterative development patterns and architectural decisions
   - Provides implementation references for all development stages

---

## 🎯 Development Workflow Quick Reference

1. **Load Context**: Execute `/Users/admin/Documents/Developer/qualia_nss/load-context.sh`
2. **Plan Tasks**: Use TodoWrite tool for complex work  
3. **Follow Architecture**: Modular SPA patterns, theme-first styling
4. **KISS Methodology**: Consult `dev/dev_stages/` for implementation patterns
5. **Get Approval**: Before any git operations

---

## 📋 Maintenance Instructions

**Adding New Rule Files:**
1. Create new file as `dev/RULES/##_FILENAME.md` 
2. Add entry to "Core Rule Files" section above
3. Update "Last Updated" date
4. Test with `load-context.sh` script

**File Naming Convention:**
- `00_RULES_INDEX.md` - This index file
- `01-03_*.md` - Core development rules  
- `##_*.md` - Additional specialized rules

**CRITICAL**: The `dev/dev_stages/` directory provides essential KISS methodology context and MUST be preserved.

---

**🎯 Ready for development tasks.**