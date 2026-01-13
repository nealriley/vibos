# Integration Guide

This guide explains how to integrate VibeOS with external systems, automate workflows, and build applications that interact with the AI-powered desktop.

## Overview

VibeOS exposes several integration points:

| Integration | Port | Protocol | Use Case |
|-------------|------|----------|----------|
| **OpenCode API** | 4096 | HTTP/SSE | AI control, automation |
| **VNC** | 5900 | VNC/RFB | Desktop viewing/control |
| **WebSocket VNC** | 6080 | WebSocket | Browser-based access |
| **Shared Volume** | - | Filesystem | File exchange |

---

## Integration Patterns

### Pattern 1: Command and Forget

Send a command and don't wait for completion.

```bash
# Fire and forget
curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
  -H "Content-Type: application/json" \
  -d '{"parts": [{"type": "text", "text": "Create a backup of ~/projects"}]}'
```

**Best for**: Background tasks, scheduled operations

### Pattern 2: Request-Response

Send a command and wait for the complete response.

```python
import requests
import time

def send_and_wait(session_id, message, timeout=60):
    # Send message
    requests.post(
        f"http://localhost:4096/session/{session_id}/message",
        json={"parts": [{"type": "text", "text": message}]}
    )
    
    # Poll for completion
    start = time.time()
    while time.time() - start < timeout:
        # Check session status via SSE or poll messages
        time.sleep(1)
        messages = requests.get(
            f"http://localhost:4096/session/{session_id}/message"
        ).json()
        # Check if last message is from assistant
        if messages["messages"][-1]["info"]["role"] == "assistant":
            return messages["messages"][-1]
    
    raise TimeoutError("Response timeout")
```

**Best for**: Sequential workflows, testing

### Pattern 3: Event-Driven

Subscribe to SSE events and react in real-time.

```python
import sseclient
import requests
import json

def subscribe_to_events():
    response = requests.get(
        "http://localhost:4096/event",
        stream=True
    )
    client = sseclient.SSEClient(response)
    
    for event in client.events():
        data = json.loads(event.data)
        
        if data["type"] == "session.idle":
            print("Session ready for next command")
            
        elif data["type"] == "message.part.updated":
            part = data["properties"]["part"]
            if part["type"] == "text":
                print(f"AI: {part['text']}")
            elif part["type"] == "tool":
                print(f"Tool: {part['tool']} - {part['state']['status']}")
```

**Best for**: Interactive UIs, monitoring dashboards

---

## Shell Scripts Integration

### Using vibeos-send

The `vibeos-send` script provides easy command-line integration:

```bash
#!/bin/bash
# deploy.sh - Example deployment automation

# Build the project
./scripts/vibeos-send "Run npm run build in ~/projects/myapp"

# Wait for completion
sleep 10

# Run tests
./scripts/vibeos-send "Run npm test in ~/projects/myapp"

# Take a screenshot of the result
./scripts/vibeos-screenshot deployment-result.png
```

### Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `VIBEOS_HOST` | `localhost` | API server host |
| `VIBEOS_PORT` | `4096` | API server port |
| `VIBEOS_SESSION` | `desktop` | Session name |
| `VIBEOS_CONTAINER` | `vibeos-dev` | Container name |

### Example: Batch Processing

```bash
#!/bin/bash
# Process multiple files

FILES=(file1.js file2.js file3.js)

for file in "${FILES[@]}"; do
    ./scripts/vibeos-send "Analyze $file and fix any ESLint errors"
    sleep 5  # Wait for processing
done

./scripts/vibeos-send "Summarize all changes made"
```

---

## Python Integration

### Basic Client

```python
import requests

class VibeOSClient:
    def __init__(self, host="localhost", port=4096):
        self.base_url = f"http://{host}:{port}"
        self.session_id = None
    
    def get_session(self, name="desktop"):
        """Get or find session by name."""
        sessions = requests.get(f"{self.base_url}/session").json()
        for session in sessions:
            if session.get("title") == name:
                self.session_id = session["id"]
                return session
        return None
    
    def send(self, message):
        """Send a message to the AI."""
        if not self.session_id:
            self.get_session()
        
        response = requests.post(
            f"{self.base_url}/session/{self.session_id}/message",
            json={"parts": [{"type": "text", "text": message}]}
        )
        return response.json()
    
    def get_messages(self):
        """Get all messages in current session."""
        response = requests.get(
            f"{self.base_url}/session/{self.session_id}/message"
        )
        return response.json()["messages"]
    
    def abort(self):
        """Abort current AI response."""
        requests.post(f"{self.base_url}/session/{self.session_id}/abort")

# Usage
client = VibeOSClient()
response = client.send("What files are in the home directory?")
print(response)
```

