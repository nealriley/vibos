#!/bin/bash
# VibeOS Window Key Tool
# Sends key presses to the currently focused window or a specific window
#
# Usage: window-key.sh <keys> [identifier]
#   keys: Key combination (e.g., "Return", "ctrl+s", "alt+F4")
#   identifier: Optional. Window ID, class, or title to focus first
#
# Common keys: Return, Escape, Tab, space, BackSpace, Delete
# Modifiers: ctrl, alt, shift, super
#
# Examples:
#   window-key.sh Return                        # Press Enter
#   window-key.sh "ctrl+s"                      # Save (Ctrl+S)
#   window-key.sh "alt+F4" firefox              # Close Firefox
#   window-key.sh "ctrl+shift+t" xfce4-terminal # New terminal tab

set -euo pipefail

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 1 $# "window-key.sh <keys> [window-id|class|title]"

KEYS="$1"
IDENTIFIER="${2:-}"

# If identifier provided, focus that window first
if [[ -n "$IDENTIFIER" ]]; then
    WINDOW_ID=$(require_window "$IDENTIFIER")
    focus_window "$WINDOW_ID"
    sleep 0.1
fi

# Send the key(s)
xdotool key --clearmodifiers "$KEYS"

log_info "Sent key: $KEYS"
