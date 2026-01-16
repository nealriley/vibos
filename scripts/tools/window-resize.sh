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

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 3 $# "window-resize.sh <window-id|class|title> <width> <height>"

IDENTIFIER="$1"
WIDTH="$2"
HEIGHT="$3"

# Find and resize the window
WINDOW_ID=$(require_window "$IDENTIFIER")
resize_window "$WINDOW_ID" "$WIDTH" "$HEIGHT"

log_info "Resized window $WINDOW_ID to ${WIDTH}x${HEIGHT}"
