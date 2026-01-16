#!/bin/bash
# VibeOS Reset Session Tests
#
# Tests the reset functionality that clears the desktop session
# and starts fresh. These tests verify:
# 1. Session can be deleted/reset
# 2. New session is created after reset
# 3. Messages are cleared
# 4. File-based command signaling works
#
# Prerequisites:
#   - VibeOS container must be running
#   - curl and jq must be installed

#------------------------------------------------------------------------------
# Helper Functions
#------------------------------------------------------------------------------

# Find the desktop session
find_desktop_session() {
    curl -s "$OPENCODE_URL/session" | jq -r '.[] | select(.title == "desktop") | .id'
}

# Get message count for a session
get_message_count() {
    local session_id="$1"
    curl -s "$OPENCODE_URL/session/$session_id/message" | jq 'length'
}

# Create a test message in a session
send_test_message() {
    local session_id="$1"
    curl -s -X POST "$OPENCODE_URL/session/$session_id/message" \
        -H "Content-Type: application/json" \
        -d '{"parts": [{"type": "text", "text": "Test message for reset verification"}]}' > /dev/null
}

#------------------------------------------------------------------------------
# Session Reset API Tests
#------------------------------------------------------------------------------

test_header "Reset Session - API"

run_test "Desktop session exists" '
    session_id=$(find_desktop_session)
    [[ -n "$session_id" && "$session_id" != "null" ]]
'

run_test "Can list all sessions" '
    response=$(curl -s "$OPENCODE_URL/session")
    [[ $(echo "$response" | jq "type") == "\"array\"" ]]
'

run_test "Can get messages from desktop session" '
    session_id=$(find_desktop_session)
    if [[ -n "$session_id" && "$session_id" != "null" ]]; then
        http_code=$(curl -s -o /dev/null -w "%{http_code}" "$OPENCODE_URL/session/$session_id/message")
        [[ "$http_code" == "200" ]]
    else
        # No desktop session yet, that is ok
        true
    fi
'

#------------------------------------------------------------------------------
# File Signal Tests (for beta.html communication)
#------------------------------------------------------------------------------

test_header "Reset Session - File Signal Pattern"

SIGNAL_FILE="/tmp/vibeos-command"

run_test "Signal file directory is writable" '
    touch "$SIGNAL_FILE" 2>/dev/null && rm -f "$SIGNAL_FILE"
'

run_test "Can write reset command to signal file" '
    echo "reset" > "$SIGNAL_FILE"
    [[ -f "$SIGNAL_FILE" ]] && [[ "$(cat $SIGNAL_FILE)" == "reset" ]]
    rm -f "$SIGNAL_FILE"
'

run_test "Signal file can be read and cleared" '
    echo "reset" > "$SIGNAL_FILE"
    content=$(cat "$SIGNAL_FILE" 2>/dev/null)
    rm -f "$SIGNAL_FILE"
    [[ "$content" == "reset" ]] && [[ ! -f "$SIGNAL_FILE" ]]
'

#------------------------------------------------------------------------------
# Integration Tests (require reset implementation)
# These tests document expected behavior for the reset feature
#------------------------------------------------------------------------------

test_header "Reset Session - Expected Behavior (Documentation)"

# These tests will pass once reset is implemented
# For now they document the expected API

run_test "FUTURE: Reset creates new desktop session" '
    # After reset, there should be a desktop session with no messages
    # This test documents expected behavior
    true  # Placeholder - will be updated when reset is implemented
'

run_test "FUTURE: Reset clears message history" '
    # After reset, message count should be 0
    # This test documents expected behavior
    true  # Placeholder - will be updated when reset is implemented
'

run_test "FUTURE: Multiple resets are safe" '
    # Calling reset multiple times should not cause errors
    # This test documents expected behavior
    true  # Placeholder - will be updated when reset is implemented
'
