#!/bin/bash

# Azure Function Direct ZIP Deployment Script for Judge0 Autoscaler

set -e

echo "🚀 Deploying Judge0 Autoscaler Azure Function via Direct ZIP..."

# Check if required tools are installed
command -v az >/dev/null 2>&1 || { echo "❌ Azure CLI is required but not installed. Aborting." >&2; exit 1; }
command -v pnpm >/dev/null 2>&1 || { echo "❌ pnpm is required but not installed. Aborting." >&2; exit 1; }

# Navigate to functions directory
cd "$(dirname "$0")/functions"

echo "📦 Installing dependencies..."
pnpm install

echo "🔨 Building TypeScript..."
pnpm run build

echo "� Creating deployment package..."
# Create a clean deployment package with only necessary files
zip -r deployment.zip . \
    -x "node_modules/*" \
    -x "src/*" \
    -x "*.ts" \
    -x "tsconfig.json" \
    -x ".git/*" \
    -x "*.md" \
    -x "local.settings.json"

echo "�📋 Getting Function App details from Terraform..."
cd ..
FUNCTION_APP_NAME=$(terraform output -raw autoscaler_function_app_url | sed 's|https://||' | sed 's|\.azurewebsites\.net||')
RESOURCE_GROUP=$(terraform output -raw resource_group_name 2>/dev/null || echo "judge0-rg")

if [ -z "$FUNCTION_APP_NAME" ]; then
    echo "❌ Could not determine Function App name. Please ensure Terraform has been applied."
    exit 1
fi

echo "🎯 Function App Name: $FUNCTION_APP_NAME"
echo "🎯 Resource Group: $RESOURCE_GROUP"

cd functions

echo "🚀 Deploying via direct ZIP upload..."
az functionapp deployment source config-zip \
    --resource-group "$RESOURCE_GROUP" \
    --name "$FUNCTION_APP_NAME" \
    --src "deployment.zip"

echo "⏳ Waiting for deployment to complete..."
sleep 10

echo "� Restarting Function App to ensure latest code is loaded..."
az functionapp restart --name "$FUNCTION_APP_NAME" --resource-group "$RESOURCE_GROUP"

echo "✅ Deployment completed successfully!"
echo "🌐 Function App URL: https://${FUNCTION_APP_NAME}.azurewebsites.net"
echo "📊 Monitor logs: az functionapp logs tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP"
echo "🧪 Test manual trigger: curl -X POST https://${FUNCTION_APP_NAME}.azurewebsites.net/api/manualScale?code=YOUR_FUNCTION_KEY"

# Clean up
rm -f deployment.zip
echo "🧹 Cleaned up deployment package"
