#!/bin/bash

# Exit on error
set -e

echo "Setting up Helix - Recruiting Outreach Agent..."

# Install root dependencies
echo "Installing root dependencies..."
npm install

# Set up frontend
echo "Setting up frontend..."
cd frontend
npm install
cd ..

# Set up backend
echo "Setting up backend..."
cd backend

# Create virtual environment if it doesn't exist
if [ ! -d "venv" ]; then
    echo "Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "Installing Python dependencies..."
pip install -r requirements.txt

# Create .env file if it doesn't exist
if [ ! -f ".env" ]; then
    echo "Creating .env file from example..."
    cp .env.example .env
    echo "Please update the .env file with your actual API keys and credentials."
fi

cd ..

echo "Setup complete! You can now run the application with:"
echo "npm start"
echo ""
echo "Note: Make sure to update the backend/.env file with your Supabase and OpenAI credentials."
