# Qualia-NSS Development Workflow Pipeline

**Version:** 1.0  
**Date:** 2025-08-31  
**Status:** Active

## 1. Objective

This document establishes the complete development workflow pipeline for maintaining architectural and UI/UX coherence across all Qualia-NSS development activities. This pipeline ensures consistency, quality, and adherence to established directives.

## 2. Pre-Development Phase

### 2.1. Requirements Analysis
Before starting any development task:

1. **Review Existing Directives**
   - [ ] Read `/dev/dev_directives/ui-ux-directive.md`
   - [ ] Check `/dev/st00-wireframe/UI-UX-Audit-and-Proposal.md`
   - [ ] Review relevant implementation plans in `/dev/`

2. **Architectural Assessment** 
   - [ ] Identify which modules/components will be affected
   - [ ] Determine if new CSS variables are needed in `theme.css`/`core.css`
   - [ ] Check if changes align with existing patterns

3. **Impact Analysis**
   - [ ] List all files that need modification
   - [ ] Identify potential breaking changes
   - [ ] Assess testing requirements

### 2.2. Planning Phase

1. **Create Task List**
   - [ ] Use `TodoWrite` tool to create structured task breakdown
   - [ ] Include specific sub-tasks with measurable completion criteria
   - [ ] Set priorities and dependencies

2. **Design Alignment Check**
   - [ ] Verify semantic HTML hierarchy (H1 → H2 → H3)
   - [ ] Confirm CSS variables usage (no hardcoded values)
   - [ ] Ensure Bootstrap accordion pattern consistency

## 3. Development Phase

### 3.1. Coding Standards Enforcement

#### CSS Development Rules (MANDATORY)
```css
/* ✅ CORRECT - Use theme variables */
.my-component {
    background-color: var(--panel-bg-color);
    color: var(--text-color);
    padding: var(--spacing-md);
    border-radius: var(--spacing-xs);
}

/* ❌ INCORRECT - Hardcoded values forbidden */
.my-component {
    background-color: #1e1e1e;
    color: #e0e0e0;
    padding: 16px;
    border-radius: 4px;
}
```

#### HTML Standards (MANDATORY)
```html
<!-- ✅ CORRECT - Semantic hierarchy -->
<h1>Module Name</h1>
<h2>Major Section</h2>
<h3>Subsection</h3>

<!-- ✅ CORRECT - Bootstrap accordion pattern -->
<div class="accordion" id="sidebarAccordion">
    <div class="accordion-item">
        <h2 class="accordion-header" id="heading-section">
            <button class="accordion-button" type="button" data-bs-toggle="collapse" data-bs-target="#collapse-section">
                Section Title
            </button>
        </h2>
        <div id="collapse-section" class="accordion-collapse collapse show">
            <div class="accordion-body">
                Content here
            </div>
        </div>
    </div>
</div>

<!-- ❌ INCORRECT - Inline styles forbidden -->
<div style="padding: 10px; background: #333;">Content</div>
```

#### JavaScript Standards (MANDATORY)
```javascript
// ✅ CORRECT - Class-based state management
element.classList.add('is-active');
element.classList.remove('is-disabled');

// ❌ INCORRECT - Direct style manipulation forbidden
element.style.color = 'red';
element.style.display = 'none';
```

### 3.2. Module Development Pattern

#### New Module Checklist
1. **Module Class Structure**
   ```javascript
   class NewModuleModule {
       constructor() {
           // Initialize state
       }
       
       async init() {
           // Setup UI, events, load data
           console.log('✓ NewModule initialized');
       }
       
       destroy() {
           // Cleanup resources
           console.log('🗑️ NewModule destroyed');
       }
   }
   
   // Global exposure required
   window.NewModuleModule = NewModuleModule;
   ```

2. **Registration Requirements**
   - [ ] Add HTML template to `module-loader.js` → `moduleHTML` object
   - [ ] Add sidebar template to `sidebar-manager.js` → `sidebarHTML` object  
   - [ ] Add navigation function to `navigation.js`
   - [ ] Create module-specific CSS in `src/styles/modules/`
   - [ ] Add CSS link to `index.html`

