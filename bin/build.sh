#!/bin/bash

# Exit on error
set -e

# Script to build the project and copy modules
echo "Starting build process..."

# Create modules directory if it doesn't exist
echo "Setting up modules directory..."
mkdir -p ./public/js/modules

# Copy modules from parent directory
echo "Copying modules from ../modules to ./public/js/modules..."
if [ -d "../modules" ]; then
  cp -r ../modules/* ./public/js/modules/
  echo "Modules copied successfully."
else
  echo "Warning: ../modules directory not found. No modules were copied."
  exit 1
fi

echo "Build process completed successfully!"