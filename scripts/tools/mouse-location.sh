#!/bin/bash
# Get current mouse cursor location
# Usage: mouse-location.sh [--json]
# Output: x y (or JSON format with --json)

export DISPLAY=:0

FORMAT="${1:-text}"

eval $(xdotool getmouselocation --shell)

if [ "$FORMAT" = "--json" ] || [ "$FORMAT" = "-j" ]; then
    echo "{\"x\": $X, \"y\": $Y, \"screen\": $SCREEN, \"window\": $WINDOW}"
else
    echo "Position: ($X, $Y)"
    echo "Screen: $SCREEN"
    echo "Window under cursor: $WINDOW"
fi
