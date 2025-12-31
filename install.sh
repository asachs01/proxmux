#!/bin/bash
#
# proxmux installer script
# Usage: curl -fsSL https://raw.githubusercontent.com/roshie548/proxmux/main/install.sh | bash
#
# This script downloads and installs the proxmux binary for your platform.

set -e

REPO="asachs01/proxmux"
BINARY_NAME="proxmux"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

warn() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

error() {
    echo -e "${RED}[ERROR]${NC} $1"
    exit 1
}

# Detect OS
detect_os() {
    local os
    os="$(uname -s)"
    case "$os" in
        Linux*)     echo "linux" ;;
        Darwin*)    echo "darwin" ;;
        MINGW*|MSYS*|CYGWIN*) echo "windows" ;;
        *)          error "Unsupported operating system: $os" ;;
    esac
}

# Detect architecture
detect_arch() {
    local arch
    arch="$(uname -m)"
    case "$arch" in
        x86_64|amd64)   echo "x64" ;;
        arm64|aarch64)  echo "arm64" ;;
        *)              error "Unsupported architecture: $arch" ;;
    esac
}

# Get the latest release version from GitHub
get_latest_version() {
    local version
    version=$(curl -sL "https://api.github.com/repos/${REPO}/releases/latest" | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')

    if [ -z "$version" ]; then
        error "Failed to fetch latest version from GitHub"
    fi

    echo "$version"
}

# Download and install the binary
install_binary() {
    local os="$1"
    local arch="$2"
    local version="$3"
    local install_dir="$4"

    local platform="${os}-${arch}"
    local download_url="https://github.com/${REPO}/releases/download/v${version}/proxmux-${platform}.tar.gz"
    local tmp_dir

    info "Downloading proxmux v${version} for ${platform}..."

    # Create temporary directory
    tmp_dir=$(mktemp -d)
    trap "rm -rf '$tmp_dir'" EXIT

    # Download the tarball
    if ! curl -fsSL "$download_url" -o "${tmp_dir}/proxmux.tar.gz"; then
        error "Failed to download from: $download_url"
    fi

    # Extract the binary
    info "Extracting..."
    tar -xzf "${tmp_dir}/proxmux.tar.gz" -C "$tmp_dir"

    # Find the binary (it might have platform suffix)
    local binary_file
    binary_file=$(find "$tmp_dir" -type f -name "proxmux*" ! -name "*.tar.gz" | head -1)

    if [ -z "$binary_file" ]; then
        error "Binary not found in archive"
    fi

    # Create install directory if it doesn't exist
    if [ ! -d "$install_dir" ]; then
        info "Creating directory: $install_dir"
        mkdir -p "$install_dir"
    fi

    # Install the binary
    info "Installing to ${install_dir}/${BINARY_NAME}..."

    if [ -w "$install_dir" ]; then
        mv "$binary_file" "${install_dir}/${BINARY_NAME}"
        chmod +x "${install_dir}/${BINARY_NAME}"
    else
        warn "Elevated permissions required to install to $install_dir"
        sudo mv "$binary_file" "${install_dir}/${BINARY_NAME}"
        sudo chmod +x "${install_dir}/${BINARY_NAME}"
    fi

    success "proxmux v${version} installed successfully!"
}

# Check if install directory is in PATH
check_path() {
    local install_dir="$1"

    if [[ ":$PATH:" != *":$install_dir:"* ]]; then
        warn "$install_dir is not in your PATH"
        echo ""
        echo "Add it to your shell profile:"
        echo ""
        echo "  For bash (~/.bashrc):"
        echo "    export PATH=\"\$PATH:$install_dir\""
        echo ""
        echo "  For zsh (~/.zshrc):"
        echo "    export PATH=\"\$PATH:$install_dir\""
        echo ""
    fi
}

# Main installation flow
main() {
    echo ""
    echo "  ╔═══════════════════════════════════════╗"
    echo "  ║        proxmux installer              ║"
    echo "  ║   Terminal UI for Proxmox VE         ║"
    echo "  ╚═══════════════════════════════════════╝"
    echo ""

    # Detect platform
    local os arch version
    os=$(detect_os)
    arch=$(detect_arch)

    info "Detected platform: ${os}-${arch}"

    # Get latest version
    version=$(get_latest_version)
    info "Latest version: v${version}"

    # Determine install directory
    local install_dir
    if [ -w "/usr/local/bin" ]; then
        install_dir="/usr/local/bin"
    elif [ -d "$HOME/.local/bin" ] || mkdir -p "$HOME/.local/bin" 2>/dev/null; then
        install_dir="$HOME/.local/bin"
    else
        install_dir="/usr/local/bin"
    fi

    # Check for existing installation
    if command -v proxmux &> /dev/null; then
        local existing_path
        existing_path=$(command -v proxmux)
        warn "proxmux already installed at: $existing_path"
        read -p "Do you want to overwrite? [y/N] " -n 1 -r
        echo
        if [[ ! $REPLY =~ ^[Yy]$ ]]; then
            info "Installation cancelled"
            exit 0
        fi
        install_dir=$(dirname "$existing_path")
    fi

    # Install
    install_binary "$os" "$arch" "$version" "$install_dir"

    # Check PATH
    check_path "$install_dir"

    echo ""
    success "Installation complete!"
    echo ""
    echo "  Get started:"
    echo "    proxmux --config    # Configure Proxmox connection"
    echo "    proxmux             # Launch the TUI"
    echo ""
    echo "  Documentation: https://github.com/${REPO}"
    echo ""
}

main "$@"
