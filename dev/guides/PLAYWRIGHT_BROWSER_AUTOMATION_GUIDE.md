claud# Complete Playwright MCP Browser Automation Guide

## Overview

This comprehensive guide covers setting up and using Playwright MCP with Claude Code for complete browser automation, UI testing, and visual error detection on macOS.

## Table of Contents

1. [Initial Setup & Configuration](#setup)
2. [Browser Automation Capabilities](#capabilities)
3. [UI Clipping Detection & Auto-Fix](#clipping)
4. [Complete Testing Workflows](#workflows)
5. [Visual Error Troubleshooting](#troubleshooting)
6. [Implementation Examples](#examples)
7. [Best Practices](#best-practices)
8. [Troubleshooting](#common-issues)

## 1. Initial Setup & Configuration {#setup}

### Prerequisites
- macOS system
- Chrome browser installed
- Claude Code installed
- Node.js and npm available

### Step 1: Install Playwright MCP
```bash
claude mcp add playwright npx '@playwright/mcp@latest'
```

This command:
- Adds Playwright MCP to your project configuration
- Stores settings in `~/.claude.json` 
- Makes 25+ browser automation tools available

### Step 2: Configure macOS Permissions
1. **System Preferences → Security & Privacy → Privacy**
2. **Select "Accessibility"**  
3. **Add Chrome to allowed applications**
4. **Grant screen recording permissions if needed**

### Step 3: Verify Installation
```bash
# In Claude Code, test the installation
claude
```
Then say: "Use playwright mcp to open a browser to google.com"

## 2. Browser Automation Capabilities {#capabilities}

### Available Tools (25+ functions)

#### Navigation & Page Management
- `browser_navigate`: Navigate to URLs
- `browser_go_back` / `browser_go_forward`: Browser history
- `browser_refresh`: Page refresh
- `browser_new_tab` / `browser_close_tab`: Tab management

#### Element Interaction
- `browser_click`: Click elements using selectors
- `browser_type`: Type text into input fields
- `browser_hover`: Hover over elements
- `browser_select`: Select dropdown options
- `browser_upload_file`: File upload handling

#### Content Extraction
- `browser_screenshot`: Capture page screenshots
- `browser_pdf`: Generate PDF from page
- `browser_get_text`: Extract text content
- `browser_get_attribute`: Get element attributes

#### Advanced Features
- `browser_execute_js`: Run custom JavaScript
- `browser_wait_for`: Wait for elements/conditions
- `browser_network_monitor`: Monitor network requests
- `browser_dialog_handle`: Handle alerts/confirms

### Key Advantages
- **Visible Browser**: Chrome window stays open for manual interaction
- **Persistent Session**: Cookies and state maintained throughout session
- **Real Browser Environment**: Full JavaScript execution and rendering
- **Accessibility Integration**: Uses accessibility tree for reliable element detection

## 3. UI Clipping Detection & Auto-Fix {#clipping}

### Automated Detection Methods

#### Viewport Analysis
```javascript
// Automatically detects elements outside viewport
const clippedElements = await page.evaluate(() => {
  return Array.from(document.querySelectorAll('*')).filter(el => {
    const rect = el.getBoundingClientRect();
    return rect.bottom < 0 || rect.right < 0 || 
           rect.top > window.innerHeight || 
           rect.left > window.innerWidth;
  });
});
```

#### Responsive Breakpoint Testing
- **Mobile (375px)**: iPhone viewport testing
- **Tablet (768px)**: iPad viewport testing  
- **Desktop (1200px)**: Standard desktop testing
- **Large Desktop (1920px)**: Wide screen testing

#### CSS Analysis
- Overflow detection (hidden, scroll, auto)
- Position absolute/fixed element checking
- Z-index layering issues
- Flexbox/Grid layout problems

### Auto-Fix Capabilities

#### Dynamic Viewport Adjustment
```javascript
// Automatically resize viewport for optimal viewing
await browser_set_viewport({ width: optimalWidth, height: optimalHeight });
```

#### CSS Property Modification
- Fix `overflow: hidden` causing content clipping
- Adjust `max-width` and `max-height` constraints
- Modify `position` properties for better layout
- Update `margin` and `padding` for spacing issues

#### Accessibility Improvements
- Add missing `alt` attributes
- Fix color contrast issues
- Ensure keyboard navigation works
- Validate ARIA labels and roles

### Required Permissions
- **Accessibility Access**: For UI automation
- **Screen Recording**: For screenshot comparison
- **File System Access**: For saving test artifacts
- **Chrome Automation**: For browser control

## 4. Complete Testing Workflows {#workflows}

### End-to-End Testing Structure

#### 1. Test Planning Phase
```markdown
# Test Case: User Registration Flow
## Steps:
1. Navigate to registration page
2. Fill out registration form
3. Submit form with valid data
4. Verify success message
5. Confirm email sent
6. Validate user dashboard access
```

#### 2. Test Implementation Pattern
```javascript
// Page Object Model Example
class RegistrationPage {
  constructor(page) {
    this.page = page;
    this.emailInput = '[data-testid="email-input"]';
    this.passwordInput = '[data-testid="password-input"]';
    this.submitButton = '[data-testid="submit-button"]';
  }
  
  async fillRegistrationForm(email, password) {
    await this.page.type(this.emailInput, email);
    await this.page.type(this.passwordInput, password);
    await this.page.click(this.submitButton);
  }
}
```

### Testing Categories

#### User Journey Tests
- **Authentication Flow**: Login, logout, password reset
- **E-commerce Flow**: Product search, cart, checkout
- **Content Management**: Create, edit, delete operations
- **User Profile**: Settings, preferences, account management

#### Form Validation Tests
- **Required Field Validation**: Empty field detection
- **Format Validation**: Email, phone, date formats
- **Length Validation**: Min/max character limits
- **Custom Validation**: Business rule validation

#### Cross-Browser Compatibility
- **Chrome Testing**: Primary browser support
- **Firefox Testing**: Secondary browser validation
- **Safari Testing**: WebKit compatibility
- **Edge Testing**: Chromium compatibility

#### Performance Testing
- **Page Load Times**: Measure initial page rendering
- **Interactive Response**: Button click responsiveness
- **Network Performance**: Request/response timing
- **Memory Usage**: JavaScript heap analysis

### CI/CD Integration

#### GitHub Actions Example
```yaml
name: Browser Tests
on: [push, pull_request]
jobs:
  test:
    runs-on: macos-latest
    steps:
      - uses: actions/checkout@v3
      - name: Setup Claude Code
        run: |
          claude mcp add playwright npx '@playwright/mcp@latest'
      - name: Run Tests
        run: claude test --browser-automation
```

## 5. Visual Error Troubleshooting {#troubleshooting}

### Automated Error Detection

#### Screenshot-Based Analysis
```javascript
// Automatic screenshot on test failure
await browser_screenshot({
  path: `error-${testName}-${timestamp}.png`,
  fullPage: true
});

// Compare with baseline
const diff = await compareScreenshots(baseline, current);
if (diff.percentage > 0.1) {
  throw new Error(`Visual regression detected: ${diff.percentage}%`);
}
```

#### DOM State Capture
```javascript
// Capture complete page state for debugging
const debugInfo = {
  url: await page.url(),
  title: await page.title(),
  html: await page.innerHTML('body'),
  console: await page.getLogs(),
  network: await page.getNetworkRequests(),
  accessibility: await page.getAccessibilityTree()
};
```

### Intelligent Analysis

#### Element State Analysis
- **Visibility**: Hidden, display:none, opacity:0
- **Position**: Off-screen, overlapped, z-index issues
- **Interaction**: Clickable, focusable, keyboard accessible
- **Content**: Text overflow, image loading, dynamic content

#### Error Pattern Recognition
- **Layout Shifts**: Cumulative Layout Shift (CLS) detection
- **Missing Elements**: Expected elements not found
- **Broken Links**: 404 errors, broken navigation
- **JavaScript Errors**: Console error categorization

### Automated Debugging Workflow

#### 1. Error Detection
```javascript
try {
  await testStep();
} catch (error) {
  // Automatic error context capture
  const context = await captureErrorContext(page, error);
  await generateErrorReport(context);
  throw error;
}
```

#### 2. Context Generation
- **Test Environment**: Browser version, viewport, OS
- **Application State**: User session, data state, feature flags
- **Error Location**: Specific test step, element selector, action type
- **Timeline**: Actions leading up to error, timing information

#### 3. Solution Suggestions
- **Common Fixes**: Known issues and solutions
- **Similar Errors**: Previous occurrences and resolutions
- **Best Practices**: Recommended improvements
- **Prevention**: Code changes to avoid future issues

## 6. Implementation Examples {#examples}

### Example 1: E-commerce Testing
```javascript
// Complete shopping cart workflow test
async function testShoppingCart() {
  // Navigate to product page
  await browser_navigate('https://store.example.com/products/widget');
  
  // Add product to cart
  await browser_click('[data-testid="add-to-cart"]');
  await browser_wait_for('[data-testid="cart-count"]');
  
  // Verify cart count updated
  const cartCount = await browser_get_text('[data-testid="cart-count"]');
  assert.equal(cartCount, '1');
  
  // Proceed to checkout
  await browser_click('[data-testid="checkout-button"]');
  
  // Fill checkout form
  await browser_type('[name="email"]', 'test@example.com');
  await browser_type('[name="address"]', '123 Test St');
  
  // Submit order
  await browser_click('[data-testid="place-order"]');
  
  // Verify success
  await browser_wait_for('[data-testid="order-confirmation"]');
  const confirmation = await browser_get_text('[data-testid="order-number"]');
  
  // Take screenshot for verification
  await browser_screenshot({ path: `order-${confirmation}.png` });
}
```

### Example 2: Responsive Design Testing
```javascript
// Test responsive behavior across viewports
async function testResponsiveDesign() {
  const viewports = [
    { width: 375, height: 667, name: 'mobile' },
    { width: 768, height: 1024, name: 'tablet' },
    { width: 1200, height: 800, name: 'desktop' }
  ];
  
  for (const viewport of viewports) {
    await browser_set_viewport(viewport);
    await browser_navigate('https://example.com');
    
    // Test navigation menu
    const menuVisible = await browser_is_visible('[data-testid="main-menu"]');
    const mobileMenuVisible = await browser_is_visible('[data-testid="mobile-menu"]');
    
    if (viewport.width < 768) {
      assert.true(mobileMenuVisible, 'Mobile menu should be visible on small screens');
      assert.false(menuVisible, 'Desktop menu should be hidden on small screens');
    } else {
      assert.true(menuVisible, 'Desktop menu should be visible on large screens');
      assert.false(mobileMenuVisible, 'Mobile menu should be hidden on large screens');
    }
    
    // Take screenshot for visual verification
    await browser_screenshot({ 
      path: `responsive-${viewport.name}-${Date.now()}.png` 
    });
  }
}
```

### Example 3: Form Validation Testing
```javascript
// Comprehensive form validation testing
async function testFormValidation() {
  await browser_navigate('https://example.com/contact');
  
  // Test required field validation
  await browser_click('[data-testid="submit-button"]');
  
  const emailError = await browser_get_text('[data-testid="email-error"]');
  assert.include(emailError, 'required');
  
  // Test invalid email format
  await browser_type('[name="email"]', 'invalid-email');
  await browser_click('[data-testid="submit-button"]');
  
  const formatError = await browser_get_text('[data-testid="email-error"]');
  assert.include(formatError, 'valid email');
  
  // Test successful submission
  await browser_type('[name="email"]', 'test@example.com');
  await browser_type('[name="message"]', 'Test message');
  await browser_click('[data-testid="submit-button"]');
  
  await browser_wait_for('[data-testid="success-message"]');
  const success = await browser_get_text('[data-testid="success-message"]');
  assert.include(success, 'Thank you');
}
```

## 7. Best Practices {#best-practices}

### Selector Strategies
- **Data Attributes**: Use `[data-testid="element"]` for test stability
- **Accessibility Selectors**: Prefer ARIA labels and roles
- **Semantic HTML**: Target semantic elements when possible
- **Avoid CSS Selectors**: Don't rely on styling-dependent selectors

### Wait Strategies
- **Element Visibility**: Wait for elements to be visible
- **Network Idle**: Wait for network requests to complete
- **Custom Conditions**: Wait for specific application states
- **Timeout Management**: Set appropriate timeout values

### Error Handling
- **Retry Logic**: Implement smart retry mechanisms  
- **Graceful Degradation**: Handle partial failures elegantly
- **Detailed Logging**: Capture comprehensive error context
- **Recovery Procedures**: Define error recovery workflows

### Performance Optimization
- **Parallel Execution**: Run independent tests concurrently
- **Resource Cleanup**: Properly dispose of browser resources
- **Caching Strategies**: Cache stable test data and fixtures
- **Minimal Navigation**: Reduce unnecessary page loads

### Maintenance
- **Regular Updates**: Keep Playwright MCP updated
- **Test Review**: Regularly review and update test cases
- **Documentation**: Maintain current test documentation
- **Monitoring**: Monitor test execution metrics

## 8. Common Issues & Troubleshooting {#common-issues}

### Setup Issues

#### Problem: MCP Not Found
```bash
# Solution: Reinstall Playwright MCP
claude mcp remove playwright
claude mcp add playwright npx '@playwright/mcp@latest'
```

#### Problem: Permission Denied
- **Check macOS Accessibility permissions**
- **Verify Chrome automation permissions**
- **Ensure file system access granted**

### Runtime Issues

#### Problem: Element Not Found
```javascript
// Solution: Implement robust waiting
await browser_wait_for('[data-testid="element"]', { timeout: 10000 });
```

#### Problem: Authentication Required
```javascript
// Solution: Handle manual authentication
console.log('Please complete authentication in the browser window');
await browser_wait_for('[data-testid="authenticated-content"]');
```

#### Problem: Network Timeouts
```javascript
// Solution: Increase timeout and implement retry
await browser_navigate(url, { timeout: 30000 });
```

### Browser Issues

#### Problem: Browser Crashes
- **Monitor memory usage**
- **Implement proper cleanup**
- **Restart browser sessions periodically**

#### Problem: Stale Elements
```javascript
// Solution: Re-query elements when needed
const element = await browser_wait_for('[data-testid="dynamic-element"]');
```

### Performance Issues

#### Problem: Slow Test Execution
- **Use parallel test execution**
- **Optimize selectors for speed**
- **Implement smart waiting strategies**
- **Cache test data where possible**

#### Problem: Memory Leaks
- **Close unused tabs**
- **Clear browser cache periodically**  
- **Monitor heap usage**
- **Implement proper resource cleanup**

---

## Conclusion

This comprehensive guide provides everything needed to implement robust browser automation with Playwright MCP and Claude Code. The combination of automated error detection, visual testing capabilities, and intelligent troubleshooting creates a powerful testing platform for modern web applications.

Key benefits:
- **Complete Automation**: Full browser control with minimal manual intervention
- **Visual Error Detection**: Automated screenshot comparison and UI analysis
- **Intelligent Debugging**: AI-powered error analysis and solution suggestions
- **Comprehensive Testing**: End-to-end, responsive, and accessibility testing

## Quick Command System

The workspace includes a streamlined command pattern for faster testing:

### Command Structure: `[TASK] [MODULE]`

**Example Commands:**
- `test 7band` → Test 7-Band Level Meter  
- `demo spectrogram` → Demonstrate 3D spectrogram
- `audit speakers` → Complete SPL module audit
- `check nav` → Verify navigation system
- `validate filters` → Test form validations

**Available Tasks:**
- `test`, `demo`, `audit`, `check`, `validate`
- `debug`, `profile`, `monitor`, `capture`, `trace`

**Available Modules:**
- `speakers`, `filters`, `cabinets`, `7band`, `spectrogram`, `comb-filter`, `wiki`
- `nav`, `theme`, `home`, `status`

For detailed command patterns, see [COMMAND_PATTERNS.md](./dev_directives/COMMAND_PATTERNS.md)

For additional support and advanced use cases, refer to the [dev_directives](./dev_directives/PLAYWRIGHT_MCP_AUTOMATION.md) document.