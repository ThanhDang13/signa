#!/usr/bin/env bash

set -e

echo "Cleaning monorepo..."
echo ""

echo "Removing dist directories..."
find . -type d -name "dist" -not -path "*/node_modules/*" -exec rm -rf {} + 2>/dev/null || true
echo "  done"

echo "Removing node_modules..."
find . -type d -name "node_modules" -exec rm -rf {} + 2>/dev/null || true
echo "  done"

echo "Cleaning Nx cache..."
rm -rf .nx/cache 2>/dev/null || true
echo "  done"

echo ""
echo "Clean complete!"
echo ""
echo "To reinstall dependencies, run:"
echo "  pnpm install"