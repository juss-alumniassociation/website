#!/usr/bin/env bash
set -euo pipefail

xvfb-run -a npx playwright test "$@"
