#!/bin/bash

# OffSec AI Mentor - Quick Start & Demo Script
# This script helps you quickly test and demo the application locally

set -e

PROJECT_NAME="OffSec AI Mentor"
PROJECT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PYTHON_VERSION=$(python3 --version 2>&1 | awk '{print $2}')
OS_TYPE=$(uname -s)

echo "════════════════════════════════════════════════════════════════"
echo "  🚀 $PROJECT_NAME - Local Dev Server Startup"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "📋 Environment Information:"
echo "  • OS: $OS_TYPE"
echo "  • Python: $PYTHON_VERSION"
echo "  • Project Path: $PROJECT_DIR"
echo "  • Current Working Directory: $(pwd)"
echo ""

# Check if we're in the right directory
if [ ! -f "$PROJECT_DIR/index.html" ]; then
    echo "❌ ERROR: index.html not found!"
    echo "   Please run this script from the project root directory."
    exit 1
fi

echo "✅ Project files detected:"
echo "  ✓ index.html"
echo "  ✓ style.css"
echo "  ✓ app.js"
echo "  ✓ README.md"
echo ""

# Determine which server to use
if command -v python3 &> /dev/null; then
    SERVER_CMD="python3 -m http.server 8000"
    PYTHON_AVAILABLE=true
elif command -v python &> /dev/null; then
    SERVER_CMD="python -m http.server 8000"
    PYTHON_AVAILABLE=true
else
    PYTHON_AVAILABLE=false
fi

if command -v npm &> /dev/null; then
    echo "📦 Available: npm (Node.js)"
fi

if command -v php &> /dev/null; then
    echo "📦 Available: php"
fi

if [ "$PYTHON_AVAILABLE" = true ]; then
    echo "📦 Available: Python"
fi

echo ""
echo "════════════════════════════════════════════════════════════════"
echo "🎯 QUICK START OPTIONS:"
echo "════════════════════════════════════════════════════════════════"
echo ""
echo "OPTION 1: Python HTTP Server (Recommended)"
echo "  $ python3 -m http.server 8000"
echo "  → Visit: http://localhost:8000"
echo ""
echo "OPTION 2: Node.js http-server"
echo "  $ npm install -g http-server"
echo "  $ http-server"
echo "  → Visit: http://localhost:8080"
echo ""
echo "OPTION 3: PHP Built-in Server"
echo "  $ php -S localhost:8000"
echo "  → Visit: http://localhost:8000"
echo ""
echo "════════════════════════════════════════════════════════════════"
echo ""

# Auto-start if Python is available
if [ "$PYTHON_AVAILABLE" = true ]; then
    echo "🚀 Starting server with Python..."
    echo ""
    echo "Server is running!"
    echo "📍 Open your browser: http://localhost:8000"
    echo ""
    echo "────────────────────────────────────────────────────────────────"
    echo ""
    
    # Change to project directory
    cd "$PROJECT_DIR"
    
    # Start the server
    eval "$SERVER_CMD"
else
    echo "⚠️  Python not found. Please choose an option above and run manually."
    echo ""
    echo "Or install Python3:"
    echo "  • macOS: brew install python3"
    echo "  • Ubuntu/Debian: sudo apt-get install python3"
    echo "  • Windows: https://www.python.org/downloads/"
    exit 1
fi
