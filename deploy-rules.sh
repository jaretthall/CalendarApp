#!/bin/bash
# Firebase Rules Deployment Script
# This script helps deploy the Firebase security rules

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

# Deploy Firestore rules
echo -e "${CYAN}Deploying Firestore rules...${NC}"
firebase deploy --only firestore:rules
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to deploy Firestore rules. Please check for errors.${NC}"
    exit 1
fi

# Deploy Storage rules
echo -e "${CYAN}Deploying Storage rules...${NC}"
firebase deploy --only storage:rules
if [ $? -ne 0 ]; then
    echo -e "${RED}Failed to deploy Storage rules. Please check for errors.${NC}"
    exit 1
fi

echo -e "${GREEN}Rules deployment completed successfully!${NC}"
echo -e "${YELLOW}Visit the Firebase console to verify your rules:${NC}"
echo -e "${YELLOW}https://console.firebase.google.com${NC}" 