#!/usr/bin/env zsh
set -e

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Starting deployment with migrations...${NC}"

# Load environment variables from .env file
if [ -f .env ]; then
    echo "Loading environment variables from .env file..."
    export $(grep -v '^#' .env | xargs)
else
    echo "No .env file found. Using default values."
fi

# Define variables with fallbacks
REMOTE_HOST="${DEPLOY_REMOTE_HOST:-104.36.23.197}"
REMOTE_PORT="${DEPLOY_REMOTE_PORT:-2048}"
REMOTE_USER="${DEPLOY_REMOTE_USER:-ubuntu}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-www/coldfollow.com/coldfollow-web}"
SERVICE_NAME="${SERVICE_NAME:-coldfollow-web}"

# Create SSH options
SSH_OPTS="-p $REMOTE_PORT"

# Deploy the code first using deploy.sh
echo -e "${YELLOW}Running deployment script...${NC}"
./bin/deploy.sh

echo -e "${GREEN}Deployment successful!${NC}"

# Check if INSTALL_SERVICE was set to true in the .env file
# If it was, the service was already installed by deploy.sh
if [ "$INSTALL_SERVICE" != "true" ]; then
  # Run install-service.sh on the remote server to install dependencies and set up the service
  echo -e "${YELLOW}Installing service and dependencies on remote server...${NC}"
  ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && chmod +x ./bin/install-service.sh && sudo ./bin/install-service.sh"
else
  echo -e "${YELLOW}Skipping service installation as it was already done by deploy.sh...${NC}"
fi

# Run Supabase setup and migrations on the remote server
echo -e "${YELLOW}Running Supabase setup and migrations on remote server...${NC}"

# Run the Supabase setup
echo -e "${YELLOW}Running Supabase setup on remote server...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && chmod +x ./bin/supabase-db.sh && ./bin/supabase-db.sh setup"

if [ $? -ne 0 ]; then
  echo -e "${RED}Supabase setup failed. Aborting deployment.${NC}"
  exit 1
fi

# Run the Supabase migrations
echo -e "${YELLOW}Running Supabase migrations on remote server...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && ./bin/supabase-db.sh migrate"

if [ $? -eq 0 ]; then
  echo -e "${GREEN}Migrations successful!${NC}"
else
  echo -e "${RED}Migrations failed. Please check the error messages above.${NC}"
  echo -e "${YELLOW}You can try running migrations manually by connecting to the remote server and running:${NC}"
  echo -e "  ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST \"cd $REMOTE_DIR && ./bin/supabase-db.sh migrate\""
  exit 1
fi

# Restart the service after all operations are complete
echo -e "${YELLOW}Restarting service...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "sudo systemctl restart ${SERVICE_NAME}"

echo -e "${GREEN}Service restarted successfully!${NC}"
echo -e "${GREEN}Deployment with migrations completed successfully!${NC}"

exit 0
