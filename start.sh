#!/bin/bash
#
# VibeOS Quick Start Script
#
# Usage:
#   ./start.sh          # Build and run
#   ./start.sh --build  # Force rebuild
#   ./start.sh --stop   # Stop container
#

set -e

# Configuration
IMAGE_NAME="vibeos"
CONTAINER_NAME="vibeos-dev"
RESOLUTION="${RESOLUTION:-1920x1080}"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
CYAN='\033[0;36m'
NC='\033[0m'

# Functions
log_info() {
    echo -e "${CYAN}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

check_docker() {
    if ! command -v docker &> /dev/null; then
        log_error "Docker is not installed. Please install Docker first."
        exit 1
    fi
    
    if ! docker info &> /dev/null; then
        log_error "Docker daemon is not running. Please start Docker."
        exit 1
    fi
    
    log_success "Docker is available"
}

stop_container() {
    log_info "Stopping existing container..."
    docker stop "$CONTAINER_NAME" 2>/dev/null || true
    docker rm "$CONTAINER_NAME" 2>/dev/null || true
    log_success "Container stopped"
}

build_image() {
    log_info "Building Docker image..."
    docker build -t "$IMAGE_NAME" .
    log_success "Image built successfully"
}

run_container() {
    log_info "Starting container..."
    
    # Create shared directory if it doesn't exist
    mkdir -p "$(pwd)/shared"
    
    docker run -d \
        --name "$CONTAINER_NAME" \
        -p 6080:6080 \
        -p 5900:5900 \
        -p 4096:4096 \
        -e RESOLUTION="$RESOLUTION" \
        -v "$(pwd)/shared:/home/vibe/shared" \
        --shm-size=2g \
        --security-opt seccomp=unconfined \
        "$IMAGE_NAME"
    
    log_success "Container started"
}

wait_for_ready() {
    log_info "Waiting for services to start..."
    local max_attempts=30
    local attempt=1
    
    while [ $attempt -le $max_attempts ]; do
        if curl -s -o /dev/null -w "%{http_code}" http://localhost:6080/vnc.html | grep -q "200"; then
            log_success "VibeOS is ready!"
            return 0
        fi
        sleep 1
        attempt=$((attempt + 1))
    done
    
    log_error "Timeout waiting for VibeOS to start"
    return 1
}

show_access_info() {
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo -e "${GREEN}                    VibeOS is Running!                      ${NC}"
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
    echo -e "  ${CYAN}Web Access:${NC}"
    echo "    http://localhost:6080/beta.html    # VibeOS custom UI"
    echo "    http://localhost:6080/vnc.html     # Default noVNC UI"
    echo ""
    echo -e "  ${CYAN}VNC Direct:${NC}  vnc://localhost:5900"
    echo ""
    echo -e "  ${CYAN}Commands:${NC}"
    echo "    docker logs $CONTAINER_NAME     # View logs"
    echo "    docker exec -it $CONTAINER_NAME bash  # Shell access"
    echo "    docker stop $CONTAINER_NAME     # Stop"
    echo ""
    echo -e "${GREEN}═══════════════════════════════════════════════════════════${NC}"
    echo ""
}

# Main
main() {
    case "${1:-}" in
        --stop)
            check_docker
            stop_container
            exit 0
            ;;
        --build)
            check_docker
            stop_container
            build_image
            run_container
            wait_for_ready
            show_access_info
            ;;
        --help|-h)
            echo "Usage: $0 [--build|--stop|--help]"
            echo ""
            echo "Options:"
            echo "  --build    Force rebuild of Docker image"
            echo "  --stop     Stop the container"
            echo "  --help     Show this help"
            echo ""
            echo "Environment variables:"
            echo "  RESOLUTION  Display resolution (default: 1920x1080)"
            exit 0
            ;;
        *)
            check_docker
            stop_container
            
            # Build if image doesn't exist
            if ! docker image inspect "$IMAGE_NAME" &> /dev/null; then
                build_image
            else
                log_info "Using existing image (use --build to rebuild)"
            fi
            
            run_container
            wait_for_ready
            show_access_info
            ;;
    esac
}

main "$@"
