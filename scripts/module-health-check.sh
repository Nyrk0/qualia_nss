#!/bin/bash

# QUALIA-NSS Module Health Check
# Runs in < 10 seconds - checks ES6+ compliance, console errors, theme compliance
# Usage: ./module-health-check.sh [module-name] [--all]

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to print colored output
print_status() {
    echo -e "${BLUE}[INFO]${NC} $1"
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

# Initialize counters
TOTAL_CHECKS=0
PASSED_CHECKS=0
WARNINGS=0
ERRORS=0

# Function to track check results
check_result() {
    local result=$1
    local message=$2

    TOTAL_CHECKS=$((TOTAL_CHECKS + 1))

    case $result in
        "PASS")
            PASSED_CHECKS=$((PASSED_CHECKS + 1))
            print_success "$message"
            ;;
        "WARN")
            WARNINGS=$((WARNINGS + 1))
            print_warning "$message"
            ;;
        "FAIL")
            ERRORS=$((ERRORS + 1))
            print_error "$message"
            ;;
    esac
}

# Check if a specific module or all modules
if [ "$1" = "--all" ] || [ $# -eq 0 ]; then
    print_header "QUALIA-NSS MODULE HEALTH CHECK"
    print_status "Checking all modules in src/ directory..."
    MODULES=$(find src/ -maxdepth 1 -type d -name "*-*" | sed 's|src/||' | sort)
else
    MODULE_NAME="$1"
    if [ ! -d "src/${MODULE_NAME}" ]; then
        print_error "Module not found: src/${MODULE_NAME}"
        exit 1
    fi
    print_header "MODULE HEALTH CHECK: ${MODULE_NAME}"
    MODULES="$MODULE_NAME"
fi

# Function to check a single module
check_module() {
    local module=$1
    local module_dir="src/${module}"
    local index_file="${module_dir}/index.js"
    local html_file="${module_dir}/index.html"
    local css_file="${module_dir}/styles.css"

    echo ""
    print_header "Checking: ${module}"

    # 1. Check if module directory exists
    if [ ! -d "$module_dir" ]; then
        check_result "FAIL" "Module directory missing: ${module_dir}"
        return
    else
        check_result "PASS" "Module directory exists"
    fi

    # 2. Check index.js file
    if [ -f "$index_file" ]; then
        check_result "PASS" "index.js file exists"

        # Check for ES6+ compliance
        if grep -q "var " "$index_file"; then
            check_result "WARN" "Contains 'var' declarations (should use const/let)"
        else
            check_result "PASS" "No 'var' declarations found (ES6+ compliant)"
        fi

        # Check for arrow functions
        if grep -q "function(" "$index_file" && ! grep -q "=>" "$index_file"; then
            check_result "WARN" "Traditional functions found (consider arrow functions)"
        else
            check_result "PASS" "Modern function syntax detected"
        fi

        # Check for template literals
        if grep -q '+"[^"]*"+' "$index_file" || grep -q "+\s*'[^']*'+" "$index_file"; then
            check_result "WARN" "String concatenation found (consider template literals)"
        else
            check_result "PASS" "Template literals or simple strings used"
        fi

        # Check for class syntax
        if grep -q "class " "$index_file"; then
            check_result "PASS" "ES6 class syntax found"
        else
            check_result "WARN" "No class syntax found (may be using constructor functions)"
        fi

        # Check for console.log statements
        if grep -q "console\." "$index_file"; then
            check_result "WARN" "Console statements found (remove for production)"
        else
            check_result "PASS" "No console statements found"
        fi

    else
        check_result "FAIL" "index.js file missing"
    fi

    # 3. Check index.html file
    if [ -f "$html_file" ]; then
        check_result "PASS" "index.html file exists"

        # Check for proper HTML structure
        if grep -q "<div" "$html_file" && grep -q "</div>" "$html_file"; then
            check_result "PASS" "HTML structure appears valid"
        else
            check_result "WARN" "HTML structure may be incomplete"
        fi

    else
        check_result "FAIL" "index.html file missing"
    fi

    # 4. Check styles.css file
    if [ -f "$css_file" ]; then
        check_result "PASS" "styles.css file exists"

        # Check for CSS variables (theme compliance)
        if grep -q "var(--" "$css_file"; then
            check_result "PASS" "CSS variables found (theme compliant)"
        else
            check_result "WARN" "No CSS variables found (may not be theme compliant)"
        fi

        # Check for hardcoded colors
        if grep -q "#[0-9a-fA-F]\{3,6\}" "$css_file" || grep -q "rgb(" "$css_file"; then
            check_result "WARN" "Hardcoded colors found (should use CSS variables)"
        else
            check_result "PASS" "No hardcoded colors found"
        fi

    else
        check_result "WARN" "styles.css file missing (optional for some modules)"
    fi

    # 5. Check for README.md
    if [ -f "${module_dir}/README.md" ]; then
        check_result "PASS" "README.md exists"
    else
        check_result "WARN" "README.md missing (documentation recommended)"
    fi
}

# Run checks for each module
for module in $MODULES; do
    check_module "$module"
done

# Print summary
echo ""
print_header "HEALTH CHECK SUMMARY"

echo "📊 Total Checks: $TOTAL_CHECKS"
echo "✅ Passed: $PASSED_CHECKS"
echo "⚠️  Warnings: $WARNINGS"
echo "❌ Errors: $ERRORS"

# Calculate health score
if [ $TOTAL_CHECKS -gt 0 ]; then
    HEALTH_SCORE=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))
    echo "🏥 Health Score: ${HEALTH_SCORE}%"

    if [ $HEALTH_SCORE -ge 90 ]; then
        print_success "Excellent health! 🎉"
    elif [ $HEALTH_SCORE -ge 75 ]; then
        print_success "Good health with minor issues"
    elif [ $HEALTH_SCORE -ge 60 ]; then
        print_warning "Fair health - attention needed"
    else
        print_error "Poor health - immediate attention required"
    fi
fi

echo ""
print_status "Health check completed in $(date +%S)s"
print_status "Use './module-health-check.sh module-name' for specific modules"

# Exit with appropriate code
if [ $ERRORS -gt 0 ]; then
    exit 1
elif [ $WARNINGS -gt 0 ]; then
    exit 0  # Warnings are OK, just informational
else
    exit 0
fi
