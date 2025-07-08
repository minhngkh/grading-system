#!/bin/bash

# Deploy Judge0 Worker Scaler Function using Terraform
# This script builds the TypeScript function and deploys via Terraform

set -e

echo "🚀 Deploying Judge0 Worker Scaler Function..."

# Navigate to function directory
cd scaler-function

# Install dependencies with pnpm
echo "📥 Installing dependencies with pnpm..."
pnpm install

# Build TypeScript
echo "🔨 Building TypeScript..."
pnpm run build

# Create deployment package
echo "📦 Creating deployment package..."
zip -r ../scaler-function.zip . -x "node_modules/.pnpm/*" "*.ts" "tsconfig.json" ".git/*"

# Return to infrastructure directory
cd ..

# Deploy using Terraform
echo "🚀 Deploying infrastructure with Terraform..."
terraform plan -out=tfplan
terraform apply tfplan

echo "✅ Deployment completed successfully!"

# Get outputs
FUNCTION_APP_NAME=$(terraform output -raw scaler_function_name 2>/dev/null || echo "")
RESOURCE_GROUP_NAME=$(terraform output -raw resource_group_name 2>/dev/null || echo "")

if [ -n "$FUNCTION_APP_NAME" ] && [ -n "$RESOURCE_GROUP_NAME" ]; then
    echo "📦 Function App: $FUNCTION_APP_NAME"
    echo "🔍 Monitor at: https://portal.azure.com/#@/resource/subscriptions/$(az account show --query id -o tsv)/resourceGroups/$RESOURCE_GROUP_NAME/providers/Microsoft.Web/sites/$FUNCTION_APP_NAME"
    echo "📊 View logs with: az functionapp log tail --name $FUNCTION_APP_NAME --resource-group $RESOURCE_GROUP_NAME"
fi

# Cleanup
rm -f scaler-function.zip
