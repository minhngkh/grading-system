# Judge0 Workers - Container Instances Configuration

resource "azurerm_container_group" "judge0_workers" {
  name                = "judge0-workers"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_address_type     = "None"
  os_type             = "Linux"
  restart_policy      = "Always" # Changed to Always for demonstration
  sku                 = "Confidential"

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
      REDIS_USE_SSL = var.redis_use_ssl

      # Judge0 Workers Configuration
      INTERVAL       = var.worker_interval
      COUNT          = var.worker_count != null ? var.worker_count : ""
      MAX_QUEUE_SIZE = var.max_queue_size

      # Submission Configuration
      CPU_TIME_LIMIT                                   = var.cpu_time_limit
      MAX_CPU_TIME_LIMIT                               = var.max_cpu_time_limit
      CPU_EXTRA_TIME                                   = var.cpu_extra_time
      MAX_CPU_EXTRA_TIME                               = var.max_cpu_extra_time
      WALL_TIME_LIMIT                                  = var.wall_time_limit
      MAX_WALL_TIME_LIMIT                              = var.max_wall_time_limit
      MEMORY_LIMIT                                     = var.memory_limit
      MAX_MEMORY_LIMIT                                 = var.max_memory_limit
      STACK_LIMIT                                      = var.stack_limit
      MAX_STACK_LIMIT                                  = var.max_stack_limit
      MAX_PROCESSES_AND_OR_THREADS                     = var.max_processes_and_or_threads
      MAX_MAX_PROCESSES_AND_OR_THREADS                 = var.max_max_processes_and_or_threads
      ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT         = var.enable_per_process_and_thread_time_limit
      ALLOW_ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT   = var.allow_enable_per_process_and_thread_time_limit
      ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT       = var.enable_per_process_and_thread_memory_limit
      ALLOW_ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT = var.allow_enable_per_process_and_thread_memory_limit
      MAX_FILE_SIZE                                    = var.max_file_size
      MAX_MAX_FILE_SIZE                                = var.max_max_file_size
      NUMBER_OF_RUNS                                   = var.number_of_runs
      MAX_NUMBER_OF_RUNS                               = var.max_number_of_runs
      REDIRECT_STDERR_TO_STDOUT                        = var.redirect_stderr_to_stdout
      MAX_EXTRACT_SIZE                                 = var.max_extract_size
      ALLOW_ENABLE_NETWORK                             = var.allow_enable_network
      ENABLE_NETWORK                                   = var.enable_network

      # Rails Configuration
      RAILS_ENV              = var.rails_env
      RAILS_MAX_THREADS      = var.rails_max_threads != null ? var.rails_max_threads : ""
      RAILS_SERVER_PROCESSES = var.rails_server_processes
    }

    secure_environment_variables = {
      DATABASE_URL = var.database_url
      REDIS_URL    = var.redis_url

      SECRET_KEY_BASE = var.secret_key_base
      AUTHN_TOKEN     = var.authn_token
      AUTHZ_TOKEN     = var.authz_token
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
