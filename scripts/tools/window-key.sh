#!/bin/bash
# VibeOS Window Key Tool
# Sends key presses to the currently focused window or a specific window
#
# Usage: window-key.sh <keys> [identifier]
#   keys: Key combination (e.g., "Return", "ctrl+s", "alt+F4")
#   identifier: Optional. Window ID, class, or title to focus first
#
# Common keys: Return, Escape, Tab, space, BackSpace, Delete
# Modifiers: ctrl, alt, shift, super
#
# Examples:
#   window-key.sh Return                        # Press Enter
#   window-key.sh "ctrl+s"                      # Save (Ctrl+S)
#   window-key.sh "alt+F4" firefox              # Close Firefox
#   window-key.sh "ctrl+shift+t" xfce4-terminal # New terminal tab

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if [[ $# -lt 1 ]]; then
    echo "Usage: window-key.sh <keys> [window-id|class|title]" >&2
    echo "Examples:" >&2
    echo "  window-key.sh Return" >&2
    echo "  window-key.sh 'ctrl+s'" >&2
    echo "  window-key.sh 'alt+F4' firefox" >&2
    exit 1
fi

KEYS="$1"
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

# Send the key(s)
xdotool key --clearmodifiers "$KEYS"

echo "Sent key: $KEYS"
