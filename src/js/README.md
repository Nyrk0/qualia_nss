# Qualia-NSS Modular JavaScript Architecture

This directory contains the modular JavaScript architecture for the Qualia-NSS application shell.

## Files Overview

| File | Purpose | Lines | Key Functions |
|------|---------|-------|---------------|
| `app-core.js` | Core initialization & theme | ~40 | Theme management, global stubs |
| `ui-utils.js` | UI utilities & effects | ~50 | Scroll fade, sidebar utils |
| `sidebar-manager.js` | Sidebar templates | ~150 | Sidebar HTML templates |
| `module-loader.js` | Module loading & templates | ~200 | Module loading, HTML templates |
| `navigation.js` | Navigation & routing | ~120 | Navigation state, module routing |

## Loading Order

**Critical**: Scripts must be loaded in this order in `index.html`:

```html
<script src="src/js/app-core.js"></script>      <!-- 1. Core -->
<script src="src/js/ui-utils.js"></script>      <!-- 2. Utilities -->
<script src="src/js/sidebar-manager.js"></script> <!-- 3. Sidebar -->
<script src="src/js/module-loader.js"></script>  <!-- 4. Modules -->
<script src="src/js/navigation.js"></script>     <!-- 5. Navigation -->
```

## Migration

- **Original**: Single `app.js` file (600+ lines)
- **Current**: 5 modular files with identical functionality
- **Preserved**: Original `app.js` remains unchanged

See `/dev/dev_directives/modular_architecture_guide.md` for complete documentation.