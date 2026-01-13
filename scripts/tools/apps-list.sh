#!/bin/bash
# VibeOS Applications List Tool
# Lists running GUI applications
#
# Usage: apps-list.sh [--json]
#   --json: Output in JSON format
#
# Output: List of running GUI applications with their PIDs and window count

set -euo pipefail

export DISPLAY="${DISPLAY:-:0}"

JSON_OUTPUT=false
if [[ "${1:-}" == "--json" ]]; then
    JSON_OUTPUT=true
fi

# Get unique window classes with their PIDs
declare -A APP_PIDS
declare -A APP_WINDOWS
declare -A APP_TITLES

# Parse wmctrl output
while IFS= read -r line; do
    [[ -z "$line" ]] && continue
    
    WIN_ID=$(echo "$line" | awk '{print $1}')
    PID=$(echo "$line" | awk '{print $3}')
    TITLE=$(echo "$line" | awk '{$1=$2=$3=$4=$5=$6=$7=$8=""; print $0}' | sed 's/^[[:space:]]*//')
    
    # Get window class
    CLASS=$(xdotool getwindowclassname "$WIN_ID" 2>/dev/null || echo "unknown")
    
    # Skip our own shell-ui windows
    [[ "$CLASS" == "electron" || "$CLASS" == "Electron" ]] && continue
    
    # Track app info
    APP_PIDS["$CLASS"]="$PID"
    APP_WINDOWS["$CLASS"]=$((${APP_WINDOWS["$CLASS"]:-0} + 1))
    # Keep first title for the app
    [[ -z "${APP_TITLES["$CLASS"]:-}" ]] && APP_TITLES["$CLASS"]="$TITLE"
    
done < <(wmctrl -l -p 2>/dev/null || echo "")

if [[ ${#APP_PIDS[@]} -eq 0 ]]; then
    if $JSON_OUTPUT; then
        echo "[]"
    else
        echo "No GUI applications running"
    fi
    exit 0
fi

if $JSON_OUTPUT; then
    echo "["
    FIRST=true
    for CLASS in "${!APP_PIDS[@]}"; do
        if ! $FIRST; then
            echo ","
        fi
        FIRST=false
        
        PID="${APP_PIDS[$CLASS]}"
        WINDOWS="${APP_WINDOWS[$CLASS]}"
        TITLE="${APP_TITLES[$CLASS]}"
        
        # Escape quotes in title
        TITLE_ESCAPED=$(echo "$TITLE" | sed 's/"/\\"/g')
        
        printf '  {"class": "%s", "pid": %s, "windows": %s, "title": "%s"}' \
            "$CLASS" "$PID" "$WINDOWS" "$TITLE_ESCAPED"
    done
    echo ""
    echo "]"
else
    echo "Running Applications:"
    echo "===================="
    for CLASS in "${!APP_PIDS[@]}"; do
        PID="${APP_PIDS[$CLASS]}"
        WINDOWS="${APP_WINDOWS[$CLASS]}"
        TITLE="${APP_TITLES[$CLASS]}"
        
        echo ""
        echo "  $CLASS"
        echo "    PID: $PID"
        echo "    Windows: $WINDOWS"
        echo "    Title: $TITLE"
    done
fi
