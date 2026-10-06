#!/usr/bin/env bash
# NazMovies — one-command start (reinstalls deps when needed, then runs the server)
cd "$(dirname "$0")"
if [ ! -d node_modules/express ]; then
  echo "⏳ Installing dependencies..."
  npm install --no-audit --no-fund
fi
echo "🚀 Starting NazMovies on http://localhost:3000"
exec node server.js