3. **Sidebar Structure (MANDATORY)**
   ```html
   <!-- Must follow this exact pattern -->
   <div id="sidebar-canvas">
       <div id="sidebar-content">
           <div class="accordion" id="sidebarAccordion">
               <!-- Accordion items here -->
           </div>
       </div>
   </div>
   ```

### 3.3. Component Development Pattern

#### Web Component Standards
1. **Hybrid ES6 Export Pattern**
   ```javascript
   // ES6 exports for modern usage
   export { ComponentName };
   
   // Global compatibility fallback
   if (typeof window !== 'undefined') {
       window.ComponentName = ComponentName;
   }
   ```

2. **Component Registry Integration**
   ```javascript
   // Register component in component-registry.js
   registry.register('component-name', {
       path: '/src/components/component-name/component-name.js',
       globalName: 'ComponentName'
   });
   ```

### 3.4. Theme System Integration

#### CSS Variable Definition Process
1. **Theme Variables Location Priority**
   ```
   1st Priority: core.css (main theme variables)
   2nd Priority: theme.css (deprecated, being phased out)
   3rd Priority: module-specific CSS (component-specific only)
   ```

2. **Variable Naming Convention**
   ```css
   /* Core colors */
   --primary-color: #28a745;
   --primary-color-hover: #218838;
   --primary-color-translucent: rgba(40, 167, 69, 0.1);
   
   /* Text colors */
   --text-color: #e0e0e0;
   --muted-text-color: #888;
   --neutral-text-color: #aaa;
   
   /* Background colors */
   --bg-color: #121212;
   --panel-bg-color: #1e1e1e;
   --panel-border-color: #333;
   
   /* Spacing (based on 8px unit) */
   --spacing-xs: 4px;
   --spacing-sm: 8px;
   --spacing-md: 16px;
   --spacing-lg: 32px;
   ```

## 4. Testing & Quality Assurance Phase

### 4.1. Mandatory Testing Checklist

#### UI/UX Compliance Testing
- [ ] **No Hardcoded Values**: Search all CSS for hardcoded colors, spacing, fonts
- [ ] **No Inline Styles**: Verify no `style=""` attributes in HTML
- [ ] **Semantic Hierarchy**: Confirm H1 → H2 → H3 structure
- [ ] **Bootstrap Accordion**: Verify standard accordion pattern usage
- [ ] **Theme Variables**: All styling uses `var(--variable-name)`

#### Cross-Browser Testing
- [ ] Chrome (primary development browser)
- [ ] Firefox (Web Audio API compatibility)
- [ ] Safari (WebKit compatibility)
- [ ] Edge (Chromium compatibility)

#### Responsive Testing
- [ ] Desktop (1920x1080, 1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667, 414x896)

#### Mobile PWA Testing (Required for iOS Chrome)
- [ ] **iOS Safari**: Add to Home Screen functionality
- [ ] **iOS Chrome**: Full-screen behavior and safe area handling
- [ ] **Android Chrome**: PWA install prompt and full-screen mode
- [ ] **Touch Targets**: All interactive elements ≥44px minimum
- [ ] **Safe Areas**: Proper handling of notch/camera cutouts
- [ ] **Viewport Optimization**: Dynamic viewport height (100dvh)
- [ ] **Momentum Scrolling**: Smooth scrolling on iOS (-webkit-overflow-scrolling: touch)

#### Theme Testing
- [ ] Dark theme (default) - all components styled correctly
- [ ] Light theme - all components styled correctly
- [ ] Theme switching - smooth transitions, no broken styles

### 4.2. Automated Testing Tools

#### Built-in Test Suites
```bash
# Phase 1 ES6 Infrastructure Test
http://localhost:8080/src/core/es6-test.html

# Phase 2 Component System Test
http://localhost:8080/src/core/phase2-test.html

# Wiki Module Test
http://localhost:8080/src/wiki/test-wiki.html
```

