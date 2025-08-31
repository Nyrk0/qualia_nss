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

### 6.1. Pre-Deployment Checklist

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