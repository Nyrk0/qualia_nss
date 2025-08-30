# Task: Document colormap architecture rules for codebase consistency

**Date:** 2024-12-19
**Status:** Approved
**Requester:** User

## Objective
Create comprehensive documentation of the colormap architecture to ensure consistent implementation across the codebase. Establish clear separation between module colormaps and component colormaps to prevent future architectural confusion.

## Problem Analysis
Recent development showed confusion between:
- Module-level colormaps (spectrogram visualization)
- Component-level colormaps (tone-control UI colors)
- Need clear rules to maintain architectural separation

## Approach
1. Create dedicated colormap architecture documentation
2. Update existing development directives with colormap rules
3. Document the tone-control component colormap system
4. Establish patterns for future OAuth/settings integration
5. Add examples and anti-patterns for clarity

## Files to Create/Modify
- [ ] Create `dev/dev_directives/colormap_architecture.md` - New architecture documentation
- [ ] Update `dev/dev_directives/ai_task_workflow.md` - Add colormap consistency checks
- [ ] Update `lib/components/tone-control/README.md` - Document component colormap API (create if needed)
- [ ] Add colormap section to main CLAUDE.md for future AI reference

## Key Rules to Document
1. **Module Colormaps**: Visualization-specific, user-selectable
2. **Component Colormaps**: Built-in UI colors, independent of modules
3. **Independence Principle**: Never mix module and component colormap systems
4. **Future Settings Integration**: OAuth-based user preference patterns
5. **Development Guidelines**: How to add new colormaps correctly

## Success Criteria
- Clear architectural documentation prevents future colormap confusion
- Developers understand separation between module and component colormaps
- Future AI assistants have clear guidelines for colormap implementation
- Ready for user settings/OAuth integration without architectural changes

## Dependencies
- Current colormap implementations (Qualia 7band, Google Turbo, Chrome Music Lab)
- Existing development directive structure
- Future OAuth/settings system planning

## Progress Log
- [2024-12-19] Task created and approved
- [2024-12-19] Starting documentation creation...
- [2024-12-19] CREATED: `dev/dev_directives/colormap_architecture.md` - Comprehensive colormap architecture documentation
- [2024-12-19] UPDATED: `dev/dev_directives/ai_task_workflow.md` - Added colormap compliance section for AI assistants
- [2024-12-19] CREATED: `lib/components/tone-control/README.md` - Complete API documentation for tone-control component
- [2024-12-19] UPDATED: `CLAUDE.md` - Added colormap architecture section for future AI reference
- [2024-12-19] COMPLETED: All documentation requirements fulfilled