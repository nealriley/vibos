# Automation Tools Reference

Complete reference for VibeOS window management, mouse control, and automation scripts.

## Overview

VibeOS includes shell scripts for programmatic desktop automation. These tools are located at `/home/vibe/scripts/` inside the container.

| Category | Tools |
|----------|-------|
| **Window Management** | list, focus, move, resize, close, maximize, minimize |
| **Window Interaction** | type, key, screenshot |
| **Mouse Control** | mouse-move, mouse-click, mouse-location |
| **Screen** | screen-info, screenshot |
| **Applications** | apps-list |

---

## window.sh - Unified Interface

The `window.sh` script provides a single entry point for all window and mouse operations.

### Usage

```bash
window.sh <command> [args...]
```

### Commands

```bash
# Window operations
window.sh list [--json]                        # List all windows
window.sh focus <target>                       # Focus a window
window.sh move <target> <x> <y>                # Move a window
window.sh resize <target> <w> <h>              # Resize a window
window.sh close <target>                       # Close a window
window.sh maximize <target> [--restore]        # Maximize/restore
window.sh minimize <target>                    # Minimize a window
window.sh screenshot <target> [file]           # Screenshot a window
window.sh type <text> [target]                 # Type text
window.sh key <keys> [target]                  # Send keystrokes
window.sh active                               # Get active window info

# Mouse operations
window.sh mouse-move <x> <y> [--relative]      # Move cursor
window.sh mouse-click [button] [x y]           # Click
window.sh mouse-location [--json]              # Get cursor position
window.sh screen-info [--json]                 # Get screen dimensions
```

### Window Targeting

Windows can be targeted by:

| Target Type | Example | Description |
|-------------|---------|-------------|
| Window ID | `0x12345678` | Hex window ID |
| Window Class | `firefox` | Application class name |
| Window Title | `"My Document"` | Window title (partial match) |

---

## Window Operations

### List Windows

**`windows-list.sh [--json]`**

Lists all open windows.

**Options**

| Option | Description |
|--------|-------------|
| `--json` | Output as JSON array |

**Output (text)**

```
0x02200003  Google-chrome     VibeOS - Google Chrome
0x02400005  Xfce4-terminal    Terminal
0x02600007  Firefox           Mozilla Firefox
```

**Output (JSON)**

```json
[
  {
    "id": "0x02200003",
    "class": "Google-chrome",
    "title": "VibeOS - Google Chrome"
  },
  {
    "id": "0x02400005",
    "class": "Xfce4-terminal",
    "title": "Terminal"
  }
]
```

**Example**

```bash
# List all windows
window.sh list

# Get as JSON for scripting
window.sh list --json | jq '.[] | select(.class == "Google-chrome")'
```

### Focus Window

**`window-focus.sh <target>`**

Brings a window to the foreground and gives it input focus.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `target` | Window ID, class, or title |

**Example**

```bash
# Focus by class
window.sh focus firefox

# Focus by title
window.sh focus "Google Chrome"

# Focus by ID
window.sh focus 0x02200003
```

### Move Window

**`window-move.sh <target> <x> <y>`**

Moves a window to absolute screen coordinates.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `target` | Window ID, class, or title |
| `x` | X coordinate (pixels from left) |
| `y` | Y coordinate (pixels from top) |

**Example**

```bash
# Move Chrome to top-left
window.sh move chrome 0 0

# Move terminal to center (assuming 1920x1080)
window.sh move terminal 460 240
```

### Resize Window

**`window-resize.sh <target> <width> <height>`**

Resizes a window to specified dimensions.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `target` | Window ID, class, or title |
| `width` | New width in pixels |
| `height` | New height in pixels |

**Example**

```bash
# Resize to 800x600
window.sh resize firefox 800 600

# Make terminal small
window.sh resize terminal 400 300
```

### Close Window

**`window-close.sh <target>`**

Closes a window gracefully (sends WM_DELETE_WINDOW).

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `target` | Window ID, class, or title |

**Example**

```bash
# Close Firefox
window.sh close firefox

# Close by title
window.sh close "Untitled Document"
```

### Maximize Window

**`window-maximize.sh <target> [--restore]`**

Maximizes a window or restores it from maximized state.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `target` | Window ID, class, or title |
| `--restore` | Restore from maximized state |

**Example**

