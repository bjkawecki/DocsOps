#!/bin/sh
# Install typst binary on Alpine (musl). Not in all Alpine repos — use GitHub release.
# Expects: tar, xz, and wget or curl (worker/dev Dockerfiles install these before calling).
set -eu

TYPST_VERSION="${TYPST_VERSION:-0.13.1}"
arch="$(uname -m)"
case "$arch" in
  x86_64) typst_arch=x86_64 ;;
  aarch64 | arm64) typst_arch=aarch64 ;;
  *)
    echo "install-typst-alpine: unsupported architecture: ${arch}" >&2
    exit 1
    ;;
esac

if ! command -v tar >/dev/null 2>&1; then
  echo "install-typst-alpine: tar is required" >&2
  exit 1
fi

if ! command -v xz >/dev/null 2>&1; then
  apk add --no-cache xz
fi

url="https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${typst_arch}-unknown-linux-musl.tar.xz"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

if command -v wget >/dev/null 2>&1; then
  wget -qO "${tmp}/typst.tar.xz" "$url"
elif command -v curl >/dev/null 2>&1; then
  curl -fsSL "$url" -o "${tmp}/typst.tar.xz"
else
  apk add --no-cache wget
  wget -qO "${tmp}/typst.tar.xz" "$url"
fi

tar -xJf "${tmp}/typst.tar.xz" -C "$tmp"
install -m 755 "${tmp}/typst-${typst_arch}-unknown-linux-musl/typst" /usr/local/bin/typst
typst --version
