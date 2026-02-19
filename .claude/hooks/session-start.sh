#!/bin/bash
set -euo pipefail

if [ "${CLAUDE_CODE_REMOTE:-}" != "true" ]; then
  exit 0
fi

# Install root dependencies (includes server deps and dev tools like eslint, ava)
yarn install --ignore-engines

# Install client dependencies (best-effort; node-sass may fail on newer Node versions)
cd client && yarn install --ignore-engines || true && cd ..
