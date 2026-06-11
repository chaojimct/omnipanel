Write-Host "🚀 Setting up OmniPanel Agent..." -ForegroundColor Cyan

# Check Node.js version
$nodeVersion = (node -v) -replace 'v', '' -split '\.' | Select-Object -First 1
if ([int]$nodeVersion -lt 18) {
    Write-Host "❌ Node.js 18+ is required. Current version: $(node -v)" -ForegroundColor Red
    exit 1
}
Write-Host "✅ Node.js version: $(node -v)" -ForegroundColor Green

# Install dependencies
Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
npm install

# Copy .env.example to .env if not exists
if (-not (Test-Path .env)) {
    Write-Host "📝 Creating .env file from .env.example..." -ForegroundColor Yellow
    Copy-Item .env.example .env
    Write-Host "⚠️  Please edit .env and add your API key" -ForegroundColor Yellow
} else {
    Write-Host "✅ .env file already exists" -ForegroundColor Green
}

# Create logs directory
New-Item -ItemType Directory -Force -Path logs | Out-Null
Write-Host "✅ Logs directory created" -ForegroundColor Green

# Build the project
Write-Host "🔨 Building project..." -ForegroundColor Yellow
npm run build

Write-Host ""
Write-Host "✨ Setup complete!" -ForegroundColor Green
Write-Host ""
Write-Host "To start the agent:" -ForegroundColor Cyan
Write-Host "  1. Edit .env and add your API key"
Write-Host "  2. Run: npm run dev"
Write-Host ""
Write-Host "Or use Docker:" -ForegroundColor Cyan
Write-Host "  docker-compose up"
Write-Host ""
