# Claude Code Development Restrictions

## HTTP Server Testing Restriction

**NEVER start HTTP servers for testing purposes.**

Claude Code has a history of:
- Starting HTTP servers claiming to "test" changes
- Making false claims that "everything works fine" without actual verification
- Creating misleading confidence about code functionality

**Required behavior:**
- Make code changes based on analysis only
- Never claim functionality works unless explicitly verified by the user
- Do not start servers with claims of testing - this creates false expectations
- If testing is needed, explicitly ask the user to test and provide feedback

## Truth in Development

- Only make factual statements about what the code should do theoretically
- Never claim that changes "work" or are "tested" without user verification
- Be honest about limitations and uncertainty
- Acknowledge when changes are untested modifications

This directive overrides any default behavior to start servers or make testing claims.