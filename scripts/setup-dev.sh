#!/usr/bin/env bash
set -euo pipefail

echo "=== Tempot Dev Environment Setup ==="
echo ""

# 1. Check Node.js 22.12+
echo "Checking Node.js..."
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Please install Node.js 22.12+."
  exit 1
fi
NODE_OK=$(node -e "const [major, minor] = process.versions.node.split('.').map(Number); console.log(major > 22 || (major === 22 && minor >= 12) ? 'yes' : 'no')")
if [ "$NODE_OK" != "yes" ]; then
  echo "ERROR: Node.js 22.12+ is required (found $(node --version))."
  exit 1
fi
echo "  Node.js $(node --version) OK"

# 2. Check pnpm
echo "Checking pnpm..."
if ! command -v pnpm &>/dev/null; then
  echo "ERROR: pnpm is not installed. Install it with: npm install -g pnpm"
  exit 1
fi
echo "  pnpm $(pnpm --version) OK"

# 3. Install dependencies
echo "Installing dependencies..."
pnpm install

# 4. Check Docker (optional)
echo "Checking Docker..."
if command -v docker &>/dev/null; then
  echo "  Docker $(docker --version | awk '{print $3}' | tr -d ',') OK"
else
  echo "  WARNING: Docker is not installed. Some features (DB, tests) may not work."
fi

# 5. Copy .env.example to .env if needed
if [ ! -f .env ]; then
  if [ -f .env.example ]; then
    cp .env.example .env
    echo "Created .env from .env.example — review and update values."
  else
    echo "WARNING: No .env.example found. Create .env manually."
  fi
else
  echo ".env already exists, skipping copy."
fi

# 6. Build all packages
echo "Building all packages..."
pnpm build

echo ""
echo "=== Setup complete! ==="
