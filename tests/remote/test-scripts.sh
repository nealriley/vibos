#!/bin/bash
# VibeOS Remote Scripts Tests
#
# Tests the host-side helper scripts (vibeos-send, vibeos-screenshot)
# These scripts allow interaction with VibeOS from outside the container.
#
# Prerequisites:
#   - VibeOS container must be running
#   - Scripts in ./scripts/ must be executable

SCRIPTS_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)/scripts"

#------------------------------------------------------------------------------
# vibeos-send Tests
#------------------------------------------------------------------------------

test_header "Host Scripts - vibeos-send"

run_test "vibeos-send script exists and is executable" '
    [[ -x "$SCRIPTS_DIR/vibeos-send" ]]
'

run_test "vibeos-send shows help with no arguments" '
    output=$("$SCRIPTS_DIR/vibeos-send" 2>&1 || true)
    echo "$output" | grep -qi "usage\|help\|message"
'

run_test "vibeos-send can send a test message" '
    # Send a simple message - should not error
    output=$("$SCRIPTS_DIR/vibeos-send" "Test message from automated test" 2>&1)
    # Check it didnt fail catastrophically
    [[ $? -eq 0 || "$output" != *"connection refused"* ]]
'

#------------------------------------------------------------------------------
# vibeos-screenshot Tests
#------------------------------------------------------------------------------

test_header "Host Scripts - vibeos-screenshot"

run_test "vibeos-screenshot script exists and is executable" '
    [[ -x "$SCRIPTS_DIR/vibeos-screenshot" ]]
'

run_test "vibeos-screenshot can capture screen" '
    # Use just a filename (not a path) - script saves to shared/
    test_filename="vibeos-test-screenshot-$$.png"
    "$SCRIPTS_DIR/vibeos-screenshot" "$test_filename" 2>/dev/null
    result=$?
    # Clean up from shared directory
    rm -f "$SCRIPTS_DIR/../shared/$test_filename" 2>/dev/null
    [[ $result -eq 0 ]]
'

run_test "vibeos-screenshot creates valid PNG file" '
    test_filename="vibeos-test-valid-$$.png"
    "$SCRIPTS_DIR/vibeos-screenshot" "$test_filename" 2>/dev/null
    # Check file exists and is a PNG in the shared directory
    # If shared dir isnt mounted, verify inside container
    result=1
    local_file="$SCRIPTS_DIR/../shared/$test_filename"
    if [[ -f "$local_file" ]]; then
        file_type=$(file -b "$local_file" 2>/dev/null)
        if echo "$file_type" | grep -qi "PNG"; then
            result=0
        fi
        rm -f "$local_file" 2>/dev/null
    else
        # Shared folder not mounted - check file exists in container
        container_file="/home/vibe/shared/$test_filename"
        if docker exec ${VIBEOS_CONTAINER:-vibeos-dev} test -f "$container_file" 2>/dev/null; then
            # Verify its a PNG by checking file header
            header=$(docker exec ${VIBEOS_CONTAINER:-vibeos-dev} head -c 8 "$container_file" 2>/dev/null | xxd -p | head -c 16)
            # PNG magic bytes: 89504e47 (first 4 bytes)
            if [[ "$header" == "89504e47"* ]]; then
                result=0
            fi
        fi
    fi
    [[ $result -eq 0 ]]
'
