#!/bin/bash
# VibeOS Window Type Tool
# Types text into the currently focused window or a specific window
#
# Usage: window-type.sh <text> [identifier]
#   text: Text to type
#   identifier: Optional. Window ID, class, or title to focus first
#
# Examples:
#   window-type.sh "Hello World"                    # Type into current window
#   window-type.sh "search query" firefox           # Focus Firefox then type
#   window-type.sh "ls -la" xfce4-terminal          # Type command in terminal

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if [[ $# -lt 1 ]]; then
    echo "Usage: window-type.sh <text> [window-id|class|title]" >&2
    exit 1
fi

TEXT="$1"
IDENTIFIER="${2:-}"

# If identifier provided, focus that window first
if [[ -n "$IDENTIFIER" ]]; then
    WINDOW_ID=""
    
    # Check if it's a hex window ID
    if [[ "$IDENTIFIER" =~ ^0x[0-9a-fA-F]+$ ]]; then
        WINDOW_ID="$IDENTIFIER"
    else
        # Try to find by class name
        WINDOW_ID=$(xdotool search --class "$IDENTIFIER" 2>/dev/null | head -1 || echo "")
        
        # Try to find by title if class didn't match
        if [[ -z "$WINDOW_ID" ]]; then
            WINDOW_ID=$(xdotool search --name "$IDENTIFIER" 2>/dev/null | head -1 || echo "")
        fi
    fi
    
    if [[ -z "$WINDOW_ID" ]]; then
        echo "Error: No window found matching '$IDENTIFIER'" >&2
        exit 1
    fi
    
    # Focus the window
    xdotool windowactivate "$WINDOW_ID" 2>/dev/null
    sleep 0.1
fi

# Type the text
xdotool type --clearmodifiers "$TEXT"

echo "Typed text into window"
