#!/bin/bash

# Build script for PDF Converter Android app

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${YELLOW}Building PDF Converter Android App...${NC}"

# Check if we're in the right directory
if [ ! -d "PDFConverter" ]; then
  echo -e "${RED}Error: PDFConverter directory not found!${NC}"
  echo -e "${YELLOW}Make sure you're running this script from the android directory.${NC}"
  exit 1
fi

# Navigate to the project directory
cd PDFConverter

# Check if gradlew exists and is executable
if [ ! -x "gradlew" ]; then
  echo -e "${YELLOW}Making gradlew executable...${NC}"
  chmod +x gradlew
fi

# Clean the project
echo -e "${YELLOW}Cleaning project...${NC}"
./gradlew clean

# Build debug APK
echo -e "${YELLOW}Building debug APK...${NC}"
./gradlew assembleDebug

# Check if build was successful
if [ $? -eq 0 ]; then
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
  
  # Check if APK was generated
  if [ -f "$APK_PATH" ]; then
    echo -e "${GREEN}Build successful!${NC}"
    echo -e "${GREEN}APK generated at: ${YELLOW}$APK_PATH${NC}"
    
    # Get APK size
    APK_SIZE=$(du -h "$APK_PATH" | cut -f1)
    echo -e "${GREEN}APK size: ${YELLOW}$APK_SIZE${NC}"
    
    echo -e "\n${YELLOW}To install on a connected device:${NC}"
    echo -e "adb install $APK_PATH"
  else
    echo -e "${RED}Error: APK file not found at expected location!${NC}"
    exit 1
  fi
else
  echo -e "${RED}Build failed!${NC}"
  exit 1
fi