#!/usr/bin/env bash
set -euo pipefail

xvfb-run -a npx playwright test --config playwright.real.config.ts --pass-with-no-tests "$@"
TEST_FIXTURES=1 xvfb-run -a npx playwright test --config playwright.fixture.config.ts --pass-with-no-tests "$@"
