# VibeOS Development Brief

## Project Vision

Build a minimal Linux distribution ("VibeOS") that boots directly to a clean, empty screen with only a search bar prompt. When users type into this prompt, it initiates an AI-powered coding session (opencode preinstalled) in a terminal. No taskbars, desktop icons, or traditional DE elements—just a focused interface for "vibe coding."

---

## Target Platforms

| Platform | Priority | Use Case |
|----------|----------|----------|
| VirtualBox | **Critical** | Development feedback loop, rapid iteration |
| Raspberry Pi (4/5) | High | Edge deployment, portable coding stations |
| Live USB | High | Try-before-install, portable sessions |
| Commodity Laptop | Medium | Daily driver installation |

---

## System Architecture

Based on the whiteboard diagram, the system has these interlocking layers:

```
┌─────────────────────────────────────────────────────────────┐
│                    APPLICATION LAYER                         │
│  ┌─────────┐  ┌─────────┐  ┌──────────┐  ┌───────────────┐  │
│  │ Search  │  │ Terminal│  │ opencode │  │ Desktop Apps  │  │
│  │ Bar UI  │  │         │  │          │  │ (optional)    │  │
│  └────┬────┘  └────┬────┘  └────┬─────┘  └───────┬───────┘  │
│       └────────────┴────────────┴────────────────┘          │
├─────────────────────────────────────────────────────────────┤
│                     STATE MANAGEMENT                         │
│  ┌─────────┐  ┌─────────┐  ┌───────────┐                    │
│  │ Events  │→ │  State  │→ │Interactions│                   │
│  └─────────┘  └─────────┘  └───────────┘                    │
├─────────────────────────────────────────────────────────────┤
│                    BOOT / CONFIG LAYER                       │
│  ┌─────────────┐  ┌──────────┐  ┌────────────┐              │
│  │ Boot Config │  │ Install  │  │ Load Apps  │              │
│  │             │  │          │  │   Build    │              │
│  └─────────────┘  └──────────┘  └────────────┘              │
├─────────────────────────────────────────────────────────────┤
│                    DISPLAY / UI LAYER                        │
│  ┌────────────────────────────────────────────────┐         │
│  │           Labwc / Cage (Wayland Compositor)    │         │
│  └────────────────────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                    DISTRO / USERLAND                         │
│  ┌────────────────────────────────────────────────┐         │
│  │              Debian Bookworm Base              │         │
│  └────────────────────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                       KERNEL                                 │
│  ┌────────────────────────────────────────────────┐         │
│  │      Linux Kernel (ARM64 / x86_64)             │         │
│  └────────────────────────────────────────────────┘         │
├─────────────────────────────────────────────────────────────┤
│                      HARDWARE                                │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐          │
│  │ Raspberry   │  │   Laptop    │  │ VirtualBox  │          │
│  │ Pi 4/5      │  │ (x86_64)    │  │    VM       │          │
│  └─────────────┘  └─────────────┘  └─────────────┘          │
└─────────────────────────────────────────────────────────────┘
```

---

## Recommended Tech Stack

### Display Layer: Wayland with Labwc or Cage

**Primary Choice: Labwc** (for flexibility)
- Now default in Raspberry Pi OS Bookworm
- Lightweight wlroots-based compositor
- Can be configured for minimal kiosk-style operation
- Auto-hide cursor feature built-in
- Works across Pi 3/4/5 and x86_64

**Alternative: Cage** (for pure kiosk)
- Purpose-built for single-application kiosk
- Even more minimal than labwc
- Best if the entire UI is one application

### Init System: SystemD

- Standard across Debian/Ubuntu ecosystem
- Required for compatibility with commodity laptops
- greetd for autologin (integrates well with Wayland)

### Base Distribution: Debian Bookworm (testing: Trixie)

- Mature, well-documented
- Works on both ARM64 and x86_64
- live-build tooling is excellent
- Large package ecosystem

---

## Build Tooling Strategy

### For Development (VirtualBox First)

```
┌─────────────────────────────────────────┐
│           live-build (Debian)           │
│  Creates hybrid ISO for BIOS + UEFI     │
│  Works in VirtualBox immediately        │
└───────────────────┬─────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│   VirtualBox    │   │    Live USB     │
│   (x86_64)      │   │   (x86_64)      │
└─────────────────┘   └─────────────────┘
```

### For Raspberry Pi

