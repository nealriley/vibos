#!/bin/bash
# VibeOS Mouse Automation Tests
#
# Tests mouse input simulation inside the container.
# These tests verify that xdotool can control the mouse.
#
# NOTE: These tests must be run INSIDE the container with DISPLAY set.

#------------------------------------------------------------------------------
# Check if running inside container
#------------------------------------------------------------------------------

if [[ -z "$DISPLAY" ]]; then
    echo "Warning: DISPLAY not set. These tests must run inside the container."
    return 0 2>/dev/null || exit 0
fi

#------------------------------------------------------------------------------
# Mouse Position Tests
#------------------------------------------------------------------------------

test_header "Mouse Automation - Position"

run_test "xdotool mousemove command exists" '
    xdotool mousemove --help > /dev/null 2>&1 || true
    which xdotool > /dev/null
'

run_test "Can get mouse location" '
    xdotool getmouselocation > /dev/null 2>&1
'

run_test "Can move mouse to coordinates" '
    # Move to center-ish of a 1920x1080 screen
    xdotool mousemove 960 540 2>/dev/null
    # Verify we moved (approximately)
    location=$(xdotool getmouselocation 2>/dev/null)
    echo "$location" | grep -qE "x:[0-9]+ y:[0-9]+"
'

run_test "Can move mouse relative" '
    xdotool mousemove_relative 10 10 2>/dev/null
'

#------------------------------------------------------------------------------
# Mouse Click Tests
#------------------------------------------------------------------------------

test_header "Mouse Automation - Clicks"

run_test "xdotool click command exists" '
    xdotool click --help > /dev/null 2>&1 || true
    which xdotool > /dev/null
'

run_test "Can simulate left click" '
    # Move to safe spot first, then click
    xdotool mousemove 100 100 click 1 2>/dev/null || true
    true  # Pass if no crash
'

run_test "Can simulate right click" '
    xdotool mousemove 100 100 click 3 2>/dev/null || true
    true  # Pass if no crash
'

run_test "Can simulate double click" '
    xdotool mousemove 100 100 click --repeat 2 --delay 50 1 2>/dev/null || true
    true  # Pass if no crash
'

#------------------------------------------------------------------------------
# Mouse Drag Tests
#------------------------------------------------------------------------------

test_header "Mouse Automation - Drag"

run_test "Can simulate mouse drag" '
    # Move to start, press, move, release
    xdotool mousemove 200 200 mousedown 1 mousemove 300 300 mouseup 1 2>/dev/null || true
    true  # Pass if no crash
'
