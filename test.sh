#!/usr/bin/env bash
set -e

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

echo "==> Backend tests"
(cd "$ROOT/backend" && ./gradlew test)

echo "==> Frontend tests"
(cd "$ROOT/frontend" && npm test -- --run)
