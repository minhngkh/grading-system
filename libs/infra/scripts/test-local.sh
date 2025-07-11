#!/bin/bash

# Local testing script for Judge0 Autoscaler
# This script helps test the autoscaler logic locally

set -e

echo "🧪 Judge0 Autoscaler Local Testing"

# Check if pnpm is available
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Aborting." >&2; exit 1; }

cd "$(dirname "$0")/functions"

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building TypeScript..."
pnpm run build

echo "✅ Build completed!"
echo ""
echo "🔧 To test locally:"
echo "1. Install Azure Functions Core Tools: npm install -g azure-functions-core-tools@4 --unsafe-perm true"
echo "2. Set environment variables in local.settings.json"
echo "3. Run: func start"
echo ""
echo "📋 Required environment variables:"
echo "- JUDGE0_SERVER_URL"
echo "- JUDGE0_AUTH_TOKEN"
echo "- AZURE_SUBSCRIPTION_ID"
echo "- AZURE_RESOURCE_GROUP"
echo "- CONTAINER_GROUP_NAME"
echo "- MIN_WORKERS"
echo "- MAX_WORKERS"
echo "- SCALE_UP_THRESHOLD"
echo "- SCALE_DOWN_THRESHOLD"
echo "- MAX_IDLE_WORKERS"

# Create local.settings.json template if it doesn't exist
if [ ! -f "local.settings.json" ]; then
    echo "📝 Creating local.settings.json template..."
    cat > local.settings.json << 'EOF'
{
  "IsEncrypted": false,
  "Values": {
    "AzureWebJobsStorage": "UseDevelopmentStorage=true",
    "FUNCTIONS_WORKER_RUNTIME": "node",
    "JUDGE0_SERVER_URL": "https://your-judge0-server.azurecontainerapps.io",
    "JUDGE0_AUTH_TOKEN": "your-auth-token",
    "AZURE_SUBSCRIPTION_ID": "your-subscription-id",
    "AZURE_RESOURCE_GROUP": "judge0-rg",
    "AZURE_TENANT_ID": "your-tenant-id",
    "CONTAINER_GROUP_NAME": "judge0-workers",
    "MIN_WORKERS": "0",
    "MAX_WORKERS": "3",
    "SCALE_UP_THRESHOLD": "5",
    "SCALE_DOWN_THRESHOLD": "2",
    "MAX_IDLE_WORKERS": "1",
    "SCALE_CHECK_INTERVAL": "2",
    "SCALE_COOLDOWN_MINUTES": "5"
  }
}
EOF
    echo "📝 Please edit local.settings.json with your actual values"
fi

echo ""
echo "🚀 Ready for local development!"
