# VibeOS Documentation

Welcome to the VibeOS documentation. This guide will help you get started, understand the system, and integrate VibeOS into your workflows.

## Quick Links

| I want to... | Read this |
|--------------|-----------|
| Get started quickly | [Getting Started Tutorial](tutorial-getting-started.md) |
| Connect via browser | [VNC Interface Guide](guide-vnc-interfaces.md) |
| Automate with the API | [API Reference](reference-api.md) |
| Integrate with my system | [Integration Guide](guide-integration.md) |
| Control windows/mouse | [Automation Tools Reference](reference-automation-tools.md) |
| Understand the design | [Architecture Explanation](explanation-architecture.md) |
| Contribute/develop | [Development Guide](DEVELOPMENT.md) |

---

## Documentation Structure

This documentation follows the [Diataxis](https://diataxis.fr/) framework:

### Tutorials (Learning-Oriented)

Step-by-step guides for learning VibeOS from scratch.

- [**Getting Started Tutorial**](tutorial-getting-started.md) - Your first VibeOS session

### How-To Guides (Task-Oriented)

Practical guides for accomplishing specific tasks.

- [**VNC Interface Guide**](guide-vnc-interfaces.md) - Using beta.html and vnc.html
- [**Integration Guide**](guide-integration.md) - Connecting VibeOS to external systems

### Reference (Information-Oriented)

Technical reference documentation for lookup.

- [**API Reference**](reference-api.md) - Complete OpenCode HTTP API docs
- [**Automation Tools Reference**](reference-automation-tools.md) - Window and mouse control scripts
- [**Components Reference**](COMPONENTS.md) - Internal component documentation

### Explanation (Understanding-Oriented)

Background and conceptual information.

- [**Architecture Explanation**](explanation-architecture.md) - Why VibeOS is designed this way
- [**Architecture Overview**](../ARCHITECTURE.md) - Technical system architecture

---

## For Contributors

- [**Development Guide**](DEVELOPMENT.md) - Setting up dev environment, debugging, testing
- [**Project Status**](PROJECT_STATUS.md) - Current features and roadmap

---

## Key Concepts

### What is VibeOS?

VibeOS is a containerized AI-powered Linux desktop environment. It combines:

- An AI coding assistant (OpenCode)
- A full Linux graphical desktop
- Web-based remote access (VNC)
- HTTP API for automation

### Access Points

| Service | Port | URL |
|---------|------|-----|
| VibeOS Web (recommended) | 6080 | http://localhost:6080/beta.html |
| Standard noVNC | 6080 | http://localhost:6080/vnc.html |
| Direct VNC | 5900 | vnc://localhost:5900 |
| OpenCode API | 4096 | http://localhost:4096 |

### Quick Start

```bash
# Set your API key
export ANTHROPIC_API_KEY=your-key-here

# Start VibeOS
./start.sh

# Access in browser
open http://localhost:6080/beta.html
```

---

## Getting Help

- Check the [Troubleshooting](DEVELOPMENT.md#troubleshooting) section
- Review the [API Reference](reference-api.md) for automation issues
- See [VNC Interface Guide](guide-vnc-interfaces.md) for connection problems
