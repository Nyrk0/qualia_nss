#!/bin/bash

# QUALIA-NSS Smart Backup System
# Automatically creates backups during migrations
# Provides simple recovery and retention management

set -e

# Configuration
BACKUP_ROOT="backups"
MAX_BACKUPS=5
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Function to print colored output
print_status() {
    echo -e "${BLUE}[BACKUP]${NC} $1"
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

# Create backup directory structure
create_backup_dirs() {
    mkdir -p "$BACKUP_ROOT/migrations"
    mkdir -p "$BACKUP_ROOT/auto"
    mkdir -p "$BACKUP_ROOT/scripts"
}

# Generate backup filename with version
generate_backup_name() {
    local base_name="$1"
    local version=1

    # Find next available version number
    while [ -d "$BACKUP_ROOT/migrations/${base_name}_v${version}_${TIMESTAMP}" ]; do
        version=$((version + 1))
    done

    echo "${base_name}_v${version}_${TIMESTAMP}"
}

# Create backup of a file or directory
create_backup() {
    local source="$1"
    local backup_name="$2"

    if [ ! -e "$source" ]; then
        print_error "Source does not exist: $source"
        return 1
    fi

    local backup_path="$BACKUP_ROOT/migrations/$backup_name"

    print_status "Creating backup: $source → $backup_path"

    if [ -d "$source" ]; then
        cp -r "$source" "$backup_path"
    else
        mkdir -p "$(dirname "$backup_path")"
        cp "$source" "$backup_path"
    fi

    print_success "Backup created: $backup_path"
}

# Auto-backup during migrations
auto_backup() {
    local target="$1"
    local operation="$2"

    if [ ! -e "$target" ]; then
        print_warning "Auto-backup target does not exist: $target"
        return 0
    fi

    local backup_name="auto_${operation}_$(basename "$target")_${TIMESTAMP}"
    local backup_path="$BACKUP_ROOT/auto/$backup_name"

    print_status "Auto-backing up: $target"

    if [ -d "$target" ]; then
        cp -r "$target" "$backup_path"
    else
        mkdir -p "$(dirname "$backup_path")"
        cp "$target" "$backup_path"
    fi

    # Clean up old auto backups (keep last 3)
    cleanup_auto_backups "$(basename "$target")"

    print_success "Auto-backup created: $backup_path"
}

# Clean up old auto backups
cleanup_auto_backups() {
    local target_name="$1"
    local backup_dir="$BACKUP_ROOT/auto"
    local pattern="${target_name}_*"

    # Count existing backups for this target
    local count=$(find "$backup_dir" -name "$pattern" -type d 2>/dev/null | wc -l)

    if [ "$count" -gt 3 ]; then
        print_status "Cleaning up old auto backups for $target_name"

        # Keep only the 3 most recent
        find "$backup_dir" -name "$pattern" -type d -printf '%T@ %p\n' 2>/dev/null |
        sort -n | head -n -$((count - 3)) |
        cut -d' ' -f2- | xargs -r rm -rf

        print_success "Cleanup completed"
    fi
}

# List available backups
list_backups() {
    print_header "AVAILABLE BACKUPS"

    echo "Migration Backups:"
    if [ -d "$BACKUP_ROOT/migrations" ]; then
        ls -la "$BACKUP_ROOT/migrations" | grep -v "^total" | grep -v "^d" | head -10
    else
        echo "  No migration backups found"
    fi

    echo ""
    echo "Auto Backups:"
    if [ -d "$BACKUP_ROOT/auto" ]; then
        find "$BACKUP_ROOT/auto" -name "*" -type d | head -10
    else
        echo "  No auto backups found"
    fi
}

# Restore from backup
restore_backup() {
    local backup_path="$1"
    local target_path="$2"

    if [ ! -e "$backup_path" ]; then
        print_error "Backup does not exist: $backup_path"
        return 1
    fi

    if [ -e "$target_path" ]; then
        print_warning "Target already exists: $target_path"
        read -p "Overwrite? (y/N): " -n 1 -r
        echo ""
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            print_status "Restore cancelled"
            return 0
        fi
    fi

    print_status "Restoring from backup..."
    print_status "Source: $backup_path"
    print_status "Target: $target_path"

    if [ -d "$backup_path" ]; then
        mkdir -p "$(dirname "$target_path")"
        cp -r "$backup_path" "$target_path"
    else
        mkdir -p "$(dirname "$target_path")"
        cp "$backup_path" "$target_path"
    fi

    print_success "Restore completed"
}

# Clean up old backups
cleanup_backups() {
    print_status "Cleaning up old backups..."

    # Clean migration backups (keep last MAX_BACKUPS)
    if [ -d "$BACKUP_ROOT/migrations" ]; then
        local migration_count=$(find "$BACKUP_ROOT/migrations" -maxdepth 1 -type d | wc -l)

        if [ "$migration_count" -gt $((MAX_BACKUPS + 1)) ]; then
            print_status "Removing old migration backups (keeping last $MAX_BACKUPS)"

            find "$BACKUP_ROOT/migrations" -maxdepth 1 -type d -printf '%T@ %p\n' |
            sort -n | head -n -$MAX_BACKUPS |
            cut -d' ' -f2- | xargs -r rm -rf

            print_success "Migration backup cleanup completed"
        fi
    fi

    # Clean auto backups (keep last 3 per target)
    if [ -d "$BACKUP_ROOT/auto" ]; then
        for target_dir in "$BACKUP_ROOT/auto"/*/; do
            if [ -d "$target_dir" ]; then
                local target_name=$(basename "$target_dir")
                local auto_count=$(find "$target_dir" -maxdepth 1 -type d | wc -l)

                if [ "$auto_count" -gt 4 ]; then # +1 for the directory itself
                    print_status "Cleaning auto backups for $target_name"

                    find "$target_dir" -maxdepth 1 -type d -printf '%T@ %p\n' |
                    sort -n | head -n -$((auto_count - 4)) |
                    cut -d' ' -f2- | xargs -r rm -rf
                fi
            fi
        done
    fi

    print_success "Backup cleanup completed"
}

# Pre-migration backup
pre_migration_backup() {
    local target="$1"
    local operation="${2:-migration}"

    create_backup_dirs

    if [ -z "$target" ]; then
        print_error "Usage: $0 pre-migration <target> [operation]"
        exit 1
    fi

    print_header "PRE-MIGRATION BACKUP"
    print_status "Target: $target"
    print_status "Operation: $operation"

    # Create numbered backup
    local backup_base="$(basename "$target")_${operation}"
    local backup_name=$(generate_backup_name "$backup_base")

    create_backup "$target" "$backup_name"

    # Also create auto backup
    auto_backup "$target" "$operation"

    print_success "Pre-migration backup completed"
    print_status "Backup location: $BACKUP_ROOT/migrations/$backup_name"
}

# Quick backup for any file/directory
quick_backup() {
    local target="$1"
    local reason="${2:-manual}"

    create_backup_dirs

    if [ -z "$target" ]; then
        print_error "Usage: $0 quick <target> [reason]"
        exit 1
    fi

    local backup_name="quick_$(basename "$target")_${reason}_${TIMESTAMP}"
    create_backup "$target" "$backup_name"

    print_success "Quick backup completed: $backup_name"
}

# Main command handler
case "$1" in
    "pre-migration")
        pre_migration_backup "$2" "$3"
        ;;
    "quick")
        quick_backup "$2" "$3"
        ;;
    "list")
        list_backups
        ;;
    "restore")
        if [ $# -lt 3 ]; then
            print_error "Usage: $0 restore <backup-path> <target-path>"
            exit 1
        fi
        restore_backup "$2" "$3"
        ;;
    "cleanup")
        cleanup_backups
        ;;
    "auto")
        if [ $# -lt 3 ]; then
            print_error "Usage: $0 auto <target> <operation>"
            exit 1
        fi
        create_backup_dirs
        auto_backup "$2" "$3"
        ;;
    *)
        print_header "QUALIA-NSS BACKUP SYSTEM"
        echo "Usage: $0 <command> [options]"
        echo ""
        echo "Commands:"
        echo "  pre-migration <target> [operation]  Create pre-migration backup"
        echo "  quick <target> [reason]             Quick backup of file/directory"
        echo "  auto <target> <operation>           Auto-backup during operations"
        echo "  list                                List all available backups"
        echo "  restore <backup> <target>           Restore from backup"
        echo "  cleanup                             Clean up old backups"
        echo ""
        echo "Examples:"
        echo "  $0 pre-migration src/js/app-core.js es6-migration"
        echo "  $0 quick src/ important-changes"
        echo "  $0 auto src/spectrogram/spectrogram.js file-edit"
        echo "  $0 list"
        echo "  $0 restore backups/migrations/app-core.js_v1_20250905 src/js/app-core.js"
        exit 0
        ;;
esac
