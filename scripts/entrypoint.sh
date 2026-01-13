#!/bin/bash
set -e

echo "=== VibeOS Starting ==="

# Set defaults
export RESOLUTION="${RESOLUTION:-1920x1080}"
export DISPLAY=":0"
export HOME="/home/vibe"
export USER="vibe"

echo "Resolution: $RESOLUTION"

# Create required directories
mkdir -p /var/log/supervisor
mkdir -p /var/run/sshd
mkdir -p /tmp/.X11-unix

# Fix permissions
chown -R vibe:vibe /home/vibe
chmod 1777 /tmp/.X11-unix

# Set password if provided
if [ -n "${VIBE_PASSWORD:-}" ]; then
    echo "vibe:${VIBE_PASSWORD}" | chpasswd
fi

# Start D-Bus if available
if command -v dbus-daemon &> /dev/null; then
    mkdir -p /run/dbus
    dbus-daemon --system --fork 2>/dev/null || true
fi

echo "=== Starting Services ==="

# Execute main command
exec "$@"
