#!/usr/bin/env zsh
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Source .env file if it exists
if [ -f .env ]; then
  echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
  source .env
fi

# Function to display usage
usage() {
  echo "Usage: $0 [command]"
  echo ""
  echo "Commands:"
  echo "  setup    - Install Supabase CLI and link to your cloud project"
  echo "  migrate  - Sync with remote DB and run migrations"
  echo "  sync     - Sync local migration history with remote database"
  echo "  status   - Check migration status and show which migrations are applied"
  echo "  new NAME - Create a new migration file"
  echo "  update   - Check for Supabase CLI updates and upgrade if available"
  echo ""
  echo "Example:"
  echo "  $0 setup"
  echo "  $0 migrate"
  echo "  $0 sync"
  echo "  $0 status"
  echo "  $0 new add_user_preferences"
  echo "  $0 update"
  exit 1
}

# Function to get the latest Supabase CLI version from GitHub
get_latest_version() {
  # Print status messages to stderr so they don't get captured in command substitution
  echo -e "${YELLOW}Checking for latest Supabase CLI version...${NC}" >&2
  
  # Use GitHub API to get the latest release
  LATEST_VERSION=$(curl -s https://api.github.com/repos/supabase/cli/releases/latest | grep '"tag_name":' | sed -E 's/.*"v([^"]+)".*/\1/')
  
  if [ -z "$LATEST_VERSION" ]; then
    echo -e "${YELLOW}Could not determine latest version, using fallback version.${NC}" >&2
    LATEST_VERSION="2.20.12"  # Fallback to known working version
  else
    echo -e "${GREEN}Latest version is: $LATEST_VERSION${NC}" >&2
  fi
  
  # Only output the version number to stdout for capture by command substitution
  echo "$LATEST_VERSION"
}

# Function to compare version strings
version_gt() {
  test "$(printf '%s\n' "$1" "$2" | sort -V | head -n 1)" != "$1"
}

# Function to install Supabase CLI
install_cli() {
  echo -e "${YELLOW}Installing Supabase CLI...${NC}"
  
  # Create local bin directory if it doesn't exist
  mkdir -p "$HOME/.local/bin"
  
  # Add to PATH if not already there
  if [[ ":$PATH:" != *":$HOME/.local/bin:"* ]]; then
    export PATH="$HOME/.local/bin:$PATH"
    echo "Added ~/.local/bin to PATH"
  fi
  
  # Check if supabase is already installed
  local INSTALLED_VERSION=""
  if command -v supabase &>/dev/null; then
    INSTALLED_VERSION=$(supabase --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
    echo -e "${GREEN}Supabase CLI already installed: v$INSTALLED_VERSION${NC}"
    
    # Check for newer version
    LATEST_VERSION=$(get_latest_version)
    
    if version_gt "$LATEST_VERSION" "$INSTALLED_VERSION"; then
      echo -e "${YELLOW}Newer version available (v$LATEST_VERSION). Upgrading from v$INSTALLED_VERSION...${NC}"
    else
      echo -e "${GREEN}You have the latest version.${NC}"
      return 0
    fi
  else
    LATEST_VERSION=$(get_latest_version)
    echo -e "${YELLOW}Installing Supabase CLI v$LATEST_VERSION...${NC}"
  fi
  
  SUPABASE_VERSION="$LATEST_VERSION"
  
  # Compile from source using ZIP file
  echo "Compiling Supabase CLI from source..."
  
  # Check if Go is installed
  if ! command -v go &>/dev/null; then
    echo "Go is required to compile Supabase CLI. Installing Go..."
    
    # Install Go (this is a simplified version, might need adjustments)
    if command -v apt-get &>/dev/null; then
      sudo apt-get update
      sudo apt-get install -y golang
    elif command -v pacman &>/dev/null; then
      sudo pacman -Sy --noconfirm go
    else
      echo -e "${RED}Cannot install Go. Please install Go manually and try again.${NC}"
      exit 1
    fi
  fi
  
  # Download source code
  SOURCE_URL="https://github.com/supabase/cli/archive/refs/tags/v$SUPABASE_VERSION.zip"
  TEMP_DIR=$(mktemp -d)
  
  echo "Downloading source code from $SOURCE_URL..."
  curl -L "$SOURCE_URL" -o "$TEMP_DIR/supabase-src.zip"
  
  # Check if download was successful
  if [ ! -s "$TEMP_DIR/supabase-src.zip" ]; then
    echo -e "${RED}Error: Failed to download Supabase CLI source code${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  
  echo "Extracting source code..."
  unzip -q "$TEMP_DIR/supabase-src.zip" -d "$TEMP_DIR"
  
  # Find the extracted directory
  SRC_DIR=$(find "$TEMP_DIR" -type d -name "cli-*" | head -n 1)
  
  if [ -z "$SRC_DIR" ]; then
    echo -e "${RED}Error: Could not find source directory after extraction${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  
  echo "Building Supabase CLI..."
  cd "$SRC_DIR"
  
  # Build the CLI with version information
  go build -ldflags "-X github.com/supabase/cli/internal/utils.Version=v$SUPABASE_VERSION" -o supabase
  
  if [ ! -f "supabase" ]; then
    echo -e "${RED}Error: Failed to build Supabase CLI${NC}"
    rm -rf "$TEMP_DIR"
    exit 1
  fi
  
  echo "Installing Supabase CLI to $HOME/.local/bin..."
  cp "supabase" "$HOME/.local/bin/supabase"
  chmod +x "$HOME/.local/bin/supabase"
  
  # Clean up
  cd - > /dev/null
  rm -rf "$TEMP_DIR"
  
  # Verify installation
  echo "Verifying installation..."
  
  if command -v supabase &>/dev/null; then
    echo -e "${GREEN}Supabase CLI installed from source: $(supabase --version 2>&1)${NC}"
  else
    echo -e "${RED}Supabase CLI installation failed${NC}"
    echo "PATH is: $PATH"
    
    # Check if binary exists in local bin
    if [ -f "$HOME/.local/bin/supabase" ]; then
      echo "Binary exists at $HOME/.local/bin/supabase"
      echo "File details: $(ls -la $HOME/.local/bin/supabase)"
      echo "File type: $(file $HOME/.local/bin/supabase)"
      
      # Try to add to PATH again
      export PATH="$HOME/.local/bin:$PATH"
      echo "Added $HOME/.local/bin to PATH again"
      
      if command -v supabase &>/dev/null; then
        echo -e "${GREEN}Supabase CLI now available: $(supabase --version 2>&1)${NC}"
      else
        echo -e "${RED}Still cannot find supabase in PATH${NC}"
      fi
    else
      echo "Binary not found at $HOME/.local/bin/supabase"
    fi
    
    # If still not found, exit with error
    if ! command -v supabase &>/dev/null; then
      echo -e "${RED}Failed to install Supabase CLI${NC}"
      exit 1
    fi
  fi
}

# Function to setup Supabase project
setup_project() {
  echo -e "${YELLOW}Setting up Supabase project...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Check if we need to source .env file again with a custom path
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    # Check for custom env file path
    ENV_FILE="${SUPABASE_ENV_FILE:-.env}"
    
    if [ "$ENV_FILE" != ".env" ] && [ -f "$ENV_FILE" ]; then
      echo -e "${YELLOW}Loading environment variables from custom $ENV_FILE file...${NC}"
      source "$ENV_FILE"
    fi
  fi
  
  # Check if required environment variables are set
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    echo -e "${RED}Error: SUPABASE_URL, SUPABASE_KEY, SUPABASE_DB_PASSWORD, and SUPABASE_ACCESS_TOKEN must be set either in .env file or as environment variables.${NC}"
    exit 1
  fi
  
  # Extract project reference from URL
  PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https?://([^.]+).*|\1|')
  echo -e "${YELLOW}Extracted project reference: $PROJECT_REF${NC}"
  
  if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}Error: Could not extract project reference from SUPABASE_URL: $SUPABASE_URL${NC}"
    echo -e "${YELLOW}SUPABASE_URL should be in the format: https://your-project-ref.supabase.co${NC}"
    echo -e "${RED}Please check your SUPABASE_URL environment variable and try again.${NC}"
    exit 1
  fi
  
  echo -e "${YELLOW}Project reference: ${PROJECT_REF}${NC}"
  
  # Initialize Supabase project if not already initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Initializing Supabase project...${NC}"
    supabase init
  else
    echo -e "${YELLOW}Supabase project already initialized.${NC}"
  fi
  
  # Link to existing Supabase project
  echo -e "${YELLOW}Linking to Supabase cloud project...${NC}"
  echo "Using database password: ${SUPABASE_DB_PASSWORD:0:3}*****"
  
  # Set environment variables for Supabase CLI
  export SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD"
  export SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"
  
  # Set up environment variables for Supabase CLI
  export PGPASSWORD="$SUPABASE_DB_PASSWORD"
  
  # Run the link command directly - no retries to avoid confusion
  echo -e "${YELLOW}Running: supabase link --project-ref \"$PROJECT_REF\" --password \"$SUPABASE_DB_PASSWORD\" --debug${NC}"
  supabase link --project-ref "$PROJECT_REF" --password "$SUPABASE_DB_PASSWORD" --debug
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Link successful!${NC}"
  else
    echo -e "${RED}Link failed.${NC}"
    echo -e "${RED}Please check your Supabase configuration and try again.${NC}"
    echo -e "${YELLOW}Make sure your SUPABASE_ACCESS_TOKEN and SUPABASE_DB_PASSWORD are correct.${NC}"
    exit 1
  fi
  
  echo -e "${GREEN}Supabase project setup complete!${NC}"
}

# Function to run migrations
run_migrations() {
  echo -e "${YELLOW}Running Supabase migrations...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Check if Supabase project is initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Supabase project not initialized. Setting up...${NC}"
    setup_project
  fi
  
  # Show migration status before running migrations
  echo -e "${YELLOW}Checking current migration status before applying changes...${NC}"
  check_migration_status
  echo ""
  
  # Make sure we have all environment variables
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    if [ -f .env ]; then
      echo -e "${YELLOW}Reloading environment variables from .env file...${NC}"
      source .env
    fi
  fi
  
  # Set environment variables for Supabase CLI
  export SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD"
  
  # Extract project reference from URL if not already done
  if [ -z "$PROJECT_REF" ]; then
    PROJECT_REF=$(echo "$SUPABASE_URL" | sed -E 's|https?://([^.]+).*|\1|')
    echo -e "${YELLOW}Extracted project reference: $PROJECT_REF${NC}"
  fi
  
  # Ensure we have the project reference
  if [ -z "$PROJECT_REF" ]; then
    echo -e "${RED}Error: Could not extract project reference from SUPABASE_URL: $SUPABASE_URL${NC}"
    echo -e "${YELLOW}SUPABASE_URL should be in the format: https://your-project-ref.supabase.co${NC}"
    echo -e "${RED}Please check your SUPABASE_URL environment variable and try again.${NC}"
    exit 1
  fi
  
  # Step 1: Sync local migration history with remote database
  echo -e "${YELLOW}Step 1: Syncing local migration history with remote database...${NC}"
  echo -e "${YELLOW}Running: supabase db pull${NC}"
  
  # Try to capture output, but also show it in real-time
  echo -e "${YELLOW}Attempting to sync migration history...${NC}"
  
  # Create a temporary file to capture output
  TEMP_OUTPUT=$(mktemp)
  
  # Run the command and capture both stdout and stderr, while also showing output
  supabase db pull --schema public,auth,storage,graphql_public,supabase_functions,extensions 2>&1 | tee "$TEMP_OUTPUT"
  PULL_EXIT_CODE=$?
  
  if [ $PULL_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}Migration history sync failed (exit code: $PULL_EXIT_CODE). Analyzing output for repair commands...${NC}"
    
    # Read the captured output
    PULL_OUTPUT=$(cat "$TEMP_OUTPUT")
    
    # Print the full output for debugging
    echo -e "${YELLOW}Full pull output for analysis:${NC}"
    echo "$PULL_OUTPUT"
    echo -e "${YELLOW}End of pull output${NC}"
    
    # Extract repair commands from the output - look for various patterns
    REPAIR_COMMANDS=$(echo "$PULL_OUTPUT" | grep -E "(supabase migration repair|supabase db repair)" | sed 's/^[[:space:]]*//')
    
    # Also try to extract repair commands that might be formatted differently
    if [ -z "$REPAIR_COMMANDS" ]; then
      # Look for lines that contain "repair" and migration IDs
      REPAIR_COMMANDS=$(echo "$PULL_OUTPUT" | grep -E "repair.*--status.*(reverted|applied)" | sed 's/^[[:space:]]*//')
    fi
    
    if [ -n "$REPAIR_COMMANDS" ]; then
      echo -e "${YELLOW}Found repair commands. Executing them...${NC}"
      echo -e "${YELLOW}Repair commands to execute:${NC}"
      echo "$REPAIR_COMMANDS"
      
      # Execute each repair command
      echo "$REPAIR_COMMANDS" | while IFS= read -r repair_cmd; do
        if [ -n "$repair_cmd" ]; then
          echo -e "${YELLOW}Running: $repair_cmd${NC}"
          eval "$repair_cmd"
          
          if [ $? -eq 0 ]; then
            echo -e "${GREEN}Repair command executed successfully${NC}"
          else
            echo -e "${RED}Repair command failed: $repair_cmd${NC}"
          fi
        fi
      done
    else
      echo -e "${YELLOW}No repair commands found in output. Manually executing suggested repairs...${NC}"
      
      # Check if the output contains specific migration IDs that need repair
      if echo "$PULL_OUTPUT" | grep -q "20250617085550"; then
        echo -e "${YELLOW}Running: supabase migration repair --status reverted 20250617085550${NC}"
        supabase migration repair --status reverted 20250617085550
      fi
      
      if echo "$PULL_OUTPUT" | grep -q "20250617092028"; then
        echo -e "${YELLOW}Running: supabase migration repair --status applied 20250617092028${NC}"
        supabase migration repair --status applied 20250617092028
      fi
    fi
    
    # Try pulling again after repairs
    echo -e "${YELLOW}Retrying sync after repairs...${NC}"
    supabase db pull --schema public,auth,storage,graphql_public,supabase_functions,extensions
    
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Migration history synced successfully after repairs!${NC}"
    else
      echo -e "${YELLOW}Warning: Sync still failed after repairs. Continuing with migration application...${NC}"
    fi
  else
    echo -e "${GREEN}Migration history synced successfully!${NC}"
  fi
  
  # Clean up temporary file
  rm -f "$TEMP_OUTPUT"
  
  # Step 2: Apply any pending migrations
  echo -e "${YELLOW}Step 2: Applying pending migrations to database...${NC}"
  echo "Using database password: ${SUPABASE_DB_PASSWORD:0:3}*****"
  
  # Use the Supabase CLI to push migrations with timeout to prevent hanging
  echo -e "${YELLOW}Running: timeout 300 supabase db push --include-all${NC}"
  echo -e "${YELLOW}(Will timeout after 5 minutes if stuck)${NC}"
  
  # Create a temporary file to capture push output
  PUSH_TEMP_OUTPUT=$(mktemp)
  
  # Run the command with timeout and capture both stdout and stderr, while also showing output
  timeout 300 supabase db push --include-all 2>&1 | tee "$PUSH_TEMP_OUTPUT"
  PUSH_EXIT_CODE=$?
  
  # Check the output for authentication errors
  if grep -q "Wrong password\|failed SASL auth\|failed to connect" "$PUSH_TEMP_OUTPUT"; then
    echo -e "${RED}❌ Authentication failed! Database password is incorrect.${NC}"
    echo -e "${YELLOW}The migration script cannot connect to the database.${NC}"
    echo -e "${YELLOW}Please check your database password in the .env file.${NC}"
    echo -e "${YELLOW}You may need to reset your database password in Supabase dashboard.${NC}"
    rm -f "$PUSH_TEMP_OUTPUT"
    exit 1
  fi
  
  # Check if command timed out
  if [ $PUSH_EXIT_CODE -eq 124 ]; then
    echo -e "${YELLOW}Command timed out after 5 minutes. Trying alternative approach...${NC}"
    
    # Try without --include-all flag as fallback
    echo -e "${YELLOW}Running fallback: timeout 300 supabase db push${NC}"
    timeout 300 supabase db push 2>&1 | tee "$PUSH_TEMP_OUTPUT"
    PUSH_EXIT_CODE=$?
    
    # Check for auth errors in fallback too
    if grep -q "Wrong password\|failed SASL auth\|failed to connect" "$PUSH_TEMP_OUTPUT"; then
      echo -e "${RED}❌ Authentication failed in fallback attempt!${NC}"
      echo -e "${YELLOW}Database password is incorrect.${NC}"
      rm -f "$PUSH_TEMP_OUTPUT"
      exit 1
    fi
    
    if [ $PUSH_EXIT_CODE -eq 124 ]; then
      echo -e "${RED}Migration push timed out even with fallback approach.${NC}"
      echo -e "${YELLOW}This might indicate network issues or resource constraints.${NC}"
      echo -e "${YELLOW}Consider running migrations manually via Supabase dashboard.${NC}"
      rm -f "$PUSH_TEMP_OUTPUT"
      exit 1
    fi
  fi
  
  # Check for other error conditions
  if [ $PUSH_EXIT_CODE -ne 0 ]; then
    echo -e "${RED}❌ Migration push failed with exit code: $PUSH_EXIT_CODE${NC}"
    echo -e "${YELLOW}Check the output above for specific error details.${NC}"
    rm -f "$PUSH_TEMP_OUTPUT"
    exit 1
  fi
  
  if [ $PUSH_EXIT_CODE -ne 0 ]; then
    echo -e "${YELLOW}Migration push failed (exit code: $PUSH_EXIT_CODE). Analyzing output for repair commands...${NC}"
    
    # Read the captured output
    PUSH_OUTPUT=$(cat "$PUSH_TEMP_OUTPUT")
    
    # Extract repair commands from the output
    PUSH_REPAIR_COMMANDS=$(echo "$PUSH_OUTPUT" | grep "supabase migration repair" | sed 's/^[[:space:]]*//')
    
    if [ -n "$PUSH_REPAIR_COMMANDS" ]; then
      echo -e "${YELLOW}Found repair commands in push output. Executing them...${NC}"
      
      # Execute each repair command
      echo "$PUSH_REPAIR_COMMANDS" | while IFS= read -r repair_cmd; do
        if [ -n "$repair_cmd" ]; then
          echo -e "${YELLOW}Running: $repair_cmd${NC}"
          eval "$repair_cmd"
          
          if [ $? -eq 0 ]; then
            echo -e "${GREEN}Repair command executed successfully${NC}"
          else
            echo -e "${RED}Repair command failed: $repair_cmd${NC}"
          fi
        fi
      done
      
      # Check if we need to pull after repairs (common suggestion)
      if echo "$PUSH_OUTPUT" | grep -q "supabase db pull"; then
        echo -e "${YELLOW}Running suggested db pull after repairs...${NC}"
        supabase db pull --schema public,auth,storage,graphql_public,supabase_functions,extensions
      fi
      
      # Try pushing again after repairs
      echo -e "${YELLOW}Retrying push after repairs...${NC}"
      supabase db push --include-all
      
      if [ $? -eq 0 ]; then
        echo -e "${GREEN}Migration successful after repairs!${NC}"
      else
        echo -e "${RED}Migration still failed after repairs.${NC}"
        echo -e "${RED}Please check your Supabase configuration and try again.${NC}"
        exit 1
      fi
    else
      echo -e "${RED}Migration failed.${NC}"
      echo -e "${RED}Please check your Supabase configuration and try again.${NC}"
      echo -e "${YELLOW}Make sure your SUPABASE_DB_PASSWORD is correct and your IP is allowed to access the database.${NC}"
      exit 1
    fi
  else
    echo -e "${GREEN}Migration successful!${NC}"
  fi
  
  # Clean up temporary file
  rm -f "$PUSH_TEMP_OUTPUT"
  
  echo -e "${GREEN}Migrations applied successfully!${NC}"
}

# Function to create a new migration
create_migration() {
  local name=$1
  
  if [ -z "$name" ]; then
    echo -e "${RED}Error: Migration name is required.${NC}"
    usage
  fi
  
  echo -e "${YELLOW}Creating new migration: $name...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Check if Supabase project is initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Supabase project not initialized. Setting up...${NC}"
    setup_project
  fi
  
  # Create migration
  supabase migration new $name
  
  echo -e "${GREEN}Migration created successfully!${NC}"
  echo -e "${YELLOW}Edit the migration file in supabase/migrations/ and then run:${NC}"
  echo -e "${GREEN}$0 migrate${NC}"
}

# Function to sync with remote database
sync_with_remote() {
  echo -e "${YELLOW}Syncing local migration history with remote database...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Check if Supabase project is initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Supabase project not initialized. Setting up...${NC}"
    setup_project
  fi
  
  # Make sure we have all environment variables
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    if [ -f .env ]; then
      echo -e "${YELLOW}Reloading environment variables from .env file...${NC}"
      source .env
    fi
  fi
  
  # Set environment variables for Supabase CLI
  export SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD"
  
  # Pull remote migration history to sync local state
  echo -e "${YELLOW}Running: supabase db pull${NC}"
  supabase db pull --schema public,auth,storage,graphql_public,supabase_functions,extensions
  
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Migration history synced successfully!${NC}"
  else
    echo -e "${YELLOW}Warning: Could not sync migration history. This might be expected for new projects.${NC}"
  fi
}

# Function to check migration status
check_migration_status() {
  echo -e "${YELLOW}=== MIGRATION STATUS CHECK ===${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &> /dev/null; then
    install_cli
    export PATH="$HOME/.local/bin:$PATH"
  fi
  
  # Check if Supabase project is initialized
  if [ ! -d "supabase" ]; then
    echo -e "${YELLOW}Supabase project not initialized. Setting up...${NC}"
    setup_project
  fi
  
  # Make sure we have all environment variables
  if [ -z "$SUPABASE_URL" ] || [ -z "$SUPABASE_KEY" ] || [ -z "$SUPABASE_DB_PASSWORD" ] || [ -z "$SUPABASE_ACCESS_TOKEN" ]; then
    if [ -f .env ]; then
      echo -e "${YELLOW}Reloading environment variables from .env file...${NC}"
      source .env
    fi
  fi
  
  # Set environment variables for Supabase CLI
  export SUPABASE_DB_PASSWORD="$SUPABASE_DB_PASSWORD"
  export SUPABASE_ACCESS_TOKEN="$SUPABASE_ACCESS_TOKEN"
  
  # Count and list migration files
  if [ -d "supabase/migrations" ]; then
    MIGRATION_COUNT=$(ls supabase/migrations/*.sql 2>/dev/null | wc -l)
    echo -e "${GREEN}Found $MIGRATION_COUNT migration files:${NC}"
    
    # List each migration file with a brief description
    for migration_file in supabase/migrations/*.sql; do
      if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file")
        echo -e "${GREEN}📄 $filename${NC}"
        
        # Show first comment line that describes what the migration does
        first_comment=$(head -5 "$migration_file" | grep -E "^--" | head -1 | sed 's/^-- *//')
        if [ -n "$first_comment" ]; then
          echo -e "${YELLOW}   → $first_comment${NC}"
        fi
      fi
    done
    echo ""
  else
    echo -e "${RED}❌ No migrations directory found.${NC}"
    return 1
  fi
  
  # Get migration status from database
  echo -e "${YELLOW}Checking which migrations have been applied to database...${NC}"
  
  # Create a temporary file to capture the migration list output
  MIGRATION_LIST_OUTPUT=$(mktemp)
  
  # Try to get the migration list using supabase migration list
  supabase migration list 2>&1 | tee "$MIGRATION_LIST_OUTPUT"
  LIST_EXIT_CODE=$?
  
  echo ""
  echo -e "${YELLOW}=== MIGRATION APPLICATION STATUS ===${NC}"
  
  if [ $LIST_EXIT_CODE -eq 0 ]; then
    # Parse the output and show status for each local migration
    APPLIED_COUNT=0
    NOT_APPLIED_COUNT=0
    
    for migration_file in supabase/migrations/*.sql; do
      if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file" .sql)
        
        # Check if this migration appears in the applied list
        if grep -q "$filename" "$MIGRATION_LIST_OUTPUT"; then
          echo -e "${GREEN}✅ $filename - APPLIED${NC}"
          APPLIED_COUNT=$((APPLIED_COUNT + 1))
        else
          echo -e "${RED}❌ $filename - NOT APPLIED${NC}"
          NOT_APPLIED_COUNT=$((NOT_APPLIED_COUNT + 1))
        fi
      fi
    done
    
    echo ""
    echo -e "${YELLOW}Summary: ${GREEN}$APPLIED_COUNT applied${NC}, ${RED}$NOT_APPLIED_COUNT not applied${NC}"
    
    if [ $NOT_APPLIED_COUNT -gt 0 ]; then
      echo -e "${YELLOW}⚠️  Some migrations have not been applied to the database!${NC}"
    fi
  else
    echo -e "${RED}❌ Could not retrieve migration status from database${NC}"
    echo -e "${YELLOW}This might indicate a connection or authentication issue${NC}"
    
    # Still list the files but mark status as unknown
    for migration_file in supabase/migrations/*.sql; do
      if [ -f "$migration_file" ]; then
        filename=$(basename "$migration_file" .sql)
        echo -e "${YELLOW}❓ $filename - STATUS UNKNOWN${NC}"
      fi
    done
  fi
  
  # Clean up temporary file
  rm -f "$MIGRATION_LIST_OUTPUT"
  
  echo -e "${YELLOW}=== END MIGRATION STATUS CHECK ===${NC}"
}

# Function to check for updates and upgrade if needed
check_for_updates() {
  echo -e "${YELLOW}Checking for Supabase CLI updates...${NC}"
  
  # Check if Supabase CLI is installed
  if ! command -v supabase &>/dev/null; then
    echo -e "${YELLOW}Supabase CLI not installed. Installing...${NC}"
    install_cli
    return 0
  fi
  
  # Get installed version
  local INSTALLED_VERSION=$(supabase --version 2>&1 | grep -oE '[0-9]+\.[0-9]+\.[0-9]+' | head -1)
  echo -e "${GREEN}Current Supabase CLI version: v$INSTALLED_VERSION${NC}"
  
  # Get latest version
  local LATEST_VERSION=$(get_latest_version)
  
  # Compare versions
  if version_gt "$LATEST_VERSION" "$INSTALLED_VERSION"; then
    echo -e "${YELLOW}Newer version available (v$LATEST_VERSION). Upgrading from v$INSTALLED_VERSION...${NC}"
    install_cli
    echo -e "${GREEN}Supabase CLI has been updated to the latest version.${NC}"
  else
    echo -e "${GREEN}You already have the latest version (v$INSTALLED_VERSION).${NC}"
  fi
}

# Main script
if [ $# -eq 0 ]; then
  usage
fi

case "$1" in
  setup)
    setup_project
    ;;
  migrate)
    run_migrations
    ;;
  sync)
    sync_with_remote
    ;;
  status)
    check_migration_status
    ;;
  new)
    if [ $# -lt 2 ]; then
      echo -e "${RED}Error: Migration name is required.${NC}"
      usage
    fi
    create_migration "$2"
    ;;
  update)
    check_for_updates
    ;;
  *)
    echo -e "${RED}Error: Unknown command: $1${NC}"
    usage
    ;;
esac

exit 0