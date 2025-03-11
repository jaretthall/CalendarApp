#!/bin/bash
# Setup CORS for Firebase Storage
# This script sets up CORS configuration for Firebase Storage

# Check if the Google Cloud SDK is installed
if ! command -v gcloud &> /dev/null; then
    echo "Google Cloud SDK is not installed or not in PATH."
    echo "Please install the Google Cloud SDK from: https://cloud.google.com/sdk/docs/install"
    echo "After installation, run 'gcloud init' to initialize the SDK."
    echo "Then run 'gcloud auth login' to authenticate."
    exit 1
fi

# Check if the user is logged in to Firebase
echo "Checking Firebase login status..."
firebase_login_status=$(firebase login:list)

if [[ $firebase_login_status == *"No users signed in"* ]]; then
    echo "You are not logged in to Firebase. Please log in first."
    firebase login
fi

# Get the Firebase project ID
echo "Getting Firebase project ID..."
project_id=$(firebase projects:list --json | jq -r '.results[0].projectId')

if [ -z "$project_id" ]; then
    echo "Could not determine Firebase project ID. Please make sure you are in a Firebase project directory."
    exit 1
fi

echo "Using Firebase project: $project_id"

# Set up CORS for Firebase Storage
echo "Setting up CORS for Firebase Storage..."
echo "Using CORS configuration from cors.json:"
cat cors.json

# Use gcloud to set CORS
echo "Applying CORS configuration..."
gcloud storage buckets update gs://$project_id.appspot.com --cors-file=cors.json

echo "CORS configuration applied successfully." 