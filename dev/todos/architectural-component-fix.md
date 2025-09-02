# Component Architecture Fix - August 30, 2025

## Issue Identified
**Problem**: Components are currently in `lib/` (public directory) instead of `src/` (source directory).

### Current (Incorrect) Structure:
```
lib/                        # ← PUBLIC directory (HTTP accessible)
├── components/
│   └── tone-control/       # ← Component source (wrong location)
└── upload-service.js       # ← Utility service

src/                        # ← Source code directory
├── js/                     # ← Core modules
└── [modules]/              # ← Feature modules
```

### Correct Structure Should Be:
```
src/
├── js/                     # Core application logic
├── components/             # ← Component SOURCE code
│   └── tone-control/
├── lib/                    # ← Third-party libraries only
├── styles/                 # CSS modules
└── [modules]/              # Feature modules

lib/ (optional)             # ← Built/compiled components if needed
```

## Architectural Principle Violated

**Separation of Concerns**: 
- `lib/` = **Public/Distribution** directory (deployed assets)
- `src/` = **Source** directory (development code)

**Current Issue**: Component source code is in public directory, violating this separation.

## Impact Analysis

### Files Affected (11 references):
- `index.html`
- `src/spectrogram/index.html` 
- `tests/index.html`
- `src/js/module-loader.js`
- `src/js/router-manager.js`
- `modules/7band-level-meter/index.html`
- Multiple documentation files

### Services Affected:
- `tone-control` component (most critical)
- `upload-service.js` utility

## Recommended Solution

### Option 1: Move to src/ (Recommended)
```bash
# Move components to source directory
mv lib/components/ src/components/
mv lib/upload-service.js src/lib/upload-service.js

# Update all script references:
# From: "lib/components/tone-control/tone-control.js"  
# To:   "src/components/tone-control/tone-control.js"
```

### Option 2: Keep lib/ as Distribution Directory
- Keep `lib/` for deployed/built components
- Add `src/components/` for source development
- Add build step to copy `src/components/` → `lib/components/`

## Recommendation: Option 1 (Move to src/)

**Reasons**:
1. ✅ **Consistent with current vanilla JS architecture** (no build step)
2. ✅ **Proper separation of concerns** (source vs public)
3. ✅ **Matches existing src/ pattern** (js/, styles/, modules/)
4. ✅ **Simpler**: No build step required
5. ✅ **Clear intent**: src/ = development, not public access

## Implementation Steps

1. **Move files**:
   ```bash
   mkdir -p src/components src/lib
   mv lib/components/* src/components/
   mv lib/upload-service.js src/lib/
   ```

2. **Update references** (11 files):
   - Change `lib/components/` → `src/components/`
   - Change `lib/upload-service.js` → `src/lib/upload-service.js`

3. **Update documentation**:
   - Architecture guides
   - Component curation guidelines  
   - Development workflows

## Benefits After Fix

✅ **Clean Architecture**: Source code in `src/`, not public directory  
✅ **Consistent Pattern**: All development code under `src/`  
✅ **Clear Separation**: Public vs. development directories  
✅ **Future-Proof**: Room for build process if needed later

**Status**: ⚠️ Architectural issue identified - requires fix for proper separation of concerns