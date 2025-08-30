# API Documentation

This directory contains automatically generated API documentation for the Qualia NSS project. The documentation is generated from JSDoc comments in the source code.

## Viewing the Documentation

To view the API documentation locally:

1. Generate the documentation:
   ```bash
   npm run docs:generate
   ```

2. Open `docs/wiki/api/index.html` in your web browser

## Documenting Your Code

### Basic Function Documentation

```javascript
/**
 * Calculates the sum of two numbers
 * @param {number} a - First number
 * @param {number} b - Second number
 * @returns {number} The sum of a and b
 * @example
 * // returns 5
 * add(2, 3);
 */
function add(a, b) {
  return a + b;
}
```

### Class Documentation

```javascript
/**
 * Represents a point in 2D space
 */
class Point {
  /**
   * Create a point
   * @param {number} x - The x coordinate
   * @param {number} y - The y coordinate
   */
  constructor(x, y) {
    this.x = x;
    this.y = y;
  }

  /**
   * Calculate the distance to another point
   * @param {Point} other - The other point
   * @returns {number} The distance between the points
   */
  distanceTo(other) {
    const dx = this.x - other.x;
    const dy = this.y - other.y;
    return Math.sqrt(dx * dx + dy * dy);
  }
}
```

### Module Documentation

```javascript
/**
 * @module utils/math
 * @description Utility functions for mathematical operations
 */

/**
 * @constant {number}
 * @description The value of PI
 */
const PI = Math.PI;

export { PI };
```

## Best Practices

1. Document all public functions, classes, and methods
2. Include parameter types and return types
3. Add examples for complex functions
4. Use `@throws` to document possible errors
5. Keep documentation up-to-date with code changes

## Regenerating Documentation

To update the documentation after making changes:

```bash
npm run docs:generate
```

Or run in watch mode during development:

```bash
npm run docs:watch
```
