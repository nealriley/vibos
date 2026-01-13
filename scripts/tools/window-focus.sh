#!/bin/bash
# VibeOS Window Focus Tool
# Focuses (activates) a window by ID, class, or title pattern
#
# Usage: window-focus.sh <identifier>
#   identifier: Window ID (hex), class name, or title substring
#
# Examples:
#   window-focus.sh 0x04000007          # By window ID
#   window-focus.sh firefox             # By class name
#   window-focus.sh "GitHub"            # By title substring

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

if [[ $# -lt 1 ]]; then
    echo "Usage: window-focus.sh <window-id|class|title>" >&2
    exit 1
fi

IDENTIFIER="$1"

# Check if it's a hex window ID
if [[ "$IDENTIFIER" =~ ^0x[0-9a-fA-F]+$ ]]; then
    xdotool windowactivate "$IDENTIFIER" 2>/dev/null && echo "Focused window: $IDENTIFIER" && exit 0
fi

# Try to find by class name
WINDOW_ID=$(xdotool search --class "$IDENTIFIER" 2>/dev/null | head -1 || echo "")
if [[ -n "$WINDOW_ID" ]]; then
    xdotool windowactivate "$WINDOW_ID" 2>/dev/null && echo "Focused window by class '$IDENTIFIER': $WINDOW_ID" && exit 0
fi

# Try to find by title
WINDOW_ID=$(xdotool search --name "$IDENTIFIER" 2>/dev/null | head -1 || echo "")
if [[ -n "$WINDOW_ID" ]]; then
    xdotool windowactivate "$WINDOW_ID" 2>/dev/null && echo "Focused window by title '$IDENTIFIER': $WINDOW_ID" && exit 0
fi

echo "Error: No window found matching '$IDENTIFIER'" >&2
exit 1
