# VibeOS Development Container
# Rapid prototyping environment with web-accessible display
# Based on working patterns from vibestack

FROM ubuntu:22.04

LABEL maintainer="VibeOS Project"
LABEL description="VibeOS - Minimal AI-powered coding environment"

SHELL ["/bin/bash", "-euo", "pipefail", "-c"]

ENV DEBIAN_FRONTEND=noninteractive \
    DISPLAY=:0 \
    RESOLUTION=1920x1080 \
    VNC_PORT=5900 \
    NOVNC_PORT=6080 \
    HOME=/home/vibe \
    USER=vibe \
    VIBEOS_TERMINAL=xfce4-terminal \
    VIBEOS_DEFAULT_CMD=opencode

# Base system + GUI stack
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        # Core utilities
        curl \
        wget \
        git \
        sudo \
        nano \
        vim \
        jq \
        tmux \
        procps \
        software-properties-common \
        # X11/Display stack
        xvfb \
        x11vnc \
        dbus-x11 \
        x11-apps \
        x11-xserver-utils \
        # Window management (minimal - no full desktop)
        openbox \
        # Terminals
        xfce4-terminal \
        xterm \
        # websockify for VNC proxy
        python3-websockify \
        # GUI libraries for Electron
        libnss3 \
        libatk1.0-0 \
        libatk-bridge2.0-0 \
        libcups2 \
        libdrm2 \
        libxkbcommon0 \
        libxcomposite1 \
        libxdamage1 \
        libxfixes3 \
        libxrandr2 \
        libgbm1 \
        libpango-1.0-0 \
        libcairo2 \
        libasound2 \
        libatspi2.0-0 \
        # Fonts
        fonts-liberation \
        fonts-noto \
        fonts-noto-color-emoji \
        fonts-jetbrains-mono \
        # Screenshot tool
        scrot \
        # Window automation tools
        xdotool \
        wmctrl \
        # Clipboard tools
        xclip \
        xsel \
        # Media tools
        ffmpeg \
        feh \
        evince \
        # System utilities
        htop \
        tree \
        ripgrep \
        # File manager
        pcmanfm \
        # Text editor
        mousepad \
        # Python + Supervisor
        python3 \
        python3-pip \
        supervisor \
        # SSH (optional)
        openssh-server \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install Node.js LTS
RUN curl -fsSL https://deb.nodesource.com/setup_22.x | bash - && \
    apt-get update && \
    apt-get install -y --no-install-recommends nodejs && \
    apt-get clean && \
    rm -rf /var/lib/apt/lists/*

# Install Chromium browser (real package, not snap wrapper)
# Ubuntu 22.04's chromium-browser is a snap wrapper, so we use the Debian package via a PPA
RUN apt-get update && \
    apt-get install -y --no-install-recommends \
        gnupg \
        ca-certificates \
    && curl -fsSL https://dl.google.com/linux/linux_signing_key.pub | gpg --dearmor -o /usr/share/keyrings/google-chrome.gpg \
    && echo "deb [arch=amd64 signed-by=/usr/share/keyrings/google-chrome.gpg] http://dl.google.com/linux/chrome/deb/ stable main" > /etc/apt/sources.list.d/google-chrome.list \
    && apt-get update \
    && apt-get install -y --no-install-recommends google-chrome-stable \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install AI coding CLIs
RUN npm install -g opencode-ai@latest

# Create vibe user
RUN useradd -m -s /bin/bash -u 1000 vibe && \
    usermod -aG sudo vibe && \
    echo 'vibe ALL=(ALL) NOPASSWD:ALL' > /etc/sudoers.d/vibe && \
    chmod 440 /etc/sudoers.d/vibe && \
    touch /home/vibe/.sudo_as_admin_successful

# SSH setup
RUN mkdir -p /var/run/sshd && \
    ssh-keygen -A 2>/dev/null || true

# Install newer noVNC (the apt version is too old)
RUN git clone --depth 1 --branch v1.4.0 https://github.com/novnc/noVNC.git /opt/novnc && \
    ln -s /opt/novnc/vnc.html /opt/novnc/index.html

# Copy custom noVNC interface
COPY novnc/ /opt/novnc/

# Create directories
WORKDIR /home/vibe
RUN mkdir -p \
    /home/vibe/.config/openbox \
    /home/vibe/.config/xfce4/terminal \
    /home/vibe/.config/vibeos \
    /home/vibe/.opencode \
    /home/vibe/projects \
    /home/vibe/shared \
    /home/vibe/scripts \
    /home/vibe/shell-ui \
    /home/vibe/Desktop \
    /var/log/supervisor \
    /var/run

# Copy shell-ui application
COPY --chown=vibe:vibe shell-ui /home/vibe/shell-ui

# Install Electron app dependencies and build React UI
WORKDIR /home/vibe/shell-ui
RUN npm install && npm run build:renderer

# Copy configuration files
COPY --chown=vibe:vibe config/openbox /home/vibe/.config/openbox
COPY --chown=vibe:vibe config/xfce4-terminal /home/vibe/.config/xfce4/terminal
COPY --chown=vibe:vibe config/vibeos /home/vibe/.config/vibeos
COPY --chown=vibe:vibe config/vibeos/AGENTS.md /home/vibe/AGENTS.md
COPY --chown=vibe:vibe config/opencode/opencode.json /home/vibe/.opencode/opencode.json
COPY config/supervisord.conf /etc/supervisor/conf.d/supervisord.conf
COPY scripts/entrypoint.sh /entrypoint.sh

# Copy tools scripts
COPY --chown=vibe:vibe scripts/tools /home/vibe/scripts

# Copy test suite
COPY --chown=vibe:vibe tests /home/vibe/tests

RUN chmod +x /entrypoint.sh && \
    chmod +x /home/vibe/.config/openbox/autostart && \
    chmod +x /home/vibe/scripts/*.sh && \
    chmod +x /home/vibe/tests/*.sh && \
    chmod +x /home/vibe/tests/remote/*.sh && \
    chmod +x /home/vibe/tests/automation/*.sh

# Fix all permissions
RUN chown -R vibe:vibe /home/vibe

# Expose ports
EXPOSE 4096 5900 6080 22

WORKDIR /home/vibe

ENTRYPOINT ["/entrypoint.sh"]
CMD ["supervisord", "-n", "-c", "/etc/supervisor/conf.d/supervisord.conf"]
