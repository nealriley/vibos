#!/bin/bash
# VibeOS Window Management Tool
# Unified interface for all window operations
#
# Usage: window.sh <command> [args...]
#
# Commands:
#   list [--json]                           List all windows
#   focus <id|class|title>                  Focus a window
#   move <id|class|title> <x> <y>           Move a window
#   resize <id|class|title> <w> <h>         Resize a window
#   close <id|class|title>                  Close a window
#   maximize <id|class|title> [--restore]   Maximize/restore a window
#   minimize <id|class|title>               Minimize a window
#   screenshot <id|class|title> [file]      Screenshot a window
#   type <text> [id|class|title]            Type text into window
#   key <keys> [id|class|title]             Send keys to window
#   active                                  Get active window info
#
# Mouse Commands:
#   mouse-move <x> <y> [--relative]         Move mouse to coordinates
#   mouse-click [button] [x y]              Click (left/middle/right/double)
#   mouse-location [--json]                 Get mouse position
#   screen-info [--json]                    Get screen dimensions
#
# Examples:
#   window.sh list --json
#   window.sh focus firefox
#   window.sh move firefox 100 100
#   window.sh resize firefox 800 600
#   window.sh screenshot firefox myshot.png
#   window.sh type "hello" firefox
#   window.sh key "ctrl+s" firefox
#   window.sh mouse-move 500 300
#   window.sh mouse-click left 100 200
#   window.sh screen-info --json

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

if [[ $# -lt 1 ]]; then
    echo "VibeOS Window Management Tool"
    echo ""
    echo "Usage: window.sh <command> [args...]"
    echo ""
    echo "Commands:"
    echo "  list [--json]                           List all windows"
    echo "  focus <id|class|title>                  Focus a window"
    echo "  move <id|class|title> <x> <y>           Move a window"
    echo "  resize <id|class|title> <w> <h>         Resize a window"
    echo "  close <id|class|title>                  Close a window"
    echo "  maximize <id|class|title> [--restore]   Maximize/restore a window"
    echo "  minimize <id|class|title>               Minimize a window"
    echo "  screenshot <id|class|title> [file]      Screenshot a window"
    echo "  type <text> [id|class|title]            Type text into window"
    echo "  key <keys> [id|class|title]             Send keys to window"
    echo "  active                                  Get active window info"
    echo ""
    echo "Mouse Commands:"
    echo "  mouse-move <x> <y> [--relative]         Move mouse to coordinates"
    echo "  mouse-click [button] [x y]              Click (left/middle/right/double)"
    echo "  mouse-location [--json]                 Get mouse position"
    echo "  screen-info [--json]                    Get screen dimensions"
    exit 0
fi

COMMAND="$1"
shift

case "$COMMAND" in
    list)
        "$SCRIPT_DIR/windows-list.sh" "$@"
        ;;
    focus)
        "$SCRIPT_DIR/window-focus.sh" "$@"
        ;;
    move)
        "$SCRIPT_DIR/window-move.sh" "$@"
        ;;
    resize)
        "$SCRIPT_DIR/window-resize.sh" "$@"
        ;;
    close)
        "$SCRIPT_DIR/window-close.sh" "$@"
        ;;
    maximize)
        "$SCRIPT_DIR/window-maximize.sh" "$@"
        ;;
    minimize)
        "$SCRIPT_DIR/window-minimize.sh" "$@"
        ;;
    screenshot)
        "$SCRIPT_DIR/window-screenshot.sh" "$@"
        ;;
    type)
        "$SCRIPT_DIR/window-type.sh" "$@"
        ;;
    key)
        "$SCRIPT_DIR/window-key.sh" "$@"
        ;;
    active)
        export DISPLAY="${DISPLAY:-:0}"
        ACTIVE_ID=$(xdotool getactivewindow 2>/dev/null || echo "")
        if [[ -z "$ACTIVE_ID" ]]; then
            echo "No active window"
            exit 1
        fi
        # Convert to hex format
        ACTIVE_HEX=$(printf "0x%08x" "$ACTIVE_ID")
        TITLE=$(xdotool getwindowname "$ACTIVE_ID" 2>/dev/null || echo "unknown")
        CLASS=$(xdotool getwindowclassname "$ACTIVE_ID" 2>/dev/null || echo "unknown")
        echo "Active Window:"
        echo "  ID: $ACTIVE_HEX"
        echo "  Class: $CLASS"
        echo "  Title: $TITLE"
        ;;
    mouse-move)
        "$SCRIPT_DIR/mouse-move.sh" "$@"
        ;;
    mouse-click)
        "$SCRIPT_DIR/mouse-click.sh" "$@"
        ;;
    mouse-location)
        "$SCRIPT_DIR/mouse-location.sh" "$@"
        ;;
    screen-info)
        "$SCRIPT_DIR/screen-info.sh" "$@"
        ;;
    *)
        echo "Error: Unknown command '$COMMAND'" >&2
        echo "Run 'window.sh' without arguments to see available commands" >&2
        exit 1
        ;;
esac
