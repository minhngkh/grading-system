# Azure Deployment Plan for Grading System

## Overview

This plan outlines the deployment of the Grading System monorepo to Azure using Terraform. The system consists of microservices including .NET Core applications (RubricEngine, AssignmentFlow), Node.js services (PluginService), and Azure Storage services.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                          Azure Cloud                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Assignment     │  │  Rubric         │  │  Plugin         │  │
│  │  Flow Service   │  │  Engine         │  │  Service        │  │
│  │  (.NET 9)       │  │  (.NET 9)       │  │  (Node.js)      │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
│           │                     │                     │         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Azure Container Apps                          │  │
│  └─────────────────────────────────────────────────────────────┘  │
│           │                     │                     │         │
│  ┌─────────────────────────────────────────────────────────────┐  │
│  │              Azure Service Bus (RabbitMQ)                  │  │
│  └─────────────────────────────────────────────────────────────┘  │
│           │                     │                     │         │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐  │
│  │  Submission     │  │  Rubric Context │  │  Azure Storage  │  │
│  │  Store          │  │  Store          │  │  Account        │  │
│  │  (Blob)         │  │  (Blob)         │  │                 │  │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Services to Deploy

### 1. Core Services
- **RubricEngine**: .NET 9 gRPC/HTTP service for rubric management
- **AssignmentFlow**: .NET 9 HTTP service for assignment workflow
- **PluginService**: Node.js service for plugin management and AI features

### 2. Storage Services
- **submissionStore**: Azure Blob Storage container for student submissions
- **rubricContextStore**: Azure Blob Storage container for rubric contexts

### 3. Infrastructure Services
- **Azure Service Bus**: Message broker (replacing RabbitMQ for cloud)
- **Azure Storage Account**: Unified storage for blob containers
- **Azure Log Analytics**: Centralized logging and monitoring

## Deployment Strategy

### Phase 1: Infrastructure Setup
1. Create Terraform configuration for Azure resources
2. Set up Azure Storage Account with blob containers
3. Configure Azure Service Bus for messaging
4. Set up Log Analytics workspace for monitoring

### Phase 2: Container Registry & Image Management
1. Use DockerHub as container registry (cost-effective)
2. Create Dockerfiles for each service
3. Set up GitHub Actions for CI/CD pipeline
4. Automate image builds and pushes to DockerHub

### Phase 3: Container Apps Deployment
1. Deploy services to Azure Container Apps
2. Configure service-to-service communication
3. Set up environment variables and secrets
4. Configure scaling policies

### Phase 4: Service Integration
1. Configure blob storage access
2. Set up Service Bus integration
3. Test inter-service communication
4. Validate end-to-end functionality

## Terraform Configuration Structure

```
libs/infra/
├── main.tf                 # Main Terraform configuration
├── variables.tf            # Input variables (existing)
├── outputs.tf              # Output values
├── versions.tf             # Provider versions (existing)
├── resource-group.tf       # Resource group (existing)
├── storage.tf              # Storage Account and containers
├── service-bus.tf          # Azure Service Bus
├── container-apps.tf       # Container Apps Environment and apps
├── log-analytics.tf        # Log Analytics (existing)
└── monitoring.tf           # Application Insights and monitoring
```

## Required Azure Resources

### 1. Storage Account
```hcl
resource "azurerm_storage_account" "main" {
  name                     = "${var.name}storage${random_string.suffix.result}"
  resource_group_name      = azurerm_resource_group.main.name
  location                = azurerm_resource_group.main.location
  account_tier            = "Standard"
  account_replication_type = "LRS"
  
  blob_properties {
    cors_rule {
      allowed_headers    = ["*"]
      allowed_methods    = ["GET", "POST", "PUT"]
      allowed_origins    = ["*"]
      exposed_headers    = ["*"]
      max_age_in_seconds = 3600
    }
  }
}

resource "azurerm_storage_container" "submissions" {
  name                  = "submissions-store"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}

resource "azurerm_storage_container" "rubric_context" {
  name                  = "rubric-context-store"
  storage_account_name  = azurerm_storage_account.main.name
  container_access_type = "private"
}
```

