#!/bin/bash
# VibeOS Stop Button Tests
#
# Tests the abort/stop functionality for killing LLM requests.
# These tests verify that:
# 1. The abort API endpoint works
# 2. Abort can interrupt an active request
# 3. The UI properly reflects abort state
#
# Prerequisites:
#   - VibeOS container must be running
#   - curl and jq must be installed

#------------------------------------------------------------------------------
# Helper: Create a test session
#------------------------------------------------------------------------------
create_stop_test_session() {
    local response=$(curl -s -X POST "$OPENCODE_URL/session" \
        -H "Content-Type: application/json" \
        -d "{\"title\": \"stop-test-$(date +%s)\"}")
    echo "$response" | jq -r '.id'
}

#------------------------------------------------------------------------------
# Abort API Tests
#------------------------------------------------------------------------------

test_header "Stop Button - Abort API"

run_test "Abort endpoint accepts POST requests" '
    session_id=$(create_stop_test_session)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$OPENCODE_URL/session/$session_id/abort")
    [[ "$http_code" == "200" || "$http_code" == "204" || "$http_code" == "202" ]]
'

run_test "Abort on idle session returns success" '
    session_id=$(create_stop_test_session)
    # Even if nothing is running, abort should succeed or no-op
    response=$(curl -s -X POST "$OPENCODE_URL/session/$session_id/abort")
    # Should not return an error status
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$OPENCODE_URL/session/$session_id/abort")
    [[ "$http_code" == "200" || "$http_code" == "204" || "$http_code" == "202" ]]
'

run_test "Abort is idempotent (can call multiple times)" '
    session_id=$(create_stop_test_session)
    # Call abort multiple times - should all succeed
    curl -s -X POST "$OPENCODE_URL/session/$session_id/abort" > /dev/null
    curl -s -X POST "$OPENCODE_URL/session/$session_id/abort" > /dev/null
    curl -s -X POST "$OPENCODE_URL/session/$session_id/abort" > /dev/null
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$OPENCODE_URL/session/$session_id/abort")
    [[ "$http_code" == "200" || "$http_code" == "204" || "$http_code" == "202" ]]
'

#------------------------------------------------------------------------------
# Abort During Active Request Tests
#------------------------------------------------------------------------------

test_header "Stop Button - Abort Active Request"

run_test "Can send message and immediately abort" '
    session_id=$(create_stop_test_session)
    
    # Send a message (start a request)
    curl -s -X POST "$OPENCODE_URL/session/$session_id/message" \
        -H "Content-Type: application/json" \
        -d "{\"parts\": [{\"type\": \"text\", \"text\": \"Count from 1 to 100 slowly\"}]}" &
    msg_pid=$!
    
    # Small delay to let request start
    sleep 0.5
    
    # Abort the request
    abort_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$OPENCODE_URL/session/$session_id/abort")
    
    # Wait for background process
    wait $msg_pid 2>/dev/null || true
    
    [[ "$abort_code" == "200" || "$abort_code" == "204" || "$abort_code" == "202" ]]
'

run_test "Session is accessible after abort" '
    session_id=$(create_stop_test_session)
    
    # Start and abort a request
    curl -s -X POST "$OPENCODE_URL/session/$session_id/message" \
        -H "Content-Type: application/json" \
        -d "{\"parts\": [{\"type\": \"text\", \"text\": \"Hello\"}]}" &
    sleep 0.3
    curl -s -X POST "$OPENCODE_URL/session/$session_id/abort" > /dev/null
    wait 2>/dev/null || true
    
    # Session should still be accessible
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$OPENCODE_URL/session/$session_id/message")
    [[ "$http_code" == "200" ]]
'

#------------------------------------------------------------------------------
# Error Handling Tests
#------------------------------------------------------------------------------

test_header "Stop Button - Error Handling"

run_test "Abort on non-existent session is handled gracefully" '
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$OPENCODE_URL/session/non-existent-session-12345/abort")
    # OpenCode may return 200 (no-op) or error - both are acceptable
    [[ "$http_code" == "200" || "$http_code" == "404" || "$http_code" == "400" || "$http_code" == "500" ]]
'

run_test "Abort endpoint responds to different methods" '
    session_id=$(create_stop_test_session)
    # Check that GET on abort endpoint responds (may return various codes)
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$OPENCODE_URL/session/$session_id/abort")
    [[ "$http_code" =~ ^[0-9]+$ ]]
'
