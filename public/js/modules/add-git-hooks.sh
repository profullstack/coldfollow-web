vi #!/bin/bash

# add-git-hooks.sh
# Script to add pre-commit git hooks to all modules
# This script adds native git hooks that run tests before committing

# Text formatting
BOLD="\033[1m"
RED="\033[31m"
GREEN="\033[32m"
YELLOW="\033[33m"
BLUE="\033[34m"
CYAN="\033[36m"
RESET="\033[0m"

# Default values
MODULES_DIR="./"
MODULES=()
SELECTED_MODULES=()
ALL_MODULES=false
DRY_RUN=false
SKIP_CONFIRM=false
PACKAGE_MANAGER="npm"
SCOPE="@profullstack"

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
      -d|--dir)
        if [[ -n "$2" ]]; then
          MODULES_DIR="$2"
          shift 2
        else
          echo -e "${RED}Error: Directory path is required for -d/--dir option${RESET}"
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
      --skip-confirm)
        SKIP_CONFIRM=true
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
      *)
        echo -e "${RED}Error: Unknown option: $1${RESET}"
        show_help
        exit 1
        ;;
    esac
  done
}

# Display help message
show_help() {
  echo -e "${BOLD}${CYAN}@profullstack Git Hooks Installer${RESET}"
  echo -e "A script to add pre-commit git hooks to @profullstack/* modules\n"
  echo -e "${BOLD}Usage:${RESET}"
  echo -e "  ./add-git-hooks.sh [options]\n"
  echo -e "${BOLD}Options:${RESET}"
  echo -e "  ${BOLD}-h, --help${RESET}                 Show this help message"
  echo -e "  ${BOLD}-a, --all${RESET}                  Apply to all modules"
  echo -e "  ${BOLD}-m, --module <name>${RESET}        Apply to specific module"
  echo -e "  ${BOLD}-d, --dir <path>${RESET}           Directory containing modules [default: ./]"
  echo -e "  ${BOLD}-p, --package-manager <name>${RESET} Package manager to use (npm, pnpm, yarn) [default: npm]"
  echo -e "  ${BOLD}--dry-run${RESET}                  Show what would be done without making changes"
  echo -e "  ${BOLD}--skip-confirm${RESET}             Skip confirmation prompts"
  echo -e "  ${BOLD}--scope <scope>${RESET}            Module scope [default: @profullstack]\n"
  echo -e "${BOLD}Examples:${RESET}"
  echo -e "  ./add-git-hooks.sh --all                  # Add git hooks to all modules"
  echo -e "  ./add-git-hooks.sh -m spa-router          # Add git hooks to spa-router module"
  echo -e "  ./add-git-hooks.sh --all --dry-run        # Show what would be done without making changes"
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
  
  local modules_count="${#MODULES[@]}"
  
  echo -e "${YELLOW}You are about to add pre-commit git hooks to ${BOLD}$modules_count${RESET}${YELLOW} modules:${RESET}"
  
  for module_info in "${MODULES[@]}"; do
    local module_name="${module_info%%:*}"
    local module_dir="${module_info#*:}"
    echo -e "  ${CYAN}${SCOPE}/${module_name}${RESET} (${module_dir})"
  done
  
  echo -e "${YELLOW}This will:${RESET}"
  echo -e "  ${YELLOW}1. Initialize git repository if needed${RESET}"
  echo -e "  ${YELLOW}2. Create a pre-commit hook that runs tests before committing${RESET}"
  
  echo -e "${YELLOW}Do you want to continue? [y/N]${RESET}"
  read -r response
  
  if [[ ! "$response" =~ ^[Yy]$ ]]; then
    echo -e "${RED}Action canceled${RESET}"
    exit 0
  fi
}

