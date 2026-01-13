#!/bin/bash
# VibeOS Window Screenshot Tool
# Takes a screenshot of a specific window
#
# Usage: window-screenshot.sh <identifier> [filename]
#   identifier: Window ID (hex), class name, or title substring
#   filename: Optional. Defaults to window-YYYYMMDD-HHMMSS.png
#
# Output: Prints the full path to the saved screenshot
#
# Examples:
#   window-screenshot.sh firefox                    # Screenshot Firefox
#   window-screenshot.sh 0x04000007 myshot.png     # Screenshot specific window

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

SHARED_DIR="/home/vibe/shared"

if [[ $# -lt 1 ]]; then
    echo "Usage: window-screenshot.sh <window-id|class|title> [filename]" >&2
    exit 1
fi

IDENTIFIER="$1"
FILENAME="${2:-window-$(date +%Y%m%d-%H%M%S).png}"

# Ensure filename has .png extension
if [[ "$FILENAME" != *.png ]]; then
    FILENAME="${FILENAME}.png"
fi

OUTPUT="$SHARED_DIR/$FILENAME"

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

# Ensure shared directory exists
mkdir -p "$SHARED_DIR"

# Focus the window first to ensure it's visible
xdotool windowactivate "$WINDOW_ID" 2>/dev/null || true
sleep 0.2

# Take screenshot of the specific window using scrot
# -u = focused window, but we'll use the window ID directly
scrot -w "$WINDOW_ID" "$OUTPUT" 2>/dev/null || {
    # Fallback: take full screenshot and crop
    echo "Warning: Direct window capture failed, taking full screenshot" >&2
    scrot "$OUTPUT"
}

echo "$OUTPUT"
