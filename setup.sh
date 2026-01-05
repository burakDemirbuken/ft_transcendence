#!/usr/bin/env bash

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

# Color codes
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
MAGENTA='\033[0;35m'
WHITE='\033[1;37m'
GRAY='\033[0;37m'
BOLD='\033[1m'
NC='\033[0m' # No Color

# Banner
print_banner() {
  clear
  echo -e "${CYAN}${BOLD}"
  echo "╔════════════════════════════════════════════════════════════════╗"
  echo "║                                                                ║"
  echo "║         ft_transcendence Environment Setup Script             ║"
  echo "║                                                                ║"
  echo "║    Supported Platforms: macOS • Linux • Windows (WSL2)        ║"
  echo "║                                                                ║"
  echo "║     This script will automatically install all required       ║"
  echo "║     components and configure your development environment.    ║"
  echo "║                                                                ║"
  echo "╚════════════════════════════════════════════════════════════════╝"
  echo -e "${NC}"
  echo
}

###############################################################################
# Helper Functions
###############################################################################

step() {
  echo -e "${BLUE}${BOLD}▶${NC} ${BOLD}$1${NC}"
}

success() {
  echo -e "${GREEN}${BOLD}✓${NC} ${GREEN}$1${NC}"
}

error() {
  echo -e "${RED}${BOLD}✗${NC} ${RED}$1${NC}"
}

info() {
  echo -e "${CYAN}ℹ${NC} ${CYAN}$1${NC}"
}

warning() {
  echo -e "${YELLOW}${BOLD}⚠${NC} ${YELLOW}$1${NC}"
}

section() {
  echo
  echo -e "${MAGENTA}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo -e "${MAGENTA}${BOLD}  $1${NC}"
  echo -e "${MAGENTA}${BOLD}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
  echo
}

print_banner

###############################################################################
# 1. Operating System Detection
###############################################################################

OS_NAME="$(uname -s)"

case "$OS_NAME" in
  Darwin)
    PLATFORM="macOS"
    ;;
  Linux)
    PLATFORM="Linux"
    ;;
  MINGW*|MSYS*|CYGWIN*)
    PLATFORM="Windows"
    ;;
  *)
    error "Unsupported operating system: ${OS_NAME}"
    exit 1
    ;;
esac

success "Platform detected: ${PLATFORM}"
echo

###############################################################################
# 2. Host IP Address Detection
###############################################################################

get_host_ip() {
  local ip=""

  case "$PLATFORM" in
    macOS)
      ip=$(ifconfig | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}')
      ;;
    Linux)
      if command -v hostname >/dev/null 2>&1; then
        ip=$(hostname -I | awk '{print $1}')
      elif command -v ip >/dev/null 2>&1; then
        ip=$(ip addr show | grep "inet " | grep -v 127.0.0.1 | head -1 | awk '{print $2}' | cut -d'/' -f1)
      fi
      ;;
    Windows)
      if command -v ipconfig.exe >/dev/null 2>&1; then
        ip=$(ipconfig.exe | grep "IPv4 Address" | head -1 | awk '{print $NF}')
      fi
      ;;
  esac

  if [[ -z "$ip" ]]; then
    ip="localhost"
  fi

  echo "$ip"
}
###############################################################################
# 3. .env File Check & Load (Secure)
###############################################################################

