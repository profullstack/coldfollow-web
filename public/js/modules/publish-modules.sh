#!/bin/bash

# publish-modules.sh
# Script to manage and publish @profullstack/* modules
# Features:
# - Version bumping (patch, minor, major)
# - Local linking for testing
# - Publishing to npm and JSR
# - Building modules before publishing
# - Dependency management

# Don't exit on error
# set -e  # Commented out to prevent script from exiting on error

# Debug function
debug() {
  if [[ "$DEBUG" == true ]]; then
    echo -e "${YELLOW}DEBUG: $1${RESET}"
  fi
}

# Error trap
trap 'debug "Command failed with exit code $? at line $LINENO"' ERR

debug "Script started"

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
MAGENTA="\033[35m"
CYAN="\033[36m"
RESET="\033[0m"

# Default values
ACTION=""
VERSION_BUMP="patch"
MODULES_DIR="./"
MODULES=()
SELECTED_MODULES=()
ALL_MODULES=false
DRY_RUN=false
SKIP_BUILD=false
SKIP_TEST=false
SKIP_CONFIRM=false
SKIP_GIT=false
GIT_FORCE=false
DEBUG=false
CREATE_TESTS=false
REGISTRY="https://registry.npmjs.org/"
SCOPE="@profullstack"
PACKAGE_MANAGER="pnpm"  # Default to pnpm for testing all modules

