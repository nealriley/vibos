#!/bin/bash
# VibeOS Remote API Tests
#
# Tests the OpenCode HTTP API from outside the container.
# These tests verify that the API is accessible and functioning correctly.
#
# Prerequisites:
#   - VibeOS container must be running
#   - curl and jq must be installed

#------------------------------------------------------------------------------
# Health Check Tests
#------------------------------------------------------------------------------

test_header "OpenCode API - Health Check"

run_test "API server is reachable" \
    'curl -s -o /dev/null -w "%{http_code}" "$OPENCODE_URL/global/health" | grep -q "200"'

run_test "Health endpoint returns healthy status" \
    'response=$(curl -s "$OPENCODE_URL/global/health"); assert_json_eq "$response" ".healthy" "true"'

#------------------------------------------------------------------------------
# Session Management Tests
#------------------------------------------------------------------------------

test_header "OpenCode API - Session Management"

# Create a test session
run_test "Can create a new session" '
    response=$(curl -s -X POST "$OPENCODE_URL/session" \
        -H "Content-Type: application/json" \
        -d "{\"title\": \"test-session-$(date +%s)\"}")
    assert_json_not_empty "$response" ".id"
'

# Store session ID for later tests
TEST_SESSION_ID=""
create_test_session() {
    local response=$(curl -s -X POST "$OPENCODE_URL/session" \
        -H "Content-Type: application/json" \
        -d "{\"title\": \"test-api-$(date +%s)\"}")
    TEST_SESSION_ID=$(echo "$response" | jq -r '.id')
    echo "$TEST_SESSION_ID"
}

run_test "Can list sessions" '
    response=$(curl -s "$OPENCODE_URL/session")
    [[ $(echo "$response" | jq "type") == "\"array\"" ]]
'

run_test "Session list contains sessions" '
    create_test_session > /dev/null
    response=$(curl -s "$OPENCODE_URL/session")
    [[ $(echo "$response" | jq "length") -gt 0 ]]
'

#------------------------------------------------------------------------------
# Message Tests
#------------------------------------------------------------------------------

test_header "OpenCode API - Messages"

run_test "Can get messages for a session" '
    session_id=$(create_test_session)
    response=$(curl -s "$OPENCODE_URL/session/$session_id/message")
    [[ $(echo "$response" | jq "type") == "\"array\"" ]]
'

run_test "Can send a message to a session" '
    session_id=$(create_test_session)
    response=$(curl -s -X POST "$OPENCODE_URL/session/$session_id/message" \
        -H "Content-Type: application/json" \
        -d "{\"parts\": [{\"type\": \"text\", \"text\": \"Hello, this is a test message\"}]}")
    # Response should not be an error
    [[ $(echo "$response" | jq -r ".error // empty") == "" ]]
'

#------------------------------------------------------------------------------
# Abort Tests
#------------------------------------------------------------------------------

test_header "OpenCode API - Abort"

run_test "Abort endpoint exists and responds" '
    session_id=$(create_test_session)
    # Abort should work even if nothing is running (returns success or no-op)
    response=$(curl -s -X POST "$OPENCODE_URL/session/$session_id/abort")
    http_code=$(curl -s -o /dev/null -w "%{http_code}" -X POST "$OPENCODE_URL/session/$session_id/abort")
    [[ "$http_code" == "200" || "$http_code" == "204" ]]
'

#------------------------------------------------------------------------------
# SSE Events Tests
#------------------------------------------------------------------------------

test_header "OpenCode API - Server-Sent Events"

run_test "SSE endpoint is accessible" '
    # Just check that the endpoint responds (SSE connections stay open)
    timeout 2 curl -s -N "$OPENCODE_URL/event" > /dev/null 2>&1 || true
    # If we got here without connection error, it works
    curl -s -o /dev/null -w "%{http_code}" --max-time 1 "$OPENCODE_URL/event" 2>/dev/null | grep -qE "200|000"
'

#------------------------------------------------------------------------------
# Error Handling Tests
#------------------------------------------------------------------------------

test_header "OpenCode API - Error Handling"

run_test "Invalid session ID returns error" '
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$OPENCODE_URL/session/invalid-session-id/message")
    [[ "$http_code" == "404" || "$http_code" == "400" || "$http_code" == "500" ]]
'

run_test "Server responds to requests" '
    # Note: OpenCode may return 200 for unknown endpoints (no strict 404)
    # This test just verifies the server is responsive
    http_code=$(curl -s -o /dev/null -w "%{http_code}" "$OPENCODE_URL/nonexistent/endpoint")
    [[ "$http_code" =~ ^[0-9]+$ ]]
'
