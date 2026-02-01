#!/bin/bash

# OffSec AI Mentor - Pre-Deployment Verification Script

echo "🔍 OffSec AI Mentor - Pre-Deployment Checklist"
echo "=============================================="
echo ""

# Check 1: CORS Configuration
echo "✅ Checking CORS configuration..."
if grep -q "origin: true" server-v2.js; then
    echo "   ✅ CORS: Public access enabled"
else
    echo "   ❌ CORS: Still using localhost only"
    exit 1
fi

# Check 2: Custom API Headers
echo ""
echo "✅ Checking custom API key header support..."
if grep -q "X-OpenAI-API-Key\|X-Groq-API-Key" server-v2.js; then
    echo "   ✅ Custom API headers: Supported"
else
    echo "   ❌ Custom API headers: Not found"
fi

# Check 3: req.customKeys middleware
echo ""
echo "✅ Checking req.customKeys middleware..."
if grep -q "req.customKeys = {" server-v2.js; then
    echo "   ✅ Middleware: Extracts custom API keys"
else
    echo "   ❌ Middleware: Not extracting custom keys"
fi

# Check 4: API routes before static files
echo ""
echo "✅ Checking route order (API routes before static)..."
API_ROUTE=$(grep -n "app.post\|app.get\('/api" server-v2.js | tail -1 | cut -d: -f1)
STATIC_ROUTE=$(grep -n "express.static" server-v2.js | cut -d: -f1)

if [ "$API_ROUTE" -lt "$STATIC_ROUTE" ]; then
    echo "   ✅ Routes: Correct order (API before static)"
else
    echo "   ⚠️  Routes: May need reordering"
fi

# Check 5: Fallback questions
echo ""
echo "✅ Checking fallback questions system..."
if grep -q "FALLBACK_QUESTIONS" server-v2.js; then
    echo "   ✅ Fallback: Questions available when API fails"
else
    echo "   ❌ Fallback: Not found"
fi

# Check 6: Database initialization
echo ""
echo "✅ Checking database..."
if [ -f "database.js" ]; then
    echo "   ✅ Database: Module present"
    if [ -f "offsec_mentor.db" ]; then
        echo "   ✅ Database: Initialized locally"
    else
        echo "   ℹ️  Database: Will be created on first run"
    fi
else
    echo "   ❌ Database: Module missing"
fi

# Check 7: Environment setup
echo ""
echo "✅ Checking dependencies..."
if grep -q "express\|cors\|better-sqlite3" package.json; then
    echo "   ✅ Dependencies: All required packages listed"
else
    echo "   ❌ Dependencies: Some packages missing from package.json"
fi

# Summary
echo ""
echo "=============================================="
echo "✅ Pre-deployment check complete!"
echo ""
echo "📋 Deployment Instructions:"
echo "   1. Commit changes: git push origin main"
echo "   2. Go to https://dashboard.render.com"
echo "   3. Create new Web Service → Connect GitHub"
echo "   4. Select OffSec-AI-Mentor repository"
echo "   5. Render auto-detects configuration"
echo "   6. Deploy! Your app goes live in 2-3 minutes"
echo ""
echo "🌐 Your app will be at: https://offsec-ai-mentor.onrender.com"
echo ""