#### Manual Testing Scripts
```javascript
// Console commands for quick testing
// Test theme variables
console.log(getComputedStyle(document.documentElement).getPropertyValue('--primary-color'));

// Test component loading
if (window.getComponentRegistry) {
    const registry = window.getComponentRegistry();
    console.log('Component registry status:', registry.getStatus());
}

// Test module loading
console.log('Current module:', window.currentModule);
console.log('Available modules:', Object.keys(window.moduleHTML));
```

## 5. Documentation Phase

### 5.1. Code Documentation Requirements

#### JavaScript Documentation (JSDoc)
```javascript
/**
 * @fileoverview Module description
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

/**
 * Class description
 * @class
 * @implements {ModuleInterface}
 */
class ModuleNameModule {
    /**
     * Method description
     * @param {string} parameter - Parameter description
     * @returns {Promise<void>} Promise resolving when complete
     */
    async methodName(parameter) {
        // Implementation
    }
}
```

#### CSS Documentation
```css
/**
 * Component Name - Brief description
 * Part of the Qualia-NSS modular CSS architecture
 * COMPLIANT with UI/UX Development Directive v1.0
 * @author Qualia-NSS Development Team
 * @version 1.0.0
 */

/* Section comments for organization */
/* Component State - Using theme variables only */
.component-class {
    /* Property comments for complex calculations */
    padding: calc(2 * var(--spacing-md)); /* Double standard spacing */
}
```

### 5.2. Wiki Documentation Updates

When adding new features, update corresponding wiki documentation:

1. **User Guide Updates**
   - [ ] Add new module to Getting Started guide
   - [ ] Create specific guide for complex features
   - [ ] Update workflow documentation

2. **Developer Documentation Updates**  
   - [ ] Update Architecture Overview for new patterns
   - [ ] Add API documentation for new components
   - [ ] Update development guides

## 6. Deployment & Maintenance Phase

### 6.1. **MANDATORY USER APPROVAL** (AI Assistants)

**CRITICAL REQUIREMENT**: AI assistants MUST obtain explicit user approval before ANY commit or push operations.

#### Pre-Commit Approval Process
1. **Present Changes Summary**
   - [ ] List all modified files with brief descriptions
   - [ ] Explain the purpose and impact of changes
   - [ ] Highlight any potential risks or breaking changes
   - [ ] Provide clear commit message preview

2. **Wait for Explicit Approval**
   - [ ] **STOP** - Do not proceed without user confirmation
   - [ ] Ask: "May I commit and push these changes?"
   - [ ] Accept only clear "yes", "approve", "commit", or "push" responses
   - [ ] If user says "no" or expresses concerns, address them first

3. **Only After Approval**
   - [ ] Execute `git add .`
   - [ ] Create descriptive commit message
   - [ ] Execute `git commit` with approved message
   - [ ] Execute `git push origin main`
   - [ ] Confirm successful deployment

#### Approval Required For
- [ ] **Any code modifications** - even minor fixes
- [ ] **Configuration changes** - CSS, JS, HTML, JSON files
- [ ] **New file creation** - documents, scripts, assets
- [ ] **File deletions or moves** - restructuring operations
- [ ] **Submodule updates** - wiki content changes

#### Emergency Exception Protocol
Only in critical system-breaking situations:
- [ ] Clearly state the emergency nature
- [ ] Explain immediate risks of not fixing
- [ ] Still request expedited approval before proceeding
- [ ] Document emergency decision rationale

### 6.2. Pre-Deployment Checklist

#### File Organization
- [ ] No orphaned files (unused CSS, JS, HTML)
- [ ] All assets properly referenced
- [ ] No debug console.log statements in production

#### Performance Check
- [ ] CSS file sizes reasonable (<50KB per module)
- [ ] JavaScript modules load without errors
- [ ] No memory leaks in audio contexts

