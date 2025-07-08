#!/bin/bash

# Judge0 on Azure - Testing Script
# Script to test the deployed Judge0 infrastructure

set -e

echo "🧪 Judge0 on Azure - Testing Script"
echo "==================================="

# Check if curl is available
if ! command -v curl &> /dev/null; then
    echo "❌ curl is not installed. Please install curl first."
    exit 1
fi

# Get server URL from Terraform output
if [ ! -f "terraform.tfstate" ]; then
    echo "❌ No terraform.tfstate found. Please deploy first using ./deploy.sh"
    exit 1
fi

SERVER_URL=$(terraform output -raw judge0_server_url 2>/dev/null)

if [ -z "$SERVER_URL" ]; then
    echo "❌ Could not get server URL from Terraform output."
    exit 1
fi

echo "🔗 Testing Judge0 server at: $SERVER_URL"
echo ""

# Test 1: Basic connectivity
echo "🔍 Test 1: Basic connectivity..."
if curl -s --max-time 30 "$SERVER_URL" > /dev/null; then
    echo "✅ Server is responding"
else
    echo "❌ Server is not responding (this is normal if scaling from 0 - try again in 1-2 minutes)"
    echo "💡 Cold start can take 30-60 seconds when scaling from 0 instances"
    exit 1
fi

echo ""

# Test 2: Get supported languages
echo "🔍 Test 2: Getting supported languages..."
LANGUAGES_RESPONSE=$(curl -s --max-time 30 "$SERVER_URL/languages" || echo "FAILED")

if [[ "$LANGUAGES_RESPONSE" == *"[{"* ]]; then
    LANG_COUNT=$(echo "$LANGUAGES_RESPONSE" | grep -o '"id":' | wc -l)
    echo "✅ Languages endpoint working - $LANG_COUNT languages available"
else
    echo "❌ Languages endpoint failed"
    echo "Response: $LANGUAGES_RESPONSE"
fi

echo ""

# Test 3: Submit a simple Hello World job
echo "🔍 Test 3: Submitting Hello World job (Python)..."
SUBMISSION_DATA='{
    "source_code": "print(\"Hello from Judge0 on Azure!\")",
    "language_id": 71,
    "stdin": ""
}'

SUBMISSION_RESPONSE=$(curl -s --max-time 60 \
    -X POST \
    -H "Content-Type: application/json" \
    -d "$SUBMISSION_DATA" \
    "$SERVER_URL/submissions?wait=true" || echo "FAILED")

if [[ "$SUBMISSION_RESPONSE" == *"Hello from Judge0 on Azure!"* ]]; then
    echo "✅ Code execution working - Hello World job completed successfully"
    echo "📄 Output: $(echo "$SUBMISSION_RESPONSE" | grep -o '"stdout":"[^"]*"' | cut -d'"' -f4)"
else
    echo "❌ Code execution failed or timed out"
    echo "💡 This might be normal if workers are starting up (can take 2-3 minutes)"
    echo "Response: $SUBMISSION_RESPONSE"
fi

echo ""

# Test 4: Check workers endpoint
echo "🔍 Test 4: Checking workers status..."
WORKERS_RESPONSE=$(curl -s --max-time 30 "$SERVER_URL/workers" || echo "FAILED")

if [[ "$WORKERS_RESPONSE" == *"["* ]]; then
    echo "✅ Workers endpoint responding"
    echo "📊 Workers info: $WORKERS_RESPONSE"
else
    echo "❌ Workers endpoint failed"
    echo "Response: $WORKERS_RESPONSE"
fi

echo ""

# Summary
echo "📋 Test Summary"
echo "==============="
echo "🔗 Server URL: $SERVER_URL"
echo "📚 API Endpoints:"
echo "   - Languages: $SERVER_URL/languages"
echo "   - Submissions: $SERVER_URL/submissions"
echo "   - Workers: $SERVER_URL/workers"
echo ""
echo "💡 Usage Examples:"
echo ""
echo "# Get all supported languages"
echo "curl $SERVER_URL/languages"
echo ""
echo "# Submit code for execution (Python)"
echo "curl -X POST \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"source_code\":\"print(\\\"Hello World\\\")\",\"language_id\":71}' \\"
echo "  '$SERVER_URL/submissions?wait=true'"
echo ""
echo "# Submit code for execution (JavaScript)"
echo "curl -X POST \\"
echo "  -H 'Content-Type: application/json' \\"
echo "  -d '{\"source_code\":\"console.log(\\\"Hello World\\\")\",\"language_id\":63}' \\"
echo "  '$SERVER_URL/submissions?wait=true'"
echo ""
echo "🎉 Testing completed! Your Judge0 deployment is ready to use."
