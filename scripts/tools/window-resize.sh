#!/bin/bash
# VibeOS Window Resize Tool
# Resizes a window to specified dimensions
#
# Usage: window-resize.sh <identifier> <width> <height>
#   identifier: Window ID (hex), class name, or title substring
#   width, height: Target dimensions in pixels
#
# Examples:
#   window-resize.sh firefox 800 600        # Resize Firefox to 800x600
#   window-resize.sh 0x04000007 1920 1080   # Resize to full HD

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if [[ $# -lt 3 ]]; then
    echo "Usage: window-resize.sh <window-id|class|title> <width> <height>" >&2
    exit 1
fi

IDENTIFIER="$1"
WIDTH="$2"
HEIGHT="$3"

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

# Resize the window using wmctrl
# -i = interpret ID as numeric, -e = geometry (gravity,x,y,width,height), -1 keeps current value
wmctrl -i -r "$WINDOW_ID" -e "0,-1,-1,$WIDTH,$HEIGHT" 2>/dev/null

echo "Resized window $WINDOW_ID to ${WIDTH}x${HEIGHT}"
