#!/bin/bash
# VibeOS Window Move Tool
# Moves a window to a specific position
#
# Usage: window-move.sh <identifier> <x> <y>
#   identifier: Window ID (hex), class name, or title substring
#   x, y: Target position coordinates
#
# Examples:
#   window-move.sh firefox 100 100      # Move Firefox to (100,100)
#   window-move.sh 0x04000007 0 0       # Move window to top-left

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if [[ $# -lt 3 ]]; then
    echo "Usage: window-move.sh <window-id|class|title> <x> <y>" >&2
    exit 1
fi

IDENTIFIER="$1"
X="$2"
Y="$3"

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

# Move the window using wmctrl (more reliable for position)
# -i = interpret ID as numeric, -e = geometry (gravity,x,y,width,height), -1 keeps current value
wmctrl -i -r "$WINDOW_ID" -e "0,$X,$Y,-1,-1" 2>/dev/null

echo "Moved window $WINDOW_ID to position ($X, $Y)"
