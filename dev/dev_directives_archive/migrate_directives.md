# Development Rules Migration Guide

**Purpose**: Transition from 11 scattered directive files to consolidated structure  
**Status**: Migration Plan  
**Execute**: After reviewing the new structure

---

## 🎯 Migration Overview

### Before (Current State)
```
dev/dev_directives/ (11 files, 2,059 lines)
├── workflow-pipeline.md (463 lines) - Primary workflow
├── modular_architecture_guide.md (323 lines) - Architecture
├── hybrid-development-workflow.md (304 lines) - AI collaboration  
├── documentation_pipeline.md (207 lines) - Docs requirements
├── colormap_architecture.md (186 lines) - Colormap rules
├── staged_development_methodology.md (180 lines) - Development phases
├── web_components_curation.md (127 lines) - Component standards
├── ui-ux-directive.md (110 lines) - UI/UX rules
├── ai_task_workflow.md (84 lines) - Task management
├── safe_development_workflows.md (51 lines) - Security
└── claude_code_restrictions.md (24 lines) - Tool limits
```

### After (Proposed State)  
```
AGENTS.md - Universal AI instructions (All assistants)
dev/
├── DEV_RULES_INDEX.md - Master navigation hub
├── core/ (Primary rules - daily use)
│   ├── MASTER_WORKFLOW.md (~650 lines)
│   ├── UI_UX_STANDARDS.md (~240 lines) 
│   └── ARCHITECTURE_GUIDE.md (~530 lines)
└── specialized/ (Domain-specific rules)
    ├── colormap_architecture.md (186 lines)
    ├── hybrid-development-workflow.md (304 lines)
    ├── safe_development_workflows.md (51 lines)
    └── claude_code_restrictions.md (24 lines)
```

---

## 🔄 Migration Steps

### Phase 1: Create Core Consolidated Files

#### Step 1.1: Create MASTER_WORKFLOW.md
```bash
# Consolidate these files:
cat dev/dev_directives/workflow-pipeline.md > dev/core/MASTER_WORKFLOW.md
echo "\n---\n## Staged Development (Absorbed)" >> dev/core/MASTER_WORKFLOW.md  
cat dev/dev_directives/staged_development_methodology.md >> dev/core/MASTER_WORKFLOW.md
echo "\n---\n## AI Task Management (Absorbed)" >> dev/core/MASTER_WORKFLOW.md
cat dev/dev_directives/ai_task_workflow.md >> dev/core/MASTER_WORKFLOW.md
```

#### Step 1.2: Create UI_UX_STANDARDS.md  
```bash
# Consolidate these files:
cat dev/dev_directives/ui-ux-directive.md > dev/core/UI_UX_STANDARDS.md
echo "\n---\n## Web Components Standards (Absorbed)" >> dev/core/UI_UX_STANDARDS.md
cat dev/dev_directives/web_components_curation.md >> dev/core/UI_UX_STANDARDS.md
```

#### Step 1.3: Create ARCHITECTURE_GUIDE.md
```bash
# Consolidate these files:  
cat dev/dev_directives/modular_architecture_guide.md > dev/core/ARCHITECTURE_GUIDE.md
echo "\n---\n## Documentation Pipeline (Absorbed)" >> dev/core/ARCHITECTURE_GUIDE.md
cat dev/dev_directives/documentation_pipeline.md >> dev/core/ARCHITECTURE_GUIDE.md
```

### Phase 2: Move Specialized Rules
```bash
# Create specialized directory
mkdir -p dev/specialized/

# Move domain-specific files (keep as-is)
mv dev/dev_directives/colormap_architecture.md dev/specialized/
mv dev/dev_directives/hybrid-development-workflow.md dev/specialized/  
mv dev/dev_directives/safe_development_workflows.md dev/specialized/
mv dev/dev_directives/claude_code_restrictions.md dev/specialized/
```

### Phase 3: Archive Old Files
```bash  
# Create archive directory
mkdir -p dev/dev_directives_archive/

# Move absorbed files to archive
mv dev/dev_directives/workflow-pipeline.md dev/dev_directives_archive/
mv dev/dev_directives/staged_development_methodology.md dev/dev_directives_archive/
mv dev/dev_directives/ai_task_workflow.md dev/dev_directives_archive/
mv dev/dev_directives/ui-ux-directive.md dev/dev_directives_archive/
mv dev/dev_directives/web_components_curation.md dev/dev_directives_archive/  
mv dev/dev_directives/modular_architecture_guide.md dev/dev_directives_archive/
mv dev/dev_directives/documentation_pipeline.md dev/dev_directives_archive/

# Remove empty dev_directives directory
rmdir dev/dev_directives/
```

---

## ✅ Validation Checklist

### After Migration - Verify These Work
- [ ] **AGENTS.md** - AI assistants can understand project structure
- [ ] **DEV_RULES_INDEX.md** - Easy navigation to all rules
- [ ] **dev/core/MASTER_WORKFLOW.md** - Complete development process
- [ ] **dev/core/UI_UX_STANDARDS.md** - All UI/UX and component rules  
- [ ] **dev/core/ARCHITECTURE_GUIDE.md** - System architecture and documentation
- [ ] **dev/specialized/** - Domain-specific rules preserved

### Update References
- [ ] Update CLAUDE.md → Point to AGENTS.md  
- [ ] Update GEMINI.md → Point to AGENTS.md
- [ ] Update any documentation links to old dev_directives/
- [ ] Update workflow references in other files
- [ ] Test AI assistant understanding with new structure

---

## 🎯 Benefits After Migration

### For AI Assistants
- ✅ Single source of truth (AGENTS.md) - no confusion between Claude/Gemini instructions
- ✅ Clear rule hierarchy - know which file to reference for what purpose  
- ✅ Reduced context switching - consolidated related rules together
- ✅ Easy navigation - master index with clear usage guide

### For Human Developers  
- ✅ 36% reduction in files to maintain (11 → 7 files)
- ✅ Clear separation: core rules vs specialized rules  
- ✅ Master index for quick rule lookup
- ✅ Consolidated related concepts - no rule hunting

### For Project Maintenance
- ✅ Easier rule consistency - fewer files to sync
- ✅ Clearer ownership - core vs specialized rule domains
- ✅ Better version control - fewer merge conflicts
- ✅ Future-ready - scalable structure for new rules

---

## ⚠️ Migration Warnings

### Do NOT Execute Until
- [ ] Review AGENTS.md for completeness vs CLAUDE.md/GEMINI.md
- [ ] Validate DEV_RULES_INDEX.md covers all use cases
- [ ] Confirm no critical rules would be lost in consolidation
- [ ] Test AI assistant understanding with sample questions

### Backup Strategy  
```bash
# Create full backup before migration
cp -r dev/ dev_backup_$(date +%Y%m%d)/
git add . && git commit -m "backup: dev_directives before consolidation"
```

### Rollback Plan
```bash
# If migration fails, restore from backup
rm -rf dev/
mv dev_backup_$(date +%Y%m%d)/ dev/
git add . && git commit -m "rollback: restore original dev_directives"
```

---

**Execute this migration when ready to simplify your development rules structure. The new system will be much easier for both AI assistants and human developers to navigate and maintain.**

*Migration Guide | Transition to consolidated development rules structure*