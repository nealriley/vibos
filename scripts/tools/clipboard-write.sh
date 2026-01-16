#!/bin/bash
# clipboard-write.sh - Write text to clipboard
# Part of VibeOS automation tools
#
# Usage:
#   clipboard-write.sh "text to copy"     # Write to clipboard
#   echo "text" | clipboard-write.sh      # Pipe text to clipboard
#   clipboard-write.sh --primary "text"   # Write to primary selection
#   clipboard-write.sh --help             # Show help
#
# Exit codes:
#   0 - Success
#   1 - Error (no input or xclip failure)

set -euo pipefail

# Ensure DISPLAY is set
export DISPLAY="${DISPLAY:-:0}"

show_help() {
    cat << 'EOF'
clipboard-write.sh - Write text to clipboard

Usage:
  clipboard-write.sh "text"        Write text to clipboard (Ctrl+V to paste)
  clipboard-write.sh -p "text"     Write to primary selection (middle-click)
  echo "text" | clipboard-write.sh Pipe text to clipboard
  clipboard-write.sh --help        Show this help

X11 has two main selections:
  PRIMARY   - Text you highlight with mouse (middle-click to paste)
  CLIPBOARD - Text you copy with Ctrl+C (Ctrl+V to paste)

By default, writes to CLIPBOARD selection for Ctrl+V pasting.

Examples:
  # Copy text to clipboard
  clipboard-write.sh "Hello, World!"
  
  # Copy file contents to clipboard
  cat file.txt | clipboard-write.sh
  
  # Copy command output
  ls -la | clipboard-write.sh
  
  # Copy to both selections (can paste with Ctrl+V or middle-click)
  clipboard-write.sh "text" && clipboard-write.sh -p "text"

Exit codes:
  0 - Success
  1 - Error (no input provided or xclip failure)
EOF
}

# Parse arguments
SELECTION="clipboard"
TEXT=""

while [[ $# -gt 0 ]]; do
    case "$1" in
        -p|--primary)
            SELECTION="primary"
            shift
            ;;
        -c|--clipboard)
            SELECTION="clipboard"
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        -*)
            echo "Error: Unknown option: $1" >&2
            echo "Use --help for usage information" >&2
            exit 1
            ;;
        *)
            # Treat as text to copy
            if [[ -z "$TEXT" ]]; then
                TEXT="$1"
            else
                TEXT="$TEXT $1"
            fi
            shift
            ;;
    esac
done

# Read from stdin if no text argument and stdin is not a terminal
if [[ -z "$TEXT" ]] && [[ ! -t 0 ]]; then
    TEXT=$(cat)
fi

# Check if we have text to copy
if [[ -z "$TEXT" ]]; then
    echo "Error: No text provided" >&2
    echo "Usage: clipboard-write.sh \"text to copy\"" >&2
    echo "   or: echo \"text\" | clipboard-write.sh" >&2
    exit 1
fi

# Write to clipboard using xclip
# -selection: which selection to write to
# -i: read from stdin (we echo the text)
if ! echo -n "$TEXT" | xclip -selection "$SELECTION" -i 2>/dev/null; then
    echo "Error: Failed to write to $SELECTION selection" >&2
    exit 1
fi

# Success message to stderr (so it doesn't interfere with piping)
echo "Copied ${#TEXT} characters to $SELECTION selection" >&2
