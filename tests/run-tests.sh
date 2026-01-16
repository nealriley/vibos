#!/bin/bash
# VibeOS Test Runner
#
# Usage:
#   ./tests/run-tests.sh              # Run all tests
#   ./tests/run-tests.sh remote       # Run only remote tests
#   ./tests/run-tests.sh automation   # Run only automation tests
#   ./tests/run-tests.sh <test-file>  # Run specific test file
#
# Environment:
#   VIBEOS_HOST     - Host to test against (default: localhost)
#   VIBEOS_API_PORT - OpenCode API port (default: 4096)
#   VIBEOS_VNC_PORT - VNC/noVNC port (default: 6080)
#   CONTAINER_NAME  - Docker container name (default: vibeos-dev)

set -e

# Configuration
VIBEOS_HOST="${VIBEOS_HOST:-localhost}"
VIBEOS_API_PORT="${VIBEOS_API_PORT:-4096}"
VIBEOS_VNC_PORT="${VIBEOS_VNC_PORT:-6080}"
CONTAINER_NAME="${CONTAINER_NAME:-vibeos-dev}"
OPENCODE_URL="http://${VIBEOS_HOST}:${VIBEOS_API_PORT}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
CYAN='\033[0;36m'
NC='\033[0m'

# Test counters
TESTS_RUN=0
TESTS_PASSED=0
TESTS_FAILED=0

# Get script directory
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

#------------------------------------------------------------------------------
# Test Framework Functions
#------------------------------------------------------------------------------

# Print a test header
test_header() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  $1${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
}

# Run a single test
# Usage: run_test "Test Name" command_to_run
run_test() {
    local name="$1"
    shift
    local cmd="$@"
    
    TESTS_RUN=$((TESTS_RUN + 1))
    echo -n "  [$TESTS_RUN] $name... "
    
    if output=$(eval "$cmd" 2>&1); then
        echo -e "${GREEN}PASS${NC}"
        TESTS_PASSED=$((TESTS_PASSED + 1))
        return 0
    else
        echo -e "${RED}FAIL${NC}"
        echo -e "      ${RED}Output: $output${NC}"
        TESTS_FAILED=$((TESTS_FAILED + 1))
        return 1
    fi
}

# Assert that a condition is true
# Usage: assert "description" "condition"
assert() {
    local desc="$1"
    local condition="$2"
    
    if eval "$condition"; then
        return 0
    else
        echo "Assertion failed: $desc"
        return 1
    fi
}

# Assert JSON field equals value
# Usage: assert_json_eq "$json" ".field" "expected"
assert_json_eq() {
    local json="$1"
    local field="$2"
    local expected="$3"
    
    local actual=$(echo "$json" | jq -r "$field" 2>/dev/null)
    if [[ "$actual" == "$expected" ]]; then
        return 0
    else
        echo "Expected $field to be '$expected', got '$actual'"
        return 1
    fi
}

# Assert JSON field is not empty
# Usage: assert_json_not_empty "$json" ".field"
assert_json_not_empty() {
    local json="$1"
    local field="$2"
    
    local actual=$(echo "$json" | jq -r "$field" 2>/dev/null)
    if [[ -n "$actual" && "$actual" != "null" ]]; then
        return 0
    else
        echo "Expected $field to be non-empty"
        return 1
    fi
}

# Wait for a condition with timeout
# Usage: wait_for "description" timeout_seconds "condition"
wait_for() {
    local desc="$1"
    local timeout="$2"
    local condition="$3"
    local elapsed=0
    
    while [[ $elapsed -lt $timeout ]]; do
        if eval "$condition" 2>/dev/null; then
            return 0
        fi
        sleep 1
        elapsed=$((elapsed + 1))
    done
    
    echo "Timeout waiting for: $desc"
    return 1
}

# Print test summary
print_summary() {
    echo -e "\n${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${CYAN}  Test Summary${NC}"
    echo -e "${CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "  Total:  $TESTS_RUN"
    echo -e "  ${GREEN}Passed: $TESTS_PASSED${NC}"
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo -e "  ${RED}Failed: $TESTS_FAILED${NC}"
    else
        echo -e "  Failed: $TESTS_FAILED"
    fi
    echo ""
    
    if [[ $TESTS_FAILED -gt 0 ]]; then
        echo -e "${RED}TESTS FAILED${NC}"
        return 1
    else
        echo -e "${GREEN}ALL TESTS PASSED${NC}"
        return 0
    fi
}

#------------------------------------------------------------------------------
# Export functions and variables for test files
#------------------------------------------------------------------------------
export VIBEOS_HOST VIBEOS_API_PORT VIBEOS_VNC_PORT CONTAINER_NAME OPENCODE_URL
export -f test_header run_test assert assert_json_eq assert_json_not_empty wait_for
export RED GREEN YELLOW CYAN NC

#------------------------------------------------------------------------------
# Main
#------------------------------------------------------------------------------

echo -e "${CYAN}"
echo "  ╦  ╦╦╔╗ ╔═╗╔═╗╔═╗  ╔╦╗╔═╗╔═╗╔╦╗╔═╗"
echo "  ╚╗╔╝║╠╩╗║╣ ║ ║╚═╗   ║ ║╣ ╚═╗ ║ ╚═╗"
echo "   ╚╝ ╩╚═╝╚═╝╚═╝╚═╝   ╩ ╚═╝╚═╝ ╩ ╚═╝"
echo -e "${NC}"
echo "  Host: $VIBEOS_HOST"
echo "  API:  $OPENCODE_URL"
echo ""

# Determine which tests to run
case "${1:-all}" in
    remote)
        for test_file in "$SCRIPT_DIR"/remote/*.sh; do
            if [[ -f "$test_file" && -x "$test_file" ]]; then
                source "$test_file"
            fi
        done
        ;;
    automation)
        for test_file in "$SCRIPT_DIR"/automation/*.sh; do
            if [[ -f "$test_file" && -x "$test_file" ]]; then
                source "$test_file"
            fi
        done
        ;;
    all)
        for test_file in "$SCRIPT_DIR"/remote/*.sh "$SCRIPT_DIR"/automation/*.sh; do
            if [[ -f "$test_file" && -x "$test_file" ]]; then
                source "$test_file"
            fi
        done
        ;;
    *)
        # Run specific test file
        if [[ -f "$1" ]]; then
            source "$1"
        elif [[ -f "$SCRIPT_DIR/$1" ]]; then
            source "$SCRIPT_DIR/$1"
        else
            echo -e "${RED}Test file not found: $1${NC}"
            exit 1
        fi
        ;;
esac

print_summary