#### Accessibility Compliance
- [ ] ARIA labels on interactive elements
- [ ] Keyboard navigation works
- [ ] Screen reader friendly HTML structure

### 6.2. Version Control Integration

#### Commit Message Standards
```
type(scope): brief description

feat(wiki): add comprehensive documentation system
fix(theme): resolve dark mode color inconsistencies  
refactor(accordion): standardize sidebar pattern across modules
docs(guide): update filter design tutorial
```

#### Pull Request Requirements
- [ ] All tests passing
- [ ] UI/UX directive compliance verified
- [ ] Documentation updated
- [ ] No breaking changes without migration plan

## 7. Continuous Improvement

### 7.1. Regular Audits

#### Monthly Architecture Review
- [ ] Review new CSS variables for consolidation opportunities
- [ ] Identify pattern violations that need refactoring
- [ ] Update workflow pipeline based on lessons learned

#### Quarterly UX Assessment
- [ ] User feedback integration
- [ ] Performance optimization opportunities
- [ ] Accessibility improvements

### 7.2. Directive Updates

When updating development directives:
1. [ ] Update this workflow pipeline accordingly
2. [ ] Create migration plan for existing code
3. [ ] Update all related documentation
4. [ ] Communicate changes to development team

## 8. Emergency Procedures

### 8.1. Critical Bug Response

For critical UI/UX issues:
1. **Immediate Assessment**
   - [ ] Identify scope of impact
   - [ ] Determine if theme variables are involved
   - [ ] Check for cascade effects on other modules

2. **Quick Fix Protocol**
   - [ ] Create hotfix branch
   - [ ] Apply minimal viable fix
   - [ ] Test across all affected modules
   - [ ] Deploy with monitoring

3. **Proper Resolution**
   - [ ] Plan comprehensive fix following this pipeline
   - [ ] Update directives if needed
   - [ ] Prevent recurrence through process improvement

### 8.2. Rollback Procedures

If deployment causes issues:
1. [ ] Identify specific commits causing problems
2. [ ] Assess impact on theme system
3. [ ] Execute selective rollback preserving data
4. [ ] Document lessons learned for pipeline improvement

---

## 9. Quick Reference Checklists

### 9.1. New Feature Development
```
□ Review existing directives and patterns
□ Create structured task list with TodoWrite
□ Follow semantic HTML hierarchy (H1→H2→H3)
□ Use only theme variables (no hardcoded values)
□ Implement standard Bootstrap accordion pattern
□ Add proper JSDoc documentation
□ Test across all browsers and themes
□ Update wiki documentation
□ Verify UI/UX directive compliance
□ Create comprehensive test coverage
```

### 9.2. Bug Fix Development
```
□ Identify root cause and affected components
□ Check if theme variables are involved
□ Apply fix using only theme variables
□ Test fix across all affected scenarios
□ Verify no regression in other modules
□ Document fix in commit message
□ Update tests to prevent recurrence
```

### 9.3. Documentation Update
```
□ Follow H1→H2→H3 semantic hierarchy
□ Use consistent emoji and formatting
□ Update both user and developer docs as needed
□ Verify all links work correctly
□ Test markdown rendering in wiki module
□ Ensure mobile-friendly formatting
```

---

**This workflow pipeline ensures architectural coherence and UI/UX consistency across all Qualia-NSS development activities.**

*Version 1.0 | Last Updated: 2025-08-31 | Next Review: 2025-09-30*
---

# Staged Development Methodology (Integrated)

# Staged Development Methodology

This document outlines the staged, iterative methodology used for the Qualia-NSS modularization project, designed to minimize risk and enable future revisits to any stage.

## Methodology Overview

The modularization project was approached using a **staged, incremental methodology** with clear checkpoints and rollback capabilities. Each stage builds upon the previous while maintaining system stability.

## Stage Structure

### Stage 01: Core Modularization ✅ COMPLETED
**Primary Focus**: Transform monolithic architecture into modular, maintainable structure

#### Sub-Stages Completed:

