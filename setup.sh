#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

mkdir -p "$ROOT/frontend/public"
mkdir -p "$ROOT/frontend/src/components/"{cards,layout,providers,wallet}
mkdir -p "$ROOT/frontend/src/"{data,pages,styles,types,utils}
mkdir -p "$ROOT/smart-contracts/"{solana,aptos,algorand}

echo "Directories ensured."