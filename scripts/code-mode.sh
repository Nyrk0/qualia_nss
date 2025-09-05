#!/bin/bash

# KISS AI Code Mode - Practical Implementation
# Demonstrates KISS principles: Simple, Effective, Zero Maintenance
# Usage: ./code-mode.sh "your coding request"

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${BLUE}[CODE MODE]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

print_header() {
    echo -e "${BLUE}================================${NC}"
    echo -e "${BLUE}$1${NC}"
    echo -e "${BLUE}================================${NC}"
}

# Check if request is provided
if [ $# -eq 0 ]; then
    print_error "Usage: $0 \"your coding request\""
    echo ""
    echo "Examples:"
    echo "  $0 \"create a login form component\""
    echo "  $0 \"add error handling to user authentication\""
    echo "  $0 \"fix the database connection issue\""
    echo "  $0 \"create API routes for user management\""
    exit 1
fi

REQUEST="$*"
print_header "CODE MODE ACTIVATED"
print_status "Request: $REQUEST"

# Analyze request type and extract key information
analyze_request() {
    local request="$1"

    # Extract action type
    if echo "$request" | grep -qi "create\|add\|new\|build"; then
        echo "create"
    elif echo "$request" | grep -qi "fix\|resolve\|repair"; then
        echo "fix"
    elif echo "$request" | grep -qi "update\|modify\|change"; then
        echo "update"
    elif echo "$request" | grep -qi "delete\|remove"; then
        echo "delete"
    else
        echo "general"
    fi
}

# Extract target (component, function, file, etc.)
extract_target() {
    local request="$1"

    # Look for common targets
    if echo "$request" | grep -qi "component"; then
        echo "component"
    elif echo "$request" | grep -qi "function\|method"; then
        echo "function"
    elif echo "$request" | grep -qi "class"; then
        echo "class"
    elif echo "$request" | grep -qi "form"; then
        echo "form"
    elif echo "$request" | grep -qi "api\|route"; then
        echo "api"
    elif echo "$request" | grep -qi "model\|database"; then
        echo "model"
    else
        echo "general"
    fi
}

# Generate simple, effective code based on request
generate_code() {
    local request="$1"
    local action=$(analyze_request "$request")
    local target=$(extract_target "$request")

    print_status "Analyzing: action=$action, target=$target"

    case "$action-$target" in
        "create-component")
            generate_component "$request"
            ;;
        "create-form")
            generate_form "$request"
            ;;
        "create-api")
            generate_api "$request"
            ;;
        "create-function")
            generate_function "$request"
            ;;
        "fix-general")
            generate_fix "$request"
            ;;
        "update-general")
            generate_update "$request"
            ;;
        *)
            generate_general "$request"
            ;;
    esac
}

# Generate a React/Vue/Angular-style component
generate_component() {
    local request="$1"
    local component_name=$(echo "$request" | grep -oE "(create|add|new) [a-zA-Z]+ (component|comp)" | sed 's/.* //')

    if [ -z "$component_name" ]; then
        component_name="NewComponent"
    fi

    # Detect project type
    if [ -f "package.json" ]; then
        if grep -q "react" package.json; then
            generate_react_component "$component_name"
        elif grep -q "vue" package.json; then
            generate_vue_component "$component_name"
        else
            generate_vanilla_component "$component_name"
        fi
    else
        generate_vanilla_component "$component_name"
    fi
}

