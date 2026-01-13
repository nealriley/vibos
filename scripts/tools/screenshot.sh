#!/bin/bash
# VibeOS Screenshot Tool
# Takes a screenshot of the desktop and saves to the shared folder
#
# Usage: screenshot.sh [filename]
#   filename: Optional. Defaults to screenshot-YYYYMMDD-HHMMSS.png
#
# Output: Prints the full path to the saved screenshot
#
# Example:
#   screenshot.sh                    # Auto-named with timestamp
#   screenshot.sh myshot.png         # Custom name

set -euo pipefail

SHARED_DIR="/home/vibe/shared"
FILENAME="${1:-screenshot-$(date +%Y%m%d-%H%M%S).png}"

# Ensure filename has .png extension
if [[ "$FILENAME" != *.png ]]; then
    FILENAME="${FILENAME}.png"
fi

OUTPUT="$SHARED_DIR/$FILENAME"

# Ensure shared directory exists
mkdir -p "$SHARED_DIR"

# Set display for X11 (use :0 which is the Xvfb display)
export DISPLAY=:0

# Take the screenshot
scrot "$OUTPUT"

# Output the path for the caller
echo "$OUTPUT"
