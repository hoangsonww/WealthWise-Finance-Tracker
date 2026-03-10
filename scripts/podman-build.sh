#!/usr/bin/env bash
set -euo pipefail

# Build production container images for WealthWise using Podman
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/.." && pwd)"

GIT_SHA=$(git -C "${REPO_ROOT}" rev-parse --short HEAD 2>/dev/null || echo "latest")

echo "Building WealthWise production images with Podman (${GIT_SHA})..."

echo ""
echo "==> Building API image..."
podman build \
    -f "${REPO_ROOT}/apps/api/Containerfile.prod" \
    -t "wealthwise-api:${GIT_SHA}" \
    -t "wealthwise-api:latest" \
    "${REPO_ROOT}"

echo ""
echo "==> Building Web image..."
podman build \
    -f "${REPO_ROOT}/apps/web/Containerfile.prod" \
    -t "wealthwise-web:${GIT_SHA}" \
    -t "wealthwise-web:latest" \
    "${REPO_ROOT}"

echo ""
echo "==> Building MCP image..."
podman build \
    -f "${REPO_ROOT}/mcp/Containerfile.prod" \
    -t "wealthwise-mcp:${GIT_SHA}" \
    -t "wealthwise-mcp:latest" \
    "${REPO_ROOT}/mcp"

echo ""
echo "==> Building Agentic AI image..."
podman build \
    -f "${REPO_ROOT}/agentic-ai/Containerfile.prod" \
    -t "wealthwise-agentic-ai:${GIT_SHA}" \
    -t "wealthwise-agentic-ai:latest" \
    "${REPO_ROOT}"

echo ""
echo "Build complete:"
echo "  wealthwise-api:${GIT_SHA}"
echo "  wealthwise-web:${GIT_SHA}"
echo "  wealthwise-mcp:${GIT_SHA}"
echo "  wealthwise-agentic-ai:${GIT_SHA}"
