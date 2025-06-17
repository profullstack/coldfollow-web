#!/bin/zsh

# This script checks if the GitHub Actions deployment is working correctly

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Checking GitHub Actions deployment...${NC}"

# Define variables with fallbacks
REMOTE_HOST="${DEPLOY_REMOTE_HOST:-104.36.23.197}"
REMOTE_PORT="${DEPLOY_REMOTE_PORT:-2048}"
REMOTE_USER="${DEPLOY_REMOTE_USER:-ubuntu}"
REMOTE_DIR="${DEPLOY_REMOTE_DIR:-www/coldfollow.com/coldfollow-web}"

# Create SSH options
SSH_OPTS="-p $REMOTE_PORT"

echo -e "${YELLOW}Configuration:${NC}"
echo -e "  Remote Host: ${GREEN}$REMOTE_HOST${NC}"
echo -e "  Remote Port: ${GREEN}$REMOTE_PORT${NC}"
echo -e "  Remote User: ${GREEN}$REMOTE_USER${NC}"
echo -e "  Remote Directory: ${GREEN}$REMOTE_DIR${NC}"

# Check if we can connect to the remote host
echo -e "\n${YELLOW}Testing SSH connection to $REMOTE_USER@$REMOTE_HOST:$REMOTE_PORT...${NC}"
if ssh -o BatchMode=yes -o ConnectTimeout=5 $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "echo Connection successful"; then
  echo -e "${GREEN}SSH connection successful!${NC}"
else
  echo -e "${RED}SSH connection failed. Check your SSH keys and server configuration.${NC}"
  exit 1
fi

# Check if the remote directory exists
echo -e "\n${YELLOW}Checking if remote directory exists...${NC}"
if ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "[ -d $REMOTE_DIR ]"; then
  echo -e "${GREEN}Remote directory exists!${NC}"
else
  echo -e "${RED}Remote directory does not exist: $REMOTE_HOST:$REMOTE_DIR${NC}"
  exit 1
fi

# Check for test files from GitHub Actions
echo -e "\n${YELLOW}Checking for GitHub Actions test files...${NC}"
TEST_FILES=$(ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "find $REMOTE_DIR -name 'github-actions-test-*.txt' | sort -r | head -5")

if [ -z "$TEST_FILES" ]; then
  echo -e "${RED}No GitHub Actions test files found. Deployment may not be working.${NC}"
else
  echo -e "${GREEN}Found GitHub Actions test files:${NC}"
  for file in $TEST_FILES; do
    echo -e "  - $file"
    echo -e "    Content: $(ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cat $file")"
  done
fi

# Create a new test file to verify we can write to the server
echo -e "\n${YELLOW}Creating a new test file...${NC}"
TEST_FILE="manual-test-$(date +%Y%m%d%H%M%S).txt"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "echo 'Manual test at $(date)' > $REMOTE_DIR/$TEST_FILE"
echo -e "${GREEN}Created test file: $REMOTE_DIR/$TEST_FILE${NC}"

# Check GitHub repository configuration
echo -e "\n${YELLOW}Checking local Git configuration...${NC}"
REMOTE_URL=$(git config --get remote.origin.url)
echo -e "  Git remote URL: ${GREEN}$REMOTE_URL${NC}"

CURRENT_BRANCH=$(git branch --show-current)
echo -e "  Current branch: ${GREEN}$CURRENT_BRANCH${NC}"

# Check for .github/workflows directory
if [ -d ".github/workflows" ]; then
  echo -e "  ${GREEN}GitHub workflows directory exists${NC}"
  echo -e "  Workflow files:"
  for file in .github/workflows/*; do
    echo -e "    - $file"
  done
else
  echo -e "  ${RED}GitHub workflows directory does not exist${NC}"
fi

echo -e "\n${YELLOW}Deployment check completed.${NC}"
echo -e "${YELLOW}If you're still having issues, check:${NC}"
echo -e "  1. GitHub repository Actions tab for workflow runs"
echo -e "  2. SSH key configuration in GitHub Secrets"
echo -e "  3. Server logs for any errors"
echo -e "  4. Make sure your changes are committed and pushed to the correct branch (master or main)"