**01.1 - JavaScript Modularization** ✅
- **Input**: Monolithic `app.js` (600+ lines)
- **Output**: 5 modular files under `src/js/`
- **Methodology**: 
  - Safe development workflow with backups
  - Preserve original file as fallback
  - Maintain identical functionality during refactor
  - Test loading order dependencies

**01.2 - CSS Modularization** ✅  
- **Input**: Monolithic `style.css` (800+ lines)
- **Output**: 8 modular files under `src/styles/`
- **Methodology**:
  - Preserve CSS cascade and specificity
  - Maintain theme system integrity
  - Test responsive behavior across breakpoints

**01.3 - Module Integration** ✅
- **Input**: Standalone spectrogram module
- **Output**: Integrated modular spectrogram with advanced sidebar
- **Methodology**:
  - Convert without losing WebGL 3D functionality
  - Implement advanced accordion sidebar from wireframes
  - Ensure proper module loader integration

## Safe Development Principles

### 1. **Backup Strategy**
```bash
# Before any major changes
cp app.js app.js_bckp
cp style.css style.css_bckp
```

### 2. **Incremental Implementation**
- Work on one file/module at a time
- Test after each significant change
- Maintain working state at each checkpoint

### 3. **Fallback Capability**
- Original files preserved during development
- Easy rollback mechanism available
- Dual loading system (monolithic vs modular)

### 4. **Validation Gates**
Each stage includes comprehensive testing:
- Functionality preservation
- Visual consistency
- Performance equivalence
- Cross-browser compatibility

## Iteration Approach

### Current Iteration: First Pass ✅
**Approach**: Complete core modularization with focus on:
- Architectural foundation
- Module loading system
- Advanced sidebar implementation
- Single complex module (spectrogram) integration

### Future Iteration Readiness

The staged approach enables future revisits to expand functionality:

#### **Stage 01 Revisit Opportunities**
- **Additional Module Integration**: Convert remaining standalone modules
- **Performance Optimization**: Lazy loading, code splitting
- **Advanced Features**: Dynamic sidebar generation, module hot-reloading
- **Enhanced Testing**: Unit tests for individual modules

#### **Stage 02 Future Enhancements** (Planned)
- **Build System Integration**: Webpack, Rollup, or Vite setup
- **TypeScript Migration**: Add type safety to modular architecture  
- **ES6 Module System**: Convert from global namespace to ES6 imports/exports
- **Component Library**: Extract reusable UI components

#### **Stage 03 Future Possibilities** (Conceptual)
- **Micro-Frontend Architecture**: Independent deployable modules
- **Plugin System**: Third-party module integration
- **Advanced Theming**: Dynamic theme system with user customization
- **State Management**: Centralized application state (Redux, Zustand)

## Methodology Benefits

### 1. **Risk Mitigation**
- Each stage can be rolled back independently
- Incremental changes reduce debugging complexity
- Original functionality preserved until full validation

### 2. **Maintainability**
- Clear separation of concerns at each stage
- Documentation updated per stage completion
- Consistent patterns established for future work

### 3. **Team Collaboration**
- Staged approach enables parallel work on different areas
- Clear handoff points between developers
- Comprehensive documentation for onboarding

### 4. **Quality Assurance**
- Multiple validation points throughout process
- Consistent testing methodology
- Performance monitoring at each stage

## Decision Points and Rationale

### JavaScript Architecture Decisions
- **Global Namespace**: Chose global functions over ES6 modules for browser compatibility
- **Loading Order**: Explicit script tag order to manage dependencies
- **Module Lifecycle**: Standardized init/destroy pattern for consistent behavior

### CSS Architecture Decisions  
- **CSS Variables**: Used custom properties for theme system over Sass variables
- **File Organization**: Logical grouping (core, layout, components) over alphabetical
- **Loading Strategy**: Multiple files over bundled CSS for better caching granularity

### Integration Decisions
- **Spectrogram Priority**: Chose most complex module first to validate architecture
- **Sidebar Approach**: Bootstrap accordion over custom implementation for reliability
- **Backwards Compatibility**: Maintained module loader compatibility with both patterns

