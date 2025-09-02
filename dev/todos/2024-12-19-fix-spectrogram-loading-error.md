# Task: Fix "Error loading spectrogram module" with tone-control integration

**Date:** 2024-12-19
**Status:** Approved
**Requester:** User

## Objective
Fix the "Error loading spectrogram module" that occurred after attempting to integrate the tone-control component. Restore spectrogram functionality while maintaining the tone control integration.

## Approach
1. Diagnose the current module loading error in spectrogram
2. Fix path/loading issues with tone-control.js component  
3. Correct HTML fragment fetch path if needed
4. Restore spectrogram module functionality
5. Ensure tone control appears at top of spectrogram interface
6. Verify module switching works properly

## Files to Modify
- [ ] src/js/module-loader.js - Fix fetch path and loading logic for spectrogram HTML fragment
- [ ] src/spectrogram/index.html - Correct tone-control script path if needed
- [ ] Possibly add error handling for failed component loads

## Dependencies
- Existing modular architecture must remain intact
- Other modules (7band-levelmeter, etc.) should continue working
- Tone control component at `/lib/components/tone-control/tone-control.js` must load properly

## Risks
- Module loading system changes could affect other modules
- Path resolution issues in different server contexts
- Potential cascade of loading errors if not handled properly

## Progress Log
- [2024-12-19] Task created and approved
- [2024-12-19] Starting diagnosis...
- [2024-12-19] DIAGNOSIS COMPLETE: Found two path resolution issues:
  1. Module loader fetch path: `'src/spectrogram/index.html'` should work from root context
  2. Tone control script path: `"../../lib/components/tone-control/tone-control.js"` wrong for main page context
- [2024-12-19] FIXED: Corrected tone-control script path to `"lib/components/tone-control/tone-control.js"`
- [2024-12-19] Implementation ready for user testing