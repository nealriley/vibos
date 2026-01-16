#!/bin/bash
# clipboard-read.sh - Read current clipboard contents
# Part of VibeOS automation tools
#
# Usage:
#   clipboard-read.sh              # Read primary selection (highlighted text)
#   clipboard-read.sh --clipboard  # Read clipboard (Ctrl+C)
#   clipboard-read.sh -c           # Short form for --clipboard
#   clipboard-read.sh --help       # Show help
#
# Exit codes:
#   0 - Success
#   1 - Clipboard is empty or error

set -euo pipefail

# Ensure DISPLAY is set
export DISPLAY="${DISPLAY:-:0}"

show_help() {
    cat << 'EOF'
clipboard-read.sh - Read current clipboard contents

Usage:
  clipboard-read.sh              Read primary selection (highlighted text)
  clipboard-read.sh --clipboard  Read clipboard (Ctrl+C copied text)
  clipboard-read.sh -c           Short form for --clipboard
  clipboard-read.sh --help       Show this help

X11 has two main selections:
  PRIMARY   - Text you highlight with mouse (middle-click to paste)
  CLIPBOARD - Text you copy with Ctrl+C (Ctrl+V to paste)

Examples:
  # Read what was last highlighted
  clipboard-read.sh
  
  # Read what was last copied with Ctrl+C
  clipboard-read.sh --clipboard
  
  # Store clipboard in variable
  CONTENT=$(clipboard-read.sh -c)

Exit codes:
  0 - Success (content printed to stdout)
  1 - Clipboard is empty or error occurred
EOF
}

# Parse arguments
SELECTION="primary"
while [[ $# -gt 0 ]]; do
    case "$1" in
        -c|--clipboard)
            SELECTION="clipboard"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo "Error: Unknown option: $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
    esac
done

# Read from clipboard using xclip
# -o: output to stdout
# -selection: which selection to read from
if ! content=$(xclip -o -selection "$SELECTION" 2>/dev/null); then
    echo "Error: Failed to read from $SELECTION selection" >&2
    exit 1
fi

# Check if empty
if [[ -z "$content" ]]; then
    echo "Error: $SELECTION selection is empty" >&2
    exit 1
fi

# Output the content
echo "$content"