### 2. Service Bus
```hcl
resource "azurerm_servicebus_namespace" "main" {
  name                = "${var.name}-servicebus"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Standard"
}
```

### 3. Container Apps Environment
```hcl
resource "azurerm_container_app_environment" "main" {
  name                       = "${var.name}-containerenv"
  location                   = azurerm_resource_group.main.location
  resource_group_name        = azurerm_resource_group.main.name
  log_analytics_workspace_id = azurerm_log_analytics_workspace.log.id
}
```

### 4. Container Apps for Services
```hcl
resource "azurerm_container_app" "rubric_engine" {
  name                         = "${var.name}-rubric-engine"
  container_app_environment_id = azurerm_container_app_environment.main.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode               = "Single"

  template {
    container {
      name   = "rubric-engine"
      image  = "your-dockerhub-username/grading-system-rubric-engine:latest"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name  = "ASPNETCORE_ENVIRONMENT"
        value = "Production"
      }
      
      env {
        name        = "ConnectionStrings__RubricContextStore"
        secret_name = "storage-connection-string"
      }
    }
  }

  secret {
    name  = "storage-connection-string"
    value = azurerm_storage_account.main.primary_connection_string
  }

  ingress {
    external_enabled = true
    target_port      = 8080
  }
}
```

## Container Images Setup

### 1. .NET Services Dockerfile Template
```dockerfile
# Base image for .NET services
FROM mcr.microsoft.com/dotnet/aspnet:9.0 AS base
WORKDIR /app
EXPOSE 8080

FROM mcr.microsoft.com/dotnet/sdk:9.0 AS build
WORKDIR /src

# Copy project files
COPY ["Directory.Packages.props", "."]
COPY ["apps/rubric-engine/application/RubricEngine.Application.csproj", "apps/rubric-engine/application/"]
COPY ["libs/shared-dotnet/Shared.ValueObjects/Shared.ValueObjects.csproj", "libs/shared-dotnet/Shared.ValueObjects/"]
COPY ["tools/service-defaults/GradingSystem.ServiceDefaults.csproj", "tools/service-defaults/"]

# Restore dependencies
RUN dotnet restore "apps/rubric-engine/application/RubricEngine.Application.csproj"

# Copy source code
COPY . .
WORKDIR "/src/apps/rubric-engine/application"

# Build
RUN dotnet build "RubricEngine.Application.csproj" -c Release -o /app/build

FROM build AS publish
RUN dotnet publish "RubricEngine.Application.csproj" -c Release -o /app/publish

FROM base AS final
WORKDIR /app
COPY --from=publish /app/publish .
ENTRYPOINT ["dotnet", "RubricEngine.Application.dll"]
```

### 2. Node.js Service Dockerfile
```dockerfile
# Multi-stage build for Node.js services
FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@latest --activate

FROM base AS deps
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/plugin-service/package.json ./apps/plugin-service/
COPY libs/*/package.json ./libs/*/
RUN pnpm install --frozen-lockfile --prod

FROM base AS build
WORKDIR /app
COPY package.json pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/plugin-service/package.json ./apps/plugin-service/
COPY libs/*/package.json ./libs/*/
RUN pnpm install --frozen-lockfile

COPY . .
WORKDIR /app/apps/plugin-service
RUN pnpm build

FROM base AS runtime
WORKDIR /app
COPY --from=deps /app/node_modules ./node_modules
COPY --from=build /app/apps/plugin-service/dist ./apps/plugin-service/dist
COPY --from=build /app/apps/plugin-service/package.json ./apps/plugin-service/

EXPOSE 3000
CMD ["node", "apps/plugin-service/dist/index.js"]
```

## Environment Variables Configuration

### Common Environment Variables
```yaml
# Storage Configuration
ConnectionStrings__submissions-store: Azure Storage connection string
ConnectionStrings__rubric-context-store: Azure Storage connection string

# Service Bus Configuration
ConnectionStrings__ServiceBus: Azure Service Bus connection string

# Logging Configuration
APPLICATIONINSIGHTS_CONNECTION_STRING: Application Insights connection string
```

