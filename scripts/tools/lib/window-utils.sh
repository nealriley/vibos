#!/bin/bash
# VibeOS Window Utilities Library
# Shared functions for window manipulation scripts
#
# Usage: source "$(dirname "$0")/lib/window-utils.sh"

# Ensure DISPLAY is set
export DISPLAY="${DISPLAY:-:0}"

# Colors for output (optional)
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# ============================================================================
# Logging Functions
# ============================================================================

log_info() {
    echo "$*"
}

log_success() {
    echo -e "${GREEN}$*${NC}"
}

log_warning() {
    echo -e "${YELLOW}Warning: $*${NC}" >&2
}

log_error() {
    echo -e "${RED}Error: $*${NC}" >&2
}

# ============================================================================
# Window Finding Functions
# ============================================================================

# Find a window by identifier (hex ID, class name, or title)
# Returns the window ID or empty string if not found
# Usage: WINDOW_ID=$(find_window "identifier")
find_window() {
    local identifier="$1"
    local window_id=""
    
    # Check if it's already a hex window ID
    if [[ "$identifier" =~ ^0x[0-9a-fA-F]+$ ]]; then
        # Verify the window exists
        if xdotool getwindowname "$identifier" &>/dev/null; then
            echo "$identifier"
            return 0
        fi
        return 1
    fi
    
    # Try to find by class name (case-insensitive)
    window_id=$(xdotool search --class "$identifier" 2>/dev/null | head -1)
    if [[ -n "$window_id" ]]; then
        echo "$window_id"
        return 0
    fi
    
    # Try to find by window name/title
    window_id=$(xdotool search --name "$identifier" 2>/dev/null | head -1)
    if [[ -n "$window_id" ]]; then
        echo "$window_id"
        return 0
    fi
    
    # Not found
    return 1
}

# Find a window or exit with error
# Usage: WINDOW_ID=$(require_window "identifier")
require_window() {
    local identifier="$1"
    local window_id
    
    window_id=$(find_window "$identifier")
    if [[ -z "$window_id" ]]; then
        log_error "No window found matching '$identifier'"
        exit 1
    fi
    
    echo "$window_id"
}

# Get window class name
# Usage: CLASS=$(get_window_class "$window_id")
get_window_class() {
    local window_id="$1"
    xdotool getwindowclassname "$window_id" 2>/dev/null || echo "unknown"
}

# Get window title/name
# Usage: TITLE=$(get_window_title "$window_id")
get_window_title() {
    local window_id="$1"
    xdotool getwindowname "$window_id" 2>/dev/null || echo "unknown"
}

# ============================================================================
# Validation Functions
# ============================================================================

# Check if required commands are available
check_dependencies() {
    local missing=()
    
    for cmd in "$@"; do
        if ! command -v "$cmd" &>/dev/null; then
            missing+=("$cmd")
        fi
    done
    
    if [[ ${#missing[@]} -gt 0 ]]; then
        log_error "Missing required commands: ${missing[*]}"
        exit 1
    fi
}

# Validate that we have at least N arguments
require_args() {
    local required="$1"
    local actual="$2"
    local usage="$3"
    
    if [[ "$actual" -lt "$required" ]]; then
        log_error "Not enough arguments"
        echo "Usage: $usage" >&2
        exit 1
    fi
}

# ============================================================================
# Common Operations
# ============================================================================

# Focus a window by ID
focus_window() {
    local window_id="$1"
    xdotool windowactivate "$window_id" 2>/dev/null
}

# Close a window gracefully by ID
close_window() {
    local window_id="$1"
    wmctrl -i -c "$window_id" 2>/dev/null
}

# Move a window to position
move_window() {
    local window_id="$1"
    local x="$2"
    local y="$3"
    wmctrl -i -r "$window_id" -e "0,$x,$y,-1,-1" 2>/dev/null
}

# Resize a window
resize_window() {
    local window_id="$1"
    local width="$2"
    local height="$3"
    wmctrl -i -r "$window_id" -e "0,-1,-1,$width,$height" 2>/dev/null
}
