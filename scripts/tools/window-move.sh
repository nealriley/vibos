#!/bin/bash
# VibeOS Window Move Tool
# Moves a window to a specific position
#
# Usage: window-move.sh <identifier> <x> <y>
#   identifier: Window ID (hex), class name, or title substring
#   x, y: Target position coordinates
#
# Examples:
#   window-move.sh 0x04000007 100 100   # Move by window ID
#   window-move.sh firefox 0 0          # Move Firefox to top-left
#   window-move.sh "Terminal" 500 200   # Move terminal

set -euo pipefail

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 3 $# "window-move.sh <window-id|class|title> <x> <y>"

IDENTIFIER="$1"
X="$2"
Y="$3"

# Find and move the window
WINDOW_ID=$(require_window "$IDENTIFIER")
move_window "$WINDOW_ID" "$X" "$Y"

log_info "Moved window $WINDOW_ID to ($X, $Y)"