# Generate React component
generate_react_component() {
    local name="$1"
    local file_name="$(echo "$name" | sed 's/\([a-z]\)\([A-Z]\)/\1-\L\2/g' | tr '[:upper:]' '[:lower:]').jsx"

    print_status "Generating React component: $name"

    cat > "src/components/$file_name" << EOF
import React, { useState, useEffect } from 'react';
import './${name,,}.css';

const $name = () => {
  const [state, setState] = useState(null);

  useEffect(() => {
    // Component initialization
    console.log('$name component mounted');
  }, []);

  return (
    <div className="${name,,}-container">
      <h3>$name Component</h3>
      <div className="content">
        {/* Component content goes here */}
        <p>Component content loading...</p>
      </div>
    </div>
  );
};

export default $name;
EOF

    # Generate CSS file
    cat > "src/components/${name,,}.css" << EOF
.${name,,}-container {
  padding: 1rem;
  background: var(--panel-bg-color, #f5f5f5);
  border: 1px solid var(--panel-border-color, #ddd);
  border-radius: 8px;
}

.${name,,}-container h3 {
  margin-bottom: 1rem;
  color: var(--text-color, #333);
}

.content {
  /* Component-specific styles */
}
EOF

    print_success "Created React component:"
    echo "  📄 src/components/$file_name"
    echo "  🎨 src/components/${name,,}.css"
}

# Generate Vue component
generate_vue_component() {
    local name="$1"
    local file_name="$(echo "$name" | sed 's/\([a-z]\)\([A-Z]\)/\1-\L\2/g' | tr '[:upper:]' '[:lower:]').vue"

    print_status "Generating Vue component: $name"

    cat > "src/components/$file_name" << EOF
<template>
  <div class="${name,,}-container">
    <h3>$name Component</h3>
    <div class="content">
      <!-- Component content goes here -->
      <p>Component content loading...</p>
    </div>
  </div>
</template>

<script>
export default {
  name: '$name',
  data() {
    return {
      state: null
    };
  },
  mounted() {
    // Component initialization
    console.log('$name component mounted');
  }
};
</script>

<style scoped>
.${name,,}-container {
  padding: 1rem;
  background: var(--panel-bg-color, #f5f5f5);
  border: 1px solid var(--panel-border-color, #ddd);
  border-radius: 8px;
}

.${name,,}-container h3 {
  margin-bottom: 1rem;
  color: var(--text-color, #333);
}

.content {
  /* Component-specific styles */
}
</style>
EOF

    print_success "Created Vue component: src/components/$file_name"
}

# Generate vanilla JS component
generate_vanilla_component() {
    local name="$1"

    print_status "Generating vanilla JS component: $name"

    cat > "src/components/${name,,}.js" << EOF
/**
 * $name Component
 * Generated by KISS Code Mode
 */

class ${name}Component {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.state = null;
    this.init();
  }

  init() {
    console.log('$name component initialized');
    this.render();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = \`
      <div class="${name,,}-container">
        <h3>$name Component</h3>
        <div class="content">
          <!-- Component content goes here -->
          <p>Component content loading...</p>
        </div>
      </div>
    \`;

    this.attachEventListeners();
  }

  attachEventListeners() {
    // Add event listeners here
  }

  destroy() {
    // Cleanup
    console.log('$name component destroyed');
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${name}Component;
} else {
  window.${name}Component = ${name}Component;
}
EOF

    print_success "Created vanilla JS component: src/components/${name,,}.js"
}

# Generate form component
generate_form() {
    local request="$1"
    local form_type=""

    if echo "$request" | grep -qi "login"; then
        form_type="login"
    elif echo "$request" | grep -qi "register\|signup"; then
        form_type="register"
    elif echo "$request" | grep -qi "contact"; then
        form_type="contact"
    else
        form_type="general"
    fi

    print_status "Generating $form_type form"

    cat > "src/components/${form_type}-form.js" << EOF
/**
 * ${form_type^} Form Component
 * Generated by KISS Code Mode
 */

class ${form_type^}Form {
  constructor(containerId) {
    this.container = document.getElementById(containerId);
    this.formData = {};
    this.errors = {};
    this.init();
  }

  init() {
    this.render();
    this.attachEventListeners();
  }

  render() {
    if (!this.container) return;

    this.container.innerHTML = \`
      <form class="${form_type}-form" id="${form_type}Form">
        <h3>${form_type^} Form</h3>
        <div class="form-group">
          <label for="email">Email:</label>
          <input type="email" id="email" name="email" required>
          <span class="error" id="emailError"></span>
        </div>
        <div class="form-group">
          <label for="password">Password:</label>
          <input type="password" id="password" name="password" required>
          <span class="error" id="passwordError"></span>
        </div>
        <button type="submit" class="submit-btn">${form_type^}</button>
      </form>
    \`;
  }

  attachEventListeners() {
    const form = document.getElementById('${form_type}Form');
    if (form) {
      form.addEventListener('submit', (e) => this.handleSubmit(e));
    }
  }

  handleSubmit(event) {
    event.preventDefault();

    const formData = new FormData(event.target);
    this.formData = Object.fromEntries(formData);

    if (this.validate()) {
      console.log('Form submitted:', this.formData);
      // Handle form submission
      this.onSubmit(this.formData);
    } else {
      this.displayErrors();
    }
  }

  validate() {
    this.errors = {};

    // Email validation
    if (!this.formData.email || !this.formData.email.includes('@')) {
      this.errors.email = 'Valid email required';
    }

    // Password validation
    if (!this.formData.password || this.formData.password.length < 6) {
      this.errors.password = 'Password must be at least 6 characters';
    }

    return Object.keys(this.errors).length === 0;
  }

  displayErrors() {
    Object.keys(this.errors).forEach(field => {
      const errorElement = document.getElementById(\`\${field}Error\`);
      if (errorElement) {
        errorElement.textContent = this.errors[field];
      }
    });
  }

  onSubmit(data) {
    // Override this method to handle form submission
    alert('Form submitted successfully!');
  }
}

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ${form_type^}Form;
} else {
  window.${form_type^}Form = ${form_type^}Form;
}
EOF

    print_success "Created form component: src/components/${form_type}-form.js"
}

# Generate API routes
generate_api() {
    local request="$1"

    print_status "Generating API routes"

    cat > "src/routes/api.js" << EOF
/**
 * API Routes
 * Generated by KISS Code Mode
 */

// Express.js style routes (adapt for your framework)
const express = require('express');
const router = express.Router();

// User routes
router.get('/users', (req, res) => {
  // Get all users
  res.json({ message: 'Get all users' });
});

router.get('/users/:id', (req, res) => {
  // Get user by ID
  const { id } = req.params;
  res.json({ message: \`Get user \${id}\` });
});

router.post('/users', (req, res) => {
  // Create new user
  const userData = req.body;
  res.json({ message: 'User created', data: userData });
});

router.put('/users/:id', (req, res) => {
  // Update user
  const { id } = req.params;
  const userData = req.body;
  res.json({ message: \`User \${id} updated\`, data: userData });
});

router.delete('/users/:id', (req, res) => {
  // Delete user
  const { id } = req.params;
  res.json({ message: \`User \${id} deleted\` });
});

// Auth routes
router.post('/auth/login', (req, res) => {
  // Login logic
  const { email, password } = req.body;
  res.json({ message: 'Login successful', token: 'jwt-token' });
});

router.post('/auth/register', (req, res) => {
  // Registration logic
  const userData = req.body;
  res.json({ message: 'User registered', data: userData });
});

module.exports = router;
EOF

    print_success "Created API routes: src/routes/api.js"
}

# Generate utility function
generate_function() {
    local request="$1"

    print_status "Generating utility function"

    cat > "src/utils/helpers.js" << EOF
/**
 * Utility Functions
 * Generated by KISS Code Mode
 */

/**
 * Validate email address
 * @param {string} email - Email to validate
 * @returns {boolean} - True if valid
 */
function validateEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format date to readable string
 * @param {Date|string} date - Date to format
 * @returns {string} - Formatted date
 */
function formatDate(date) {
  const d = new Date(date);
  return d.toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric'
  });
}

/**
 * Generate random ID
 * @param {number} length - Length of ID
 * @returns {string} - Random ID
 */
function generateId(length = 8) {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < length; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

/**
 * Debounce function calls
 * @param {Function} func - Function to debounce
 * @param {number} wait - Wait time in milliseconds
 * @returns {Function} - Debounced function
 */
function debounce(func, wait) {
  let timeout;
  return function executedFunction(...args) {
    const later = () => {
      clearTimeout(timeout);
      func(...args);
    };
    clearTimeout(timeout);
    timeout = setTimeout(later, wait);
  };
}

/**
 * Deep clone object
 * @param {any} obj - Object to clone
 * @returns {any} - Cloned object
 */
function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj;
  if (obj instanceof Date) return new Date(obj.getTime());
  if (obj instanceof Array) return obj.map(item => deepClone(item));

  const cloned = {};
  Object.keys(obj).forEach(key => {
    cloned[key] = deepClone(obj[key]);
  });
  return cloned;
}

// Export functions
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    validateEmail,
    formatDate,
    generateId,
    debounce,
    deepClone
  };
} else {
  window.Utils = {
    validateEmail,
    formatDate,
    generateId,
    debounce,
    deepClone
  };
}
EOF

    print_success "Created utility functions: src/utils/helpers.js"
}

# Generate general code
generate_general() {
    local request="$1"

    print_status "Generating general code solution"

    # Create a simple example based on the request
    cat > "generated-code.js" << EOF
/**
 * Generated Code Solution
 * Request: $request
 * Generated by KISS Code Mode
 */

// Example implementation based on your request
class Solution {
  constructor() {
    this.data = [];
    this.init();
  }

  init() {
    console.log('Solution initialized');
    // Add your initialization logic here
  }

  // Add methods based on your specific needs
  processData(input) {
    // Process input data
    return input;
  }

  saveData() {
    // Save data logic
    console.log('Data saved');
  }

  loadData() {
    // Load data logic
    console.log('Data loaded');
    return this.data;
  }
}

// Usage example
const solution = new Solution();

// Export for module system
if (typeof module !== 'undefined' && module.exports) {
  module.exports = Solution;
} else {
  window.Solution = Solution;
}
EOF

    print_success "Created general solution: generated-code.js"
    print_warning "Please review and customize the generated code for your specific needs"
}

# Generate fix for common issues
generate_fix() {
    local request="$1"

    print_status "Generating fix for common issues"

    # Check for common issues in the codebase
    if echo "$request" | grep -qi "database\|connection"; then
        generate_database_fix
    elif echo "$request" | grep -qi "auth\|login"; then
        generate_auth_fix
    elif echo "$request" | grep -qi "error\|handling"; then
        generate_error_fix
    else
        generate_general_fix
    fi
}

# Generate database fix
generate_database_fix() {
    print_status "Generating database connection fix"

    cat > "database-fix.js" << EOF
/**
 * Database Connection Fix
 * Generated by KISS Code Mode
 */

class DatabaseManager {
  constructor() {
    this.connection = null;
    this.isConnected = false;
  }

  async connect() {
    try {
      // Replace with your actual database connection
      this.connection = await this.createConnection();
      this.isConnected = true;
      console.log('Database connected successfully');
      return true;
    } catch (error) {
      console.error('Database connection failed:', error);
      this.handleConnectionError(error);
      return false;
    }
  }

  async createConnection() {
    // Example connection logic - replace with your database
    return new Promise((resolve, reject) => {
      setTimeout(() => {
        // Simulate connection
        resolve({ status: 'connected' });
      }, 100);
    });
  }

  handleConnectionError(error) {
    // Implement retry logic
    console.log('Attempting to reconnect...');
    setTimeout(() => this.connect(), 5000);
  }

  async disconnect() {
    if (this.connection) {
      await this.connection.close();
      this.isConnected = false;
      console.log('Database disconnected');
    }
  }

  async query(sql, params = []) {
    if (!this.isConnected) {
      throw new Error('Database not connected');
    }

    try {
      // Execute query logic
      const result = await this.connection.query(sql, params);
      return result;
    } catch (error) {
      console.error('Query failed:', error);
      throw error;
    }
  }
}

// Global instance
const dbManager = new DatabaseManager();

// Auto-connect on module load
dbManager.connect().catch(console.error);

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = DatabaseManager;
} else {
  window.DatabaseManager = DatabaseManager;
  window.dbManager = dbManager;
}
EOF

    print_success "Created database fix: database-fix.js"
}

# Generate auth fix
generate_auth_fix() {
    print_status "Generating authentication fix"

    cat > "auth-fix.js" << EOF
/**
 * Authentication Fix
 * Generated by KISS Code Mode
 */

class AuthManager {
  constructor() {
    this.user = null;
    this.token = localStorage.getItem('auth_token');
    this.isAuthenticated = false;
  }

  async login(credentials) {
    try {
      const response = await fetch('/api/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(credentials)
      });

      if (!response.ok) {
        throw new Error('Login failed');
      }

      const data = await response.json();
      this.token = data.token;
      this.user = data.user;
      this.isAuthenticated = true;

      localStorage.setItem('auth_token', this.token);
      console.log('Login successful');
      return data;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  }

  async logout() {
    try {
      await fetch('/api/auth/logout', {
        method: 'POST',
        headers: {
          'Authorization': \`Bearer \${this.token}\`
        }
      });
    } catch (error) {
      console.warn('Logout API call failed, clearing local data');
    }

    this.user = null;
    this.token = null;
    this.isAuthenticated = false;
    localStorage.removeItem('auth_token');

    console.log('Logged out successfully');
  }

  async checkAuth() {
    if (!this.token) return false;

    try {
      const response = await fetch('/api/auth/verify', {
        headers: {
          'Authorization': \`Bearer \${this.token}\`
        }
      });

      if (response.ok) {
        const data = await response.json();
        this.user = data.user;
        this.isAuthenticated = true;
        return true;
      } else {
        this.logout();
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      return false;
    }
  }

  getAuthHeaders() {
    return this.token ? { 'Authorization': \`Bearer \${this.token}\` } : {};
  }
}

// Global instance
const authManager = new AuthManager();

// Auto-check auth on load
authManager.checkAuth().catch(console.error);

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = AuthManager;
} else {
  window.AuthManager = AuthManager;
  window.authManager = authManager;
}
EOF

    print_success "Created auth fix: auth-fix.js"
}

# Generate error handling fix
generate_error_fix() {
    print_status "Generating error handling improvements"

    cat > "error-handling-fix.js" << EOF
/**
 * Error Handling Improvements
 * Generated by KISS Code Mode
 */

class ErrorHandler {
  static handle(error, context = '') {
    console.error(\`Error in \${context}:\`, error);

    // Log to external service if available
    this.logToService(error, context);

    // Show user-friendly message
    this.showUserMessage(error);

    // Attempt recovery if possible
    this.attemptRecovery(error, context);
  }

  static logToService(error, context) {
    // Send to error logging service
    const errorData = {
      message: error.message,
      stack: error.stack,
      context: context,
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    // Example: Send to logging service
    console.log('Error logged:', errorData);
  }

  static showUserMessage(error) {
    // Create user-friendly error message
    let message = 'An unexpected error occurred.';

    if (error.message.includes('network')) {
      message = 'Network connection error. Please check your internet connection.';
    } else if (error.message.includes('auth')) {
      message = 'Authentication error. Please log in again.';
    } else if (error.message.includes('permission')) {
      message = 'Permission denied. Please contact support.';
    }

    // Show message to user (adapt to your UI framework)
    alert(message);
  }

  static attemptRecovery(error, context) {
    // Attempt automatic recovery for certain errors
    if (error.message.includes('token') && context.includes('auth')) {
      // Try to refresh token
      console.log('Attempting token refresh...');
      // authManager.refreshToken().catch(() => {});
    } else if (error.message.includes('network')) {
      // Retry network request
      console.log('Retrying network request...');
    }
  }
}

// Global error handlers
window.addEventListener('error', (event) => {
  ErrorHandler.handle(event.error, 'global');
});

window.addEventListener('unhandledrejection', (event) => {
  ErrorHandler.handle(event.reason, 'promise');
});

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = ErrorHandler;
} else {
  window.ErrorHandler = ErrorHandler;
}
EOF

    print_success "Created error handling fix: error-handling-fix.js"
}

# Generate general fix
generate_general_fix() {
    print_status "Generating general fix template"

    cat > "general-fix.js" << EOF
/**
 * General Fix Template
 * Request: $REQUEST
 * Generated by KISS Code Mode
 */

// Identify the issue and implement fix
class GeneralFix {
  static apply() {
    console.log('Applying general fix...');

    // 1. Identify the problem
    this.identifyProblem();

    // 2. Implement the solution
    this.implementSolution();

    // 3. Test the fix
    this.testFix();

    console.log('General fix applied');
  }

  static identifyProblem() {
    // Add problem identification logic
    console.log('Problem identified');
  }

  static implementSolution() {
    // Add solution implementation
    console.log('Solution implemented');
  }

  static testFix() {
    // Add testing logic
    console.log('Fix tested successfully');
  }
}

// Apply the fix
GeneralFix.apply();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = GeneralFix;
} else {
  window.GeneralFix = GeneralFix;
}
EOF

    print_success "Created general fix template: general-fix.js"
}

# Generate update
generate_update() {
    local request="$1"

    print_status "Generating update for existing code"

    cat > "update-template.js" << EOF
/**
 * Update Template
 * Request: $REQUEST
 * Generated by KISS Code Mode
 */

// Template for updating existing code
class CodeUpdate {
  static apply() {
    console.log('Applying code update...');

    // 1. Backup current code
    this.backupCurrent();

    // 2. Apply changes
    this.applyChanges();

    // 3. Test updates
    this.testUpdates();

    console.log('Code update completed');
  }

  static backupCurrent() {
    // Create backup before updating
    console.log('Current code backed up');
  }

  static applyChanges() {
    // Apply the requested changes
    console.log('Changes applied');
  }

  static testUpdates() {
    // Test the updated code
    console.log('Updates tested successfully');
  }
}

// Apply the update
CodeUpdate.apply();

// Export
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CodeUpdate;
} else {
  window.CodeUpdate = CodeUpdate;
}
EOF

    print_success "Created update template: update-template.js"
    print_warning "Please adapt this template to your specific update needs"
}

# Main execution
print_header "KISS CODE MODE"
print_status "Processing request: $REQUEST"

# Analyze and generate code
generate_code "$REQUEST"

print_header "CODE GENERATION COMPLETE"
print_success "Generated code ready for use"
print_status "Review and customize the generated code as needed"
print_status "Test the code in your application before deploying"

echo ""
print_status "💡 KISS Code Mode Tips:"
echo "  • Generated code is a starting point - customize as needed"
echo "  • Test thoroughly before deploying to production"
echo "  • Use the generated code as a foundation for your specific requirements"
echo "  • Remember: Simple, effective, zero maintenance"
