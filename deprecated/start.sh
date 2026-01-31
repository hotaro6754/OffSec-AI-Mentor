#!/bin/bash

# OffSec AI Mentor - Quick Start Script
# This script helps you set up and run the application

echo "🎓 OffSec AI Mentor - Setup Script"
echo "=================================="
echo ""

# Check if Python is installed
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8 or higher."
    exit 1
fi

echo "✅ Python found: $(python3 --version)"
echo ""

# Check if .env file exists
if [ ! -f .env ]; then
    echo "⚠️  No .env file found. Creating from template..."
    cp .env.example .env
    echo "✅ Created .env file"
    echo ""
    echo "📝 IMPORTANT: Edit the .env file and add your OpenAI API key!"
    echo "   Get your API key from: https://platform.openai.com/api-keys"
    echo ""
    read -p "Press Enter after you've added your API key to .env..."
else
    echo "✅ .env file found"
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo ""
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
    echo "✅ Virtual environment created"
fi

# Activate virtual environment
echo ""
echo "🔄 Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo ""
echo "📥 Installing dependencies..."
pip install -q --upgrade pip
pip install -q -r requirements.txt

if [ $? -eq 0 ]; then
    echo "✅ Dependencies installed successfully"
else
    echo "❌ Failed to install dependencies"
    exit 1
fi

# Run the application
echo ""
echo "🚀 Starting OffSec AI Mentor..."
echo ""
echo "The application will open in your browser at http://localhost:8501"
echo "Press Ctrl+C to stop the application"
echo ""
streamlit run app.py
