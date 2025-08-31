# Development Rules Index

**Master Index for Qualia-NSS Development Standards**  
**Version**: 2.0  
**Date**: 2025-08-31  
**Status**: Active

---

## 📋 Quick Reference

### Primary Rules (Essential Reading)
| Document | Purpose | Status | Lines |
|----------|---------|--------|--------|
| **[workflow-pipeline.md](dev_directives/workflow-pipeline.md)** | Complete development workflow covering all coding scenarios | ✅ Active | 463 |
| **[ui-ux-directive.md](dev_directives/ui-ux-directive.md)** | UI/UX standards and theme system requirements | ✅ Active | 110 |
| **[modular_architecture_guide.md](dev_directives/modular_architecture_guide.md)** | Module system and SPA architecture patterns | ✅ Active | 323 |

### Specialized Rules (Domain-Specific)
| Document | Purpose | Status | Lines |
|----------|---------|--------|--------|
| **[colormap_architecture.md](dev_directives/colormap_architecture.md)** | Colormap separation rules (module vs component) | ✅ Active | 186 |
| **[web_components_curation.md](dev_directives/web_components_curation.md)** | Web component standards and patterns | ✅ Active | 127 |
| **[documentation_pipeline.md](dev_directives/documentation_pipeline.md)** | Documentation requirements and JSDoc standards | ✅ Active | 207 |

### Workflow & Process Rules
| Document | Purpose | Status | Lines |
|----------|---------|--------|--------|
| **[hybrid-development-workflow.md](dev_directives/hybrid-development-workflow.md)** | AI-human collaboration workflow | ✅ Active | 304 |
| **[staged_development_methodology.md](dev_directives/staged_development_methodology.md)** | Phased development approach | ✅ Active | 180 |
| **[ai_task_workflow.md](dev_directives/ai_task_workflow.md)** | AI assistant task management | ✅ Active | 84 |

### Safety & Restrictions
| Document | Purpose | Status | Lines |
|----------|---------|--------|--------|
| **[safe_development_workflows.md](dev_directives/safe_development_workflows.md)** | Security and safety protocols | ✅ Active | 51 |
| **[claude_code_restrictions.md](dev_directives/claude_code_restrictions.md)** | Claude Code specific limitations | ✅ Active | 24 |

---

## 🎯 Usage Guide for AI Assistants

### For New Tasks - Read These First
1. **[workflow-pipeline.md](dev_directives/workflow-pipeline.md)** - Complete development process
2. **[ui-ux-directive.md](dev_directives/ui-ux-directive.md)** - Mandatory styling standards
3. **[modular_architecture_guide.md](dev_directives/modular_architecture_guide.md)** - System architecture

### For Specialized Work
- **Component Development**: [web_components_curation.md](dev_directives/web_components_curation.md)
- **Colormap Work**: [colormap_architecture.md](dev_directives/colormap_architecture.md)  
- **Documentation**: [documentation_pipeline.md](dev_directives/documentation_pipeline.md)
- **AI Collaboration**: [hybrid-development-workflow.md](dev_directives/hybrid-development-workflow.md)

### For Process Questions
- **Safety Concerns**: [safe_development_workflows.md](dev_directives/safe_development_workflows.md)
- **Tool Limitations**: [claude_code_restrictions.md](dev_directives/claude_code_restrictions.md)
- **Task Management**: [ai_task_workflow.md](dev_directives/ai_task_workflow.md)

---

## 🔄 Consolidation Recommendations

### Phase 1: Core Consolidation (Recommended)
Merge related directives to reduce complexity:

```
workflow-pipeline.md (463 lines)
├─ Absorb: staged_development_methodology.md (180 lines)  
├─ Absorb: ai_task_workflow.md (84 lines)
└─ Result: MASTER_WORKFLOW.md (~650 lines)

ui-ux-directive.md (110 lines)
├─ Absorb: web_components_curation.md (127 lines)
└─ Result: UI_UX_STANDARDS.md (~240 lines)

modular_architecture_guide.md (323 lines)  
├─ Absorb: documentation_pipeline.md (207 lines)
└─ Result: ARCHITECTURE_GUIDE.md (~530 lines)
```

### Phase 2: Specialized Rules (Keep Separate)
```
colormap_architecture.md (186 lines) - Domain-specific, keep separate
hybrid-development-workflow.md (304 lines) - Process-specific, keep separate  
safe_development_workflows.md (51 lines) - Security-specific, keep separate
claude_code_restrictions.md (24 lines) - Tool-specific, keep separate
```

### Final Structure Recommendation
```
dev/
├── DEV_RULES_INDEX.md           # This file - master navigation
├── MASTER_WORKFLOW.md           # Complete development process (~650 lines)
├── UI_UX_STANDARDS.md           # All UI/UX and component rules (~240 lines)
├── ARCHITECTURE_GUIDE.md        # System architecture & docs (~530 lines)
└── specialized/
    ├── colormap_architecture.md      # Colormap separation rules
    ├── hybrid-development-workflow.md # AI-human collaboration  
    ├── safe_development_workflows.md # Security protocols
    └── claude_code_restrictions.md   # Tool-specific limits
```

**Total Reduction**: 11 files → 7 files (36% reduction)  
**Complexity Reduction**: Related rules consolidated, easier navigation

---

## 🚀 Implementation Priority

### High Priority (Do Immediately)
- [ ] **workflow-pipeline.md**: Already comprehensive, use as primary reference
- [ ] **ui-ux-directive.md**: Critical for all UI work, well-structured
- [ ] **colormap_architecture.md**: Specialized but essential for visual components

### Medium Priority (Next Sprint)  
- [ ] Consolidate workflow files into MASTER_WORKFLOW.md
- [ ] Merge UI/UX and component rules into UI_UX_STANDARDS.md
- [ ] Update AGENTS.md references to point to consolidated files

### Low Priority (Future Maintenance)
- [ ] Archive redundant files after consolidation
- [ ] Update all documentation references
- [ ] Create automated validation for rule compliance

---

## 📝 Maintenance Protocol

### Monthly Review
- [ ] Check for directive conflicts or overlaps
- [ ] Validate rule adherence across codebase  
- [ ] Update line counts and consolidation opportunities
- [ ] Sync AGENTS.md with current rule structure

### Quarterly Assessment
- [ ] Evaluate consolidation effectiveness
- [ ] Identify new rule requirements from development patterns
- [ ] Update specialized rules based on domain evolution
- [ ] Review AI assistant feedback on rule clarity

---

**Use this index as your navigation hub for all Qualia-NSS development standards. Always check the most recent version before starting work.**

*Development Rules Index v2.0 | Master navigation for all development standards*