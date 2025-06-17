#!/bin/bash

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
LOCAL_DIR="."
INSTALL_SERVICE="${INSTALL_SERVICE:-false}"

# Create SSH options
SSH_OPTS="-p $REMOTE_PORT"
SCP_OPTS="-P $REMOTE_PORT"
RSYNC_OPTS="-e \"ssh -p $REMOTE_PORT\""

# Set colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Deployment Configuration:${NC}"
echo -e "  Remote Host: ${GREEN}$REMOTE_HOST${NC}"
echo -e "  Remote Port: ${GREEN}$REMOTE_PORT${NC}"
echo -e "  Remote User: ${GREEN}$REMOTE_USER${NC}"
echo -e "  Remote Directory: ${GREEN}$REMOTE_DIR${NC}"
echo -e "  Install Service: ${GREEN}$INSTALL_SERVICE${NC}"
echo -e "${YELLOW}Checking if remote directory exists...${NC}"

# Check if the remote directory exists
if ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "[ -d $REMOTE_DIR ]"; then
    echo -e "${GREEN}Remote directory exists. Starting deployment...${NC}"
    
    # Deploy using rsync with .deployignore
    if [ -f .deployignore ]; then
        echo -e "${YELLOW}Using .deployignore file for exclusions...${NC}"
        rsync -avz --partial --compress-level=9 --delete -e "ssh -p $REMOTE_PORT" --exclude-from=.deployignore $LOCAL_DIR $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR
    else
        echo -e "${YELLOW}No .deployignore file found. Excluding node_modules/ by default...${NC}"
        rsync -avz --partial --compress-level=9 --delete -e "ssh -p $REMOTE_PORT" --exclude="node_modules/" $LOCAL_DIR $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR
    fi
    
    # Check if rsync was successful
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}Deployment completed successfully!${NC}"
        
        # Check if we should install the service
        if [ "$INSTALL_SERVICE" = "true" ]; then
            echo -e "${YELLOW}Attempting to install service on remote host...${NC}"
            
            # Check if the user can run sudo without password
            CAN_SUDO=$(ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "sudo -n true 2>/dev/null && echo yes || echo no")
            
            if [ "$CAN_SUDO" = "yes" ]; then
                # Run the install-service.sh script on the remote host
                echo -e "${YELLOW}Running install-service.sh on remote host...${NC}"
                # Make sure the install-service.sh script is executable
                ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "chmod +x $REMOTE_DIR/bin/install-service.sh"
                
                # Run the install-service.sh script with verbose output
                ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && sudo ./bin/install-service.sh"
                
                # Check if the service is running
                echo -e "${YELLOW}Checking service status on remote host...${NC}"
                ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "sudo systemctl status $SERVICE_NAME"
                
                if [ $? -eq 0 ]; then
                    echo -e "${GREEN}Service installed successfully!${NC}"
                else
                    echo -e "${RED}Failed to install service. Please check the error messages above.${NC}"
                    echo -e "${YELLOW}You can try installing the service manually by running:${NC}"
                    echo -e "  ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST \"cd $REMOTE_DIR && sudo ./bin/install-service.sh\""
                fi
            else
                echo -e "${YELLOW}Cannot run sudo without password on remote host.${NC}"
                echo -e "${YELLOW}To install the service, connect to the remote host and run:${NC}"
                echo -e "  cd $REMOTE_DIR && sudo ./bin/install-service.sh"
            fi
        else
            echo -e "${YELLOW}Skipping service installation. To install the service, set INSTALL_SERVICE=true in .env${NC}"
            echo -e "${YELLOW}or connect to the remote host and run:${NC}"
            echo -e "  cd $REMOTE_DIR && sudo ./bin/install-service.sh"
        fi
        
        # We don't restart services here - that's handled by deploy-with-migrations.sh
        # Just reload the systemd daemon
        echo -e "${YELLOW}Reloading systemd daemon on remote host...${NC}"
        ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "sudo systemctl daemon-reload"
    else
        echo -e "${RED}Deployment failed. Please check the error messages above.${NC}"
        exit 1
    fi
else
    echo -e "${RED}Remote directory does not exist: $REMOTE_USER@$REMOTE_HOST:$REMOTE_DIR${NC}"
    echo -e "${YELLOW}Please create the directory first or check your configuration in .env file.${NC}"
    exit 1
fi

# Make sure the scripts are executable
echo -e "${YELLOW}Making scripts executable on remote host...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "chmod +x $REMOTE_DIR/bin/*.sh"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "chmod +x $REMOTE_DIR/bin/*.js"

# Run Puppeteer setup script to configure Chrome path
echo -e "${YELLOW}Setting up Puppeteer Chrome path on remote host...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && ./bin/setup-puppeteer.sh"

# Set up Supabase storage buckets
echo -e "${YELLOW}Setting up Supabase storage buckets on remote host...${NC}"
ssh $SSH_OPTS $REMOTE_USER@$REMOTE_HOST "cd $REMOTE_DIR && node bin/setup-supabase-storage.js"

echo -e "${GREEN}Deployment process completed!${NC}"