### Service-Specific Variables

#### RubricEngine
```yaml
ASPNETCORE_ENVIRONMENT: Production
ASPNETCORE_URLS: "http://+:8080"
Logging__LogLevel__Default: Information
```

#### AssignmentFlow
```yaml
ASPNETCORE_ENVIRONMENT: Production
ASPNETCORE_URLS: "http://+:8080"
Logging__LogLevel__Default: Information
```

#### PluginService
```yaml
NODE_ENV: production
PORT: "3000"
LOG_LEVEL: info
```

## Security Configuration

### 1. Managed Identity
```hcl
resource "azurerm_user_assigned_identity" "container_apps" {
  name                = "${var.name}-container-identity"
  resource_group_name = azurerm_resource_group.main.name
  location            = azurerm_resource_group.main.location
}

# Assign Storage Blob Data Contributor role
resource "azurerm_role_assignment" "storage" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.container_apps.principal_id
}
```

### 2. Key Vault Integration
```hcl
resource "azurerm_key_vault" "main" {
  name                = "${var.name}-keyvault"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  tenant_id           = data.azurerm_client_config.current.tenant_id
  sku_name           = "standard"
}

resource "azurerm_key_vault_secret" "storage_connection" {
  name         = "storage-connection-string"
  value        = azurerm_storage_account.main.primary_connection_string
  key_vault_id = azurerm_key_vault.main.id
}
```

## CI/CD Pipeline Configuration

### GitHub Actions Workflow
```yaml
name: Deploy to Azure

on:
  push:
    branches: [main]
  workflow_dispatch:

jobs:
  build-and-deploy:
    runs-on: ubuntu-latest
    
    steps:
    - uses: actions/checkout@v4
    
    - name: Setup .NET
      uses: actions/setup-dotnet@v4
      with:
        dotnet-version: 9.0.x
        
    - name: Setup Node.js
      uses: actions/setup-node@v4
      with:
        node-version: '22'
        
    - name: Setup pnpm
      uses: pnpm/action-setup@v2
      with:
        version: latest
        
    - name: Login to DockerHub
      uses: docker/login-action@v3
      with:
        username: ${{ secrets.DOCKERHUB_USERNAME }}
        password: ${{ secrets.DOCKERHUB_TOKEN }}
        
    - name: Build and push RubricEngine
      run: |
        docker build -f apps/rubric-engine/Dockerfile -t ${{ secrets.DOCKERHUB_USERNAME }}/grading-system-rubric-engine:${{ github.sha }} .
        docker push ${{ secrets.DOCKERHUB_USERNAME }}/grading-system-rubric-engine:${{ github.sha }}
        
    - name: Build and push AssignmentFlow
      run: |
        docker build -f apps/assignment-flow/Dockerfile -t ${{ secrets.DOCKERHUB_USERNAME }}/grading-system-assignment-flow:${{ github.sha }} .
        docker push ${{ secrets.DOCKERHUB_USERNAME }}/grading-system-assignment-flow:${{ github.sha }}
        
    - name: Build and push PluginService
      run: |
        docker build -f apps/plugin-service/Dockerfile -t ${{ secrets.DOCKERHUB_USERNAME }}/grading-system-plugin-service:${{ github.sha }} .
        docker push ${{ secrets.DOCKERHUB_USERNAME }}/grading-system-plugin-service:${{ github.sha }}
        
    - name: Setup Terraform
      uses: hashicorp/setup-terraform@v2
      
    - name: Terraform Apply
      working-directory: libs/infra
      run: |
        terraform init
        terraform plan -var="container_image_tag=${{ github.sha }}"
        terraform apply -auto-approve -var="container_image_tag=${{ github.sha }}"
      env:
        ARM_CLIENT_ID: ${{ secrets.AZURE_CLIENT_ID }}
        ARM_CLIENT_SECRET: ${{ secrets.AZURE_CLIENT_SECRET }}
        ARM_SUBSCRIPTION_ID: ${{ secrets.AZURE_SUBSCRIPTION_ID }}
        ARM_TENANT_ID: ${{ secrets.AZURE_TENANT_ID }}
```