# Find all @profullstack modules
find_modules() {
  local search_dir="$1"
  echo -e "${BLUE}Searching for ${SCOPE} modules in ${search_dir}...${RESET}"
  
  # Find all package.json files and check if they belong to the @profullstack scope
  while IFS= read -r pkg_file; do
    local dir=$(dirname "$pkg_file")
    local name=$(grep -o '"name": *"@profullstack/[^"]*"' "$pkg_file" | cut -d'"' -f4)
    
    if [[ -n "$name" ]]; then
      local module_name="${name#@profullstack/}"
      MODULES+=("$module_name:$dir")
      echo -e "  ${GREEN}Found module: ${BOLD}$name${RESET} in ${dir}"
    fi
  done < <(find "$search_dir" -name "package.json" -not -path "*/node_modules/*" -not -path "*/dist/*")
  
  if [[ ${#MODULES[@]} -eq 0 ]]; then
    echo -e "${RED}No ${SCOPE} modules found in ${search_dir}${RESET}"
    exit 1
  fi
  
  echo -e "${GREEN}Found ${#MODULES[@]} modules${RESET}"
}

# Display help message
show_help() {
  echo -e "${BOLD}${CYAN}@profullstack Modules Publisher${RESET}"
  echo -e "A script to manage and publish @profullstack/* modules\n"
  echo -e "${BOLD}Usage:${RESET}"
  echo -e "  ./publish-modules.sh [options] <action>\n"
  echo -e "${BOLD}Actions:${RESET}"
  echo -e "  ${BOLD}publish${RESET}    Publish modules to npm registry and JSR"
  echo -e "  ${BOLD}version${RESET}    Bump version of modules"
  echo -e "  ${BOLD}link${RESET}       Create symlinks for local development"
  echo -e "  ${BOLD}unlink${RESET}     Remove symlinks created by link action"
  echo -e "  ${BOLD}build${RESET}      Build modules"
  echo -e "  ${BOLD}test${RESET}       Run tests for modules"
  echo -e "  ${BOLD}list${RESET}       List available modules"
  echo -e "  ${BOLD}create-tests${RESET} Create basic test files for modules\n"
  echo -e "${BOLD}Options:${RESET}"
  echo -e "  ${BOLD}-h, --help${RESET}                 Show this help message"
  echo -e "  ${BOLD}-a, --all${RESET}                  Apply action to all modules"
  echo -e "  ${BOLD}-m, --module <name>${RESET}        Apply action to specific module"
  echo -e "  ${BOLD}-b, --bump <level>${RESET}         Version bump level (patch, minor, major) [default: patch]"
  echo -e "  ${BOLD}-d, --dir <path>${RESET}           Directory containing modules [default: ./]"
  echo -e "  ${BOLD}-r, --registry <url>${RESET}       NPM registry URL [default: https://registry.npmjs.org/]"
  echo -e "  ${BOLD}-p, --package-manager <name>${RESET} Package manager to use (npm, pnpm, yarn) [default: pnpm]"
  echo -e "  ${BOLD}--dry-run${RESET}                  Show what would be done without making changes"
  echo -e "  ${BOLD}--skip-build${RESET}               Skip build step before publishing"
  echo -e "  ${BOLD}--skip-test${RESET}                Skip test step before publishing"
  echo -e "  ${BOLD}--skip-confirm${RESET}             Skip confirmation prompts"
  echo -e "  ${BOLD}--skip-git${RESET}                 Skip git operations (add, commit, push)"
  echo -e "  ${BOLD}--git-force${RESET}                Use --force flag when pushing to git (for version command)"
  echo -e "  ${BOLD}--debug${RESET}                    Enable debug output"
  echo -e "  ${BOLD}--create-tests${RESET}             Create basic test files for modules that don't have them"
  echo -e "  ${BOLD}--scope <scope>${RESET}            Module scope [default: @profullstack]\n"
  echo -e "${BOLD}Examples:${RESET}"
  echo -e "  ./publish-modules.sh --all publish        # Publish all modules"
  echo -e "  ./publish-modules.sh --all version        # Bump patch version of all modules (default)"
  echo -e "  ./publish-modules.sh --all -b minor version  # Bump minor version of all modules"
  echo -e "  ./publish-modules.sh --all -b major version  # Bump major version of all modules"
  echo -e "  ./publish-modules.sh -m document-converters -b minor version  # Bump minor version of document-converters"
  echo -e "  ./publish-modules.sh -m api-key-manager version  # Bump patch version of api-key-manager"
  echo -e "  ./publish-modules.sh --all --skip-git version  # Bump version without git operations"
  echo -e "  ./publish-modules.sh --all --git-force version  # Bump version with force push to git"
  echo -e "  ./publish-modules.sh --all link           # Link all modules for local development"
  echo -e "  ./publish-modules.sh --all --dry-run publish  # Show what would be published without publishing"
  echo -e "  ./publish-modules.sh --all create-tests   # Create basic test files for all modules"
}

# Parse command line arguments
parse_args() {
  while [[ $# -gt 0 ]]; do
    case "$1" in
      -h|--help)
        show_help
        exit 0
        ;;
      -a|--all)
        ALL_MODULES=true
        shift
        ;;
      -m|--module)
        if [[ -n "$2" ]]; then
          SELECTED_MODULES+=("$2")
          shift 2
        else
          echo -e "${RED}Error: Module name is required for -m/--module option${RESET}"
          exit 1
        fi
        ;;
      -b|--bump)
        if [[ -n "$2" && "$2" =~ ^(patch|minor|major)$ ]]; then
          VERSION_BUMP="$2"
          shift 2
        else
          echo -e "${RED}Error: Invalid version bump level. Use patch, minor, or major${RESET}"
          exit 1
        fi
        ;;
      -d|--dir)
        if [[ -n "$2" ]]; then
          MODULES_DIR="$2"
          shift 2
        else
          echo -e "${RED}Error: Directory path is required for -d/--dir option${RESET}"
          exit 1
        fi
        ;;
      -r|--registry)
        if [[ -n "$2" ]]; then
          REGISTRY="$2"
          shift 2
        else
          echo -e "${RED}Error: Registry URL is required for -r/--registry option${RESET}"
          exit 1
        fi
        ;;
      -p|--package-manager)
        if [[ -n "$2" && "$2" =~ ^(npm|pnpm|yarn)$ ]]; then
          PACKAGE_MANAGER="$2"
          shift 2
        else
          echo -e "${RED}Error: Invalid package manager. Use npm, pnpm, or yarn${RESET}"
          exit 1
        fi
        ;;
      --dry-run)
        DRY_RUN=true
        shift
        ;;
      --skip-build)
        SKIP_BUILD=true
        shift
        ;;
      --skip-test)
        SKIP_TEST=true
        shift
        ;;
      --skip-confirm)
        SKIP_CONFIRM=true
        shift
        ;;
      --skip-git)
        SKIP_GIT=true
        shift
        ;;
      --git-force)
        GIT_FORCE=true
        shift
        ;;
      --debug)
        DEBUG=true
        shift
        ;;
      --create-tests)
        CREATE_TESTS=true
        shift
        ;;
      --scope)
        if [[ -n "$2" ]]; then
          SCOPE="$2"
          shift 2
        else
          echo -e "${RED}Error: Scope is required for --scope option${RESET}"
          exit 1
        fi
        ;;
      publish|version|link|unlink|build|test|list|create-tests)
        ACTION="$1"
        shift
        ;;
      *)
        echo -e "${RED}Error: Unknown option or action: $1${RESET}"
        show_help
        exit 1
        ;;
    esac
  done
  
  # Validate required arguments
  if [[ -z "$ACTION" ]]; then
    echo -e "${RED}Error: Action is required${RESET}"
    show_help
    exit 1
  fi
  
  if [[ "$ALL_MODULES" == false && ${#SELECTED_MODULES[@]} -eq 0 ]]; then
    echo -e "${RED}Error: Either --all or --module option is required${RESET}"
    show_help
    exit 1
  fi
}

# Filter modules based on selection
filter_modules() {
  if [[ "$ALL_MODULES" == true ]]; then
    return
  fi
  
  local filtered_modules=()
  
  for module_info in "${MODULES[@]}"; do
    local module_name="${module_info%%:*}"
    
    for selected in "${SELECTED_MODULES[@]}"; do
      if [[ "$module_name" == "$selected" ]]; then
        filtered_modules+=("$module_info")
        break
      fi
    done
  done
  
  if [[ ${#filtered_modules[@]} -eq 0 ]]; then
    echo -e "${RED}Error: No matching modules found${RESET}"
    exit 1
  fi
  
  MODULES=("${filtered_modules[@]}")
}

# Confirm action with user
confirm_action() {
  if [[ "$SKIP_CONFIRM" == true ]]; then
    return 0
  fi
  
  local action_desc="$1"
  local modules_count="${#MODULES[@]}"
  
  echo -e "${YELLOW}You are about to $action_desc ${BOLD}$modules_count${RESET}${YELLOW} modules:${RESET}"
  
  for module_info in "${MODULES[@]}"; do
    local module_name="${module_info%%:*}"
    local module_dir="${module_info#*:}"
    echo -e "  ${CYAN}${SCOPE}/${module_name}${RESET} (${module_dir})"
  done
  
  echo -e "${YELLOW}Do you want to continue? [y/N]${RESET}"
  read -r response
  
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Action canceled${RESET}"
    exit 0
  fi
}

# Build a module
build_module() {
  local module_name="$1"
  local module_dir="$2"
  local return_code=0
  
  echo -e "${BLUE}Building ${BOLD}${SCOPE}/${module_name}${RESET}..."
  
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}[DRY RUN] Would build ${SCOPE}/${module_name}${RESET}"
    return 0
  fi
  
  # Save current directory
  local current_dir=$(pwd)
  
  # Change to module directory
  cd "$module_dir" || return 1
  
  if [[ -f "package.json" ]]; then
    if grep -q '"build"' package.json; then
      $PACKAGE_MANAGER run build
      local build_result=$?
      if [[ $build_result -ne 0 ]]; then
        echo -e "${RED}Build failed for ${SCOPE}/${module_name}${RESET}"
        echo -e "${RED}Exiting due to build failure${RESET}"
        exit 1  # Exit immediately if build fails
      fi
    else
      echo -e "${YELLOW}No build script found in package.json, creating dist directory...${RESET}"
      mkdir -p dist
      
      # Special case for therapist module which uses lib instead of src
      if [[ "$module_name" == "therapy" ]]; then
        echo -e "${YELLOW}Special case for therapy module: copying lib directory to dist...${RESET}"
        if ! cp -r lib/* dist/ 2>/dev/null; then
          echo -e "${YELLOW}No lib directory found, copying index.js to dist...${RESET}"
          if ! cp index.js dist/; then
            echo -e "${RED}Failed to copy files to dist for ${SCOPE}/${module_name}${RESET}"
            echo -e "${RED}Exiting due to build failure${RESET}"
            exit 1  # Exit immediately if copy fails
          fi
        fi
      else
        # Normal case: copy src to dist
        if ! cp -r src/* dist/ 2>/dev/null; then
          echo -e "${RED}Failed to copy src to dist for ${SCOPE}/${module_name}${RESET}"
          echo -e "${RED}Exiting due to build failure${RESET}"
          exit 1  # Exit immediately if copy fails
        fi
      fi
    fi
  else
    echo -e "${RED}Error: package.json not found in $module_dir${RESET}"
    echo -e "${RED}Exiting due to missing package.json${RESET}"
    exit 1  # Exit immediately if package.json is missing
  fi
  
  # Return to original directory
  cd "$current_dir" || return 1
  
  return $return_code
}

# Test a module
test_module() {
  local module_name="$1"
  local module_dir="$2"
  local return_code=0
  
  echo -e "${BLUE}Testing ${BOLD}${SCOPE}/${module_name}${RESET}..."
  
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}[DRY RUN] Would test ${SCOPE}/${module_name}${RESET}"
    return 0
  fi
  
  # Save current directory
  local current_dir=$(pwd)
  
  # Change to module directory
  cd "$module_dir" || return 1
  
  if [[ -f "package.json" ]]; then
    # Check if test directory and files exist
    if [[ -d "test" && $(find "test" -name "*.js" | wc -l) -gt 0 ]]; then
      if grep -q '"test"' package.json; then
        echo -e "${CYAN}Running tests for ${SCOPE}/${module_name}...${RESET}"
        $PACKAGE_MANAGER test
        local test_result=$?
        
        if [[ $test_result -ne 0 ]]; then
          echo -e "${RED}Tests failed for ${SCOPE}/${module_name}${RESET}"
          echo -e "${RED}Exiting due to test failure${RESET}"
          # Return to original directory before exiting
          cd "$current_dir" || true
          return 1
        else
          echo -e "${GREEN}Tests passed for ${SCOPE}/${module_name}${RESET}"
        fi
      else
        echo -e "${YELLOW}No test script found in package.json, but test directory exists.${RESET}"
        echo -e "${YELLOW}Consider adding a test script to package.json.${RESET}"
      fi
    else
      echo -e "${YELLOW}No test directory or test files found, skipping tests${RESET}"
    fi
  else
    echo -e "${RED}Error: package.json not found in $module_dir${RESET}"
    return_code=1
  fi
  
  # Return to original directory
  cd "$current_dir" || return 1
  
  return $return_code
}

# Bump version of a module
bump_version() {
  local module_name="$1"
  local module_dir="$2"
  local bump_level="$3"
  local return_code=0
  
  echo -e "${BLUE}Bumping ${bump_level} version of ${BOLD}${SCOPE}/${module_name}${RESET}..."
  
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}[DRY RUN] Would bump ${bump_level} version of ${SCOPE}/${module_name}${RESET}"
    return 0
  fi
  
  # Save current directory
  local current_dir=$(pwd)
  
  # Change to module directory
  cd "$module_dir" || return 1
  
  if [[ -f "package.json" ]]; then
    # Get current version
    local current_version=$(grep -o '"version": *"[^"]*"' package.json | cut -d'"' -f4)
    
    # Calculate new version
    local new_version=""
    
    if [[ -n "$current_version" ]]; then
      echo -e "${YELLOW}Current version: ${BOLD}v${current_version}${RESET}"
      IFS='.' read -r major minor patch <<< "$current_version"
      
      case "$bump_level" in
        patch)
          new_version="${major}.${minor}.$((patch + 1))"
          ;;
        minor)
          new_version="${major}.$((minor + 1)).0"
          ;;
        major)
          new_version="$((major + 1)).0.0"
          ;;
      esac
      
      # Update version in package.json
      if [[ "$PACKAGE_MANAGER" == "npm" ]]; then
        npm version "$bump_level" --no-git-tag-version
      elif [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
        pnpm version --no-git-tag-version "$bump_level"
      elif [[ "$PACKAGE_MANAGER" == "yarn" ]]; then
        yarn version --new-version "$new_version" --no-git-tag-version
      fi
      
      echo -e "${GREEN}Bumped version from ${BOLD}v${current_version}${RESET}${GREEN} to ${BOLD}v${new_version}${RESET}"
      
      # Update version in jsr.json if it exists
      if [[ -f "jsr.json" ]]; then
        echo -e "${BLUE}Updating version in jsr.json...${RESET}"
        # Use sed to update the version in jsr.json
        if [[ "$OSTYPE" == "darwin"* ]]; then
          # macOS requires an empty string for -i
          sed -i '' "s/\"version\": *\"$current_version\"/\"version\": \"$new_version\"/" jsr.json
        else
          # Linux doesn't require an empty string for -i
          sed -i "s/\"version\": *\"$current_version\"/\"version\": \"$new_version\"/" jsr.json
        fi
        echo -e "${GREEN}Updated version in jsr.json to ${BOLD}v${new_version}${RESET}"
      fi
      
      # Install dependencies
      echo -e "${BLUE}Installing dependencies...${RESET}"
      $PACKAGE_MANAGER install
      
      # Git operations if not skipped
      if [[ "$SKIP_GIT" == false ]]; then
        # Check if this is a git repository
        if [[ -d ".git" || $(git rev-parse --is-inside-work-tree 2>/dev/null) == "true" ]]; then
          echo -e "${BLUE}Committing changes to git...${RESET}"
          
          # Add all changes
          git add .
          
          # Commit with release message
          git commit -m "release: ${SCOPE}/${module_name}@${new_version}"
          
          # Push to origin master
          echo -e "${BLUE}Pushing changes to origin master...${RESET}"
          if [[ "$GIT_FORCE" == true ]]; then
            echo -e "${YELLOW}Using --force flag for git push${RESET}"
            git push -u origin master --force
          else
            git push -u origin master
          fi
          
          if [[ $? -eq 0 ]]; then
            echo -e "${GREEN}Successfully pushed changes to git${RESET}"
          else
            echo -e "${YELLOW}Warning: Failed to push changes to git. You may need to push manually.${RESET}"
          fi
        else
          echo -e "${YELLOW}Not a git repository, skipping git operations${RESET}"
        fi
      else
        echo -e "${YELLOW}Git operations skipped due to --skip-git flag${RESET}"
      fi
    else
      echo -e "${RED}Error: Could not find version in package.json${RESET}"
      return_code=1
    fi
  else
    echo -e "${RED}Error: package.json not found in $module_dir${RESET}"
    return_code=1
  fi
  
  # Return to original directory
  cd "$current_dir" || return 1
  
  return $return_code
}

# Link a module for local development
link_module() {
  local module_name="$1"
  local module_dir="$2"
  local return_code=0
  
  echo -e "${BLUE}Linking ${BOLD}${SCOPE}/${module_name}${RESET} for local development..."
  
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}[DRY RUN] Would link ${SCOPE}/${module_name}${RESET}"
    return 0
  fi
  
  # Save current directory
  local current_dir=$(pwd)
  
  # Change to module directory
  cd "$module_dir" || return 1
  
  if [[ -f "package.json" ]]; then
    if [[ "$PACKAGE_MANAGER" == "npm" ]]; then
      npm link
    elif [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
      pnpm link --global
    elif [[ "$PACKAGE_MANAGER" == "yarn" ]]; then
      yarn link
    fi
    
    echo -e "${GREEN}Linked ${SCOPE}/${module_name}${RESET}"
  else
    echo -e "${RED}Error: package.json not found in $module_dir${RESET}"
    return_code=1
  fi
  
  # Return to original directory
  cd "$current_dir" || return 1
  
  return $return_code
}

# Unlink a module
unlink_module() {
  local module_name="$1"
  local module_dir="$2"
  local return_code=0
  
  echo -e "${BLUE}Unlinking ${BOLD}${SCOPE}/${module_name}${RESET}..."
  
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}[DRY RUN] Would unlink ${SCOPE}/${module_name}${RESET}"
    return 0
  fi
  
  # Save current directory
  local current_dir=$(pwd)
  
  # Change to module directory
  cd "$module_dir" || return 1
  
  if [[ -f "package.json" ]]; then
    if [[ "$PACKAGE_MANAGER" == "npm" ]]; then
      npm unlink
    elif [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
      pnpm unlink --global
    elif [[ "$PACKAGE_MANAGER" == "yarn" ]]; then
      yarn unlink
    fi
    
    echo -e "${GREEN}Unlinked ${SCOPE}/${module_name}${RESET}"
  else
    echo -e "${RED}Error: package.json not found in $module_dir${RESET}"
    return_code=1
  fi
  
  # Return to original directory
  cd "$current_dir" || return 1
  
  return $return_code
}

# Publish a module to npm and JSR
publish_module() {
  local module_name="$1"
  local module_dir="$2"
  local return_code=0
  
  echo -e "${BLUE}Publishing ${BOLD}${SCOPE}/${module_name}${RESET} to npm registry and JSR..."
  
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}[DRY RUN] Would publish ${SCOPE}/${module_name}${RESET}"
    return 0
  fi
  
  # Build module if not skipped
  if [[ "$SKIP_BUILD" == false ]]; then
    build_module "$module_name" "$module_dir"
    # Note: build_module now exits the script if it fails
  fi
  
  # Test module if not skipped
  if [[ "$SKIP_TEST" == false ]]; then
    # Run tests and exit immediately if they fail
    if ! test_module "$module_name" "$module_dir"; then
      echo -e "${RED}Tests failed for ${SCOPE}/${module_name}, aborting publish process${RESET}"
      echo -e "${RED}Fix the failing tests before publishing${RESET}"
      exit 1  # Exit immediately if tests fail
    else
      echo -e "${GREEN}Tests passed for ${SCOPE}/${module_name}${RESET}"
    fi
  fi
  
  # Save current directory
  local current_dir=$(pwd)
  
  # Change to module directory
  cd "$module_dir" || return 1
  
  if [[ -f "package.json" ]]; then
    # Get current version
    local version=$(grep -o '"version": *"[^"]*"' package.json | cut -d'"' -f4)
    
    # Publish to npm
    echo -e "${CYAN}Publishing ${SCOPE}/${module_name}@${version} to ${REGISTRY}...${RESET}"
    
    if [[ "$PACKAGE_MANAGER" == "npm" ]]; then
      npm publish --registry "$REGISTRY" --access public
    elif [[ "$PACKAGE_MANAGER" == "pnpm" ]]; then
      pnpm publish --registry "$REGISTRY" --access public --no-git-checks
    elif [[ "$PACKAGE_MANAGER" == "yarn" ]]; then
      yarn publish --registry "$REGISTRY" --access public
    fi
    
    local npm_result=$?
    
    if [[ $npm_result -eq 0 ]]; then
      echo -e "${GREEN}Successfully published ${SCOPE}/${module_name}@${version} to npm${RESET}"
    else
      echo -e "${RED}Failed to publish ${SCOPE}/${module_name}@${version} to npm${RESET}"
      return_code=1
    fi
    
    # Publish to JSR
    if [[ -f "jsr.json" ]]; then
      echo -e "${CYAN}Publishing ${SCOPE}/${module_name}@${version} to JSR...${RESET}"
      pnpx jsr publish
      
      local jsr_result=$?
      
      if [[ $jsr_result -eq 0 ]]; then
        echo -e "${GREEN}Successfully published ${SCOPE}/${module_name}@${version} to JSR${RESET}"
      else
        echo -e "${RED}Failed to publish ${SCOPE}/${module_name}@${version} to JSR${RESET}"
        return_code=1
      fi
    else
      echo -e "${YELLOW}Warning: jsr.json not found in $module_dir, skipping JSR publish${RESET}"
    fi
  else
    echo -e "${RED}Error: package.json not found in $module_dir${RESET}"
    return_code=1
  fi
  
  # Return to original directory
  cd "$current_dir" || return 1
  
  return $return_code
}

# Process modules based on action
process_modules() {
  local action="$1"
  local success_count=0
  local fail_count=0
  local total_modules=${#MODULES[@]}
  
  echo -e "${BLUE}Processing ${BOLD}${total_modules}${RESET}${BLUE} modules...${RESET}"
  debug "MODULES array contains ${#MODULES[@]} elements"
  
  # Print all modules for debugging
  for i in "${!MODULES[@]}"; do
    debug "MODULES[$i] = ${MODULES[$i]}"
  done
  
  # Process each module
  for module_info in "${MODULES[@]}"; do
    local module_name="${module_info%%:*}"
    local module_dir="${module_info#*:}"
    local module_num=$((success_count + fail_count + 1))
    
    echo -e "${CYAN}[${module_num}/${total_modules}] Processing ${BOLD}${SCOPE}/${module_name}${RESET}"
    
    # Debug info
    debug "Processing module_name=${module_name}, module_dir=${module_dir}"
    
    local result=0
    case "$action" in
      publish)
        publish_module "$module_name" "$module_dir"
        result=$?
        debug "publish_module returned ${result}"
        ;;
      version)
        # Build module first to ensure all files are in dist
        if [[ "$SKIP_BUILD" == false ]]; then
          echo -e "${BLUE}Building module before versioning...${RESET}"
          build_module "$module_name" "$module_dir"
          # Note: build_module now exits the script if it fails
        fi
        
        bump_version "$module_name" "$module_dir" "$VERSION_BUMP"
        result=$?
        debug "bump_version returned ${result}"
        if [[ $result -ne 0 ]]; then
          echo -e "${RED}Version bump failed for ${SCOPE}/${module_name}${RESET}"
          echo -e "${RED}Exiting due to version bump failure${RESET}"
          exit 1  # Exit immediately if version bump fails
        fi
        ;;
      link)
        link_module "$module_name" "$module_dir"
        result=$?
        debug "link_module returned ${result}"
        ;;
      unlink)
        unlink_module "$module_name" "$module_dir"
        result=$?
        debug "unlink_module returned ${result}"
        ;;
      build)
        build_module "$module_name" "$module_dir"
        result=$?
        debug "build_module returned ${result}"
        ;;
      test)
        test_module "$module_name" "$module_dir"
        result=$?
        debug "test_module returned ${result}"
        if [[ $result -ne 0 ]]; then
          echo -e "${RED}Tests failed for ${SCOPE}/${module_name}, stopping test execution${RESET}"
          return 1
        fi
        ;;
    esac
    
    if [[ $result -eq 0 ]]; then
      ((success_count++))
      echo -e "${GREEN}Module processed successfully${RESET}"
    else
      ((fail_count++))
      echo -e "${RED}Module processing failed${RESET}"
    fi
    
    echo ""
    
    # Debug info
    debug "success_count=${success_count}, fail_count=${fail_count}"
  done
  
  echo -e "${GREEN}${success_count}/${total_modules} modules processed successfully${RESET}"
  
  if [[ $fail_count -gt 0 ]]; then
    echo -e "${RED}${fail_count}/${total_modules} modules failed${RESET}"
    return 1
  fi
  
  return 0
}

# List available modules
list_modules() {
  echo -e "${CYAN}Available ${SCOPE} modules:${RESET}"
  
  for module_info in "${MODULES[@]}"; do
    local module_name="${module_info%%:*}"
    local module_dir="${module_info#*:}"
    
    # Get version from package.json
    local version=""
    if [[ -f "${module_dir}/package.json" ]]; then
      version=$(grep -o '"version": *"[^"]*"' "${module_dir}/package.json" | cut -d'"' -f4)
    fi
    
    if [[ -n "$version" ]]; then
      echo -e "  ${BOLD}${module_name}${RESET} (${version}) - ${module_dir}"
    else
      echo -e "  ${BOLD}${module_name}${RESET} - ${module_dir}"
    fi
  done
}

# Main function
main() {
  debug "Starting main function"
  
  # Parse command line arguments
  parse_args "$@"
  debug "Arguments parsed, ACTION=${ACTION}, ALL_MODULES=${ALL_MODULES}"
  
  # Find modules
  find_modules "$MODULES_DIR"
  debug "Found ${#MODULES[@]} modules"
  
  # Filter modules based on selection
  filter_modules
  debug "After filtering, ${#MODULES[@]} modules remain"
  
  # Handle list action separately
  if [[ "$ACTION" == "list" ]]; then
    debug "Listing modules and exiting"
    list_modules
    exit 0
  fi
  
  # Confirm action with user
  case "$ACTION" in
    publish)
      confirm_action "publish"
      ;;
    version)
      if [[ "$GIT_FORCE" == true ]]; then
        confirm_action "bump ${VERSION_BUMP} version of (with --force git push)"
      else
        confirm_action "bump ${VERSION_BUMP} version of"
      fi
      ;;
    link)
      confirm_action "link"
      ;;
    unlink)
      confirm_action "unlink"
      ;;
    build)
      confirm_action "build"
      ;;
    test)
      confirm_action "test"
      ;;
  esac
  
  debug "About to process modules with action=${ACTION}"
  
  # Process modules
  process_modules "$ACTION"
  local result=$?
  
  debug "process_modules returned ${result}"
  debug "Exiting main function"
  
  return $result
}

# Run main function
main "$@"