#!/bin/bash
echo "🔄 Pulling latest changes..."
git pull origin main

echo "📦 Installing dependencies..."
npm install

echo "📁 Creating logs directory..."
mkdir -p logs

echo "🔄 Restarting application..."
pm2 restart news-aggregator 2>/dev/null || pm2 start ecosystem.config.js

echo "✅ Deployment complete!"
pm2 status