## Monitoring and Observability

### Application Insights Configuration
```hcl
resource "azurerm_application_insights" "main" {
  name                = "${var.name}-appinsights"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  workspace_id        = azurerm_log_analytics_workspace.log.id
  application_type    = "web"
}
```

### Custom Metrics and Alerts
```hcl
resource "azurerm_monitor_metric_alert" "cpu_usage" {
  name                = "${var.name}-cpu-alert"
  resource_group_name = azurerm_resource_group.main.name
  scopes              = [azurerm_container_app_environment.main.id]
  description         = "CPU usage is above 80%"

  criteria {
    metric_namespace = "Microsoft.App/containerApps"
    metric_name      = "CpuPercentage"
    aggregation      = "Average"
    operator         = "GreaterThan"
    threshold        = 80
  }

  action {
    action_group_id = azurerm_monitor_action_group.main.id
  }
}
```

## Scaling Configuration

### Auto-scaling Rules
```hcl
resource "azurerm_container_app" "rubric_engine" {
  # ... other configuration ...
  
  template {
    min_replicas = 1
    max_replicas = 10
    
    # ... container configuration ...
  }
  
  scale_rule {
    name = "http-rule"
    http {
      concurrent_requests = 100
    }
  }
  
  scale_rule {
    name = "cpu-rule"
    custom {
      type = "cpu"
      metadata = {
        type  = "Utilization"
        value = "70"
      }
    }
  }
}
```

## Network Security

### Virtual Network Integration
```hcl
resource "azurerm_virtual_network" "main" {
  name                = "${var.name}-vnet"
  address_space       = ["10.0.0.0/16"]
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
}

resource "azurerm_subnet" "container_apps" {
  name                 = "container-apps-subnet"
  resource_group_name  = azurerm_resource_group.main.name
  virtual_network_name = azurerm_virtual_network.main.name
  address_prefixes     = ["10.0.1.0/24"]
  
  delegation {
    name = "container-apps-delegation"
    service_delegation {
      name = "Microsoft.App/environments"
    }
  }
}
```

## Cost Optimization

### Resource Sizing Recommendations

#### Development Environment
- **Container Apps**: 0.25 CPU, 0.5Gi memory per service
- **Storage Account**: Standard LRS
- **Service Bus**: Standard tier
- **Log Analytics**: Pay-as-you-go

#### Production Environment
- **Container Apps**: 0.5-1 CPU, 1-2Gi memory per service
- **Storage Account**: Standard GRS for redundancy
- **Service Bus**: Premium for higher throughput
- **Log Analytics**: Commitment tier based on usage

### Estimated Monthly Costs

#### Development Environment
- Container Apps: ~$20-30/month
- Storage Account: ~$5-10/month
- Service Bus: ~$10/month
- Log Analytics: ~$5-15/month
- **Total**: ~$40-65/month

#### Production Environment
- Container Apps: ~$100-200/month
- Storage Account: ~$20-50/month
- Service Bus: ~$50-100/month
- Log Analytics: ~$20-50/month
- **Total**: ~$190-400/month

## Deployment Steps

### Prerequisites
1. Azure subscription with appropriate permissions
2. DockerHub account for container registry
3. Terraform installed locally
4. Azure CLI installed and configured
5. GitHub repository with secrets configured

### Step-by-Step Deployment

#### 1. Prepare Infrastructure Code
```bash
# Clone the repository
git clone <your-repo-url>
cd grading-system

# Navigate to infrastructure directory
cd libs/infra

# Initialize Terraform
terraform init
```

#### 2. Create Dockerfiles
Create Dockerfiles for each service in their respective directories:
- `apps/rubric-engine/Dockerfile`
- `apps/assignment-flow/Dockerfile`
- `apps/plugin-service/Dockerfile`