```bash
# Maximize Chrome
window.sh maximize chrome

# Restore to previous size
window.sh maximize chrome --restore
```

### Minimize Window

**`window-minimize.sh <target>`**

Minimizes (iconifies) a window.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `target` | Window ID, class, or title |

**Example**

```bash
window.sh minimize terminal
```

### Active Window

**`window.sh active`**

Gets information about the currently focused window.

**Output**

```
Active Window:
  ID: 0x02200003
  Class: Google-chrome
  Title: VibeOS - Google Chrome
```

---

## Window Interaction

### Type Text

**`window-type.sh <text> [target]`**

Types text into a window using synthetic keyboard events.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `text` | Text to type |
| `target` | (Optional) Window to target; uses active window if omitted |

**Example**

```bash
# Type into active window
window.sh type "Hello, World!"

# Type into specific window
window.sh type "search query" firefox

# Type with delay for slow applications
window.sh type "$(echo -e 'line1\nline2')" terminal
```

### Send Keys

**`window-key.sh <keys> [target]`**

Sends key combinations to a window.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `keys` | Key combination (xdotool format) |
| `target` | (Optional) Window to target |

**Key Format**

- Modifiers: `ctrl`, `alt`, `shift`, `super`
- Combine with `+`: `ctrl+s`, `ctrl+shift+t`
- Special keys: `Return`, `Tab`, `Escape`, `BackSpace`, `Delete`, `F1`-`F12`

**Example**

```bash
# Save file (Ctrl+S)
window.sh key "ctrl+s" firefox

# New tab (Ctrl+T)
window.sh key "ctrl+t" chrome

# Close tab (Ctrl+W)
window.sh key "ctrl+w"

# Alt+Tab to switch windows
window.sh key "alt+Tab"

# Press Enter
window.sh key "Return"

# Escape key
window.sh key "Escape"
```

### Window Screenshot

**`window-screenshot.sh <target> [filename]`**

Captures a screenshot of a specific window.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `target` | Window ID, class, or title |
| `filename` | (Optional) Output filename (default: auto-generated) |

**Output Location**: `/home/vibe/shared/`

**Example**

```bash
# Screenshot Chrome
window.sh screenshot chrome chrome-capture.png

# Auto-named screenshot
window.sh screenshot firefox
# Output: /home/vibe/shared/firefox-20240113-143022.png
```

---

## Mouse Operations

### Move Mouse

**`mouse-move.sh <x> <y> [--relative]`**

Moves the mouse cursor to specified coordinates.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `x` | X coordinate |
| `y` | Y coordinate |
| `--relative` | Move relative to current position |

**Example**

```bash
# Move to absolute position
window.sh mouse-move 500 300

# Move relative (right 100, down 50)
window.sh mouse-move 100 50 --relative
```

### Mouse Click

**`mouse-click.sh [button] [x y]`**

Performs a mouse click.

**Parameters**

| Parameter | Default | Description |
|-----------|---------|-------------|
| `button` | `left` | Button: `left`, `middle`, `right`, `double` |
| `x y` | Current position | Click coordinates |

**Example**

```bash
# Left click at current position
window.sh mouse-click

# Right click at position
window.sh mouse-click right 500 300

# Double-click
window.sh mouse-click double 100 200

# Middle click
window.sh mouse-click middle
```

### Mouse Location

**`mouse-location.sh [--json]`**

Gets the current mouse cursor position.

**Output (text)**

```
X: 500
Y: 300
```

**Output (JSON)**

```json
{"x": 500, "y": 300}
```

**Example**

```bash
# Get position
window.sh mouse-location

# Use in script
POS=$(window.sh mouse-location --json)
X=$(echo $POS | jq '.x')
```

---

## Screen Operations

### Screen Info

**`screen-info.sh [--json]`**

Gets screen dimensions and information.

**Output (text)**

```
Width: 1920
Height: 1080
Depth: 24
```

**Output (JSON)**

```json
{"width": 1920, "height": 1080, "depth": 24}
```

**Example**

```bash
# Get screen size
window.sh screen-info

# Calculate center
INFO=$(window.sh screen-info --json)
CENTER_X=$(($(echo $INFO | jq '.width') / 2))
CENTER_Y=$(($(echo $INFO | jq '.height') / 2))
```

### Full Screenshot

**`screenshot.sh [filename]`**

Captures the entire desktop.

**Parameters**

