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

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 1 $# "window-focus.sh <window-id|class|title>"

IDENTIFIER="$1"

# Find and focus the window
WINDOW_ID=$(require_window "$IDENTIFIER")
focus_window "$WINDOW_ID"

log_info "Focused window: $WINDOW_ID"
