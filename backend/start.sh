#!/bin/zsh
set -a && source ../.env && set +a
lsof -ti:8080 | xargs kill -9 2>/dev/null
sleep 1
./gradlew bootRun
