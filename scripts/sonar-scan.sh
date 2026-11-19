#!/bin/sh
# Local SonarQube analysis of the frontend (web + mobile).
#
# Requires the local SonarQube started from Backend-Pikka (`make sonar-up`, http://127.0.0.1:9000) and a
# token (SonarQube > My Account > Security) in SONAR_TOKEN.
#
# Usage (repository root): SONAR_TOKEN=xxx sh scripts/sonar-scan.sh
set -eu

: "${SONAR_TOKEN:?Set SONAR_TOKEN (SonarQube > My Account > Security)}"
host="${SONAR_HOST_URL:-http://host.docker.internal:9000}"

(cd apps/web && npm run test:coverage)
(cd apps/mobile && npm run test:coverage)
node scripts/sonar-coverage.mjs

# Git for Windows sh needs the Windows form of the path for Docker (pwd -W); Linux/macOS use pwd.
src="$(pwd -W 2>/dev/null || pwd)"
# SCM is disabled: the local scan does not need blame data and it also works from git worktrees.
docker run --rm \
  -e SONAR_TOKEN -e "SONAR_HOST_URL=$host" \
  -v "$src:/usr/src" \
  sonarsource/sonar-scanner-cli:11 -Dsonar.scm.disabled=true
