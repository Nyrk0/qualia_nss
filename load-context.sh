#!/bin/bash

# Qualia-NSS Context Loader for AI Assistants
# Usage: ./load-context.sh or source load-context.sh

PROJECT_ROOT="/Users/admin/Documents/Developer/qualia_nss"
AGENTS_FILE="$PROJECT_ROOT/AGENTS.md"
RULES_DIR="$PROJECT_ROOT/dev/RULES"

echo "🎯 Loading Qualia-NSS Project Context..."
echo "================================================"

# Load AGENTS.md
if [ -f "$AGENTS_FILE" ]; then
    echo "📋 AGENTS.md - Project Overview & Critical Rules"
    echo "================================================"
    cat "$AGENTS_FILE"
    echo -e "\n"
else
    echo "❌ ERROR: AGENTS.md not found at $AGENTS_FILE"
    exit 1
fi

# Load all numbered rule files in order
echo "📚 DEVELOPMENT RULES"
echo "================================================"

for rule_file in "$RULES_DIR"/[0-9]*.md; do
    if [ -f "$rule_file" ]; then
        echo "=== $(basename "$rule_file") ==="
        cat "$rule_file"
        echo -e "\n"
    fi
done

# Load rules index
if [ -f "$RULES_DIR/rules-index.md" ]; then
    echo "=== RULES-INDEX.MD ==="
    cat "$RULES_DIR/rules-index.md"
    echo -e "\n"
fi

echo "✅ Context Loading Complete"
echo "================================================"
echo "🏗️  Architecture: Modular SPA with Vanilla JavaScript"
echo "🎨 Development: Theme-first, no inline styles"
echo "⚠️  Critical: User approval required before git commits"
echo "📁 Working Directory: $PROJECT_ROOT"