create_env_file() {
  section "Environment Configuration Check"

  local env_file="${PROJECT_ROOT}/.env"
  if [[ ! -f "$env_file" ]]; then
    error "CRITIC ERROR: .env file could'nt found!"
    echo
    echo -e "${YELLOW}The project MUST have a .env file in the main directory to work.${NC}"
    echo
    echo -e "Please create a file named ${BOLD}.env${NC} in the project directory and enter your information in the following format:"
    echo
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo -e "${WHITE}# JWT Settings${NC}"
    echo -e "JWT_SECRET=your_super_secret_key"
    echo
    echo -e "${WHITE}# Email Settings${NC}"
    echo -e "EMAIL_SERVICE=gmail,yahoo,yandex etc."
    echo -e "EMAIL_USER=yourmailaddress@(gmail,yahoo,yandex etc.).com"
    echo -e "EMAIL_PASS=your application password"
    echo -e "EMAIL_FROM=yourmailaddress@(gmail,yahoo,yandex etc.).com"
    echo
    echo -e "${WHITE}# Host Settings${NC}"
    echo -e "HOST_IP=localhost/Or Your Host IP"
    echo -e "NGINX_PORT=3030"
    echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
    echo
    exit 1
  fi
  success "The .env file exists, and the configuration is being read..."

  HOST_IP=$(grep "^HOST_IP=" "$env_file" | cut -d'=' -f2 | cut -d'#' -f1 | tr -d '[:space:]')
  NGINX_PORT=$(grep "^NGINX_PORT=" "$env_file" | cut -d'=' -f2 | cut -d'#' -f1 | tr -d '[:space:]')
  
  local email_check=$(grep "^EMAIL_USER=" "$env_file" | cut -d'=' -f2 | tr -d '[:space:]')
  
  if [[ -z "$email_check" ]]; then
    warning "The EMAIL USER field appears empty in the .env file."
  else
    success "Email settings detected."
  fi

  HOST_IP=${HOST_IP:-localhost}
  NGINX_PORT=${NGINX_PORT:-3030}

  info "Aktif Host: ${BOLD}${HOST_IP}${NC}"
  info "Aktif Port: ${BOLD}${NGINX_PORT}${NC}"
}

###############################################################################
# 4. Windows Setup
###############################################################################

setup_windows() {
  section "Windows Environment Setup"

  if command -v wsl.exe >/dev/null 2>&1; then
    info "WSL 2 detected"
    setup_wsl2
    return
  fi

  if [[ "$OSTYPE" == "msys" || "$OSTYPE" == "cygwin" ]]; then
    info "Git Bash / MSYS2 detected"
    setup_git_bash
    return
  fi

  if command -v docker.exe >/dev/null 2>&1; then
    info "Docker Desktop (Windows native) detected"
    setup_docker_desktop_windows
    return
  fi

  error "No supported Windows environment detected!"
  echo
  section "Windows Setup Options"
  echo
  echo -e "${CYAN}${BOLD}OPTION 1: WSL 2 + Ubuntu (RECOMMENDED)${NC}"
  echo "  Steps:"
  echo "    1. Open PowerShell as Administrator"
  echo "    2. Run: ${BOLD}wsl --install -d Ubuntu${NC}"
  echo "    3. Restart your computer"
  echo "    4. Run this script in Ubuntu"
  echo
  echo -e "${CYAN}${BOLD}OPTION 2: Git Bash${NC}"
  echo "  Steps:"
  echo "    1. Download Git for Windows: https://git-scm.com/download/win"
  echo "    2. Complete the installation"
  echo "    3. Open Git Bash"
  echo "    4. Run this script"
  echo
  echo -e "${CYAN}${BOLD}OPTION 3: Docker Desktop for Windows${NC}"
  echo "  Steps:"
  echo "    1. Download Docker Desktop: https://www.docker.com/products/docker-desktop"
  echo "    2. Complete the installation"
  echo "    3. Run this script in PowerShell or CMD"
  echo
  exit 1
}

###############################################################################
# 4.1 WSL2 Setup
###############################################################################

setup_wsl2() {
  step "Configuring WSL 2 environment..."

  if grep -qi microsoft /proc/version 2>/dev/null || grep -qi wsl /proc/version 2>/dev/null; then
    success "Running in WSL 2 Ubuntu environment"
    setup_linux
    return
  fi

  error "WSL 2 detected but Ubuntu distribution is not running!"
  echo
  echo "Please follow these steps:"
  echo "  1. Open PowerShell as Administrator"
  echo "  2. Run: ${BOLD}wsl --install -d Ubuntu${NC}"
  echo "  3. Restart your computer"
  echo "  4. Run this script in Ubuntu"
  exit 1
}

###############################################################################
# 4.2 Git Bash Setup
###############################################################################