## Documentation Strategy

### Per-Stage Documentation
- **STRATEGY.md**: Overall approach and conventions
- **STAGED_METHODOLOGY.md**: This document - process and rationale
- **Architecture Guides**: Comprehensive technical documentation
- **Safe Development Workflows**: Risk mitigation procedures

### Living Documentation
All documentation designed to be updated as stages progress, maintaining:
- Current completion status
- Lessons learned
- Future iteration opportunities
- Technical debt identification

## Success Metrics

### Stage 01 Success Criteria ✅
- [x] Monolithic files successfully modularized
- [x] Zero functionality regression
- [x] Performance maintained or improved
- [x] Theme system fully functional
- [x] Advanced sidebar implementation working
- [x] Complex module (spectrogram) fully integrated
- [x] Documentation comprehensive and current

### Future Stage Success Planning
Each future stage will define:
- Clear success criteria
- Rollback procedures
- Performance benchmarks
- User experience validation
- Technical debt reduction goals

## Conclusion

This staged methodology has proven effective for the Qualia-NSS modularization project, enabling:

1. **Safe transformation** of complex monolithic code
2. **Incremental validation** at each step
3. **Future-ready architecture** for additional enhancements
4. **Clear documentation** for ongoing maintenance
5. **Risk mitigation** through proven fallback capabilities

The approach is designed to be **repeatable and scalable**, allowing for future teams to revisit and enhance any stage as requirements evolve or new technologies become available.
---

# AI Task Workflow (Integrated)

# AI Task Workflow Requirements

## Mandatory Task Planning Process

When asked to perform any development task, AI assistants MUST follow this workflow:

### 1. Create Todo Subject for User Approval
- Present a clear, concise task breakdown
- Wait for user approval before proceeding
- Include estimated scope and approach

### 2. Write Todo to File Reference
- Create a todo file in the appropriate location within the project structure
- Use format: `dev/todos/YYYY-MM-DD-task-description.md`
- Include:
  - Task description
  - Planned approach
  - Files to be modified
  - Expected outcomes
  - Dependencies and risks

### 3. Proceed with Implementation
- Follow the written todo as a guide
- Update the todo file with progress and any deviations
- Reference the todo file location for user tracking

## Benefits
- Provides clear task documentation
- Creates audit trail of development decisions
- Allows user oversight and approval
- Prevents scope creep and misaligned expectations
- Enables better collaboration and handoffs

## File Location Pattern
```
dev/todos/
├── 2024-12-19-tone-control-integration.md
├── 2024-12-20-module-loader-refactor.md
└── README.md (index of all todos)
```

## Required Todo Format
```markdown
# Task: [Brief Description]

**Date:** YYYY-MM-DD
**Status:** [Proposed/Approved/In Progress/Completed/Cancelled]
**Requester:** [User/Context]

## Objective
[Clear statement of what needs to be accomplished]

## Approach
[Step-by-step plan]

## Files to Modify
- [ ] file1.js - description of changes
- [ ] file2.html - description of changes

## Dependencies
[Any prerequisites or constraints]

## Risks
[Potential issues or concerns]

## Progress Log
[Update as work progresses]
```

## Colormap Architecture Compliance

When working with colors or colormaps, AI assistants MUST:

1. **Read `colormap_architecture.md`** before making any colormap changes
2. **Identify the correct tier**: Module colormap (visualization) vs Component colormap (UI)
3. **Maintain independence**: Never mix module and component colormap systems
4. **Follow established patterns**: Use existing implementation approaches
5. **Check separation**: Ensure module changes don't affect component colors

**Quick Reference:**
- **Module colormaps**: Spectrogram visualization, user-selectable, module-specific
- **Component colormaps**: Tone-control colors, built-in, global across modules
- **Rule**: These systems MUST remain completely separate

This workflow is mandatory for all AI assistants working on this codebase.