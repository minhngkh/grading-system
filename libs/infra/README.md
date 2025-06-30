# Judge0 on Azure - Terraform Infrastructure

Complete Terraform implementation for deploying Judge0 (server + workers) on Azure with true zero-cost scaling when idle.

## Architecture

```
Client → Container App (Judge0 Server) → External Redis ← Container Instances (Judge0 Workers)
                ↓                                                      ↑
        /workers endpoint                                    Autoscale based on
                ↓                                            /workers metrics
        Azure Monitor Autoscale Settings
```

## Features

- **Zero-cost scaling**: Both server and workers can scale to 0 instances when idle
- **Automatic HTTPS**: Container Apps provide SSL termination
- **Privileged workers**: Container Instances support required privileged mode for code execution
- **Environment-based configuration**: No config files needed, all via environment variables
- **Built-in monitoring**: Azure Monitor integration for autoscaling decisions
- **Secure secrets management**: Sensitive data stored as Container App secrets

## Cost Structure

### When Completely Idle
- Container App (Server): **$0** (0 instances)
- Container Instances (Workers): **~$25/month** (1 always-running instance for demo)
- Container Apps Environment: **$0** (consumption plan)
- Autoscale Settings: **$0** (free service)
- **Total: ~$25/month** (due to always-running worker for demonstration)

### When Active
- Container App (Server): ~$10-25/month (1-5 instances)
- Container Instances (Workers): ~$25/month (1 instance always running)
- **Total: ~$35-50/month under load**

**Note**: This simplified configuration uses a single always-running worker for demonstration purposes. Container Instances don't support autoscaling, so the worker runs continuously.

## Prerequisites

Before deploying, you need:

1. **Azure CLI** installed and configured
2. **Terraform** >= 1.0 installed
3. **External PostgreSQL database** (Azure Database for PostgreSQL, AWS RDS, etc.)
4. **External Redis instance** (Azure Cache for Redis, AWS ElastiCache, etc.)

## Quick Start

### 1. Clone and Setup

```bash
cd libs/infra
cp terraform.tfvars.example terraform.tfvars
```

### 2. Configure Your Variables

Edit `terraform.tfvars` with your database and Redis connection details:

```hcl
# Database Configuration
postgres_host     = "your-postgres-host.example.com"
postgres_db       = "judge0"
postgres_user     = "judge0"
postgres_password = "your-secure-database-password"

# Redis Configuration
redis_host     = "your-redis-host.example.com"
redis_password = "your-secure-redis-password"

# Optional: Customize location and scaling
location    = "East US"
max_workers = 10
max_servers = 5
```

### 3. Deploy

```bash
# Initialize Terraform
terraform init

# Review the deployment plan
terraform plan

# Deploy the infrastructure
terraform apply
```

### 4. Test Your Deployment

After deployment, Terraform will output the Judge0 server URL. Test it:

```bash
# Get the server URL from Terraform output
SERVER_URL=$(terraform output -raw judge0_server_url)

# Test basic connectivity
curl $SERVER_URL/languages

# Submit a test job
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello, Judge0!\")",
    "language_id": 71
  }' \
  $SERVER_URL/submissions?wait=true
```

## Configuration Reference

### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `postgres_host` | PostgreSQL server hostname | `my-db.postgres.database.azure.com` |
| `postgres_password` | PostgreSQL password | `SecurePassword123!` |
| `redis_host` | Redis server hostname | `my-cache.redis.cache.windows.net` |
| `redis_password` | Redis password/access key | `AccessKey123=` |

### Optional Variables

| Variable | Default | Description |
|----------|---------|-------------|
| `location` | `"East US"` | Azure region |
| `resource_group_name` | `"judge0-rg"` | Resource group name |
| `judge0_image_tag` | `"1.13.1"` | Judge0 Docker image version |
| `max_workers` | `10` | Maximum worker instances |
| `max_servers` | `5` | Maximum server instances |
| `postgres_port` | `"5432"` | PostgreSQL port |
| `postgres_db` | `"judge0"` | Database name |
| `postgres_user` | `"judge0"` | Database username |
| `redis_port` | `"6379"` | Redis port |
| `auth_token` | `""` | Optional API authentication token |