# Add git hooks to a module
add_git_hooks() {
  local module_name="$1"
  local module_dir="$2"
  local return_code=0
  
  echo -e "${BLUE}Adding git hooks to ${BOLD}${SCOPE}/${module_name}${RESET}..."
  
  if [[ "$DRY_RUN" == true ]]; then
    echo -e "${YELLOW}[DRY RUN] Would add git hooks to ${SCOPE}/${module_name}${RESET}"
    return 0
  fi
  
  # Save current directory
  local current_dir=$(pwd)
  
  # Change to module directory
  cd "$module_dir" || return 1
  
  if [[ -f "package.json" ]]; then
    # Check if .git directory exists
    if [[ ! -d ".git" ]]; then
      echo -e "${YELLOW}No .git directory found in $module_dir, initializing git repository...${RESET}"
      git init
    fi
    
    # Create pre-commit hook directly in .git/hooks
    echo -e "${BLUE}Creating pre-commit hook...${RESET}"
    
    # Create hooks directory if it doesn't exist
    mkdir -p .git/hooks
    
    # Create pre-commit hook file
    echo -e "${BLUE}Writing pre-commit hook file...${RESET}"
    echo '#!/bin/sh
# Pre-commit hook to run tests before committing

echo "Running tests before commit..."

# Get the package manager from package.json
if grep -q "\"pnpm\"" package.json; then
  PACKAGE_MANAGER="pnpm"
elif grep -q "\"yarn\"" package.json; then
  PACKAGE_MANAGER="yarn"
else
  PACKAGE_MANAGER="npm"
fi

# Run tests
if [ "$PACKAGE_MANAGER" = "pnpm" ]; then
  pnpm test
elif [ "$PACKAGE_MANAGER" = "yarn" ]; then
  yarn test
else
  npm test
fi

# If tests fail, prevent the commit
if [ $? -ne 0 ]; then
  echo "Tests failed. Commit aborted."
  exit 1
fi

echo "Tests passed. Proceeding with commit."
exit 0
' > .git/hooks/pre-commit
    
    # Make pre-commit hook executable
    chmod +x .git/hooks/pre-commit
    
    echo -e "${GREEN}Successfully added git hooks to ${SCOPE}/${module_name}${RESET}"
  else
    echo -e "${RED}Error: package.json not found in $module_dir${RESET}"
    return_code=1
  fi
  
  # Return to original directory
  cd "$current_dir" || return 1
  
  return $return_code
}

# Process modules
process_modules() {
  local success_count=0
  local fail_count=0
  local total_modules=${#MODULES[@]}
  
  echo -e "${BLUE}Processing ${BOLD}${total_modules}${RESET}${BLUE} modules...${RESET}"
  
  # Process each module
  for module_info in "${MODULES[@]}"; do
    local module_name="${module_info%%:*}"
    local module_dir="${module_info#*:}"
    local module_num=$((success_count + fail_count + 1))
    
    echo -e "${CYAN}[${module_num}/${total_modules}] Processing ${BOLD}${SCOPE}/${module_name}${RESET}"
    
    add_git_hooks "$module_name" "$module_dir"
    local result=$?
    
    if [[ $result -eq 0 ]]; then
      ((success_count++))
      echo -e "${GREEN}Module processed successfully${RESET}"
    else
      ((fail_count++))
      echo -e "${RED}Module processing failed${RESET}"
    fi
    
    echo ""
  done
  
  echo -e "${GREEN}${success_count}/${total_modules} modules processed successfully${RESET}"
  
  if [[ $fail_count -gt 0 ]]; then
    echo -e "${RED}${fail_count}/${total_modules} modules failed${RESET}"
    return 1
  fi
  
  return 0
}

# Main function
main() {
  # Parse command line arguments
  parse_args "$@"
  
  # Find modules
  find_modules "$MODULES_DIR"
  
  # Filter modules based on selection
  filter_modules
  
  # Confirm action with user
  confirm_action
  
  # Process modules
  process_modules
  
  return $?
}

# Run main function
main "$@"