#!/bin/bash
# Deploy AI Development Coach UI to Vercel

echo "🚀 Deploying AI Development Coach UI..."

cd "$(dirname "$0")"

# Check if vercel is installed
if ! command -v vercel &> /dev/null; then
    echo "Installing Vercel CLI..."
    npm install -g vercel
fi

# Login to Vercel (will open browser)
echo "Please login to Vercel in the browser..."
vercel login

# Deploy
echo "Deploying to Vercel..."
vercel --prod --yes

echo "✅ Deployment complete!"