```
┌─────────────────────────────────────────┐
│    pi-gen OR rpi-image-gen (new 2025)   │
│   Creates .img for SD card / USB boot   │
└───────────────────┬─────────────────────┘
                    │
         ┌──────────┴──────────┐
         ▼                     ▼
┌─────────────────┐   ┌─────────────────┐
│  Raspberry Pi   │   │   Pi-QEMU for   │
│  Hardware       │   │   Testing       │
└─────────────────┘   └─────────────────┘
```

### Unified Build Structure

```
vibeos/
├── common/
│   ├── packages/           # Package lists shared across platforms
│   ├── config/             # Config files (labwc, greetd, etc.)
│   └── scripts/            # Post-install scripts
│
├── x86_64/
│   ├── live-build/         # Debian live-build config
│   │   ├── auto/
│   │   │   ├── config
│   │   │   ├── build
│   │   │   └── clean
│   │   └── config/
│   │       ├── package-lists/
│   │       ├── hooks/
│   │       └── includes.chroot/
│   └── Makefile
│
├── arm64/
│   ├── pi-gen/             # Raspberry Pi build config
│   │   └── stage-vibeos/   # Custom stage for VibeOS
│   └── Makefile
│
└── Makefile                # Top-level orchestration
```

---

## Key Components to Build

### 1. Search Bar UI (The "Shell")

This is the core UX component—a minimal fullscreen application that:

- Displays an empty screen with a centered search bar
- Accepts text input (the "prompt")
- On Enter, spawns a terminal with opencode or relevant command
- Can launch desktop applications if needed (via application launcher logic)

**Implementation Options:**

A. **Electron/Web-based** (fastest to prototype)
   - GTK4 WebKit view or standalone Electron
   - HTML/CSS/JS for UI
   - Spawns terminal via child process
   - Pro: Rapid iteration, familiar tooling
   - Con: Higher memory footprint

B. **GTK4 Native** (best for resources)
   - Python + GTK4 or Rust + GTK4
   - Native performance
   - Pro: Minimal overhead, clean integration
   - Con: Slower development

C. **Terminal-based** (most minimal)
   - Custom shell/prompt that replaces bash
   - Fullscreen terminal with styled prompt
   - Pro: Extremely minimal
   - Con: Less visual flexibility

**Recommendation:** Start with Electron for VirtualBox iteration, port to GTK4 for production.

### 2. Terminal Integration

- **alacritty** or **foot** (both are Wayland-native, GPU-accelerated)
- foot is more minimal, already in Debian repos
- Must be configured to spawn in specific modes (fullscreen, floating)

### 3. opencode Integration

- Pre-install Node.js (LTS) and opencode globally
- Configure API key management (env vars or config file)
- Create wrapper script for launching opencode sessions

### 4. Session/State Management

Simple state machine:

```
IDLE (search bar visible)
    │
    ▼ [user types + Enter]
SPAWNING (launching terminal + opencode)
    │
    ▼
ACTIVE (terminal visible, opencode running)
    │
    ▼ [user closes terminal or types exit]
IDLE
```

Consider using a simple IPC mechanism (Unix sockets or DBus) for the search bar to communicate with the compositor.

---

## Phase 1: VirtualBox MVP (Week 1-2)

**Goal:** Bootable ISO that runs in VirtualBox with the basic UX

**Tasks:**

1. **Set up live-build skeleton**
   ```bash
   mkdir -p vibeos/x86_64/live-build
   cd vibeos/x86_64/live-build
   lb config \
     --distribution bookworm \
     --architectures amd64 \
     --binary-images iso-hybrid \
     --apt-indices false \
     --memtest none
   ```

2. **Create minimal package list**
   ```
   # config/package-lists/vibeos.list.chroot
   linux-image-amd64
   grub-efi-amd64
   labwc
   greetd
   foot
   nodejs
   npm
   git
   curl
   ```

3. **Build search bar prototype**
   - Simple Electron app with centered input
   - On submit, runs: `foot -e opencode`

4. **Configure labwc for kiosk mode**
   ```ini
   # /etc/labwc/autostart
   /usr/local/bin/vibeos-shell &
   ```

5. **Configure greetd for autologin**
   ```toml
   # /etc/greetd/config.toml
   [terminal]
   vt = 1

   [default_session]
   command = "labwc"
   user = "vibe"
   ```

6. **Build and test**
   ```bash
   sudo lb build
   # Creates live-image-amd64.hybrid.iso
   # Import into VirtualBox
   ```

---

## Phase 2: Raspberry Pi Port (Week 3-4)

