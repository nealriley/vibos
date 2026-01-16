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

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

SHARED_DIR="/home/vibe/shared"

# Validate arguments
require_args 1 $# "window-screenshot.sh <window-id|class|title> [filename]"

IDENTIFIER="$1"
FILENAME="${2:-window-$(date +%Y%m%d-%H%M%S).png}"

# Ensure filename has .png extension
if [[ "$FILENAME" != *.png ]]; then
    FILENAME="${FILENAME}.png"
fi

OUTPUT="$SHARED_DIR/$FILENAME"

# Find the window
WINDOW_ID=$(require_window "$IDENTIFIER")

# Ensure shared directory exists
mkdir -p "$SHARED_DIR"

# Focus the window first to ensure it's visible
focus_window "$WINDOW_ID" || true
sleep 0.2

# Take screenshot of the specific window using scrot
scrot -w "$WINDOW_ID" "$OUTPUT" 2>/dev/null || {
    # Fallback: take full screenshot
    log_warning "Direct window capture failed, taking full screenshot"
    scrot "$OUTPUT"
}

echo "$OUTPUT"
