#!/bin/bash
# VibeOS Window Close Tool
# Closes a window by ID, class, or title pattern
#
# Usage: window-close.sh <identifier>
#   identifier: Window ID (hex), class name, or title substring
#
# Examples:
#   window-close.sh 0x04000007      # Close by window ID
#   window-close.sh firefox         # Close Firefox
#   window-close.sh "Untitled"      # Close window with "Untitled" in title

set -euo pipefail

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 1 $# "window-close.sh <window-id|class|title>"

IDENTIFIER="$1"

# Find and close the window
WINDOW_ID=$(require_window "$IDENTIFIER")
close_window "$WINDOW_ID"

log_info "Closed window: $WINDOW_ID"
