#!/usr/bin/env bash
set -euo pipefail
cp -n .env.example .env || true
echo "Copied .env.example -> .env. Fill in ANTHROPIC_API_KEY and OAuth secrets."
