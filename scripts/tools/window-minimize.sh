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

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 1 $# "window-minimize.sh <window-id|class|title>"

IDENTIFIER="$1"

# Find the window
WINDOW_ID=$(require_window "$IDENTIFIER")

# Minimize using xdotool
xdotool windowminimize "$WINDOW_ID" 2>/dev/null

log_info "Minimized window $WINDOW_ID"
