#!/usr/bin/env bash
set -euo pipefail

xvfb-run -a node --test tests/live-reload.test.mjs
