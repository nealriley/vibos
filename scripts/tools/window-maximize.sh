#!/bin/bash
# VibeOS Window Maximize Tool
# Maximizes or restores a window
#
# Usage: window-maximize.sh <identifier> [--restore]
#   identifier: Window ID (hex), class name, or title substring
#   --restore: Restore from maximized state instead of maximizing
#
# Examples:
#   window-maximize.sh firefox              # Maximize Firefox
#   window-maximize.sh firefox --restore    # Restore Firefox from maximized

set -euo pipefail

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 1 $# "window-maximize.sh <window-id|class|title> [--restore]"

IDENTIFIER="$1"
RESTORE=false
if [[ "${2:-}" == "--restore" ]]; then
    RESTORE=true
fi

# Find the window
WINDOW_ID=$(require_window "$IDENTIFIER")

if $RESTORE; then
    # Remove maximized state
    wmctrl -i -r "$WINDOW_ID" -b remove,maximized_vert,maximized_horz 2>/dev/null
    log_info "Restored window $WINDOW_ID from maximized state"
else
    # Maximize the window
    wmctrl -i -r "$WINDOW_ID" -b add,maximized_vert,maximized_horz 2>/dev/null
    log_info "Maximized window $WINDOW_ID"
fi
