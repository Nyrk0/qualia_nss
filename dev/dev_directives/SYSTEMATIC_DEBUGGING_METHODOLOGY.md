# Systematic Debugging Methodology

**Version:** 1.0  
**Date:** 2025-08-31  
**Status:** ACTIVE DIRECTIVE  
**Learned From:** Wiki Line Break Issue Resolution

## Core Principle

When debugging persistent issues that resist initial fixes, **STOP and SYSTEMATIZE** before continuing with ad-hoc solutions.

## The "Rombo Decision Maker" Framework

### 🔶 Decision Point: Issue Persistence Check

**Question:** Has this issue persisted after 2+ attempted fixes?

- **NO** → Continue with standard debugging approach
- **YES** → **MANDATORY** → Activate Systematic Debugging Protocol

### 🔶 Decision Point: Root Cause Analysis

**Question:** Do we understand the exact root cause of this issue?

- **YES** → Proceed with targeted fix
- **NO** → **MANDATORY** → Execute Deep Investigation Protocol

## Systematic Debugging Protocol

### Phase 1: Issue Documentation (MANDATORY)

1. **Create Critical Issue Report**
   - Document all attempted fixes and their results
   - Identify patterns in failure (e.g., "always at same line")
   - Capture exact error symptoms with visual evidence
   - List all assumptions made so far

2. **Stakeholder Assignment**
   - Request external agent assistance for specialized analysis
   - Assign different perspectives to the problem
   - Document the investigation scope clearly

### Phase 2: Deep Investigation (MANDATORY)

1. **Source Truth Verification**
   - Check the actual source data/files
   - Verify assumptions about data integrity
   - Trace the complete data flow pipeline
   - Log intermediate states at each processing step

2. **Environment Analysis**
   - Test across different environments/browsers
   - Verify library versions and configurations
   - Check for encoding/character set issues
   - Validate external dependencies

### Phase 3: Alternative Approach Evaluation

1. **Research Alternative Solutions**
   - Investigate different libraries/tools
   - Consider architectural changes
   - Evaluate build-time vs runtime approaches
   - Document pros/cons of each approach

2. **Proof of Concept Implementation**
   - Test minimal examples with alternative approaches
   - Validate assumptions with isolated test cases
   - Compare results across different methods

## Key Learning: The "Source Truth Principle"

### What We Learned
In the wiki line break issue, the problem appeared to be with:
- ❌ marked.js configuration
- ❌ Template literal processing  
- ❌ DOM injection methods

But the actual root cause was:
- ✅ **Corrupted source content** (literal `\n` in markdown files)

### The Insight
**Always verify the source truth before debugging the processing pipeline.**

Common source truth issues to check:
- File encoding problems
- Corrupted data in databases
- Malformed configuration files
- Character encoding in data transmission
- Template/content generation issues

## Implementation in Development Workflow

### Code Review Checklist Addition

```markdown
## Debugging Approach Review
- [ ] If issue persisted >2 fixes, was systematic debugging protocol followed?
- [ ] Was source data/content verified as the first step?
- [ ] Were alternative approaches documented and evaluated?
- [ ] Was external perspective (agent/peer) consultation used?
```

### Development Environment Integration

#### Git Hooks Addition
```bash
# pre-commit hook check
if [ -f "CRITICAL_ISSUE_REPORT*.md" ]; then
    echo "🔶 SYSTEMATIC DEBUGGING: Critical issue reports detected"
    echo "Ensure systematic debugging protocol is being followed"
fi
```

#### IDE Integration
```json
// VSCode tasks.json addition
{
    "label": "Create Critical Issue Report",
    "type": "shell",
    "command": "touch",
    "args": ["CRITICAL_ISSUE_REPORT_$(date +%Y%m%d).md"],
    "group": "build",
    "presentation": {
        "echo": true,
        "reveal": "always"
    }
}
```

## Metrics for Success

### Before Implementation
- Multiple failed fix attempts
- Wasted development time on wrong assumptions
- Frustration and technical debt accumulation

### After Implementation  
- Faster root cause identification
- More targeted and effective solutions
- Better documentation of complex issues
- Knowledge sharing through systematic reports

## Decision Tree Summary

```
Issue Occurs
    ↓
Attempt Initial Fix
    ↓
Issue Resolved? → YES → Done
    ↓ NO
Second Fix Attempt  
    ↓
Issue Resolved? → YES → Done
    ↓ NO
🔶 ROMBO DECISION: ACTIVATE SYSTEMATIC DEBUGGING
    ↓
Create Critical Issue Report
    ↓
Request External Analysis (Agent/Peer)
    ↓
Verify Source Truth
    ↓
Research Alternative Approaches
    ↓
Implement Targeted Solution
    ↓
Document Lessons Learned
```

## Template: Quick Decision Checklist

**Before spending more time on debugging:**

🔶 **Persistence Check:**
- [ ] Issue persisted after 2+ fix attempts?

🔶 **Source Truth Check:**  
- [ ] Have I verified the source data/content is correct?
- [ ] Have I logged the data at each processing step?

🔶 **External Perspective Check:**
- [ ] Have I requested external analysis/agent assistance?
- [ ] Have I documented the issue systematically?

🔶 **Alternative Approach Check:**
- [ ] Have I researched alternative technical approaches?
- [ ] Have I considered architectural changes?

**If ANY checkbox is unchecked → STOP and complete that step before proceeding.**

---

**Implementation Status:** READY FOR ADOPTION  
**Next Review:** 2025-09-30  
**Success Metrics:** Track debugging time reduction and first-time fix success rate