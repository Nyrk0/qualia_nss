#!/bin/bash

# QUALIA-NSS Deployment Validation System
# Pre-deployment checks and rollback capabilities
# Ensures safe deployments with automatic validation

set -e

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${BLUE}[DEPLOY]${NC} $1"
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
ISSUES_FOUND=0

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
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            print_warning "$message"
            ;;
        "FAIL")
            ISSUES_FOUND=$((ISSUES_FOUND + 1))
            print_error "$message"
            ;;
    esac
}

# Pre-deployment validation
pre_deployment_check() {
    print_header "PRE-DEPLOYMENT VALIDATION"

    # 1. Check git status
    print_status "Checking git status..."
    if git diff --quiet && git diff --staged --quiet; then
        check_result "PASS" "Working directory is clean"
    else
        check_result "WARN" "Uncommitted changes found"
        git status --short
    fi

    # 2. Run health checks
    print_status "Running module health checks..."
    if [ -f "scripts/module-health-check.sh" ]; then
        if ./scripts/module-health-check.sh --all > /tmp/deploy_health.log 2>&1; then
            check_result "PASS" "All modules passed health checks"
        else
            check_result "FAIL" "Module health check failed - see /tmp/deploy_health.log"
        fi
    else
        check_result "WARN" "Health check script not found"
    fi

    # 3. Check for console errors
    print_status "Checking for console statements..."
    if find src/ -name "*.js" -exec grep -l "console\." {} \; | grep -q .; then
        check_result "WARN" "Console statements found in production code"
    else
        check_result "PASS" "No console statements found"
    fi

    # 4. Validate file structure
    print_status "Validating file structure..."
    local required_files=("index.html" "src/js/app-core.js" "src/js/module-loader.js")

    for file in "${required_files[@]}"; do
        if [ -f "$file" ]; then
            check_result "PASS" "Required file exists: $file"
        else
            check_result "FAIL" "Missing required file: $file"
        fi
    done

    # 5. Check for backup
    print_status "Checking backup status..."
    if [ -d "backups" ] && [ "$(find backups/ -name "*.js" | wc -l)" -gt 0 ]; then
        check_result "PASS" "Backup files available for rollback"
    else
        check_result "WARN" "No backup files found - create backup before deployment"
    fi

    # 6. Test build (if applicable)
    print_status "Testing basic functionality..."
    if [ -f "index.html" ]; then
        check_result "PASS" "Main index.html exists"
    else
        check_result "FAIL" "Main index.html missing"
    fi

    # Calculate readiness score
    local readiness_score=$(( (PASSED_CHECKS * 100) / TOTAL_CHECKS ))

    echo ""
    print_header "DEPLOYMENT READINESS"

    echo "📊 Checks Performed: $TOTAL_CHECKS"
    echo "✅ Passed: $PASSED_CHECKS"
    echo "⚠️  Issues: $ISSUES_FOUND"
    echo "📈 Readiness Score: ${readiness_score}%"

    if [ $readiness_score -ge 90 ]; then
        print_success "✅ READY FOR DEPLOYMENT"
        return 0
    elif [ $readiness_score -ge 75 ]; then
        print_warning "⚠️  MOSTLY READY - Minor issues found"
        return 0
    else
        print_error "❌ NOT READY - Critical issues found"
        return 1
    fi
}

# Create deployment package
create_deployment_package() {
    local version="${1:-$(date +%Y%m%d_%H%M%S)}"
    local package_name="qualia-nss-v${version}"

    print_header "CREATING DEPLOYMENT PACKAGE"

    print_status "Package name: $package_name"

    # Create deployment directory
    mkdir -p "deploy/${package_name}"

    # Copy essential files
    cp -r index.html "deploy/${package_name}/"
    cp -r src/ "deploy/${package_name}/"
    cp -r scripts/ "deploy/${package_name}/" 2>/dev/null || true
    cp -r assets/ "deploy/${package_name}/" 2>/dev/null || true

    # Create deployment manifest
    cat > "deploy/${package_name}/DEPLOYMENT.md" << EOF
# Qualia-NSS Deployment Package

**Version:** ${version}
**Created:** $(date)
**Git Commit:** $(git rev-parse HEAD 2>/dev/null || echo "unknown")

## Contents
- index.html - Main application
- src/ - Source modules
- scripts/ - Utility scripts
- assets/ - Static assets

## Deployment Instructions
1. Copy package to deployment server
2. Ensure web server serves from package root
3. Test functionality in browser
4. Update any necessary server configurations

## Rollback
If issues occur, rollback to previous deployment package.

---
Generated by Qualia-NSS deployment system
EOF

    # Create archive
    if command -v tar &> /dev/null; then
        cd deploy
        tar -czf "${package_name}.tar.gz" "$package_name"
        cd ..
        print_success "Deployment package created: deploy/${package_name}.tar.gz"
    else
        print_success "Deployment package created: deploy/${package_name}/"
        print_warning "tar not available - package not compressed"
    fi

    # Update latest symlink
    ln -sf "$package_name" "deploy/latest" 2>/dev/null || true

    print_success "Deployment package ready for use"
}

