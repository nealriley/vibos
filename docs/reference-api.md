# OpenCode API Reference

Complete reference for the VibeOS OpenCode HTTP API. This API enables remote control of the AI assistant and desktop automation.

## Overview

The OpenCode server runs on port 4096 and provides:

- **REST API**: Session and message management
- **SSE Events**: Real-time streaming updates

**Base URL**: `http://localhost:4096`

---

## Health Check

Check if the server is running.

### `GET /global/health`

**Response**

```json
{
  "status": "ok"
}
```

**Example**

```bash
curl http://localhost:4096/global/health
```

---

## Sessions

Sessions represent AI conversation contexts. VibeOS creates a default "desktop" session automatically.

### List Sessions

**`GET /session`**

Returns all active sessions.

**Response**

```json
[
  {
    "id": "ses_abc123",
    "title": "desktop",
    "time": {
      "created": 1704067200,
      "updated": 1704070800
    }
  }
]
```

**Example**

```bash
curl http://localhost:4096/session | jq
```

### Create Session

**`POST /session`**

Creates a new conversation session.

**Request Body**

```json
{
  "title": "my-session"
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `title` | string | No | Session name (default: auto-generated) |

**Response**

```json
{
  "id": "ses_xyz789",
  "title": "my-session",
  "time": {
    "created": 1704067200,
    "updated": 1704067200
  }
}
```

**Example**

```bash
curl -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" \
  -d '{"title": "automation"}'
