# Qualia-NSS Test Suite

Simple vanilla JavaScript testing framework for Qualia-NSS modules and components.

## Running Tests

### HTTP Server (Recommended)
```bash
cd tests/
python3 -m http.server 8081
# Open: http://localhost:8081/
```

### Direct File Access
```bash
# Open tests/index.html directly in browser
open tests/index.html
```

## Test Structure

### Framework (`test-framework.js`)
- Lightweight testing framework with `describe()`, `it()`, `beforeEach()`, `afterEach()`
- Assertion functions: `expect.toBeTruthy()`, `expect.toEqual()`, `expect.toExist()`
- Visual test results with pass/fail indicators

### Test Files
- `tone-control.test.js` - Tests for ToneControl Web Component
- `module-loader.test.js` - Tests for module loading system and navigation functions

### Test Coverage
- **Web Components**: ToneControl shadow DOM, properties, events
- **Module System**: Global function availability, module templates, navigation mapping
- **Core Functions**: setActiveNav, showWelcome, module loaders

## Adding Tests

1. Create new test file: `[module-name].test.js`
2. Add script tag to `index.html`
3. Use framework pattern:

```javascript
describe('Module Name', () => {
    beforeEach(() => {
        // Setup
    });
    
    it('should test something', () => {
        expect.toBeTruthy(someValue);
    });
});
```

## Test Results
- **Green**: Passing tests
- **Red**: Failed tests with error details
- **Summary**: Total tests, pass/fail count, success rate