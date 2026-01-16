#!/bin/bash
# VibeOS Window Type Tool
# Types text into the currently focused window or a specific window
#
# Usage: window-type.sh <text> [identifier]
#   text: Text to type
#   identifier: Optional. Window ID, class, or title to focus first
#
# Examples:
#   window-type.sh "Hello World"                    # Type into current window
#   window-type.sh "search query" firefox           # Focus Firefox then type
#   window-type.sh "ls -la" xfce4-terminal          # Type command in terminal

set -euo pipefail

# Source shared library
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
source "$SCRIPT_DIR/lib/window-utils.sh"

# Validate arguments
require_args 1 $# "window-type.sh <text> [window-id|class|title]"

TEXT="$1"
IDENTIFIER="${2:-}"

# If identifier provided, focus that window first
if [[ -n "$IDENTIFIER" ]]; then
    WINDOW_ID=$(require_window "$IDENTIFIER")
    focus_window "$WINDOW_ID"
    sleep 0.1
fi

# Type the text
xdotool type --clearmodifiers "$TEXT"

log_info "Typed text into window"
