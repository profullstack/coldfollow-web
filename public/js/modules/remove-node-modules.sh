#!/bin/bash

# Script to remove node_modules from git history for all modules

# Make the script executable
chmod +x remove-node-modules.sh

# Function to remove node_modules from git history for a module
remove_node_modules() {
  local module_dir="$1"
  echo "Processing $module_dir..."
  
  # Check if the directory exists and is a git repository
  if [ -d "$module_dir" ] && [ -d "$module_dir/.git" ]; then
    cd "$module_dir"
    
    # Remove node_modules from git history
    git filter-branch --force --index-filter \
      "git rm -r --cached --ignore-unmatch node_modules" \
      --prune-empty --tag-name-filter cat -- --all
    
    # Clean up
    git for-each-ref --format="delete %(refname)" refs/original | git update-ref --stdin
    git reflog expire --expire=now --all
    git gc --prune=now
    
    cd ..
    echo "Completed processing $module_dir"
  else
    echo "Skipping $module_dir (not a git repository)"
  fi
}

# Process each module
for module_dir in */; do
  # Skip non-directories
  if [ ! -d "$module_dir" ]; then
    continue
  fi
  
  # Skip the .git directory
  if [ "$module_dir" = ".git/" ]; then
    continue
  fi
  
  remove_node_modules "$module_dir"
done

echo "All modules processed. node_modules removed from git history."