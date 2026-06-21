#!/bin/sh
# Install typst binary on Debian/glibc. Not always in apt – use GitHub release.
set -eu

TYPST_VERSION="${TYPST_VERSION:-0.13.1}"
arch="$(uname -m)"
case "$arch" in
  x86_64) typst_arch=x86_64 ;;
  aarch64 | arm64) typst_arch=aarch64 ;;
  *)
    echo "install-typst-debian: unsupported architecture: ${arch}" >&2
    exit 1
    ;;
esac

url="https://github.com/typst/typst/releases/download/v${TYPST_VERSION}/typst-${typst_arch}-unknown-linux-gnu.tar.xz"
tmp="$(mktemp -d)"
trap 'rm -rf "$tmp"' EXIT

wget -qO "${tmp}/typst.tar.xz" "$url"
tar -xJf "${tmp}/typst.tar.xz" -C "$tmp"
install -m 755 "${tmp}/typst-${typst_arch}-unknown-linux-gnu/typst" /usr/local/bin/typst