## Scaling Behavior

### Cold Start (0 → Active)
1. Client makes request to Container App FQDN
2. Container App scales from 0 to 1 (~30-60 seconds)
3. Job submitted to Redis queue
4. Worker is already running and picks up jobs immediately
5. System processes jobs with consistent performance

### Scale Down (Active → 0)
1. Jobs complete, queue becomes empty
2. Worker continues running (always available for new jobs)
3. Server has no requests for 15 minutes → Scales server to 0
4. Worker remains running for immediate job processing

**Note**: This simplified configuration keeps one worker always running for demonstration purposes. This ensures immediate job processing but sacrifices the zero-cost scaling for workers.

## Monitoring and Management

### View Deployment Status
```bash
# Check all resources
terraform show

# Get key outputs
terraform output

# Check specific output
terraform output judge0_server_url
```

### Monitor in Azure Portal
1. Go to the Azure Portal
2. Navigate to your resource group (`judge0-rg` by default)
3. View Container App and Container Instance metrics
4. Check autoscale settings and scaling history

### View Logs
```bash
# Container App logs
az containerapp logs show \
  --name judge0-server \
  --resource-group judge0-rg

# Container Instance logs
az container logs \
  --name judge0-workers \
  --resource-group judge0-rg
```

## API Usage Examples

### Submit Code for Execution
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{
    "source_code": "print(\"Hello World\")",
    "language_id": 71,
    "stdin": ""
  }' \
  https://your-judge0-url.azurecontainerapps.io/submissions?wait=true
```

### Check Worker Status
```bash
curl https://your-judge0-url.azurecontainerapps.io/workers
```

### Get Supported Languages
```bash
curl https://your-judge0-url.azurecontainerapps.io/languages
```

## Troubleshooting

### Common Issues

#### 1. Database Connection Failed
- Verify `postgres_host`, `postgres_user`, and `postgres_password`
- Ensure your PostgreSQL server allows connections from Azure
- Check if the database `judge0` exists

#### 2. Redis Connection Failed
- Verify `redis_host` and `redis_password`
- Ensure your Redis instance allows connections from Azure
- Check if Redis is using the default port 6379

#### 3. Workers Not Starting
- Check Container Instance logs for errors
- Verify privileged mode is enabled (handled automatically)
- Check if Redis queue has jobs pending

#### 4. Slow Cold Start
- This is expected behavior for zero-cost scaling
- First request after idle period takes 30-60 seconds
- Consider keeping 1 instance warm if cold starts are problematic

### Debug Commands

```bash
# Check Terraform state
terraform state list

# View specific resource
terraform state show azurerm_container_app.judge0_server

# Check for configuration drift
terraform plan

# Force refresh state
terraform refresh
```

## Security Considerations

- Container App has automatic HTTPS (SSL termination)
- Workers run in private network (no public access)
- Privileged mode only for workers (required for sandboxing)
- Sensitive credentials stored as Container App secrets
- External Redis/PostgreSQL handle their own security
- Optional API authentication via `AUTHN_TOKEN`

## Cleanup

To remove all resources:

```bash
terraform destroy
```

This will delete all Azure resources created by this deployment.

## Advanced Configuration

### Custom Resource Limits
Modify environment variables in `container-apps.tf` and `container-instances.tf`:

```hcl
env {
  name  = "MAX_CPU_TIME_LIMIT"
  value = "30"  # Increase from default 15 seconds
}
```

### Custom Scaling Rules
Modify autoscale settings in `autoscale.tf` to adjust scaling thresholds and timing.

### Multiple Environments
Create separate `.tfvars` files for different environments:

```bash
# Development
terraform apply -var-file="dev.tfvars"

# Production
terraform apply -var-file="prod.tfvars"
```

## Support

For issues with:
- **Judge0**: See [Judge0 documentation](https://github.com/judge0/judge0)
- **Azure services**: Check Azure documentation
- **This Terraform code**: Review the configuration files and logs

## License

This Terraform configuration is provided as-is for deploying Judge0 on Azure.
