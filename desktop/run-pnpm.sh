#!/bin/bash

# Change to the script's directory
cd "$(dirname "$0")"

# Install dependencies if node_modules doesn't exist
if [ ! -d "node_modules" ]; then
  echo "Installing dependencies..."
  pnpm install
fi

# Run the app
echo "Starting Convert2Doc Desktop App..."
pnpm start