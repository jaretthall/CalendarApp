#!/bin/bash
# Firebase Deployment Script
# This script helps deploy the Calendar application to Firebase

# Text colors
CYAN='\033[0;36m'
YELLOW='\033[1;33m'
GREEN='\033[0;32m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Check if Firebase CLI is installed
echo -e "${CYAN}Checking if Firebase CLI is installed...${NC}"
if ! command -v firebase &> /dev/null; then
    echo -e "${RED}Firebase CLI is not installed. Installing now...${NC}"
    npm install -g firebase-tools
    if [ $? -ne 0 ]; then
        echo -e "${RED}Failed to install Firebase CLI. Please install it manually with: npm install -g firebase-tools${NC}"
        exit 1
    fi
fi

echo -e "${GREEN}Firebase CLI is available.${NC}"

# Login to Firebase
echo -e "${CYAN}Logging in to Firebase...${NC}"
firebase login
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to login to Firebase. Please try again.${NC}"
    exit 1
fi

# Build the application
echo -e "${CYAN}Building the application...${NC}"
npm run build
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to build the application. Please check for errors.${NC}"
    exit 1
fi

# Deploy to Firebase
echo -e "${CYAN}Deploying to Firebase...${NC}"
firebase deploy
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to deploy to Firebase. Please check for errors.${NC}"
    exit 1
fi

echo -e "${GREEN}Deployment completed successfully!${NC}"
echo -e "${GREEN}Your application is now live on Firebase.${NC}"
echo -e "${YELLOW}Visit the Firebase console to see your deployed app:${NC}"
echo -e "${YELLOW}https://console.firebase.google.com${NC}" 