# Rollback to previous deployment
rollback_deployment() {
    local target_version="$1"

    print_header "DEPLOYMENT ROLLBACK"

    if [ -z "$target_version" ]; then
        # Find most recent backup
        if [ -d "deploy" ]; then
            target_version=$(ls -t deploy/ | grep "qualia-nss-v" | head -1)
        fi

        if [ -z "$target_version" ]; then
            print_error "No deployment packages found for rollback"
            return 1
        fi
    fi

    print_status "Rolling back to: $target_version"

    if [ ! -d "deploy/$target_version" ]; then
        print_error "Target version not found: $target_version"
        return 1
    fi

    # Backup current state
    if [ -f "index.html" ]; then
        print_status "Creating rollback backup..."
        ./scripts/backup.sh auto index.html rollback 2>/dev/null || true
        ./scripts/backup.sh auto src/ rollback 2>/dev/null || true
    fi

    # Perform rollback
    cp -r "deploy/$target_version"/* .

    print_success "Rollback completed to $target_version"
    print_warning "Test the application to ensure rollback was successful"
}

# List available deployment packages
list_deployments() {
    print_header "AVAILABLE DEPLOYMENT PACKAGES"

    if [ ! -d "deploy" ]; then
        print_warning "No deployment directory found"
        return
    fi

    local packages=$(ls -la deploy/ | grep "qualia-nss-v" | wc -l)

    if [ "$packages" -eq 0 ]; then
        print_warning "No deployment packages found"
        return
    fi

    echo "📦 Found $packages deployment packages:"
    echo ""

    ls -la deploy/ | grep "qualia-nss-v" | while read -r line; do
        local package=$(echo "$line" | awk '{print $9}')
        local size=$(echo "$line" | awk '{print $5}')
        local date=$(echo "$line" | awk '{print $6, $7, $8}')

        if [ -d "deploy/$package" ]; then
            echo "  📁 $package ($size bytes, $date)"
        fi
    done

    echo ""
    if [ -L "deploy/latest" ]; then
        local latest=$(readlink deploy/latest)
        print_status "Latest deployment: $latest"
    fi
}

# Quick deployment test
test_deployment() {
    print_header "DEPLOYMENT TEST"

    print_status "Testing basic functionality..."

    # Check if files exist
    local critical_files=("index.html" "src/js/app-core.js" "src/js/module-loader.js")

    for file in "${critical_files[@]}"; do
        if [ -f "$file" ]; then
            check_result "PASS" "Critical file exists: $file"
        else
            check_result "FAIL" "Missing critical file: $file"
        fi
    done

    # Test HTML structure
    if [ -f "index.html" ]; then
        if grep -q "<!DOCTYPE html>" index.html; then
            check_result "PASS" "HTML document structure valid"
        else
            check_result "WARN" "HTML document structure may be incomplete"
        fi
    fi

    # Test JavaScript syntax (basic check)
    if [ -f "src/js/app-core.js" ]; then
        if node -c src/js/app-core.js 2>/dev/null; then
            check_result "PASS" "app-core.js syntax valid"
        else
            check_result "FAIL" "app-core.js syntax errors found"
        fi
    fi

    print_status "Deployment test completed"
}

# Main command handler
case "$1" in
    "check"|"validate")
        pre_deployment_check
        ;;
    "package"|"create")
        shift
        create_deployment_package "$@"
        ;;
    "rollback")
        rollback_deployment "$2"
        ;;
    "list")
        list_deployments
        ;;
    "test")
        test_deployment
        ;;
    *)
        print_header "QUALIA-NSS DEPLOYMENT VALIDATION"
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  check|validate          Run pre-deployment validation"
        echo "  package|create [ver]    Create deployment package"
        echo "  rollback [version]      Rollback to previous deployment"
        echo "  list                    List available deployment packages"
        echo "  test                    Run basic deployment test"
        echo ""
        echo "Examples:"
        echo "  $0 check                # Validate before deployment"
        echo "  $0 package v1.2.3       # Create versioned package"
        echo "  $0 rollback             # Rollback to latest package"
        echo "  $0 list                 # Show deployment history"
        echo ""
        echo "Ensures safe deployments with rollback capabilities."
        exit 0
        ;;
esac
