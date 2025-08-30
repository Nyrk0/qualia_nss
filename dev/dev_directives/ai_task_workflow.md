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