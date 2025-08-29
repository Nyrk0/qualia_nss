# Qualia-NSS Modular CSS Architecture

This directory contains the modular CSS architecture for the Qualia-NSS application.

## Files Overview

| File | Purpose | Lines | Key Features |
|------|---------|-------|--------------|
| `core.css` | Variables, fonts, typography | ~70 | Theme system, fonts, base elements |
| `layout.css` | Layout, sidebar, content areas | ~120 | Flexbox layouts, sidebar structure |
| `navigation.css` | Header, navbar, theme toggle | ~180 | Navigation, logo, theme switching |
| `components.css` | Buttons, forms, controls | ~200 | UI components, interactive elements |
| `utilities.css` | Scroll effects, helpers | ~50 | Scroll fade, utility classes |
| `responsive.css` | Media queries, mobile | ~60 | Responsive breakpoints |

## Module Styles

| File | Purpose |
|------|---------|
| `modules/module-content.css` | Common module container styles |
| `modules/speakers-spl.css` | SPL analysis module styles |

## Loading Order

**Critical**: CSS files must be loaded in this order in `index.html`:

```html
<link rel="stylesheet" href="src/styles/core.css">        <!-- 1. Foundation -->
<link rel="stylesheet" href="src/styles/layout.css">      <!-- 2. Layout -->
<link rel="stylesheet" href="src/styles/navigation.css">  <!-- 3. Navigation -->
<link rel="stylesheet" href="src/styles/components.css">  <!-- 4. Components -->
<link rel="stylesheet" href="src/styles/utilities.css">   <!-- 5. Utilities -->
<link rel="stylesheet" href="src/styles/responsive.css">  <!-- 6. Responsive -->
<link rel="stylesheet" href="src/styles/modules/*.css">   <!-- 7. Modules -->
```

## Migration

- **Original**: Single `style.css` file (800+ lines)
- **Current**: 8+ modular files with identical functionality
- **Preserved**: Original `style.css` remains unchanged

See `/dev/dev_directives/css_architecture_guide.md` for complete documentation.