**Goal:** Bootable SD card image for Pi 4/5

**Tasks:**

1. **Set up pi-gen with custom stage**
   ```bash
   git clone https://github.com/RPi-Distro/pi-gen.git
   cd pi-gen
   # Skip stages 3-5 (desktop stuff we don't need)
   touch stage3/SKIP stage4/SKIP stage5/SKIP
   # Create our stage
   mkdir stage-vibeos
   ```

2. **Create stage-vibeos install scripts**
   - 00-packages: labwc, greetd, foot, nodejs, etc.
   - 01-config: Copy labwc and greetd configs
   - 02-vibeos-shell: Install the search bar app

3. **Build and test**
   ```bash
   sudo ./build.sh
   # Creates image in deploy/
   # Flash to SD card: sudo dd if=image.img of=/dev/sdX bs=4M
   ```

4. **Test with QEMU (optional, for faster iteration)**
   ```bash
   qemu-system-aarch64 -M virt -cpu cortex-a72 \
     -m 2G -drive file=image.img,format=raw
   ```

---

## Phase 3: Polish & Live USB (Week 5-6)

**Tasks:**

1. **Add persistence support for live USB**
   - Configure casper/live-boot for overlay persistence
   - Create setup script for first-boot configuration

2. **Refine UX**
   - Keyboard shortcuts (Ctrl+Space for search bar, etc.)
   - Visual polish (fonts, colors, animations)
   - Error handling and feedback

3. **Create installer (optional)**
   - Calamares or simple shell-based installer
   - For users who want to install to disk

---

## Development Environment Setup

### Prerequisites on Host Machine

```bash
# Debian/Ubuntu host
sudo apt update
sudo apt install -y \
  live-build \
  debootstrap \
  qemu-user-static \
  binfmt-support \
  virtualbox \
  git \
  make

# For Pi builds
sudo apt install -y \
  qemu-system-arm \
  qemu-efi-aarch64
```

### Quick Start Commands

```bash
# Clone and setup
git clone https://github.com/yourorg/vibeos.git
cd vibeos

# Build x86_64 ISO (for VirtualBox)
make x86_64

# Build ARM64 image (for Pi)
make arm64

# Test in VirtualBox
make test-vbox

# Clean build artifacts
make clean
```

---

## Key Decisions to Make

1. **Search Bar Implementation**
   - [ ] Electron (fast dev) vs GTK4 (production quality)?
   - [ ] Include application launcher features beyond opencode?

2. **Terminal Choice**
   - [ ] foot (minimal, in repos) vs alacritty (more features)?

3. **Persistence Model**
   - [ ] Full persistence vs session-only vs hybrid?
   - [ ] Where to store API keys and user config?

4. **Desktop App Support**
   - [ ] Include Firefox/Chromium?
   - [ ] Include file manager?
   - [ ] How to launch non-terminal apps from search bar?

5. **Theming**
   - [ ] Light/dark mode?
   - [ ] Custom cursor/fonts?
   - [ ] Boot splash screen?

---

## Resources & References

### Build Tools Documentation
- [Debian Live Manual](https://live-team.pages.debian.net/live-manual/html/live-manual/index.en.html)
- [pi-gen GitHub](https://github.com/RPi-Distro/pi-gen)
- [rpi-image-gen (new 2025)](https://github.com/raspberrypi/rpi-image-gen)

### Desktop/Compositor
- [Labwc GitHub](https://github.com/labwc/labwc)
- [Cage (Wayland Kiosk)](https://github.com/cage-kiosk/cage)
- [greetd](https://git.sr.ht/~kennylevinsen/greetd)

### Similar Projects
- [DietPi](https://dietpi.com/) - Minimal Debian for SBCs
- [FullPageOS](https://github.com/guysoft/FullPageOS) - Kiosk-mode Pi distro
- [Raspberry Pi Kiosk Mode Tutorial](https://www.raspberrypi.com/tutorials/how-to-use-a-raspberry-pi-in-kiosk-mode/)

---

## Next Steps

1. Create the repository structure
2. Set up live-build skeleton with basic Debian Bookworm config
3. Build and boot minimal ISO in VirtualBox (no custom UI yet)
4. Iterate: Add labwc, greetd, foot, test autologin to Wayland
5. Iterate: Add search bar prototype, test launching terminal
6. Iterate: Add opencode, test full flow
7. Port to pi-gen for Raspberry Pi

---

*Generated for Claude Code CLI development workflow*