setup_git_bash() {
  step "Configuring Git Bash environment..."

  if ! command -v make >/dev/null 2>&1; then
    warning "make not found"
    echo
    echo "To install make in Git Bash:"
    echo "  1. Download MSYS2: https://www.msys2.org/"
    echo "  2. Complete the installation"
    echo "  3. Open MSYS2 terminal"
    echo "  4. Run: ${BOLD}pacman -S make${NC}"
    echo "  5. Run this script again"
    exit 1
  fi
  success "make found"

  if ! command -v git >/dev/null 2>&1; then
    error "git not found! Please install Git for Windows."
    exit 1
  fi
  success "git found"

  if ! command -v docker.exe >/dev/null 2>&1; then
    step "Installing Docker Desktop..."
    echo
    section "Manual Action Required"
    echo
    echo "Download and install Docker Desktop:"
    echo "  1. Visit: https://www.docker.com/products/docker-desktop"
    echo "  2. Click 'Download for Windows'"
    echo "  3. Complete the installation"
    echo "  4. Restart your computer"
    echo "  5. Open Docker Desktop application"
    echo "  6. Accept the license agreement"
    echo "  7. Run this script again when Docker is fully started"
    echo
    exit 0
  fi
  success "Docker Desktop found"

  if ! docker.exe info >/dev/null 2>&1; then
    error "Docker daemon is not running!"
    echo
    echo "Please open Docker Desktop application and ensure it's fully started."
    echo "Then run this script again."
    exit 1
  fi
  success "Docker daemon is running"

  if ! docker.exe compose version >/dev/null 2>&1; then
    error "Docker Compose not found!"
    echo
    echo "Please update Docker Desktop:"
    echo "  1. Open Docker application"
    echo "  2. Settings → General → Check for updates"
    echo "  3. Install updates and restart"
    exit 1
  fi
  success "Docker Compose found"
}

###############################################################################
# 4.3 Docker Desktop for Windows (Native)
###############################################################################

setup_docker_desktop_windows() {
  step "Configuring Docker Desktop (Windows) environment..."

  if ! docker.exe info >/dev/null 2>&1; then
    error "Docker daemon is not running!"
    echo
    echo "Please open Docker Desktop application and ensure it's fully started."
    echo "Then run this script again."
    exit 1
  fi
  success "Docker daemon is running"

  if ! docker.exe compose version >/dev/null 2>&1; then
    error "Docker Compose not found!"
    echo
    echo "Please update Docker Desktop:"
    echo "  1. Open Docker application"
    echo "  2. Settings → General → Check for updates"
    echo "  3. Install updates and restart"
    exit 1
  fi
  success "Docker Compose found"

  if ! command -v make >/dev/null 2>&1; then
    warning "make not found"
    echo
    echo "To install make:"
    echo "  1. Download Chocolatey: https://chocolatey.org/install"
    echo "  2. Open PowerShell as Administrator"
    echo "  3. Run: ${BOLD}choco install make${NC}"
    echo "  4. Run this script again"
    echo
    echo "OR"
    echo
    echo "  1. Install Git for Windows: https://git-scm.com/download/win"
    echo "  2. Open Git Bash"
    echo "  3. Run this script"
    exit 1
  fi
  success "make found"
}

###############################################################################
# 5. macOS Setup
###############################################################################

setup_macos() {
  section "macOS Environment Setup"

  if ! command -v brew >/dev/null 2>&1; then
    step "Installing Homebrew (this may take a moment)..."
    /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

    if [[ -d "/opt/homebrew/bin" ]]; then
      eval "$(/opt/homebrew/bin/brew shellenv)"
    elif [[ -d "/usr/local/bin" ]]; then
      export PATH="/usr/local/bin:$PATH"
    fi
    success "Homebrew installed"
  else
    success "Homebrew found"
    step "Updating Homebrew..."
    brew update || true
  fi

  step "Checking and installing required tools..."

  for tool in make git; do
    if ! brew list "$tool" >/dev/null 2>&1; then
      info "Installing $tool..."
      brew install "$tool"
      success "$tool installed"
    else
      success "$tool already installed"
    fi
  done

  step "Checking Docker..."

  if ! command -v docker >/dev/null 2>&1; then
    step "Installing Docker Desktop (via Homebrew)..."
    brew install --cask docker

    echo
    section "Manual Action Required"
    echo
    echo "Docker Desktop has been installed. Please:"
    echo "  1. Search for 'Docker' in Spotlight"
    echo "  2. Open the Docker application"
    echo "  3. Accept the license agreement"
    echo "  4. Enter your password (to start Docker daemon)"
    echo "  5. Run this script again when Docker is fully started"
    echo
    exit 0
  else
    success "Docker CLI found"
  fi

  if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running!"
    echo
    echo "Please open Docker Desktop and ensure it's fully started."
    echo "Then run this script again."
    exit 1
  fi
  success "Docker daemon is running"

  if ! docker compose version >/dev/null 2>&1; then
    error "Docker Compose not found!"
    echo
    echo "Please update Docker Desktop:"
    echo "  1. Open Docker application"
    echo "  2. Settings → Check for Updates"
    echo "  3. Install updates and restart"
    exit 1
  fi
  success "Docker Compose found"
}

