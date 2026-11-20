#!/usr/bin/env bash
cd "$(dirname "$0")"
[ -d node_modules/phaser ] || npm install
(sleep 1; xdg-open http://localhost:8080 2>/dev/null || open http://localhost:8080 2>/dev/null) &
node server.js 8080
