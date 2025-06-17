#!/bin/bash

# Build script for PDF Converter iOS app

# Set colors for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Function to display section headers
display_section() {
  echo -e "\n${BLUE}=== $1 ===${NC}"
}

display_section "Starting Build Process"

# Check if we're in the right directory
if [ ! -d "PDFConverter" ]; then
  echo -e "${RED}Error: PDFConverter directory not found!${NC}"
  echo -e "${YELLOW}Make sure you're running this script from the ios directory.${NC}"
  exit 1
fi

# Check if xcodebuild is available
if ! command -v xcodebuild &> /dev/null; then
  echo -e "${RED}Error: xcodebuild command not found!${NC}"
  echo -e "${YELLOW}Make sure Xcode is installed and command line tools are set up.${NC}"
  echo -e "${YELLOW}Run: xcode-select --install${NC}"
  exit 1
fi

# Navigate to the project directory
cd PDFConverter

# Get Xcode and Swift version for diagnostics
display_section "Environment Information"
echo -e "Xcode Version:"
xcodebuild -version
echo -e "\nSwift Version:"
swift --version

# Clear derived data to start fresh
display_section "Preparing Build Environment"
echo -e "${YELLOW}Clearing derived data for this project...${NC}"
rm -rf ~/Library/Developer/Xcode/DerivedData/PDFConverter-*

# Get available simulators and find a suitable one
echo -e "\n${YELLOW}Available iOS Simulators:${NC}"
xcrun simctl list devices available | grep -E 'iPhone|iPad' | grep -v unavailable | head -10

# Find an available iPhone simulator
AVAILABLE_IPHONE_SIM=$(xcrun simctl list devices available | grep -E 'iPhone' | grep -v unavailable | head -1 | sed -E 's/.*\(([A-Z0-9-]+)\).*/\1/')
AVAILABLE_SIMULATOR_NAME=$(xcrun simctl list devices available | grep -E 'iPhone' | grep -v unavailable | head -1 | sed -E 's/.*iPhone ([^(]+).*/iPhone \1/' | xargs)

if [ -z "$AVAILABLE_IPHONE_SIM" ]; then
  echo -e "${RED}Error: No available iPhone simulator found!${NC}"
  echo -e "${YELLOW}Please create an iPhone simulator in Xcode before running this script.${NC}"
  exit 1
fi

echo -e "${GREEN}Using simulator: $AVAILABLE_SIMULATOR_NAME (ID: $AVAILABLE_IPHONE_SIM)${NC}"

# Clean the project
display_section "Cleaning Project"
xcodebuild clean -scheme PDFConverter -sdk iphonesimulator

# Validate project structure
display_section "Validating Project"
echo -e "Project schemes and targets:"
xcodebuild -list

# Check project file for minimum deployment target
echo -e "\n${YELLOW}Checking project settings...${NC}"
DEPLOY_TARGET=$(grep -A 2 "IPHONEOS_DEPLOYMENT_TARGET" PDFConverter.xcodeproj/project.pbxproj | head -2 | tail -1 | awk -F'= ' '{print $2}' | tr -d ';')
echo -e "Minimum deployment target: $DEPLOY_TARGET"

# Check if iOS development team is set up
TEAM_ID=$(grep -A 2 "DEVELOPMENT_TEAM" PDFConverter.xcodeproj/project.pbxproj | head -2 | tail -1 | awk -F'= ' '{print $2}' | tr -d ';')
if [ -z "$TEAM_ID" ] || [ "$TEAM_ID" == "\"\"" ]; then
  echo -e "${YELLOW}Warning: No development team configured in project.${NC}"
  echo -e "You may need to select a team in Xcode before building for device."
else
  echo -e "Development Team ID: $TEAM_ID"
fi

# Start the build process with multiple fallback options
display_section "Building for iOS Simulator"
echo -e "${YELLOW}Attempt 1: Standard build...${NC}"
xcodebuild -scheme PDFConverter -sdk iphonesimulator -destination "platform=iOS Simulator,id=$AVAILABLE_IPHONE_SIM" build

# Check if build was successful
if [ $? -eq 0 ]; then
  echo -e "${GREEN}Build successful!${NC}"
