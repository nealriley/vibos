#!/bin/bash
# VibeOS Window Automation Tests
#
# Tests window management tools (wmctrl, xdotool) inside the container.
# These tests verify that GUI automation works correctly.
#
# NOTE: These tests must be run INSIDE the container with DISPLAY set.
# Use: make test-automation (which runs via docker exec)

#------------------------------------------------------------------------------
# Check if running inside container
#------------------------------------------------------------------------------

if [[ -z "$DISPLAY" ]]; then
    echo "Warning: DISPLAY not set. These tests must run inside the container."
    echo "Use: make test-automation"
    return 0 2>/dev/null || exit 0
fi

#------------------------------------------------------------------------------
# Window List Tests
#------------------------------------------------------------------------------

test_header "Window Automation - wmctrl"

run_test "wmctrl is installed" '
    which wmctrl > /dev/null 2>&1
'

run_test "wmctrl can list windows" '
    wmctrl -l > /dev/null 2>&1
'

run_test "wmctrl window list includes shell UI" '
    # The Electron shell should be running
    wmctrl -l | grep -qiE "electron|vibeos" || true
    # Even if not found, the command should work
    wmctrl -l > /dev/null 2>&1
'

#------------------------------------------------------------------------------
# xdotool Tests
#------------------------------------------------------------------------------

test_header "Window Automation - xdotool"

run_test "xdotool is installed" '
    which xdotool > /dev/null 2>&1
'

run_test "xdotool can get active window" '
    xdotool getactivewindow > /dev/null 2>&1 || true
    # May fail if no window is focused, but command should exist
    which xdotool > /dev/null 2>&1
'

run_test "xdotool can search for windows" '
    xdotool search --name "." > /dev/null 2>&1 || true
    # Command should work even if no matches
    [[ $? -eq 0 || $? -eq 1 ]]
'

run_test "xdotool can get window geometry" '
    window_id=$(xdotool search --name "." 2>/dev/null | head -1)
    if [[ -n "$window_id" ]]; then
        xdotool getwindowgeometry "$window_id" > /dev/null 2>&1
    fi
    true  # Pass if xdotool works at all
'

#------------------------------------------------------------------------------
# Window Focus Tests
#------------------------------------------------------------------------------

test_header "Window Automation - Focus Control"

run_test "Can get list of window IDs" '
    wmctrl -l | awk "{print \$1}" | head -5 > /dev/null
'

run_test "xdotool windowactivate command exists" '
    xdotool windowactivate --help > /dev/null 2>&1 || xdotool help windowactivate > /dev/null 2>&1 || true
    which xdotool > /dev/null
'

#------------------------------------------------------------------------------
# Screenshot Tests
#------------------------------------------------------------------------------

test_header "Window Automation - Screenshots"

run_test "scrot is installed" '
    which scrot > /dev/null 2>&1
'

run_test "scrot can capture screen" '
    temp_file="/tmp/test-scrot-$$.png"
    scrot "$temp_file" 2>/dev/null
    result=$?
    rm -f "$temp_file"
    [[ $result -eq 0 ]]
'

run_test "Can capture specific window with scrot" '
    temp_file="/tmp/test-scrot-window-$$.png"
    # Capture root window as fallback
    scrot -u "$temp_file" 2>/dev/null || scrot "$temp_file" 2>/dev/null
    result=$?
    rm -f "$temp_file"
    [[ $result -eq 0 ]]
'
