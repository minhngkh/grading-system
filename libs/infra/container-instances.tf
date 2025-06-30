# Judge0 Workers - Container Instances Configuration
# Single worker instance for demonstration purposes

# Judge0 Worker - Single Container Group (Always Running)
resource "azurerm_container_group" "judge0_workers" {
  name                = "judge0-workers"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_address_type     = "None"
  os_type             = "Linux"
  restart_policy      = "Always" # Changed to Always for demonstration

  container {
    name   = "judge0-worker"
    image  = "judge0/judge0:${var.judge0_image_tag}"
    cpu    = "1.0"
    memory = "2.0"

    # Command to start workers (overrides default entrypoint)
    commands = ["./scripts/workers"]

    security {
      privilege_enabled = true
    }

    # Environment variables configuration
    environment_variables = {
      REDIS_HOST    = var.redis_host
      REDIS_USE_SSL = "true"
    }

    secure_environment_variables = {
      DATABASE_URL = var.postgres_url
      REDIS_URL    = var.redis_url
    }
  }

  tags = {
    Environment = "production"
    Application = "judge0"
    Component   = "worker"
  }
}

# Note: For demonstration purposes, we use a single always-running worker instance
# Container Instances do not support autoscaling, so this provides a simple setup
# for testing Judge0 functionality without complex scaling logic
