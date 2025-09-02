# Modular App Structure - Wireframe Documentation

This document describes the structural changes made to the Qualia-NSS application shell for wireframe and development purposes.

## Structural Overview

### Before: Monolithic Architecture
```
app.js (600+ lines)
├── Global stubs
├── Theme management  
├── UI utilities
├── Sidebar templates (5 modules × ~30 lines each)
├── Module templates (5 modules × ~20 lines each)  
├── Navigation logic
├── Module loading logic
└── Initialization code
```

### After: Modular Architecture
```
src/js/
├── app-core.js        # Core app & theme (40 lines)
├── ui-utils.js        # UI utilities (50 lines)  
├── sidebar-manager.js # Sidebar content (150 lines)
├── module-loader.js   # Module loading (200 lines)
└── navigation.js      # Navigation (120 lines)
```

## Module Interface Design

### Global API Surface
Each module exposes specific functions to `window` object:

```javascript
// app-core.js
window.setActiveNav (stub → full implementation)
window.load* functions (stubs → implementations)

// ui-utils.js  
window.initializeScrollFade()
window.showSidebar() / hideSidebar()

// sidebar-manager.js
window.sidebarHTML = { ... }

// module-loader.js  
window.moduleHTML = { ... }
window.loadModule()
window.currentModule

// navigation.js
window.setActiveNav() (full implementation)
window.setNavActiveForModule()  
window.showWelcome()
window.loadSpeakersSpl(), loadFilters(), etc.
```

## Template Organization

### Sidebar Templates Structure
```javascript
sidebarHTML = {
    'speakers-spl': '...',    // File upload, analysis metrics
    'filters': '...',         // Filter controls, FFT display  
    'cabinets': '...',        // Cabinet parameters, calculations
    'tests': '...',           // Test controls, signal status
    'spectrogram': '...'      // Accordion with experiment setup
}
```

### Module Templates Structure  
```javascript
moduleHTML = {
    'speakers-spl': '...',    // SPL chart container
    'filters': '...',         // Filter configuration UI
    'cabinets': '...',        // Cabinet design controls  
    'tests': '...',           # Test measurement interface
    'spectrogram': '...'      // Canvas with 3D controls
}
```

## Loading Sequence Wireframe

```
1. HTML loads → Bootstrap CSS/JS
2. app-core.js → Global stubs, theme setup
3. ui-utils.js → Scroll effects, sidebar utils  
4. sidebar-manager.js → Sidebar template library
5. module-loader.js → Module templates & loading logic
6. navigation.js → Navigation logic, auto-restore module
```

## Component Interaction Flow

```
User clicks navbar → navigation.js → loadModule(name)
                   ↓
               module-loader.js → Check moduleHTML[name]  
                   ↓
               Create/update sidebar from sidebarHTML[name]
                   ↓
               Load main content from moduleHTML[name]
                   ↓  
               Load & instantiate module script
                   ↓
               ui-utils.js → Initialize scroll fade effects
                   ↓
               navigation.js → Set active nav state
```

## Responsive Design Considerations

### Sidebar Management
- **Desktop**: Full sidebar with scroll fade effects
- **Mobile**: Collapsible sidebar (handled by existing CSS)
- **Template compatibility**: All sidebar templates work across breakpoints

### Module Content
- **Flexible containers**: Module templates use responsive containers
- **Canvas handling**: Spectrogram module adapts to container size
- **Control layouts**: Form controls stack appropriately

## Development Workflow

### Adding New Module (Wireframe Process)
1. **Design phase**: Create wireframe mockup for module
2. **Template phase**: Add HTML template to both managers  
3. **Navigation phase**: Add routing in navigation.js
4. **Implementation phase**: Create module script
5. **Testing phase**: Verify responsive behavior

### Modifying Existing Module
1. **Content changes**: Edit appropriate manager template
2. **Behavior changes**: Edit module-specific script  
3. **Navigation changes**: Edit navigation.js mappings
4. **Style changes**: Edit main stylesheet

## File Size Impact

### Before
- `app.js`: 600+ lines
- Single point of failure
- Difficult to track changes

### After  
- 5 files: 40-200 lines each
- Clear separation of concerns
- Easy change tracking
- Better Git diff visibility

## Browser Compatibility

### Script Loading
- Uses traditional `<script>` tags (universal compatibility)
- Maintains load order via HTML sequence
- No ES6 modules (broader browser support)

### Functionality
- All existing features preserved
- Same browser support matrix  
- Progressive enhancement maintained

## Performance Characteristics

### Loading
- **Initial**: 5 small files vs 1 large file
- **Caching**: Better granular cache invalidation
- **Parsing**: Distributed parsing load

### Runtime
- **Memory**: Same footprint (identical functionality)
- **Execution**: Identical performance characteristics
- **Debugging**: Better stack traces with named files

## Testing Strategy

### Module Testing
- **Unit tests**: Each module can be tested independently
- **Integration tests**: Verify module interactions  
- **Load order tests**: Ensure proper dependency sequence

### Compatibility Testing  
- **Fallback behavior**: Test with missing dependencies
- **Error handling**: Verify graceful degradation
- **Performance**: Compare with monolithic version