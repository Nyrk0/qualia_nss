# Task: Implement Router Manager for Path Resolution in Modular Architecture

**Date:** 2024-12-19
**Status:** Approved
**Requester:** User

## Objective
Implement a router manager to handle path resolution issues in the modular architecture. Replace ad-hoc path handling with a centralized routing system that properly resolves HTML fragments, component scripts, and module assets.

## Problem Analysis
Current issues:
- Module loader fetch paths fail in different contexts
- Component script paths break when loaded via HTML fragments
- No centralized path management
- Static hosting requires reliable relative path resolution

## Approach
1. Research and select optimal vanilla JS routing method for static hosting
2. Create RouterManager class for centralized path resolution
3. Implement base URL detection and path normalization
4. Integrate with existing module loader system
5. Handle component script loading with correct paths
6. Add fallback mechanisms for different hosting contexts

## Vanilla JS Routing Options Analysis
1. **Hash-based routing** (`#/module`) - Best for static hosting, no server config
2. **History API** - Clean URLs but needs server fallback configuration  
3. **Base tag management** - Simple relative path resolution
4. **Custom path resolver** - Full control over path logic
5. **Hybrid approach** - Combine multiple methods for robustness

## Files to Create/Modify
- [ ] src/js/router-manager.js - New router manager class
- [ ] src/js/module-loader.js - Integrate router for path resolution
- [ ] index.html - Add base tag management if needed
- [ ] src/spectrogram/index.html - Use router-resolved paths
- [ ] Update other module HTML fragments as needed

## Dependencies
- Must work with existing modular architecture
- Compatible with static hosting (no server-side routing)
- Maintain backward compatibility with current module system
- Work in file:// and http:// contexts

## Risks
- Complex path resolution logic could introduce new bugs
- Router changes could break existing modules
- Need to handle edge cases in different hosting environments
- Performance impact of dynamic path resolution

## Success Criteria
- Spectrogram module loads correctly with tone-control component
- All module paths resolve properly in different contexts
- No hardcoded paths in HTML fragments
- Router handles base URL detection automatically
- Fallback mechanisms prevent total failures

## Progress Log
- [2024-12-19] Task created and approved  
- [2024-12-19] Starting analysis of routing options...
- [2024-12-19] ANALYSIS COMPLETE: Selected Custom Path Resolver approach for static hosting compatibility
- [2024-12-19] CREATED: RouterManager class in `src/js/router-manager.js` with:
  - Base URL auto-detection (file://, http://localhost, production)
  - Path normalization and resolution methods
  - HTML path processing for script src fixes
  - Component and module path resolution
- [2024-12-19] INTEGRATED: Router with module loader system:
  - Added router-manager.js to index.html loading order (before module-loader.js)
  - Updated module loader to use router.createFetchUrl() for spectrogram fragment
  - Added router.processHtmlPaths() to fix script paths in loaded HTML
  - Enhanced error reporting with attempted URLs
- [2024-12-19] UPDATED: HTML fragment to use original relative paths (router handles conversion)
- [2024-12-19] Implementation complete - ready for user testing
- [2024-12-19] TESTING FEEDBACK: file:// protocol fails with ERR_FAILED due to CORS restrictions
- [2024-12-19] ISSUE: Browser security prevents fetch() from loading local files in file:// context