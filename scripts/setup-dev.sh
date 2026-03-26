#!/usr/bin/env bash
set -euo pipefail

echo "=== Tempot Dev Environment Setup ==="
echo ""

# 1. Check Node.js 20+
echo "Checking Node.js..."
if ! command -v node &>/dev/null; then
  echo "ERROR: Node.js is not installed. Please install Node.js 20+."
  exit 1
fi
NODE_MAJOR=$(node -e "console.log(process.version.split('.')[0].slice(1))")
if [ "$NODE_MAJOR" -lt 20 ]; then
  echo "ERROR: Node.js 20+ is required (found v$NODE_MAJOR)."
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