###############################################################################
# 6. Linux Setup
###############################################################################

setup_linux() {
  section "Linux Environment Setup"

  PM=""
  DISTRO=""

  if command -v apt-get >/dev/null 2>&1; then
    PM="apt"
    DISTRO="Debian/Ubuntu"
  elif command -v dnf >/dev/null 2>&1; then
    PM="dnf"
    DISTRO="Fedora/RHEL"
  elif command -v pacman >/dev/null 2>&1; then
    PM="pacman"
    DISTRO="Arch Linux"
  elif command -v apk >/dev/null 2>&1; then
    PM="apk"
    DISTRO="Alpine"
  elif command -v yum >/dev/null 2>&1; then
    PM="yum"
    DISTRO="CentOS/RHEL (legacy)"
  fi

  if [[ -z "${PM}" ]]; then
    warning "Could not automatically detect package manager"
    echo
    echo -e "${CYAN}Please select your distribution:${NC}"
    echo "  1. Ubuntu/Debian"
    echo "  2. Fedora/RHEL"
    echo "  3. Arch Linux"
    echo "  4. Alpine"
    echo "  5. Other (manual installation)"
    echo
    read -p "$(echo -e ${CYAN})Enter your choice (1-5): $(echo -e ${NC})" distro_choice

    case "$distro_choice" in
      1)
        PM="apt"
        DISTRO="Debian/Ubuntu"
        ;;
      2)
        PM="dnf"
        DISTRO="Fedora/RHEL"
        ;;
      3)
        PM="pacman"
        DISTRO="Arch Linux"
        ;;
      4)
        PM="apk"
        DISTRO="Alpine"
        ;;
      *)
        error "Please install the following manually:"
        echo "  • make"
        echo "  • git"
        echo "  • docker"
        echo "  • docker-compose"
        echo
        echo "After installation, run 'make' in the project directory."
        exit 1
        ;;
    esac
  fi

  success "Package manager detected: ${PM} (${DISTRO})"

  step "Installing required packages (sudo password may be required)..."

  case "$PM" in
    apt)
      info "Updating apt-get..."
      sudo apt-get update
      info "Installing packages..."
      sudo apt-get install -y make git ca-certificates curl gnupg lsb-release
      sudo apt-get install -y docker.io docker-compose-plugin || true
      ;;
    dnf)
      info "Installing packages via dnf..."
      sudo dnf install -y make git docker docker-compose-plugin || true
      ;;
    pacman)
      info "Installing packages via pacman..."
      sudo pacman -Sy --noconfirm make git docker docker-compose || true
      ;;
    apk)
      info "Installing packages via apk..."
      sudo apk add --no-cache make git docker docker-compose || true
      ;;
    yum)
      info "Installing packages via yum..."
      sudo yum install -y make git docker docker-compose || true
      ;;
  esac

  success "Packages installed"

  step "Starting Docker service..."

  if command -v systemctl >/dev/null 2>&1; then
    sudo systemctl enable docker >/dev/null 2>&1 || true
    sudo systemctl start docker >/dev/null 2>&1 || true
    success "Docker service enabled"
  elif command -v service >/dev/null 2>&1; then
    sudo service docker start >/dev/null 2>&1 || true
    success "Docker service started"
  else
    warning "Could not automatically start Docker service"
    info "Please start Docker daemon manually"
  fi

  step "Configuring user permissions..."

  if getent group docker >/dev/null 2>&1; then
    sudo usermod -aG docker "$USER" || true
    success "User added to docker group"
    echo
    warning "Note: You may need to log out and log back in for new permissions to take effect."
    info "Command: ${BOLD}exit${NC} (then log back in)"
    echo
  fi

  step "Verifying Docker installation..."

  if ! command -v docker >/dev/null 2>&1; then
    error "Docker command not found!"
    echo
    echo "Please install Docker manually:"
    echo "  https://docs.docker.com/engine/install/"
    exit 1
  fi
  success "Docker found"

  if ! docker info >/dev/null 2>&1; then
    error "Docker daemon is not running!"
    echo
    echo "Please run:"
    echo "  ${BOLD}sudo systemctl start docker${NC}"
    echo
    echo "Then run this script again."
    exit 1
  fi
  success "Docker daemon is running"

  if ! docker compose version >/dev/null 2>&1 && ! command -v docker-compose >/dev/null 2>&1; then
    error "Docker Compose not found!"
    echo
    echo "Please install docker-compose-plugin and try again."
    exit 1
  fi
  success "Docker Compose found"
}

