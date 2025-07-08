#!/bin/bash

# Judge0 on Azure - Deployment Script
# Simple script to help deploy Judge0 infrastructure

set -e

echo "🚀 Judge0 on Azure - Deployment Script"
echo "======================================="

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed. Please install Terraform first."
    exit 1
fi

# Check if az cli is installed
if ! command -v az &> /dev/null; then
    echo "❌ Azure CLI is not installed. Please install Azure CLI first."
    exit 1
fi

# Check if logged in to Azure
if ! az account show &> /dev/null; then
    echo "❌ Not logged in to Azure. Please run 'az login' first."
    exit 1
fi

# Check if terraform.tfvars exists
if [ ! -f "terraform.tfvars" ]; then
    echo "❌ terraform.tfvars not found."
    echo "💡 Please copy terraform.tfvars.example to terraform.tfvars and configure it:"
    echo "   cp terraform.tfvars.example terraform.tfvars"
    echo "   # Edit terraform.tfvars with your database and Redis connection details"
    exit 1
fi

echo "✅ Prerequisites check passed"
echo ""

# Initialize Terraform
echo "🔧 Initializing Terraform..."
terraform init

echo ""

# Validate configuration
echo "🔍 Validating Terraform configuration..."
terraform validate

echo ""

# Show plan
echo "📋 Showing deployment plan..."
terraform plan

echo ""

# Ask for confirmation
read -p "Do you want to proceed with the deployment? (yes/no): " confirm

if [ "$confirm" != "yes" ]; then
    echo "❌ Deployment cancelled."
    exit 0
fi

echo ""

# Apply configuration
echo "🚀 Deploying Judge0 infrastructure..."
terraform apply -auto-approve

echo ""

# Show outputs
echo "✅ Deployment completed successfully!"
echo ""
echo "📋 Deployment Summary:"
echo "====================="
terraform output

echo ""
echo "🎉 Judge0 is now deployed and ready to use!"
echo ""
echo "📌 Next Steps:"
echo "1. Test your deployment with the server URL above"
echo "2. Monitor scaling behavior in Azure Portal"
echo "3. Submit test jobs to verify everything works"
echo ""
echo "📚 Test commands:"
SERVER_URL=$(terraform output -raw judge0_server_url 2>/dev/null || echo "CHECK_OUTPUT_ABOVE")
echo "curl $SERVER_URL/languages"
echo "curl -X POST -H 'Content-Type: application/json' -d '{\"source_code\":\"print(\\\"Hello Judge0!\\\")\",\"language_id\":71}' $SERVER_URL/submissions?wait=true"
echo ""
echo "🔍 Monitor your deployment:"
echo "az containerapp logs show --name judge0-server --resource-group $(terraform output -raw resource_group_name 2>/dev/null || echo 'judge0-rg')"