### Async Client with SSE

```python
import asyncio
import aiohttp
import json

class AsyncVibeOSClient:
    def __init__(self, host="localhost", port=4096):
        self.base_url = f"http://{host}:{port}"
        self.session_id = None
    
    async def connect(self):
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/session") as resp:
                sessions = await resp.json()
                self.session_id = sessions[0]["id"]
    
    async def send(self, message):
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{self.base_url}/session/{self.session_id}/message",
                json={"parts": [{"type": "text", "text": message}]}
            ) as resp:
                return await resp.json()
    
    async def stream_events(self, callback):
        """Stream SSE events."""
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{self.base_url}/event") as resp:
                async for line in resp.content:
                    line = line.decode().strip()
                    if line.startswith("data:"):
                        data = json.loads(line[5:])
                        await callback(data)

# Usage
async def handle_event(event):
    if event["type"] == "message.part.updated":
        part = event["properties"]["part"]
        if part["type"] == "text":
            print(part["text"], end="", flush=True)

async def main():
    client = AsyncVibeOSClient()
    await client.connect()
    
    # Start event listener
    asyncio.create_task(client.stream_events(handle_event))
    
    # Send message
    await client.send("Create a hello world Python script")
    
    # Keep running
    await asyncio.sleep(30)

asyncio.run(main())
```

---

## Node.js Integration

### Basic Client

```javascript
const BASE_URL = "http://localhost:4096";

class VibeOSClient {
  constructor(host = "localhost", port = 4096) {
    this.baseUrl = `http://${host}:${port}`;
    this.sessionId = null;
  }

  async getSession(name = "desktop") {
    const response = await fetch(`${this.baseUrl}/session`);
    const sessions = await response.json();
    const session = sessions.find((s) => s.title === name);
    if (session) {
      this.sessionId = session.id;
    }
    return session;
  }

  async send(message) {
    if (!this.sessionId) {
      await this.getSession();
    }

    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/message`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ parts: [{ type: "text", text: message }] }),
      }
    );
    return response.json();
  }

  async getMessages() {
    const response = await fetch(
      `${this.baseUrl}/session/${this.sessionId}/message`
    );
    const data = await response.json();
    return data.messages;
  }

  async abort() {
    await fetch(`${this.baseUrl}/session/${this.sessionId}/abort`, {
      method: "POST",
    });
  }
}

// Usage
const client = new VibeOSClient();
client.send("List files in home directory").then(console.log);
```

### With EventSource (SSE)

```javascript
const EventSource = require("eventsource");

class VibeOSClient {
  constructor(host = "localhost", port = 4096) {
    this.baseUrl = `http://${host}:${port}`;
    this.sessionId = null;
    this.eventSource = null;
  }

  subscribeToEvents(handlers = {}) {
    this.eventSource = new EventSource(`${this.baseUrl}/event`);

    this.eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);

      switch (data.type) {
        case "session.idle":
          handlers.onIdle?.(data);
          break;
        case "message.part.updated":
          handlers.onPartUpdate?.(data.properties.part);
          break;
        case "session.status":
          handlers.onStatus?.(data.properties.status);
          break;
      }
    };

    this.eventSource.onerror = (error) => {
      handlers.onError?.(error);
    };
  }

  disconnect() {
    if (this.eventSource) {
      this.eventSource.close();
    }
  }
}

// Usage
const client = new VibeOSClient();

client.subscribeToEvents({
  onPartUpdate: (part) => {
    if (part.type === "text") {
      process.stdout.write(part.text);
    } else if (part.type === "tool") {
      console.log(`\n[${part.tool}] ${part.state.status}`);
    }
  },
  onIdle: () => {
    console.log("\n--- Response complete ---");
  },
});

// Send a message
await client.getSession();
await client.send("Create a simple web server");
```

---

## File Exchange via Shared Volume

The `shared/` directory is mounted into the container for file exchange.

### Host to Container

```bash
# Copy file to container
cp myfile.txt shared/

