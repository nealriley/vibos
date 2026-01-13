#!/bin/bash
# VibeOS Window Minimize Tool
# Minimizes a window
#
# Usage: window-minimize.sh <identifier>
#   identifier: Window ID (hex), class name, or title substring
#
# Examples:
#   window-minimize.sh firefox          # Minimize Firefox
#   window-minimize.sh 0x04000007       # Minimize by window ID

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if [[ $# -lt 1 ]]; then
    echo "Usage: window-minimize.sh <window-id|class|title>" >&2
    exit 1
fi

IDENTIFIER="$1"

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

# Minimize using xdotool
xdotool windowminimize "$WINDOW_ID" 2>/dev/null

echo "Minimized window $WINDOW_ID"
