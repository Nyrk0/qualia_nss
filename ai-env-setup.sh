#!/bin/bash

# AI Environment Variables for Qualia-NSS Project
# Add these to your .bashrc, .zshrc, or .profile

echo "Adding Qualia-NSS environment variables to shell profile..."

# Detect shell
if [ -n "$ZSH_VERSION" ]; then
    SHELL_PROFILE="$HOME/.zshrc"
elif [ -n "$BASH_VERSION" ]; then
    SHELL_PROFILE="$HOME/.bashrc"
else
    SHELL_PROFILE="$HOME/.profile"
fi

# Environment variables to add
ENV_VARS='
# Qualia-NSS Project Configuration for AI Assistants
export AI_PROJECT_CONTEXT="/Users/admin/Documents/Developer/qualia_nss/AGENTS.md:/Users/admin/Documents/Developer/qualia_nss/dev/RULES/rules-index.md"
export AI_WORKING_DIR="/Users/admin/Documents/Developer/qualia_nss"
export QUALIA_PROJECT_ROOT="/Users/admin/Documents/Developer/qualia_nss"
export QUALIA_RULES_DIR="/Users/admin/Documents/Developer/qualia_nss/dev/RULES"
export QUALIA_THEME_FIRST="true"
export QUALIA_COMMIT_APPROVAL="required"

# Qualia-NSS Aliases
alias qualia-context="cat /Users/admin/Documents/Developer/qualia_nss/AGENTS.md"
alias qualia-rules="ls -la /Users/admin/Documents/Developer/qualia_nss/dev/RULES/"
alias qualia-dev="cd /Users/admin/Documents/Developer/qualia_nss"
alias qualia-serve="cd /Users/admin/Documents/Developer/qualia_nss && python3 -m http.server 8080"
alias load-qualia="source /Users/admin/Documents/Developer/qualia_nss/load-context.sh"

# AI Assistant Aliases
alias claude-qualia="cd /Users/admin/Documents/Developer/qualia_nss && claude --context=\"Qualia-NSS project loaded\""
alias gpt-qualia="cd /Users/admin/Documents/Developer/qualia_nss && chatgpt --system=\"Load Qualia-NSS context\""
alias gemini-qualia="cd /Users/admin/Documents/Developer/qualia_nss && gemini --config=\"gemini_config.json\""
'

# Check if already exists
if grep -q "Qualia-NSS Project Configuration" "$SHELL_PROFILE" 2>/dev/null; then
    echo "⚠️  Qualia-NSS environment variables already exist in $SHELL_PROFILE"
    echo "   Remove existing entries manually if you want to update them."
else
    echo "$ENV_VARS" >> "$SHELL_PROFILE"
    echo "✅ Environment variables added to $SHELL_PROFILE"
    echo "🔄 Run 'source $SHELL_PROFILE' or restart your terminal to apply changes"
fi

echo ""
echo "Available commands after sourcing:"
echo "  qualia-dev        - Navigate to project directory"
echo "  qualia-context    - Show AGENTS.md content"
echo "  qualia-rules      - List development rules"
echo "  qualia-serve      - Start local development server"
echo "  load-qualia       - Load full project context"
echo "  claude-qualia     - Start Claude with project context"
echo "  gpt-qualia        - Start GPT with project context"
echo "  gemini-qualia     - Start Gemini with project context"