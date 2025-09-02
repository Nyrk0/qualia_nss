/**
 * Simple Test Framework for Qualia-NSS
 * @fileoverview Lightweight testing framework for vanilla JS modules
 */

class TestFramework {
    constructor() {
        this.suites = [];
        this.results = [];
    }

    /**
     * Create a new test suite
     * @param {string} name - Suite name
     * @param {Function} callback - Function containing tests
     */
    describe(name, callback) {
        const suite = {
            name,
            tests: [],
            beforeEach: null,
            afterEach: null
        };
        
        this.currentSuite = suite;
        this.suites.push(suite);
        
        callback();
        
        this.currentSuite = null;
    }

    /**
     * Define a test
     * @param {string} description - Test description
     * @param {Function} testFn - Test function
     */
    it(description, testFn) {
        if (!this.currentSuite) {
            throw new Error('it() must be called within describe()');
        }
        
        this.currentSuite.tests.push({
            description,
            testFn
        });
    }

    /**
     * Set up function to run before each test
     * @param {Function} fn - Setup function
     */
    beforeEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.beforeEach = fn;
        }
    }

    /**
     * Cleanup function to run after each test
     * @param {Function} fn - Cleanup function
     */
    afterEach(fn) {
        if (this.currentSuite) {
            this.currentSuite.afterEach = fn;
        }
    }

    /**
     * Run all test suites
     */
    async runAll() {
        const resultsContainer = document.getElementById('test-results');
        let totalTests = 0;
        let passedTests = 0;
        
        for (const suite of this.suites) {
            const suiteDiv = document.createElement('div');
            suiteDiv.className = 'test-suite';
            suiteDiv.innerHTML = `<h3>${suite.name}</h3>`;
            
            for (const test of suite.tests) {
                totalTests++;
                
                try {
                    // Run beforeEach if exists
                    if (suite.beforeEach) {
                        await suite.beforeEach();
                    }
                    
                    // Run the test
                    await test.testFn();
                    
                    // Test passed
                    const testDiv = document.createElement('div');
                    testDiv.className = 'test-result test-pass';
                    testDiv.textContent = `✓ ${test.description}`;
                    suiteDiv.appendChild(testDiv);
                    passedTests++;
                    
                } catch (error) {
                    // Test failed
                    const testDiv = document.createElement('div');
                    testDiv.className = 'test-result test-fail';
                    testDiv.textContent = `✗ ${test.description}: ${error.message}`;
                    suiteDiv.appendChild(testDiv);
                } finally {
                    // Run afterEach if exists
                    if (suite.afterEach) {
                        await suite.afterEach();
                    }
                }
            }
            
            resultsContainer.appendChild(suiteDiv);
        }
        
        // Show summary
        const summaryDiv = document.createElement('div');
        summaryDiv.className = 'summary';
        summaryDiv.innerHTML = `
            <h3>Test Summary</h3>
            <p>Total: ${totalTests} | Passed: ${passedTests} | Failed: ${totalTests - passedTests}</p>
            <p>Success Rate: ${Math.round((passedTests / totalTests) * 100)}%</p>
        `;
        resultsContainer.appendChild(summaryDiv);
    }
}

// Assertion functions
const expect = {
    /**
     * Assert that value is truthy
     * @param {*} value - Value to test
     */
    toBeTruthy(value) {
        if (!value) {
            throw new Error(`Expected ${value} to be truthy`);
        }
    },

    /**
     * Assert that value is falsy
     * @param {*} value - Value to test
     */
    toBeFalsy(value) {
        if (value) {
            throw new Error(`Expected ${value} to be falsy`);
        }
    },

    /**
     * Assert equality
     * @param {*} actual - Actual value
     * @param {*} expected - Expected value
     */
    toEqual(actual, expected) {
        if (actual !== expected) {
            throw new Error(`Expected ${actual} to equal ${expected}`);
        }
    },

    /**
     * Assert that element exists
     * @param {Element} element - DOM element
     */
    toExist(element) {
        if (!element) {
            throw new Error('Expected element to exist');
        }
    },

    /**
     * Assert that function throws
     * @param {Function} fn - Function to test
     */
    toThrow(fn) {
        try {
            fn();
            throw new Error('Expected function to throw an error');
        } catch (e) {
            // Expected behavior
        }
    }
};

// Global test runner instance
window.TestRunner = new TestFramework();

// Export globals for convenience
window.describe = TestRunner.describe.bind(TestRunner);
window.it = TestRunner.it.bind(TestRunner);
window.beforeEach = TestRunner.beforeEach.bind(TestRunner);
window.afterEach = TestRunner.afterEach.bind(TestRunner);
window.expect = expect;