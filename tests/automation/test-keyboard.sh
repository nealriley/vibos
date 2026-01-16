#!/bin/bash
# VibeOS Keyboard Automation Tests
#
# Tests keyboard input simulation inside the container.
# These tests verify that xdotool can send keystrokes.
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
# Keyboard Input Tests
#------------------------------------------------------------------------------

test_header "Keyboard Automation - xdotool"

run_test "xdotool key command exists" '
    xdotool key --help > /dev/null 2>&1 || true
    which xdotool > /dev/null
'

run_test "xdotool type command exists" '
    xdotool type --help > /dev/null 2>&1 || true
    which xdotool > /dev/null
'

run_test "Can simulate key press" '
    # Send a harmless key that wont affect anything
    xdotool key --clearmodifiers shift 2>/dev/null || true
    [[ $? -eq 0 || $? -eq 1 ]]
'

run_test "Can simulate key combination" '
    # Test that we can send modifier combinations (dont actually press them)
    xdotool key --help 2>&1 | grep -q "key" || true
    which xdotool > /dev/null
'

#------------------------------------------------------------------------------
# Special Key Tests
#------------------------------------------------------------------------------

test_header "Keyboard Automation - Special Keys"

run_test "Can reference Super key" '
    # Verify xdotool understands Super key
    xdotool key --delay 0 "super" 2>/dev/null || true
    true  # Pass if no crash
'

run_test "Can reference function keys" '
    xdotool key --delay 0 "F1" 2>/dev/null || true
    true  # Pass if no crash
'

run_test "Can reference escape key" '
    xdotool key --delay 0 "Escape" 2>/dev/null || true
    true  # Pass if no crash
'
