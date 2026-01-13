#!/bin/bash
# Get screen/display information
# Usage: screen-info.sh [--json]
# Outputs: width, height, and other display info

export DISPLAY=:0

FORMAT="${1:-text}"

# Get display geometry
GEOMETRY=$(xdotool getdisplaygeometry)
WIDTH=$(echo "$GEOMETRY" | awk '{print $1}')
HEIGHT=$(echo "$GEOMETRY" | awk '{print $2}')

# Get active window info
ACTIVE_WINDOW=$(xdotool getactivewindow 2>/dev/null || echo "none")

# Get mouse position
eval $(xdotool getmouselocation --shell)
MOUSE_X=$X
MOUSE_Y=$Y

if [ "$FORMAT" = "--json" ] || [ "$FORMAT" = "-j" ]; then
    cat <<EOF
{
  "screen": {
    "width": $WIDTH,
    "height": $HEIGHT
  },
  "mouse": {
    "x": $MOUSE_X,
    "y": $MOUSE_Y
  },
  "activeWindow": "$ACTIVE_WINDOW"
}
EOF
else
    echo "Screen Dimensions: ${WIDTH}x${HEIGHT}"
    echo "Mouse Position: ($MOUSE_X, $MOUSE_Y)"
    echo "Active Window ID: $ACTIVE_WINDOW"
fi