# Now accessible in container at /home/vibe/shared/myfile.txt
./scripts/vibeos-send "Read the file at ~/shared/myfile.txt"
```

### Container to Host

```bash
# Have AI create a file
./scripts/vibeos-send "Create a report.txt in ~/shared with today's date"

# Access on host
cat shared/report.txt
```

### Screenshots

```bash
# Trigger screenshot
./scripts/vibeos-screenshot output.png

# Screenshot saved to shared/output.png
open shared/output.png
```

---

## CI/CD Integration

### GitHub Actions Example

```yaml
name: VibeOS Automation

on:
  push:
    branches: [main]

jobs:
  automate:
    runs-on: ubuntu-latest

    services:
      vibeos:
        image: your-registry/vibeos:latest
        ports:
          - 4096:4096
          - 6080:6080
        env:
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}

    steps:
      - uses: actions/checkout@v4

      - name: Wait for VibeOS
        run: |
          for i in {1..30}; do
            curl -s http://localhost:4096/global/health && break
            sleep 2
          done

      - name: Run automation
        run: |
          SESSION_ID=$(curl -s http://localhost:4096/session | jq -r '.[0].id')
          curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
            -H "Content-Type: application/json" \
            -d '{"parts": [{"type": "text", "text": "Run the test suite"}]}'
```

### Docker Compose for Testing

```yaml
version: "3.8"

services:
  vibeos:
    build: .
    ports:
      - "4096:4096"
      - "6080:6080"
    environment:
      - ANTHROPIC_API_KEY=${ANTHROPIC_API_KEY}
      - RESOLUTION=1280x720
    volumes:
      - ./shared:/home/vibe/shared
    shm_size: "2gb"
    security_opt:
      - seccomp:unconfined

  test-runner:
    image: node:18
    depends_on:
      - vibeos
    volumes:
      - ./tests:/app
    working_dir: /app
    command: npm test
    environment:
      - VIBEOS_HOST=vibeos
      - VIBEOS_PORT=4096
```

---

## Webhook Integration

### Receiving Webhooks

Create a simple relay that forwards webhooks to VibeOS:

```python
from flask import Flask, request
import requests

app = Flask(__name__)
VIBEOS_URL = "http://localhost:4096"

@app.route("/webhook/github", methods=["POST"])
def github_webhook():
    data = request.json
    
    if data.get("action") == "opened" and "pull_request" in data:
        pr = data["pull_request"]
        message = f"Review PR #{pr['number']}: {pr['title']}"
        
        # Get session
        sessions = requests.get(f"{VIBEOS_URL}/session").json()
        session_id = sessions[0]["id"]
        
        # Send to VibeOS
        requests.post(
            f"{VIBEOS_URL}/session/{session_id}/message",
            json={"parts": [{"type": "text", "text": message}]}
        )
    
    return {"status": "ok"}

if __name__ == "__main__":
    app.run(port=5000)
```

---

## Security Best Practices

### Network Isolation

```yaml
# docker-compose.yml
services:
  vibeos:
    networks:
      - internal
    # Don't expose API externally
    # ports:
    #   - "4096:4096"

  your-app:
    networks:
      - internal
    environment:
      - VIBEOS_HOST=vibeos  # Internal hostname

networks:
  internal:
    driver: bridge
```

### API Authentication

If using `OPENCODE_SERVER_PASSWORD`:

```bash
curl -X POST "http://localhost:4096/session/$SESSION_ID/message" \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $OPENCODE_SERVER_PASSWORD" \
  -d '{"parts": [{"type": "text", "text": "Hello"}]}'
```

### Read-Only Volumes

For production, mount shell-ui as read-only:

```yaml
volumes:
  - ./shell-ui:/home/vibe/shell-ui:ro
```

---

## Troubleshooting

### Connection Refused

```bash
# Check container is running
docker ps | grep vibeos

# Check API health
curl http://localhost:4096/global/health

# Check logs
docker logs vibeos-dev
```

### Session Not Found

```bash
# List available sessions
curl http://localhost:4096/session | jq

# Create a new session if needed
curl -X POST http://localhost:4096/session \
  -H "Content-Type: application/json" \
  -d '{"title": "automation"}'
```

### SSE Connection Drops

- Implement reconnection logic
- Use exponential backoff
- Check for network timeouts
