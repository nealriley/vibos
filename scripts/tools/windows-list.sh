#!/bin/bash
# VibeOS Window List Tool
# Lists all open windows with their IDs, titles, and geometry
#
# Usage: windows-list.sh [--json]
#   --json: Output in JSON format
#
# Output: List of windows with ID, title, position, size
#
# Example:
#   windows-list.sh           # Human-readable format
#   windows-list.sh --json    # JSON format for programmatic use

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

JSON_OUTPUT=false
if [[ "${1:-}" == "--json" ]]; then
    JSON_OUTPUT=true
fi

# Get window list using wmctrl
# Format: <window-id> <desktop> <pid> <x> <y> <width> <height> <hostname> <title>
WINDOWS=$(wmctrl -l -G -p 2>/dev/null || echo "")

if [[ -z "$WINDOWS" ]]; then
    if $JSON_OUTPUT; then
        echo "[]"
    else
        echo "No windows found"
    fi
    exit 0
fi

if $JSON_OUTPUT; then
    echo "["
    FIRST=true
    while IFS= read -r line; do
        # Parse wmctrl output
        WIN_ID=$(echo "$line" | awk '{print $1}')
        DESKTOP=$(echo "$line" | awk '{print $2}')
        PID=$(echo "$line" | awk '{print $3}')
        X=$(echo "$line" | awk '{print $4}')
        Y=$(echo "$line" | awk '{print $5}')
        WIDTH=$(echo "$line" | awk '{print $6}')
        HEIGHT=$(echo "$line" | awk '{print $7}')
        # Title is everything after the 8th field (hostname)
        TITLE=$(echo "$line" | awk '{$1=$2=$3=$4=$5=$6=$7=$8=""; print $0}' | sed 's/^[[:space:]]*//')
        
        # Get window class using xdotool
        WIN_CLASS=$(xdotool getwindowclassname "$WIN_ID" 2>/dev/null || echo "unknown")
        
        if ! $FIRST; then
            echo ","
        fi
        FIRST=false
        
        # Escape quotes in title
        TITLE_ESCAPED=$(echo "$TITLE" | sed 's/"/\\"/g')
        
        printf '  {"id": "%s", "desktop": %s, "pid": %s, "x": %s, "y": %s, "width": %s, "height": %s, "class": "%s", "title": "%s"}' \
            "$WIN_ID" "$DESKTOP" "$PID" "$X" "$Y" "$WIDTH" "$HEIGHT" "$WIN_CLASS" "$TITLE_ESCAPED"
    done <<< "$WINDOWS"
    echo ""
    echo "]"
else
    echo "Open Windows:"
    echo "============="
    while IFS= read -r line; do
        WIN_ID=$(echo "$line" | awk '{print $1}')
        X=$(echo "$line" | awk '{print $4}')
        Y=$(echo "$line" | awk '{print $5}')
        WIDTH=$(echo "$line" | awk '{print $6}')
        HEIGHT=$(echo "$line" | awk '{print $7}')
        TITLE=$(echo "$line" | awk '{$1=$2=$3=$4=$5=$6=$7=$8=""; print $0}' | sed 's/^[[:space:]]*//')
        WIN_CLASS=$(xdotool getwindowclassname "$WIN_ID" 2>/dev/null || echo "unknown")
        
        echo ""
        echo "Window: $WIN_ID"
        echo "  Class: $WIN_CLASS"
        echo "  Title: $TITLE"
        echo "  Position: ${X},${Y}"
        echo "  Size: ${WIDTH}x${HEIGHT}"
    done <<< "$WINDOWS"
fi
