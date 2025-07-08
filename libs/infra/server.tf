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

    # HTTP-based scaling rules
    http_scale_rule {
      name                = "http-requests"
      concurrent_requests = 10
    }

    container {
      name   = "judge0-server"
      image  = "judge0/judge0:${var.judge0_image_tag}"
      cpu    = 0.25
      memory = "0.5Gi"

      # Database and Redis Configuration
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
      env {
        name  = "REDIS_USE_SSL"
        value = var.redis_use_ssl
      }

      # Judge0 Server Configuration
      env {
        name  = "JUDGE0_TELEMETRY_ENABLE"
        value = var.judge0_telemetry_enable
      }
      env {
        name  = "RESTART_MAX_TRIES"
        value = var.restart_max_tries
      }
      env {
        name  = "MAINTENANCE_MODE"
        value = var.maintenance_mode
      }
      env {
        name  = "MAINTENANCE_MESSAGE"
        value = var.maintenance_message
      }
      env {
        name  = "ENABLE_WAIT_RESULT"
        value = var.enable_wait_result
      }
      env {
        name  = "ENABLE_COMPILER_OPTIONS"
        value = var.enable_compiler_options
      }
      env {
        name  = "ALLOWED_LANGUAGES_FOR_COMPILER_OPTIONS"
        value = var.allowed_languages_for_compiler_options
      }
      env {
        name  = "ENABLE_COMMAND_LINE_ARGUMENTS"
        value = var.enable_command_line_arguments
      }
      env {
        name  = "ENABLE_SUBMISSION_DELETE"
        value = var.enable_submission_delete
      }
      env {
        name  = "ENABLE_BATCHED_SUBMISSIONS"
        value = var.enable_batched_submissions
      }
      env {
        name  = "MAX_SUBMISSION_BATCH_SIZE"
        value = var.max_submission_batch_size
      }
      env {
        name  = "ENABLE_CALLBACKS"
        value = var.enable_callbacks
      }
      env {
        name  = "CALLBACKS_MAX_TRIES"
        value = var.callbacks_max_tries
      }
      env {
        name  = "CALLBACKS_TIMEOUT"
        value = var.callbacks_timeout
      }
      env {
        name  = "ENABLE_ADDITIONAL_FILES"
        value = var.enable_additional_files
      }
      env {
        name  = "SUBMISSION_CACHE_DURATION"
        value = var.submission_cache_duration
      }
      env {
        name  = "USE_DOCS_AS_HOMEPAGE"
        value = var.use_docs_as_homepage
      }

      # Judge0 Server Access Configuration
      env {
        name  = "ALLOW_ORIGIN"
        value = var.allow_origin
      }
      env {
        name  = "DISALLOW_ORIGIN"
        value = var.disallow_origin
      }
      env {
        name  = "ALLOW_IP"
        value = var.allow_ip
      }
      env {
        name  = "DISALLOW_IP"
        value = var.disallow_ip
      }

      # Judge0 Authentication Configuration
      env {
        name  = "AUTHN_HEADER"
        value = var.authn_header
      }
      env {
        name        = "AUTHN_TOKEN"
        secret_name = var.authn_token != "" ? "authn-token" : null
      }

      # Judge0 Authorization Configuration
      env {
        name  = "AUTHZ_HEADER"
        value = var.authz_header
      }
      env {
        name        = "AUTHZ_TOKEN"
        secret_name = var.authz_token != "" ? "authz-token" : null
      }

      # Submission Configuration
      env {
        name  = "CPU_TIME_LIMIT"
        value = var.cpu_time_limit
      }
      env {
        name  = "MAX_CPU_TIME_LIMIT"
        value = var.max_cpu_time_limit
      }
      env {
        name  = "CPU_EXTRA_TIME"
        value = var.cpu_extra_time
      }
      env {
        name  = "MAX_CPU_EXTRA_TIME"
        value = var.max_cpu_extra_time
      }
      env {
        name  = "WALL_TIME_LIMIT"
        value = var.wall_time_limit
      }
      env {
        name  = "MAX_WALL_TIME_LIMIT"
        value = var.max_wall_time_limit
      }
      env {
        name  = "MEMORY_LIMIT"
        value = var.memory_limit
      }
      env {
        name  = "MAX_MEMORY_LIMIT"
        value = var.max_memory_limit
      }
      env {
        name  = "STACK_LIMIT"
        value = var.stack_limit
      }
      env {
        name  = "MAX_STACK_LIMIT"
        value = var.max_stack_limit
      }
      env {
        name  = "MAX_PROCESSES_AND_OR_THREADS"
        value = var.max_processes_and_or_threads
      }
      env {
        name  = "MAX_MAX_PROCESSES_AND_OR_THREADS"
        value = var.max_max_processes_and_or_threads
      }
      env {
        name  = "ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT"
        value = var.enable_per_process_and_thread_time_limit
      }
      env {
        name  = "ALLOW_ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT"
        value = var.allow_enable_per_process_and_thread_time_limit
      }
      env {
        name  = "ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT"
        value = var.enable_per_process_and_thread_memory_limit
      }
      env {
        name  = "ALLOW_ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT"
        value = var.allow_enable_per_process_and_thread_memory_limit
      }
      env {
        name  = "MAX_FILE_SIZE"
        value = var.max_file_size
      }
      env {
        name  = "MAX_MAX_FILE_SIZE"
        value = var.max_max_file_size
      }
      env {
        name  = "NUMBER_OF_RUNS"
        value = var.number_of_runs
      }
      env {
        name  = "MAX_NUMBER_OF_RUNS"
        value = var.max_number_of_runs
      }
      env {
        name  = "REDIRECT_STDERR_TO_STDOUT"
        value = var.redirect_stderr_to_stdout
      }
      env {
        name  = "MAX_EXTRACT_SIZE"
        value = var.max_extract_size
      }
      env {
        name  = "ALLOW_ENABLE_NETWORK"
        value = var.allow_enable_network
      }
      env {
        name  = "ENABLE_NETWORK"
        value = var.enable_network
      }

      # Rails Configuration
      env {
        name  = "RAILS_ENV"
        value = var.rails_env
      }
      env {
        name  = "RAILS_MAX_THREADS"
        value = var.rails_max_threads != null ? var.rails_max_threads : null
      }
      env {
        name  = "RAILS_SERVER_PROCESSES"
        value = var.rails_server_processes
      }
      env {
        name        = "SECRET_KEY_BASE"
        secret_name = var.secret_key_base != "" ? "secret-key-base" : null
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
    name  = "database-url"
    value = var.database_url
  }

  secret {
    name  = "redis-url"
    value = var.redis_url
  }

  dynamic "secret" {
    for_each = var.authn_token != "" ? [1] : []
    content {
      name  = "authn-token"
      value = var.authn_token
    }
  }

  dynamic "secret" {
    for_each = var.authz_token != "" ? [1] : []
    content {
      name  = "authz-token"
      value = var.authz_token
    }
  }

  dynamic "secret" {
    for_each = var.secret_key_base != "" ? [1] : []
    content {
      name  = "secret-key-base"
      value = var.secret_key_base
    }
  }

  tags = {
    Environment = "production"
    Application = "judge0"
    Component   = "server"
  }
}
