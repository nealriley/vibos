#!/bin/bash
# Move mouse cursor to specified coordinates
# Usage: mouse-move.sh <x> <y> [--relative]
# Examples:
#   mouse-move.sh 500 300        # Move to absolute position (500, 300)
#   mouse-move.sh 100 50 --relative  # Move 100 pixels right, 50 down from current

export DISPLAY=:0

if [ -z "$1" ] || [ -z "$2" ]; then
    echo "Usage: mouse-move.sh <x> <y> [--relative]"
    echo "  --relative: Move relative to current position"
    exit 1
fi

X="$1"
Y="$2"
MODE="${3:-absolute}"

if [ "$MODE" = "--relative" ] || [ "$MODE" = "-r" ]; then
    xdotool mousemove_relative -- "$X" "$Y"
    echo "Moved mouse relative by ($X, $Y)"
else
    xdotool mousemove "$X" "$Y"
    echo "Moved mouse to ($X, $Y)"
fi

# Output new position
eval $(xdotool getmouselocation --shell)
echo "Current position: ($X, $Y)"
