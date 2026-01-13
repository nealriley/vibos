#!/bin/bash
# VibeOS Window Maximize Tool
# Maximizes or restores a window
#
# Usage: window-maximize.sh <identifier> [--restore]
#   identifier: Window ID (hex), class name, or title substring
#   --restore: Restore from maximized state instead of maximizing
#
# Examples:
#   window-maximize.sh firefox              # Maximize Firefox
#   window-maximize.sh firefox --restore    # Restore Firefox from maximized

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if [[ $# -lt 1 ]]; then
    echo "Usage: window-maximize.sh <window-id|class|title> [--restore]" >&2
    exit 1
fi

IDENTIFIER="$1"
RESTORE=false
if [[ "${2:-}" == "--restore" ]]; then
    RESTORE=true
fi

# Find window ID
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

if $RESTORE; then
    # Remove maximized state
    wmctrl -i -r "$WINDOW_ID" -b remove,maximized_vert,maximized_horz 2>/dev/null
    echo "Restored window $WINDOW_ID from maximized state"
else
    # Maximize the window
    wmctrl -i -r "$WINDOW_ID" -b add,maximized_vert,maximized_horz 2>/dev/null
    echo "Maximized window $WINDOW_ID"
fi