```

---

## Messages

Messages are the conversation turns between user and AI.

### Get Messages

**`GET /session/:id/message`**

Returns all messages in a session.

**Path Parameters**

| Parameter | Description |
|-----------|-------------|
| `id` | Session ID |

**Response**

```json
{
  "messages": [
    {
      "info": {
        "id": "msg_001",
        "sessionID": "ses_abc123",
        "role": "user",
        "time": {
          "created": 1704067200
        }
      },
      "parts": [
        {
          "type": "text",
          "text": "Hello, what can you do?"
        }
      ]
    },
    {
      "info": {
        "id": "msg_002",
        "sessionID": "ses_abc123",
        "role": "assistant",
        "time": {
          "created": 1704067205
        }
      },
      "parts": [
        {
          "type": "text",
          "text": "I can help you with coding, file management, and more..."
        }
      ]
    }
  ]
}
```

**Example**

```bash
SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[0].id')
curl "http://localhost:4096/session/$SESSION_ID/message" | jq
```

### Send Message

**`POST /session/:id/message`**

Sends a message to the AI assistant.

**Path Parameters**

| Parameter | Description |
|-----------|-------------|
| `id` | Session ID |

**Request Body**

```json
{
  "parts": [
    {
      "type": "text",
      "text": "Create a hello world script"
    }
  ]
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| `parts` | array | Yes | Message content parts |
| `parts[].type` | string | Yes | Part type: `"text"` |
| `parts[].text` | string | Yes | Message text content |

**Response**

Returns the AI's response message.

```json
{
  "info": {
    "id": "msg_003",
    "sessionID": "ses_abc123",
    "role": "assistant",
    "time": {
      "created": 1704067300
    }
  },
  "parts": [
    {
      "type": "text",
      "text": "I'll create a hello world script for you."
    },
    {
      "type": "tool",
      "tool": "write",
      "state": {
        "status": "completed",
        "input": {
          "filePath": "/home/vibe/hello.sh",
          "content": "#!/bin/bash\necho 'Hello, World!'"
        }
      }
    }
  ]
}
```

**Example**

```bash
SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[0].id')
curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
  -H "Content-Type: application/json" \
  -d '{"parts": [{"type": "text", "text": "What is 2+2?"}]}'
```

### Abort Response

**`POST /session/:id/abort`**

Aborts the current AI response generation.

**Path Parameters**

| Parameter | Description |
|-----------|-------------|
| `id` | Session ID |

**Response**

```json
{
  "success": true
}
```

**Example**

```bash
curl -X POST "http://localhost:4096/session/$SESSION_ID/abort"
```

---

## Server-Sent Events (SSE)

Real-time event streaming for monitoring conversation state.

### Subscribe to Events

**`GET /event`**

Establishes an SSE connection for real-time updates.

**Example**

```bash
curl -N http://localhost:4096/event
```

### Event Types

#### `server.connected`

Sent immediately after connecting.

```json
{
  "type": "server.connected"
}
```

#### `session.status`

Session state changes (busy/idle).

```json
{
  "type": "session.status",
  "properties": {
    "sessionID": "ses_abc123",
    "status": {
      "type": "busy"
    }
  }
}
```

Status types:
- `busy` - AI is generating a response
- `idle` - Session is ready for input

#### `session.idle`

Conversation turn completed.

```json
{
  "type": "session.idle",
  "properties": {
    "sessionID": "ses_abc123"
  }
}
```

#### `message.created`

New message created.

```json
{
  "type": "message.created",
  "properties": {
    "info": {
      "id": "msg_001",
      "sessionID": "ses_abc123",
      "role": "user"
    }
  }
}
```

#### `message.updated`

Message metadata updated.

```json
{
  "type": "message.updated",
  "properties": {
    "info": {
      "id": "msg_002",
      "sessionID": "ses_abc123",
      "role": "assistant"
    }
  }
}
```

#### `message.part.updated`

Streaming content update (text or tool call progress).

```json
{
  "type": "message.part.updated",
  "properties": {
    "sessionID": "ses_abc123",
    "messageID": "msg_002",
    "part": {
      "type": "text",
      "text": "I'll help you with that..."
    }
  }
}
```

Tool call part:

```json
{
  "type": "message.part.updated",
  "properties": {
    "sessionID": "ses_abc123",
    "messageID": "msg_002",
    "part": {
      "type": "tool",
      "tool": "bash",
      "state": {
        "status": "running",
        "input": {
          "command": "ls -la"
        }
      }
    }
  }
}
```

---

## Message Parts

Messages contain one or more parts of different types.

### Text Part

User or assistant text content.

```json
{
  "type": "text",
  "text": "Hello, how can I help?"
}
```

### Tool Part

Tool/function call by the assistant.

```json
{
  "type": "tool",
  "tool": "bash",
  "state": {
    "status": "completed",
    "input": {
      "command": "ls -la"
    },
    "output": "total 12\ndrwxr-xr-x 3 vibe vibe 4096..."
  }
}
```

Tool state statuses:
- `pending` - Tool call queued
- `running` - Tool is executing
- `completed` - Tool finished successfully
- `error` - Tool execution failed

Common tools:
- `bash` - Execute shell commands
- `read` - Read file contents
- `write` - Write/create files
- `edit` - Edit existing files
- `glob` - Find files by pattern
- `grep` - Search file contents

---

## Complete Examples

### Send a Message and Monitor via SSE

**Terminal 1: Monitor events**

```bash
curl -N http://localhost:4096/event
```

**Terminal 2: Send message**

```bash
SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[0].id')
curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
  -H "Content-Type: application/json" \
  -d '{"parts": [{"type": "text", "text": "List the files in the home directory"}]}'
```

### Using the vibeos-send Helper

The `vibeos-send` script simplifies message sending:

```bash
# Send a message
./scripts/vibeos-send "Create a Python hello world script"

# Pipe from stdin
echo "What time is it?" | ./scripts/vibeos-send

# Use with a specific session
VIBEOS_SESSION=myproject ./scripts/vibeos-send "Build the project"
```

Environment variables:

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBEOS_HOST` | `localhost` | OpenCode server host |
| `VIBEOS_PORT` | `4096` | OpenCode server port |
| `VIBEOS_SESSION` | `desktop` | Session name to use |

### Programmatic Integration (Python)

```python
import requests
import json

BASE_URL = "http://localhost:4096"

# Get session ID
sessions = requests.get(f"{BASE_URL}/session").json()
session_id = sessions[0]["id"]

# Send a message
response = requests.post(
    f"{BASE_URL}/session/{session_id}/message",
    json={"parts": [{"type": "text", "text": "What is 2+2?"}]}
)

# Parse response
message = response.json()
for part in message.get("parts", []):
    if part["type"] == "text":
        print(part["text"])
```

### Programmatic Integration (Node.js)

```javascript
const BASE_URL = "http://localhost:4096";

async function sendMessage(text) {
  // Get session ID
  const sessions = await fetch(`${BASE_URL}/session`).then(r => r.json());
  const sessionId = sessions[0].id;

  // Send message
  const response = await fetch(`${BASE_URL}/session/${sessionId}/message`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ parts: [{ type: "text", text }] })
  });

  return response.json();
}

// Usage
sendMessage("Create a hello.txt file").then(console.log);
```

---

## Error Handling

### HTTP Status Codes

| Code | Description |
|------|-------------|
| `200` | Success |
| `400` | Bad request (invalid JSON, missing fields) |
| `404` | Session not found |
| `500` | Internal server error |

### Error Response Format

```json
{
  "error": "Session not found",
  "code": "SESSION_NOT_FOUND"
}
```

---

## Rate Limits and Performance

- No built-in rate limits
- One message at a time per session (wait for `session.idle` before sending another)
- SSE connections are long-lived; reconnect on disconnect
- Large responses may take time; use SSE for real-time updates

---

## Security

By default, the API has no authentication. For production use:

1. Set `OPENCODE_SERVER_PASSWORD` environment variable
2. Use Docker network isolation
3. Don't expose port 4096 to untrusted networks
