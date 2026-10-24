#!/usr/bin/env bash
# ==============================================================================
# SAINT // COLD STEEL HOSTING - UBUNTU VM PROVISIONING SCRIPT
# ==============================================================================
# Run this inside your new VM 101 (SAINTHOSTING) terminal:
# curl -fsSL https://raw.githubusercontent.com/... or copy-paste these commands
# ==============================================================================

set -euo pipefail

echo -e "\e[31m[SAINT]\e[0m Updating system repositories..."
sudo apt update && sudo apt upgrade -y

echo -e "\e[31m[SAINT]\e[0m Installing essential utilities & QEMU Guest Agent..."
sudo apt install -y qemu-guest-agent curl wget git ca-certificates gnupg lsb-release

# Enable QEMU Guest Agent so Proxmox shows VM IP, RAM and metrics in GUI
sudo systemctl enable --now qemu-guest-agent

echo -e "\e[31m[SAINT]\e[0m Installing Docker Engine & Docker Compose Plugin..."
if ! command -v docker &> /dev/null; then
    curl -fsSL https://get.docker.com -o get-docker.sh
    sudo sh get-docker.sh
    sudo usermod -aG docker "$USER"
    rm get-docker.sh
fi

echo -e "\e[32m[SUCCESS]\e[0m VM 101 is now fully configured for Saint Hosting!"
echo -e "You can now run:"
echo -e "  \e[33mdocker compose up -d\e[0m"