else
  echo -e "${YELLOW}Standard build failed, trying alternative approaches...${NC}"
  
  # Try with legacy build system
  echo -e "${YELLOW}Trying with legacy build system...${NC}"
  xcodebuild -scheme PDFConverter -sdk iphonesimulator -destination "platform=iOS Simulator,id=$AVAILABLE_IPHONE_SIM" -UseModernBuildSystem=NO build
  
  # Check if alternative build was successful
  if [ $? -eq 0 ]; then
    echo -e "${GREEN}Build successful with legacy build system!${NC}"
  else
    # Try with basic configuration
    echo -e "${YELLOW}Trying basic configuration build...${NC}"
    xcodebuild -scheme PDFConverter -configuration Debug -sdk iphonesimulator -destination "generic/platform=iOS Simulator" build
    
    # Final check
    if [ $? -eq 0 ]; then
      echo -e "${GREEN}Build successful with basic configuration!${NC}"
    else
      echo -e "${RED}All build attempts failed!${NC}"
      echo -e "${YELLOW}Try opening the project in Xcode directly to resolve issues.${NC}"
      echo -e "${YELLOW}Check for Swift version compatibility, missing dependencies, or code signing issues.${NC}"
      exit 1
    fi
  fi
fi

echo -e "\n${YELLOW}To run on a simulator:${NC}"
echo -e "1. Open Xcode"
echo -e "2. Open PDFConverter.xcodeproj"
echo -e "3. Select a simulator from the scheme dropdown"
echo -e "4. Click the Run button or press Cmd+R"

echo -e "\n${YELLOW}To build for a physical device:${NC}"
echo -e "xcodebuild -scheme PDFConverter -sdk iphoneos -configuration Release build"

# Provide instructions for creating an IPA
echo -e "\n${YELLOW}To create an IPA for distribution:${NC}"
echo -e "1. Create an exportOptions.plist file with your team ID and provisioning profile"
echo -e "2. Run the following commands:"
echo -e "   xcodebuild -scheme PDFConverter -sdk iphoneos -configuration Release archive -archivePath ./build/PDFConverter.xcarchive"
echo -e "   xcodebuild -exportArchive -archivePath ./build/PDFConverter.xcarchive -exportOptionsPlist exportOptions.plist -exportPath ./build"

# Add detailed troubleshooting guide for Swift module issues
display_section "Swift Module Error Troubleshooting"
echo -e "The build failed with Swift module emission errors. This is common when:"
echo -e " - Your Xcode version ($(xcodebuild -version | head -1)) is incompatible with the project's settings"
echo -e " - The minimum deployment target ($DEPLOY_TARGET) needs updating"
echo -e " - Swift language version mismatch"
echo -e " - Project settings need modernization"
echo -e ""
echo -e "${YELLOW}Step-by-step troubleshooting:${NC}"
echo -e "1. Open the project in Xcode:"
echo -e "   open PDFConverter.xcodeproj"
echo -e ""
echo -e "2. Update project settings in Xcode:"
echo -e "   - Select PDFConverter project in the navigator"
echo -e "   - In 'General' tab, increase iOS Deployment Target to at least 13.0"
echo -e "   - In 'Build Settings', search for 'Swift Compiler - Language' and ensure it's set to 'Swift 5.0'"
echo -e ""
echo -e "3. Update the Build System if needed:"
echo -e "   - File > Project Settings > Build System > Legacy Build System"
echo -e ""
echo -e "4. Manual fixes for common Swift module errors:"
echo -e "   - Update Swift syntax in the project files"
echo -e "   - Check for and fix any Swift language features that have been deprecated"
echo -e "   - Ensure imports are correct and frameworks are properly linked"
echo -e ""
echo -e "5. If using dependencies, update them:"
echo -e "   - If using CocoaPods: pod update"
echo -e "   - If using Swift Package Manager: Update packages in Xcode"
echo -e ""
echo -e "After making these changes, try building again with:"
echo -e "   bash build.sh"
echo -e ""
echo -e "${YELLOW}Advanced troubleshooting:${NC}"
echo -e "1. Create a new Xcode project and migrate code gradually"
echo -e "2. Run: sudo xcode-select -s /Applications/Xcode.app (if multiple Xcode versions installed)"
echo -e "3. Try building using xcodebuild -allowProvisioningUpdates flag"
echo -e "4. Check for Swift language version compatibility issues"
echo -e "5. Verify code signing identity settings"
echo -e "6. Clean derived data and module cache: rm -rf ~/Library/Developer/Xcode/DerivedData/"