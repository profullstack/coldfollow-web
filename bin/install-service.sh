#!/bin/zsh

# Colors for output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m' # No Color

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo -e "${RED}Please run as root (use sudo)${NC}"
  exit 1
fi

# Get the directory of the script
SCRIPT_DIR="$(cd "$(dirname "${0:A}")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"

# Load environment variables from .env file if it exists
if [ -f "$PROJECT_DIR/.env" ]; then
  echo -e "${YELLOW}Loading environment variables from .env file...${NC}"
  source "$PROJECT_DIR/.env"
fi

# Set default values if not in environment
SERVICE_NAME=${SERVICE_NAME:-"convert2doc-pdf"}
SERVICE_USER=${SERVICE_USER:-"ubuntu"}
SERVICE_GROUP=${SERVICE_GROUP:-"ubuntu"}
SERVICE_WORKING_DIR=${SERVICE_WORKING_DIR:-"$PROJECT_DIR"}
START_SCRIPT=${START_SCRIPT:-"$PROJECT_DIR/bin/start.sh"}
SERVICE_FILE="/etc/systemd/system/$SERVICE_NAME.service"

echo -e "${YELLOW}Creating service file at $SERVICE_FILE${NC}"

# Create service file with explicit values
cat > "$SERVICE_FILE" << EOF
[Unit]
Description=Document Generation Service
After=network.target

[Service]
Type=simple
User=$SERVICE_USER
Group=$SERVICE_GROUP
WorkingDirectory=$SERVICE_WORKING_DIR
ExecStart=/bin/zsh $START_SCRIPT
Restart=on-failure
RestartSec=10

# Log to files instead of journal
StandardOutput=append:/var/log/$SERVICE_NAME.log
StandardError=append:/var/log/$SERVICE_NAME.error.log

# Environment
Environment=NODE_ENV=production
Environment=PATH=/usr/local/bin:/usr/bin:/bin:/usr/local/sbin:/usr/sbin:/sbin:/home/$SERVICE_USER/.local/bin:/home/$SERVICE_USER/.local/share/pnpm:/home/$SERVICE_USER/.npm/pnpm/bin
Environment=HOME=/home/$SERVICE_USER

# Hardening
ProtectSystem=full
PrivateTmp=true
NoNewPrivileges=true

[Install]
WantedBy=multi-user.target
EOF

# Set proper permissions
chmod 644 "$SERVICE_FILE"

# Ensure log files exist
mkdir -p /var/log
touch /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log
chmod 644 /var/log/$SERVICE_NAME.log /var/log/$SERVICE_NAME.error.log

# Make start script executable
if [ -f "$START_SCRIPT" ]; then
  chmod +x "$START_SCRIPT"
  echo -e "${GREEN}Made start script executable${NC}"
else
  echo -e "${RED}Warning: Start script not found at $START_SCRIPT${NC}"
fi

# Install system dependencies
echo -e "${YELLOW}Installing system dependencies...${NC}"
if command -v apt-get &> /dev/null; then
  apt-get update
  apt-get install -y librsvg2-bin poppler-utils
  echo -e "${GREEN}System dependencies installed (librsvg2-bin, poppler-utils for pdftotext).${NC}"
else
  echo -e "${YELLOW}apt-get not found. Please install librsvg2-bin manually.${NC}"
fi

# Install project dependencies automatically
echo -e "${YELLOW}Installing project dependencies...${NC}"

# Get the original user who ran sudo
ORIGINAL_USER=${SUDO_USER:-$USER}

# Run pnpm install with zsh and loading .zshrc
echo "Running pnpm install..."
if [ "$EUID" -eq 0 ]; then
  echo "Running as root"
  sudo -u "$ORIGINAL_USER" zsh -c "source /home/$ORIGINAL_USER/.zshrc && cd \"$PROJECT_DIR\" && pnpm install"
else
  echo "Running as user"
  zsh -c "source $HOME/.zshrc && cd \"$PROJECT_DIR\" && pnpm install"
fi

echo -e "${GREEN}Dependencies installed.${NC}"

# Run Supabase setup script
echo -e "${YELLOW}Running Supabase setup script...${NC}"

# Create local bin directory if it doesn't exist
if [ "$EUID" -eq 0 ]; then
  sudo -u "$ORIGINAL_USER" mkdir -p "/home/$ORIGINAL_USER/.local/bin"
  
  # Add to PATH if not already there
  if ! grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" "/home/$ORIGINAL_USER/.zshrc"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' | sudo -u "$ORIGINAL_USER" tee -a "/home/$ORIGINAL_USER/.zshrc" > /dev/null
  fi
  
  # Check if .env file exists
  if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}Found .env file, using for Supabase setup...${NC}"
    
    # Run the setup script as the original user with environment variables from .env
    echo -e "${YELLOW}Running Supabase setup as $ORIGINAL_USER...${NC}"
    sudo -u "$ORIGINAL_USER" zsh -c "cd \"$PROJECT_DIR\" && source .env && chmod +x ./bin/supabase-db.sh && ./bin/supabase-db.sh setup"
  else
    echo -e "${RED}No .env file found. Supabase setup may fail without proper credentials.${NC}"
    echo -e "${YELLOW}Running Supabase setup as $ORIGINAL_USER...${NC}"
    sudo -u "$ORIGINAL_USER" zsh -c "cd \"$PROJECT_DIR\" && chmod +x ./bin/supabase-db.sh && ./bin/supabase-db.sh setup"
  fi
else
  mkdir -p "$HOME/.local/bin"
  
  # Add to PATH if not already there
  if ! grep -q "export PATH=\"\$HOME/.local/bin:\$PATH\"" "$HOME/.zshrc"; then
    echo 'export PATH="$HOME/.local/bin:$PATH"' >> "$HOME/.zshrc"
  fi
  
  # Check if .env file exists
  if [ -f "$PROJECT_DIR/.env" ]; then
    echo -e "${YELLOW}Found .env file, using for Supabase setup...${NC}"
    
    # Run the setup script with environment variables from .env
    echo -e "${YELLOW}Running Supabase setup...${NC}"
    cd "$PROJECT_DIR" && source .env && chmod +x ./bin/supabase-db.sh && ./bin/supabase-db.sh setup
  else
    echo -e "${RED}No .env file found. Supabase setup may fail without proper credentials.${NC}"
    echo -e "${YELLOW}Running Supabase setup...${NC}"
    cd "$PROJECT_DIR" && chmod +x ./bin/supabase-db.sh && ./bin/supabase-db.sh setup
  fi
fi

echo -e "${GREEN}Supabase setup complete.${NC}"

# Reload systemd
echo -e "${YELLOW}Reloading systemd...${NC}"
systemctl daemon-reload

# Enable and start the service
echo -e "${YELLOW}Enabling and starting the service...${NC}"
systemctl enable $SERVICE_NAME
systemctl start $SERVICE_NAME

# Check for any unexpanded variables
if grep -q "\${" "$SERVICE_FILE"; then
  echo -e "${RED}ERROR: Service file contains unexpanded variables!${NC}"
  exit 1
fi

# Show status
echo -e "${YELLOW}Service status:${NC}"
systemctl status $SERVICE_NAME

echo -e "${GREEN}Installation complete!${NC}"
echo -e "${YELLOW}You can view the logs with:${NC}"
echo -e "  tail -f /var/log/$SERVICE_NAME.log"
echo -e "  tail -f /var/log/$SERVICE_NAME.error.log"
