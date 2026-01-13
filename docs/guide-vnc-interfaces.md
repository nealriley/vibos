# VNC Interface Guide

VibeOS provides two VNC web interfaces for accessing the desktop. This guide explains when and how to use each interface.

## Overview

| Interface | URL | Best For |
|-----------|-----|----------|
| **beta.html** | http://localhost:6080/beta.html | Daily use, recommended |
| **vnc.html** | http://localhost:6080/vnc.html | Debugging, advanced settings |

---

## beta.html (Recommended)

The custom VibeOS interface built for streamlined access.

### URL

```
http://localhost:6080/beta.html
```

### Features

- **Auto-connect**: Connects immediately on page load
- **Dark theme**: Matches the VibeOS shell-ui aesthetic
- **Connection status**: Visual indicator (green/yellow/red dot)
- **Auto-reconnect**: Automatically reconnects on disconnect (3s interval, max 50 attempts)
- **Fullscreen mode**: Click button or press F11
- **Ctrl+Alt+Del**: Button for sending the key combination
- **Reconnect overlay**: Shows status during reconnection attempts

### URL Parameters

Customize behavior via URL parameters:

| Parameter | Default | Description |
|-----------|---------|-------------|
| `host` | Current hostname | VNC server hostname |
| `port` | Current port | VNC server port (usually 6080) |
| `path` | `websockify` | WebSocket path |
| `password` | (none) | VNC password if required |
| `resize` | `false` | Request server resize to match viewport |
| `view_only` | `false` | Disable input (view only) |

**Examples:**

```
# Connect to a different host
http://localhost:6080/beta.html?host=192.168.1.100

# View-only mode
http://localhost:6080/beta.html?view_only=true

# With password
http://localhost:6080/beta.html?password=secret

# Request server resize
http://localhost:6080/beta.html?resize=true
```

### Interface Elements

```
┌─────────────────────────────────────────────────────────────┐
│ [V] VIBEOS                      ● Connected  [Fullscreen] [Ctrl+Alt+Del] │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│                                                             │
│                      VNC Display                            │
│                                                             │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

### Connection States

The status dot indicates connection state:

| Color | State | Description |
|-------|-------|-------------|
| Green | Connected | Active connection to VNC server |
| Yellow (pulsing) | Connecting | Attempting to connect |
| Red | Disconnected | Connection lost or failed |

### Keyboard Shortcuts

| Shortcut | Action |
|----------|--------|
| `F11` | Toggle fullscreen mode |

### Reconnect Behavior

When disconnected:

1. Shows overlay with "Connection Lost" message
2. Attempts reconnection every 3 seconds
3. Maximum 50 reconnect attempts
4. After max attempts, shows "Click to retry" button

To manually retry immediately, click the **Retry Now** button on the overlay.

---

## vnc.html (Standard noVNC)

The default noVNC interface with all settings exposed.

### URL

```
http://localhost:6080/vnc.html
```

### Features

- **Manual connect**: Click "Connect" button to initiate
- **Settings panel**: Full noVNC configuration options
- **Clipboard sync**: Copy/paste between local and remote
- **Quality settings**: Adjust compression and quality
- **Keyboard settings**: Configure key handling
- **Connection history**: Remembers previous connections

### When to Use

Use vnc.html when you need:

- Access to advanced VNC settings
- Clipboard synchronization controls
- Quality/compression adjustments
- Debugging connection issues
- Non-default connection parameters

### Connection Steps

1. Open http://localhost:6080/vnc.html
2. (Optional) Expand settings and configure
3. Click **Connect**
4. Desktop appears when connected

### Settings Panel

Click the gear icon to access:

- **Scaling Mode**: Local, Remote, or None
- **Shared Mode**: Allow multiple connections
- **View Only**: Disable input
- **Clipboard**: Enable/disable sync
- **Quality**: Compression level
- **Logging**: Debug output level

---

## Direct VNC Access

For native VNC clients (not web-based):

### Connection Details

| Setting | Value |
|---------|-------|
| Host | `localhost` |
| Port | `5900` |
| Password | (none by default) |

### Client Examples

**macOS Screen Sharing:**
```
vnc://localhost:5900
```

**RealVNC Viewer:**
```
localhost:5900
```

**TigerVNC:**
```bash
vncviewer localhost:5900
```

---

## Troubleshooting

### Connection Refused

**Symptom**: "Connection refused" or timeout

**Solutions**:
1. Verify the container is running:
   ```bash
   docker ps | grep vibeos
   ```
2. Check port mapping:
   ```bash
   docker port vibeos-dev 6080
   ```
3. Verify noVNC service:
   ```bash
   docker exec vibeos-dev supervisorctl status novnc
   ```

### Black Screen

**Symptom**: Connected but screen is black

**Solutions**:
1. Check Xvfb is running:
   ```bash
   docker exec vibeos-dev supervisorctl status xvfb
   ```
2. Check window manager:
   ```bash
   docker exec vibeos-dev supervisorctl status openbox
   ```
3. Check logs:
   ```bash
   docker exec vibeos-dev cat /var/log/supervisor/xvfb.err
   ```

### Slow or Laggy Display

**Symptom**: Display updates slowly or stutters

**Solutions**:
1. Use beta.html (optimized settings)
2. In vnc.html, reduce quality settings
3. Ensure sufficient network bandwidth
4. Check container resource usage:
   ```bash
   docker stats vibeos-dev
   ```

### Authentication Failure

**Symptom**: "Authentication failed" error

**Solutions**:
1. VNC has no password by default - don't enter one
2. If password was configured, use the `password` URL parameter
3. Check x11vnc configuration:
   ```bash
   docker exec vibeos-dev grep passwd /etc/supervisor/conf.d/supervisord.conf
   ```

### Auto-reconnect Not Working

**Symptom**: beta.html doesn't reconnect after disconnect

**Solutions**:
1. Check if max attempts (50) reached
2. Click "Retry Now" to reset counter
3. Refresh the page to start fresh
4. Check container is still running

---

## Performance Tips

### For Best Performance

1. **Use beta.html** - Optimized for VibeOS
2. **Local access** - Access from the same machine as Docker
3. **Adequate resources** - Ensure 4GB+ RAM for container
4. **Stable network** - For remote access, use wired connection

### For Remote Access

1. Use `resize=true` parameter to match viewport
2. Consider VPN for security
3. Use direct VNC (port 5900) for better performance than WebSocket
4. Lower resolution if bandwidth is limited:
   ```bash
   docker run -e RESOLUTION=1280x720 ...
   ```

---

## Security Considerations

### Default Configuration

- **No VNC password** - Designed for local development
- **No encryption** - WebSocket traffic is unencrypted
- **All ports exposed** - 6080 and 5900 accessible

### For Production Use

1. **Set VNC password**: Modify supervisord.conf to add `-passwd` flag
2. **Use HTTPS**: Put nginx/traefik in front with TLS
3. **Network isolation**: Use Docker networks to restrict access
4. **Firewall**: Don't expose ports to public networks
