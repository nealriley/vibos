# Tutorial: Getting Started with VibeOS

In this tutorial, you'll set up VibeOS, connect to your AI-powered desktop, and complete your first AI-assisted task.

## Prerequisites

- Docker installed and running (Docker Desktop, Rancher Desktop, or similar)
- 4GB+ RAM available
- An API key from one of:
  - Anthropic (Claude)
  - OpenAI
  - OpenCode Zen

## Step 1: Get the VibeOS Source

Clone or download the VibeOS repository:

```bash
git clone <repository-url>
cd vibeos
```

You should see the following structure:

```
vibeos/
├── Dockerfile
├── docker-compose.yml
├── start.sh
├── shell-ui/
├── scripts/
└── ...
```

## Step 2: Configure Your API Key

Set your API key as an environment variable:

```bash
# For Anthropic (Claude)
export ANTHROPIC_API_KEY=sk-ant-your-key-here

# For OpenAI
export OPENAI_API_KEY=sk-your-key-here

# For OpenCode Zen
export OPENCODE_API_KEY=your-key-here
```

Alternatively, create a `.env` file:

```bash
echo "ANTHROPIC_API_KEY=sk-ant-your-key-here" > .env
```

## Step 3: Start VibeOS

Run the quick-start script:

```bash
./start.sh
```

You should see output like:

```
Building VibeOS...
Starting VibeOS container...
VibeOS is starting...
Access VibeOS at: http://localhost:6080/beta.html
```

The first build takes 3-5 minutes. Subsequent starts are faster.

## Step 4: Connect to Your Desktop

Open your browser and navigate to:

```
http://localhost:6080/beta.html
```

You should see:
1. A brief "Connecting" overlay with a spinner
2. The VibeOS desktop with a dark theme
3. The AI conversation interface

The interface auto-connects - no need to click a "Connect" button.

## Step 5: Send Your First Message

In the prompt bar at the top, type:

```
What can you help me with?
```

Press **Enter** to send.

The AI will respond with an overview of its capabilities. You'll see the response stream in real-time.

## Step 6: Create Your First File

Let's have the AI create a simple file. Type:

```
Create a file called hello.txt in the shared folder with the text "Hello from VibeOS!"
```

Press **Enter**.

You'll see the AI:
1. Think about the task
2. Execute a file creation command
3. Confirm the file was created

Check the result on your host machine:

```bash
cat shared/hello.txt
```

You should see: `Hello from VibeOS!`

## Step 7: Launch an Application

Try launching Chrome. Type:

```
!chrome
```

Press **Enter**.

Google Chrome will open in the desktop. The main conversation window automatically hides to give Chrome focus.

To bring back the conversation interface, click the "V" icon in the bottom-left corner, or press `Super+Space`.

## Step 8: Run a Shell Command

You can run shell commands directly. Type:

```
$ls -la ~/shared
```

Press **Enter**.

A terminal window opens and shows the directory listing.

## Step 9: Take a Screenshot

Capture your desktop from the host machine:

```bash
./scripts/vibeos-screenshot my-first-screenshot.png
```

View the screenshot:

```bash
open shared/my-first-screenshot.png
# or on Linux: xdg-open shared/my-first-screenshot.png
```

## Step 10: Stop VibeOS

When you're done, stop the container:

```bash
./start.sh --stop
```

Or use Docker directly:

```bash
docker stop vibeos-dev && docker rm vibeos-dev
```

## What You Learned

In this tutorial, you:

- Built and started a VibeOS container
- Connected via the web-based VNC interface
- Sent messages to the AI assistant
- Created files through AI commands
- Launched desktop applications
- Ran shell commands
- Took screenshots

## Next Steps

- [VNC Interface Guide](guide-vnc-interfaces.md) - Learn about the different VNC interfaces
- [API Reference](reference-api.md) - Automate VibeOS with the HTTP API
- [Integration Guide](guide-integration.md) - Connect VibeOS to your workflows
- [Automation Tools](reference-automation-tools.md) - Programmatic window control