| Parameter | Description |
|-----------|-------------|
| `filename` | (Optional) Output filename (default: timestamp-based) |

**Output Location**: `/home/vibe/shared/`

**Example**

```bash
# Auto-named screenshot
/home/vibe/scripts/screenshot.sh
# Output: /home/vibe/shared/screenshot-20240113-143022.png

# Custom name
/home/vibe/scripts/screenshot.sh my-desktop.png
# Output: /home/vibe/shared/my-desktop.png
```

---

## Application Tools

### List Applications

**`apps-list.sh`**

Lists GUI applications with open windows.

**Output**

```
google-chrome (2 windows)
xfce4-terminal (1 window)
firefox (1 window)
```

---

## Host Helper Scripts

These scripts run on the host machine to interact with VibeOS.

### vibeos-send

Sends messages to the AI assistant.

**Location**: `./scripts/vibeos-send`

**Usage**

```bash
# Direct message
./scripts/vibeos-send "Create a new file"

# From stdin
echo "What time is it?" | ./scripts/vibeos-send

# Multi-line
cat <<EOF | ./scripts/vibeos-send
Please create a Python script that:
1. Reads a CSV file
2. Calculates averages
3. Outputs results
EOF
```

**Environment Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBEOS_HOST` | `localhost` | API server host |
| `VIBEOS_PORT` | `4096` | API server port |
| `VIBEOS_SESSION` | `desktop` | Session name |

### vibeos-screenshot

Captures the desktop from the host.

**Location**: `./scripts/vibeos-screenshot`

**Usage**

```bash
# Auto-named
./scripts/vibeos-screenshot

# Custom name
./scripts/vibeos-screenshot my-capture.png

# View result
ls shared/*.png
```

**Environment Variables**

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBEOS_CONTAINER` | `vibeos-dev` | Container name |

---

## Scripting Examples

### Automated Testing Flow

```bash
#!/bin/bash
# test-ui.sh - Automated UI test

# Open the application
window.sh key "super+Return"  # Open terminal
sleep 1

# Type command
window.sh type "npm start"
window.sh key "Return"
sleep 5

# Take screenshot of result
window.sh screenshot terminal test-start.png

# Interact with UI
window.sh mouse-move 500 300
window.sh mouse-click
sleep 1

# Final screenshot
/home/vibe/scripts/screenshot.sh test-complete.png
```

### Window Arrangement

```bash
#!/bin/bash
# arrange.sh - Tile windows side by side

# Get screen size
INFO=$(window.sh screen-info --json)
WIDTH=$(echo $INFO | jq '.width')
HEIGHT=$(echo $INFO | jq '.height')

HALF_WIDTH=$((WIDTH / 2))

# Arrange Chrome on left
window.sh move chrome 0 0
window.sh resize chrome $HALF_WIDTH $HEIGHT

# Arrange Terminal on right
window.sh move terminal $HALF_WIDTH 0
window.sh resize terminal $HALF_WIDTH $HEIGHT
```

### Form Automation

```bash
#!/bin/bash
# fill-form.sh - Fill out a web form

# Focus browser
window.sh focus chrome
sleep 0.5

# Tab to first field
window.sh key "Tab"
sleep 0.2

# Fill fields
window.sh type "John Doe"
window.sh key "Tab"
window.sh type "john@example.com"
window.sh key "Tab"
window.sh type "Hello, this is a message."

# Submit
window.sh key "Return"
```

### Screenshot Series

```bash
#!/bin/bash
# capture-series.sh - Take screenshots at intervals

DURATION=60  # seconds
INTERVAL=5   # seconds

for ((i=0; i<DURATION; i+=INTERVAL)); do
    /home/vibe/scripts/screenshot.sh "capture-$(printf '%03d' $i).png"
    sleep $INTERVAL
done
```

---

## Error Handling

### Common Errors

| Error | Cause | Solution |
|-------|-------|----------|
| "Window not found" | Invalid target | Check window list with `window.sh list` |
| "Cannot focus window" | Window minimized/hidden | Restore window first |
| "DISPLAY not set" | Environment issue | Export `DISPLAY=:0` |
| "xdotool: command not found" | Missing tool | Install xdotool in container |

### Debug Mode

Add `set -x` to scripts for verbose output:

```bash
#!/bin/bash
set -x  # Enable debug output
window.sh focus chrome
window.sh type "test"
```
