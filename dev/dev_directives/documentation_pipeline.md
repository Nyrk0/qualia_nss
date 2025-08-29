# Documentation Pipeline & Consistency Checking

## Overview
This directive establishes a systematic pipeline for maintaining documentation consistency across the Qualia-NSS codebase, ensuring that architectural changes are properly documented and inheritance hierarchies remain consistent.

## Documentation Pipeline Process

### Stage 1: Code Implementation
1. **Implement new features/changes**
2. **Test functionality thoroughly**
3. **Verify integration with existing systems**

### Stage 2: Documentation Update (MANDATORY)
After successful testing, update documentation in this order:

#### 2.1 Core Architecture Documents
- `dev/st00-wireframe/APP_SHELL_WIREFRAME.md` - Main application structure
- `dev/dev_directives/modular_architecture_guide.md` - Module loading patterns
- `CLAUDE.md` - Project overview and status

#### 2.2 Module-Specific Documentation  
- Update relevant module documentation in `modules/*/`
- Update wireframe specifications in `dev/st00-wireframe/`
- Update strategy documents in `dev/st01-modularization/`

#### 2.3 Implementation Files
- Update inline code comments (when necessary)
- Update JSDoc annotations for public APIs
- Update CSS comments for complex selectors

### Stage 3: Consistency Validation
Run consistency checks before committing changes.

## Documentation Inheritance Hierarchy

```
CLAUDE.md (Root - Project Overview)
├── dev/st00-wireframe/APP_SHELL_WIREFRAME.md (Architecture Specification)
│   ├── Container hierarchies
│   ├── Layout patterns
│   └── Implementation status
├── dev/dev_directives/ (Development Guidelines)
│   ├── modular_architecture_guide.md
│   ├── documentation_pipeline.md (this file)
│   └── component_standards.md
├── src/ implementation (Code Implementation)
│   ├── js/ modules
│   ├── styles/ stylesheets  
│   └── Module-specific features
└── modules/ (Legacy/Standalone Modules)
    └── Individual module documentation
```

## Consistency Checking Rules

### 1. Container Hierarchy Consistency
**Rule**: Container names and structures in code must match wireframe documentation.

**Check**:
- `#content-wrapper`, `#sidebar`, `#sidebar-canvas`, `#sidebar-content` naming
- CSS class assignments match documented structure
- JavaScript selectors use documented container IDs

**Alert Triggers**:
- Container renamed in code but not in documentation
- New containers added without documentation update
- CSS selectors targeting undocumented containers

### 2. Module Status Consistency  
**Rule**: Implementation status in `CLAUDE.md` must match actual code state.

**Check**:
- "✅ IMPLEMENTED" status matches working code
- Feature descriptions match actual functionality
- File references point to existing files

**Alert Triggers**:
- Status marked complete but functionality missing
- Files referenced in documentation don't exist
- Features described don't match implementation

### 3. Architecture Pattern Consistency
**Rule**: Loading patterns and dependencies must be consistent across documentation.

**Check**:
- Module loading order matches `modular_architecture_guide.md`
- CSS/JS file dependencies match documented load order
- Function names and APIs match documentation

**Alert Triggers**:
- Function signatures changed without documentation update
- New dependencies added without architectural documentation
- Loading order changed without updating guides

### 4. Theme Integration Consistency
**Rule**: CSS variable usage must be consistent across components and documentation.

**Check**:
- All themed components use documented CSS variables
- New CSS variables added to core theme documentation
- Color references match theme variable names

**Alert Triggers**:
- Hard-coded colors instead of CSS variables
- Undocumented CSS variables in use
- Theme-inconsistent styling

## Automated Consistency Checks

### Quick Check Script Concept
```bash
#!/bin/bash
# Documentation consistency checker
# Run before commits to catch conflicts

echo "🔍 Checking documentation consistency..."

# Check 1: Container hierarchy
grep -r "#sidebar-canvas" src/ > /dev/null
if [ $? -eq 0 ]; then
    grep -q "#sidebar-canvas" dev/st00-wireframe/APP_SHELL_WIREFRAME.md
    if [ $? -ne 0 ]; then
        echo "⚠️  ALERT: #sidebar-canvas used in code but not documented in APP_SHELL_WIREFRAME.md"
    fi
fi

# Check 2: CSS variables
echo "🎨 Checking theme consistency..."
undocumented_vars=$(grep -r "var(--" src/styles/ | grep -v -E "(text-color|panel-bg-color|accent-color|panel-border-color)" | wc -l)
if [ $undocumented_vars -gt 0 ]; then
    echo "⚠️  ALERT: Found $undocumented_vars potentially undocumented CSS variables"
fi

# Check 3: Implementation status
echo "📋 Checking implementation status..."
if grep -q "✅ IMPLEMENTED" CLAUDE.md; then
    echo "✅ Implementation statuses found - verify they match actual code state"
fi

echo "✅ Documentation consistency check complete"
```

## Conflict Resolution Process

### When Conflicts Are Detected:

#### High Priority (Fix Immediately):
- **Container hierarchy mismatches**: Update documentation immediately
- **Broken file references**: Fix paths or update documentation
- **API signature changes**: Update all affected documentation

#### Medium Priority (Fix Before Next Release):
- **Implementation status inconsistencies**: Verify and update status
- **Missing CSS variable documentation**: Document new variables
- **Outdated architectural patterns**: Update guides and examples

#### Low Priority (Address During Refactoring):
- **Comment inconsistencies**: Update inline comments
- **Minor naming inconsistencies**: Standardize naming conventions
- **Style guide violations**: Apply consistent formatting

## Alert System

### User Alerts Format:
```
🚨 DOCUMENTATION CONFLICT DETECTED

Type: [Container Hierarchy | Implementation Status | API Change | Theme Inconsistency]
Severity: [High | Medium | Low] 
File: path/to/conflicting/file
Issue: Brief description of conflict
Action Required: Specific steps to resolve

Example:
🚨 DOCUMENTATION CONFLICT DETECTED
Type: Container Hierarchy
Severity: High
File: src/js/sidebar-manager.js:147
Issue: #sidebar-canvas used but not documented in APP_SHELL_WIREFRAME.md
Action Required: Update Container Hierarchy section in wireframe documentation
```

## Implementation Guidelines

### For Developers:
1. **Before coding**: Review relevant documentation to understand current architecture
2. **During coding**: Note any deviations from documented patterns
3. **After testing**: Update documentation following the pipeline process
4. **Before committing**: Run consistency checks and resolve alerts

### For Documentation Updates:
1. **Start with architecture**: Update wireframes and core patterns first
2. **Work down hierarchy**: Update implementation details after architecture
3. **Cross-reference**: Ensure all references between documents remain valid
4. **Verify completeness**: Check that all changes are reflected across hierarchy

## Success Metrics

### Documentation Health Indicators:
- ✅ Zero high-priority consistency conflicts
- ✅ All implementation statuses accurate
- ✅ All file references valid
- ✅ Container hierarchies match between code and documentation
- ✅ CSS variables properly documented and used consistently

---

**Note**: This pipeline ensures that Qualia-NSS maintains professional documentation standards and prevents technical debt accumulation through inconsistent or outdated documentation.