#### 3. Set up GitHub Secrets
Configure the following secrets in your GitHub repository:
- `DOCKERHUB_USERNAME`
- `DOCKERHUB_TOKEN`
- `AZURE_CLIENT_ID`
- `AZURE_CLIENT_SECRET`
- `AZURE_SUBSCRIPTION_ID`
- `AZURE_TENANT_ID`

#### 4. Deploy Infrastructure
```bash
# Plan the deployment
terraform plan -var="name=grading-system-dev" -var="environment=development"

# Apply the configuration
terraform apply -var="name=grading-system-dev" -var="environment=development"
```

#### 5. Build and Push Container Images
```bash
# Build and push images manually for initial deployment
docker build -f apps/rubric-engine/Dockerfile -t yourusername/grading-system-rubric-engine:latest .
docker push yourusername/grading-system-rubric-engine:latest

docker build -f apps/assignment-flow/Dockerfile -t yourusername/grading-system-assignment-flow:latest .
docker push yourusername/grading-system-assignment-flow:latest

docker build -f apps/plugin-service/Dockerfile -t yourusername/grading-system-plugin-service:latest .
docker push yourusername/grading-system-plugin-service:latest
```

#### 6. Verify Deployment
```bash
# Check Container Apps status
az containerapp list --resource-group grading-system-dev --output table

# Check storage account
az storage account list --resource-group grading-system-dev --output table

# Check service bus
az servicebus namespace list --resource-group grading-system-dev --output table
```

#### 7. Configure DNS and SSL (Optional)
For production deployments, configure custom domains and SSL certificates through Azure Front Door or Application Gateway.

## Troubleshooting Guide

### Common Issues and Solutions

#### 1. Container App Startup Issues
```bash
# Check container app logs
az containerapp logs show --name grading-system-dev-rubric-engine --resource-group grading-system-dev

# Check revision status
az containerapp revision list --name grading-system-dev-rubric-engine --resource-group grading-system-dev
```

#### 2. Storage Access Issues
- Verify managed identity has correct permissions
- Check storage account firewall settings
- Validate connection strings in Key Vault

#### 3. Service Communication Issues
- Verify Service Bus configuration
- Check network security groups
- Validate service discovery settings

### Monitoring and Alerting

#### Key Metrics to Monitor
- Container CPU and memory usage
- HTTP response times and error rates
- Storage account transaction rates
- Service Bus message processing rates

#### Recommended Alerts
- High CPU usage (>80%)
- High memory usage (>85%)
- HTTP error rate (>5%)
- Storage account throttling
- Service Bus dead letter queue messages

## Future Enhancements

### Phase 2 Improvements
1. **Service Mesh**: Implement Istio or Linkerd for advanced traffic management
2. **GitOps**: Implement ArgoCD or Flux for GitOps-based deployments
3. **Blue-Green Deployments**: Set up automated blue-green deployment strategy
4. **Multi-region**: Deploy across multiple Azure regions for high availability

### Security Enhancements
1. **Network Policies**: Implement network segmentation and policies
2. **Pod Security Standards**: Enforce pod security policies
3. **Vulnerability Scanning**: Integrate container image vulnerability scanning
4. **Secret Rotation**: Implement automated secret rotation

### Performance Optimizations
1. **Caching Layer**: Implement Redis for caching frequently accessed data
2. **CDN**: Use Azure CDN for static content delivery
3. **Database Optimization**: Fine-tune database performance and indexing
4. **Load Testing**: Implement automated load testing in CI/CD pipeline

## Maintenance and Updates

### Regular Maintenance Tasks
1. **Security Updates**: Regularly update container base images
2. **Cost Review**: Monthly cost analysis and optimization
3. **Performance Review**: Quarterly performance analysis
4. **Backup Verification**: Regular backup and restore testing

### Update Process
1. **Staging Deployment**: Always deploy to staging environment first
2. **Automated Testing**: Run comprehensive test suite
3. **Gradual Rollout**: Use canary deployments for production updates
4. **Rollback Plan**: Maintain ability to quickly rollback changes

This deployment plan provides a comprehensive approach to deploying your grading system to Azure using modern cloud-native practices while optimizing for cost and maintainability.