###############################################################################
# 7. Platform-specific Setup
###############################################################################

if [[ "${PLATFORM}" == "macOS" ]]; then
  setup_macos
elif [[ "${PLATFORM}" == "Linux" ]]; then
  setup_linux
elif [[ "${PLATFORM}" == "Windows" ]]; then
  setup_windows
fi

###############################################################################
# 8. Create .env File
###############################################################################

create_env_file

###############################################################################
# 9. Start Project
###############################################################################

section "Starting Project"

step "Changing to project directory: ${PROJECT_ROOT}"
cd "${PROJECT_ROOT}"

step "Launching project (running make command)..."
echo
if make re; then
  success "Project started successfully!"
else
  error "An error occurred while starting the project!"
  exit 1
fi

###############################################################################
# 10. Success Message
###############################################################################

HOST_IP=$(grep "^HOST_IP=" "${PROJECT_ROOT}/.env" | cut -d'=' -f2 | cut -d'#' -f1 | tr -d '[:space:]')
NGINX_PORT=$(grep "^NGINX_PORT=" "${PROJECT_ROOT}/.env" | cut -d'=' -f2 | cut -d'#' -f1 | tr -d '[:space:]')

HOST_IP=${HOST_IP:-localhost}
NGINX_PORT=${NGINX_PORT:-3030}

echo
echo -e "${GREEN}${BOLD}"
echo "╔════════════════════════════════════════════════════════════════╗"
echo "║                                                                ║"
echo "║              ✓ SETUP COMPLETED SUCCESSFULLY                   ║"
echo "║                                                                ║"
echo "╚════════════════════════════════════════════════════════════════╝"
echo -e "${NC}"
echo
echo -e "${GREEN}✓ All components have been installed and started!${NC}"
echo

section "Project Access Information"
echo
echo -e "${CYAN}${BOLD}🌐 Project URL:${NC}"
echo -e "   ${BOLD}https://${HOST_IP}:${NGINX_PORT}${NC}"
echo

section "Common Commands"
echo
echo -e "${CYAN}${BOLD}📋 View logs:${NC}"
echo -e "   ${BOLD}docker compose logs -f${NC}"
echo
echo -e "${CYAN}${BOLD}🛑 Stop the project:${NC}"
echo -e "   ${BOLD}docker compose down${NC}"
echo
echo -e "${CYAN}${BOLD}🔄 Restart the project:${NC}"
echo -e "   ${BOLD}docker compose restart${NC}"
echo
echo -e "${CYAN}${BOLD}🗑️  Clean start (remove all data):${NC}"
echo -e "   ${BOLD}docker compose down -v${NC}"
echo

section "Quick Access Link"
echo
echo -e "${BOLD}${CYAN}https://${HOST_IP}:${NGINX_PORT}${NC}"
echo

echo -e "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo "${GRAY}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo
