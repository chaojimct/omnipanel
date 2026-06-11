#!/bin/bash

echo "🚀 Setting up OmniPanel Agent..."

# Check Node.js version
NODE_VERSION=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VERSION" -lt 18 ]; then
    echo "❌ Node.js 18+ is required. Current version: $(node -v)"
    exit 1
fi

echo "✅ Node.js version: $(node -v)"

# Install dependencies
echo "📦 Installing dependencies..."
npm install

# Copy .env.example to .env if not exists
if [ ! -f .env ]; then
    echo "📝 Creating .env file from .env.example..."
    cp .env.example .env
    echo "⚠️  Please edit .env and add your API key"
else
    echo "✅ .env file already exists"
fi

# Create logs directory
mkdir -p logs
echo "✅ Logs directory created"

# Build the project
echo "🔨 Building project..."
npm run build

echo ""
echo "✨ Setup complete!"
echo ""
echo "To start the agent:"
echo "  1. Edit .env and add your API key"
echo "  2. Run: npm run dev"
echo ""
echo "Or use Docker:"
echo "  docker-compose up"
echo ""
