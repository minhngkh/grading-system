#!/bin/bash

# Judge0 on Azure - Cleanup Script
# Script to safely destroy all Judge0 infrastructure

set -e

echo "🗑️  Judge0 on Azure - Cleanup Script"
echo "===================================="

# Check if terraform is installed
if ! command -v terraform &> /dev/null; then
    echo "❌ Terraform is not installed."
    exit 1
fi

# Check if terraform.tfstate exists
if [ ! -f "terraform.tfstate" ]; then
    echo "❌ No terraform.tfstate found. Nothing to cleanup."
    exit 0
fi

echo "⚠️  WARNING: This will destroy ALL Judge0 infrastructure!"
echo "This includes:"
echo "- Container Apps (Judge0 Server)"
echo "- Container Instances (Judge0 Workers)"
echo "- Autoscale Settings"
echo "- Log Analytics Workspace"
echo "- Resource Group and all resources"
echo ""

# Show what will be destroyed
echo "📋 Resources that will be destroyed:"
terraform plan -destroy

echo ""
echo "⚠️  IMPORTANT: This action cannot be undone!"
echo "⚠️  Make sure you have backups of any important data!"
echo ""

# Double confirmation
read -p "Are you absolutely sure you want to destroy all resources? (type 'yes' to confirm): " confirm1

if [ "$confirm1" != "yes" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

read -p "This will permanently delete all Judge0 infrastructure. Type 'DESTROY' to confirm: " confirm2

if [ "$confirm2" != "DESTROY" ]; then
    echo "❌ Cleanup cancelled."
    exit 0
fi

echo ""

# Destroy infrastructure
echo "🗑️  Destroying Judge0 infrastructure..."
terraform destroy -auto-approve

echo ""
echo "✅ All Judge0 infrastructure has been successfully destroyed."
echo ""
echo "📋 Cleanup completed:"
echo "- All Azure resources have been deleted"
echo "- terraform.tfstate still exists for reference"
echo "- Your terraform.tfvars file is preserved"
echo ""
echo "💡 To deploy again, run: ./deploy.sh"
