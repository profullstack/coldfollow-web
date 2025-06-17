#!/bin/bash

# Script to convert directories to git submodules
set -e  # Exit on error

# Directories to convert
DIRS=(
  "api-key-manager"
  "auth-system"
  "document-converters"
  "invoicer"
  "localizer"
  "payment-gateway"
  "spa-router"
  "state-manager"
  "storage-service"
  "therapist"
  "transcoder"
  "websocket-client"
)

# Process each directory
for dir in "${DIRS[@]}"; do
  echo "Processing $dir..."
  
  # Skip if directory doesn't exist
  if [ ! -d "$dir" ]; then
    echo "Directory $dir doesn't exist, skipping."
    continue
  fi
  
  # Check if the GitHub repository exists
  REPO_URL="git@github.com:profullstack/$dir.git"
  if ! git ls-remote "$REPO_URL" &>/dev/null; then
    echo "Repository $REPO_URL doesn't exist, skipping."
    continue
  fi
  
  echo "Repository $REPO_URL exists."
  
  # Save the current state of the directory
  echo "Creating backup of $dir..."
  cp -r "$dir" "${dir}_backup"
  
  # Remove the directory from git tracking
  echo "Removing $dir from git tracking..."
  git rm -r --cached "$dir" || true
  
  # Remove the .git directory from the backup
  echo "Removing .git directory from backup..."
  rm -rf "${dir}_backup/.git"
  
  # Physically remove the directory
  echo "Physically removing $dir..."
  rm -rf "$dir"
  
  # Add as submodule
  echo "Adding $dir as submodule from $REPO_URL..."
  git submodule add "$REPO_URL" "$dir"
  
  # Copy the content from backup to the submodule
  echo "Copying content from backup to submodule..."
  cp -r "${dir}_backup/"* "$dir/" 2>/dev/null || true
  
  # Remove the backup
  echo "Removing backup..."
  rm -rf "${dir}_backup"
  
  echo "Converted $dir to a submodule."
  echo "-----------------------------------"
done

echo "All directories converted to submodules."
echo "You may need to commit the changes with: git commit -m 'Convert directories to submodules'"