# Playwright MCP Browser Automation Directives

## AI Agent Instructions for Browser Testing & UI Automation

### Core Setup Requirements

1. **MCP Configuration**
   ```bash
   claude mcp add playwright npx '@playwright/mcp@latest'
   ```
   - Configuration persists in `~/.claude.json`
   - Always specify "playwright mcp" explicitly when first using

2. **macOS Permissions**
   - System Preferences → Security & Privacy → Accessibility
   - Chrome automation permissions required
   - File system access for screenshot operations

### Browser Automation Protocols

#### Standard Testing Workflow
1. **Initialize Browser Session**
   - Launch visible Chrome browser window
   - Set appropriate viewport for testing scenario
   - Configure network monitoring if needed

2. **Navigation & Interaction**
   - Use accessibility-first selectors
   - Implement wait strategies for dynamic content
   - Handle authentication flows manually when required

3. **Error Detection & Handling**
   - Capture DOM state on failures
   - Log network requests/responses
   - Screenshot generation for debugging

#### UI Clipping Detection Protocol
1. **Accessibility Tree Analysis**
   - Parse element visibility states
   - Identify elements outside viewport bounds
   - Detect overflow and positioning issues

2. **Responsive Testing**
   - Test across multiple viewport sizes
   - Validate mobile and desktop layouts
   - Check breakpoint transitions

3. **Auto-Fix Implementation**
   - Adjust viewport dimensions
   - Modify CSS properties programmatically
   - Apply accessibility improvements

### Testing Workflow Standards

#### End-to-End Test Structure
```
1. Setup → 2. Navigation → 3. Interaction → 4. Validation → 5. Cleanup
```

#### Required Test Categories
- **User Journey Tests**: Complete workflows from login to goal completion
- **Form Validation Tests**: Input validation and error handling
- **Responsive Tests**: Cross-device compatibility
- **Performance Tests**: Load time and interaction responsiveness
- **Accessibility Tests**: WCAG compliance validation

#### Test Organization
- Use Page Object Model pattern
- Implement reusable test utilities
- Create data-driven test scenarios
- Enable parallel execution where possible

### Visual Error Troubleshooting Protocol

#### Automated Debugging Steps
1. **Error Context Capture**
   - Screenshot at failure point
   - DOM state serialization
   - Console error collection
   - Network request logging

2. **Analysis & Classification**
   - Element positioning calculation
   - CSS computed style analysis
   - Accessibility tree parsing
   - Error pattern recognition

3. **Solution Generation**
   - Root cause identification
   - Suggested fix implementation
   - Test case reproduction steps
   - Prevention recommendations

### AI Agent Decision Tree

#### When to Use Playwright MCP
- ✅ Browser automation tasks
- ✅ UI testing and validation
- ✅ Visual regression testing
- ✅ Form interaction testing
- ✅ Cross-browser compatibility
- ✅ Performance monitoring

#### Alternative Tools
- 🔄 Use standard tools for: File system operations, API testing, unit tests
- 🔄 Use WebFetch for: Simple page content analysis
- 🔄 Use Bash for: Build processes, package management

### Error Handling Standards

#### Common Issues & Solutions
- **Element Not Found**: Implement robust wait strategies
- **Authentication Required**: Guide manual login process
- **Network Timeouts**: Configure appropriate timeout values
- **Memory Issues**: Implement proper cleanup procedures
- **Permission Errors**: Verify macOS accessibility settings

#### Failure Recovery
- Retry failed operations with backoff
- Capture detailed error context
- Provide actionable troubleshooting steps
- Log comprehensive debugging information

### Performance Optimization

#### Best Practices
- Minimize unnecessary page loads
- Use efficient selectors
- Implement smart waiting strategies
- Optimize screenshot capture
- Clean up resources properly

#### Monitoring
- Track test execution times
- Monitor memory usage
- Log network performance
- Measure user interaction responsiveness

### Documentation Requirements

#### Test Documentation
- Clear test case descriptions
- Expected vs actual behavior
- Environment configuration details
- Reproduction steps for failures

#### Automation Documentation
- Setup instructions for new environments
- Configuration parameter explanations
- Troubleshooting guides
- Performance benchmarks

---

**Note**: This directive document ensures consistent, reliable browser automation across all AI agents using Claude Code with Playwright MCP integration.