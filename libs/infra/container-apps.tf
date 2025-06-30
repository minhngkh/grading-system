# Judge0 Server - Container Apps Configuration
# Container Apps Environment and Judge0 Server deployment

# Container Apps Environment - Consumption Plan (serverless)
resource "azurerm_container_app_environment" "judge0_env" {
  name                = "judge0-env"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  # log_analytics_workspace_id = azurerm_log_analytics_workspace.judge0_logs.id

  tags = {
    Environment = "production"
    Application = "judge0"
    Component   = "container-apps-environment"
  }
}

# Log Analytics Workspace for Container Apps
# resource "azurerm_log_analytics_workspace" "judge0_logs" {
#   name                = "judge0-logs"
#   location            = azurerm_resource_group.main.location
#   resource_group_name = azurerm_resource_group.main.name
#   sku                 = "PerGB2018"
#   retention_in_days   = 30

#   tags = {
#     Environment = "production"
#     Application = "judge0"
#     Component   = "logging"
#   }
# }

# Judge0 Server - Container App
resource "azurerm_container_app" "judge0_server" {
  name                         = "judge0-server"
  container_app_environment_id = azurerm_container_app_environment.judge0_env.id
  resource_group_name          = azurerm_resource_group.main.name
  revision_mode                = "Single"

  template {
    # Scaling configuration - can scale to 0
    min_replicas = 0
    max_replicas = var.max_servers

    container {
      name   = "judge0-server"
      image  = "judge0/judge0:${var.judge0_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      env {
        name        = "DATABASE_URL"
        secret_name = "database-url"
      }

      env {
        name        = "REDIS_URL"
        secret_name = "redis-url"
      }
      env {
        name  = "REDIS_HOST"
        value = var.redis_host
      }
      # env {
      #   name  = "REDIS_PORT"
      #   value = var.redis_port
      # }
      # env {
      #   name        = "REDIS_PASSWORD"
      #   secret_name = "redis-password"
      # }
      env {
        name  = "REDIS_USE_SSL"
        value = "true"
      }

      dynamic "env" {
        for_each = var.auth_token != "" ? [1] : []
        content {
          name  = "AUTHN_HEADER"
          value = "X-Auth-Token"
        }
      }
      dynamic "env" {
        for_each = var.auth_token != "" ? [1] : []
        content {
          name        = "AUTHN_TOKEN"
          secret_name = "auth-token"
        }
      }
    }
  }

  # Ingress configuration - HTTPS enabled
  ingress {
    external_enabled           = true
    target_port                = 2358
    transport                  = "http"
    allow_insecure_connections = false

    traffic_weight {
      percentage      = 100
      latest_revision = true
    }
  }

  secret {
    name  = "redis-password"
    value = var.redis_password
  }

  secret {
    name  = "database-url"
    value = var.postgres_url
  }

  secret {
    name  = "redis-url"
    value = var.redis_url
  }

  # Conditional secret for auth token (only if provided)
  dynamic "secret" {
    for_each = var.auth_token != "" ? [1] : []
    content {
      name  = "auth-token"
      value = var.auth_token
    }
  }

  tags = {
    Environment = "production"
    Application = "judge0"
    Component   = "server"
  }
}
