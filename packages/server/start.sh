#!/bin/bash
set -e

echo "Running database migrations..."
node dist/db/migrate.js

echo "Starting server..."
node dist/index.js
