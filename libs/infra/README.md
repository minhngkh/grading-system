# Azure Infrastructure for Grading System

This directory contains Terraform configuration for deploying the Grading System infrastructure to Azure.

## Prerequisites

1. **Azure CLI** - Install and login to your Azure account
   ```bash
   az login
   ```

2. **Terraform** - Install Terraform >= 1.12.0
   ```bash
   # Check version
   terraform version
   ```

3. **Azure Subscription** - Ensure you have appropriate permissions to create resources

## Quick Start

### 1. Initialize Terraform

```bash
cd libs/infra
terraform init
```

### 2. Plan the Deployment

```bash
terraform plan -var="name=grading-system-dev" -var="environment=development"
```

### 3. Deploy the Infrastructure

```bash
terraform apply -var="name=grading-system-dev" -var="environment=development"
```

### 4. Get Output Values

```bash
# Get all outputs
terraform output

# Get Service Bus connection string (sensitive)
terraform output -raw servicebus_connection_string
```

## Configuration Variables

| Variable | Description | Default | Required |
|----------|-------------|---------|----------|
| `name` | Name prefix for all resources | - | Yes |
| `environment` | Environment (development, staging, production) | `development` | No |
| `region` | Azure region for deployment | `Southeast Asia` | No |

## Deployed Resources

### Current Phase - Service Bus Only

- **Resource Group**: Container for all resources
- **Log Analytics Workspace**: For monitoring and logging
- **Service Bus Namespace**: Message broker for inter-service communication
- **Service Bus Queues**: 
  - `grading-requests`: For grading job requests
  - `grading-results`: For grading job results  
  - `assignment-notifications`: For assignment-related notifications
  - `plugin-events`: For plugin system events
- **Service Bus Topic**: `system-events` for pub/sub messaging
- **Service Bus Subscriptions**: For each service to consume events

## Environment-Specific Configurations

### Development
- Service Bus: Standard tier
- Log Analytics: 30-day retention
- Auto-delete idle subscriptions after 5 minutes

### Production
- Service Bus: Premium tier (recommended)
- Log Analytics: 90+ day retention
- Persistent subscriptions

## Cost Estimation

### Development Environment
- Service Bus Standard: ~$10/month
- Log Analytics: ~$5-15/month (depending on ingestion)
- **Total**: ~$15-25/month

### Production Environment  
- Service Bus Premium: ~$50-100/month
- Log Analytics: ~$20-50/month
- **Total**: ~$70-150/month

## Connection Strings

After deployment, retrieve connection strings for your applications:

```bash
# For application connections (send/listen only)
terraform output -raw servicebus_connection_string

# For management operations
terraform output -raw servicebus_management_connection_string
```

## Security Notes

1. **Connection Strings**: Never commit connection strings to source control
2. **Managed Identity**: Future phases will use managed identity for authentication
3. **Access Rules**: Separate authorization rules for applications vs management
4. **Network Security**: Future phases will include VNet integration

## Troubleshooting

### Common Issues

1. **Resource Name Conflicts**
   ```bash
   # Add environment suffix if names conflict
   terraform apply -var="name=grading-system-dev-$(whoami)"
   ```

2. **Permission Issues**
   ```bash
   # Ensure you have Contributor role on the subscription
   az role assignment list --assignee $(az account show --query user.name -o tsv)
   ```

3. **Region Availability**
   ```bash
   # Check if Service Bus is available in your region
   az provider show --namespace Microsoft.ServiceBus --query "resourceTypes[?resourceType=='namespaces'].locations"
   ```

## Next Steps

This deployment creates the foundational messaging infrastructure. The next phases will add:

1. **Storage Account** - For blob storage (submissions, rubric contexts)
2. **Container Apps Environment** - For hosting the microservices
3. **Application Insights** - For application monitoring
4. **Key Vault** - For secrets management

## Cleanup

To destroy all resources:

```bash
terraform destroy -var="name=grading-system-dev" -var="environment=development"
```

⚠️ **Warning**: This will permanently delete all resources and data. Use with caution!

## Support

For issues or questions:
1. Check the [deployment plan](../../plan/azure-deployment-plan.md)
2. Review Terraform documentation
3. Check Azure Service Bus documentation
