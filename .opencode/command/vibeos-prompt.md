---
description: Send a prompt to the VibeOS desktop AI agent
---

Send the following prompt to the running VibeOS container's AI agent:

**Prompt**: $ARGUMENTS

First, verify VibeOS is running:
!`curl -s http://localhost:4096/global/health 2>/dev/null || echo '{"error":"VibeOS not reachable"}'`

Then send the message and show the response:
!`./scripts/vibeos-send "$ARGUMENTS" 2>&1`

Report what the VibeOS agent responded with, including any tool calls it made.
