#!/bin/bash
# Click mouse at current position or specified coordinates
# Usage: mouse-click.sh [button] [x y]
# Examples:
#   mouse-click.sh              # Left click at current position
#   mouse-click.sh right        # Right click at current position
#   mouse-click.sh left 500 300 # Left click at (500, 300)
#   mouse-click.sh middle       # Middle click at current position
#   mouse-click.sh double       # Double left click at current position
#   mouse-click.sh double 500 300  # Double click at position

export DISPLAY=:0

BUTTON="${1:-left}"
X="$2"
Y="$3"

# Map button names to xdotool button numbers
case "$BUTTON" in
    left|1)
        BTN=1
        ;;
    middle|2)
        BTN=2
        ;;
    right|3)
        BTN=3
        ;;
    double)
        BTN="double"
        ;;
    *)
        echo "Usage: mouse-click.sh [left|middle|right|double] [x y]"
        echo "  left (1)   - Left mouse button (default)"
        echo "  middle (2) - Middle mouse button"
        echo "  right (3)  - Right mouse button"
        echo "  double     - Double left click"
        exit 1
        ;;
esac

# Move to position if specified
if [ -n "$X" ] && [ -n "$Y" ]; then
    xdotool mousemove "$X" "$Y"
    echo "Moved to ($X, $Y)"
fi

# Perform click
if [ "$BTN" = "double" ]; then
    xdotool click --repeat 2 --delay 50 1
    echo "Double-clicked"
else
    xdotool click "$BTN"
    echo "Clicked button $BUTTON"
fi

# Output current position
eval $(xdotool getmouselocation --shell)
echo "Click position: ($X, $Y)"
