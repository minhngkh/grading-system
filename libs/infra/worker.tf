# Judge0 Workers - Pre-created pool for fast stop/start scaling
# All worker instances are created at deployment time for optimal scaling speed

# Create all worker instances (up to max_workers) for stop/start scaling
resource "azurerm_container_group" "judge0_workers_pool" {
  count               = var.max_workers
  name                = "judge0-worker-${count.index + 1}"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  ip_address_type     = "None"
  os_type             = "Linux"
  restart_policy      = "OnFailure"
  sku                 = "Confidential"

  container {
    name   = "judge0-worker"
    image  = "judge0/judge0:${var.judge0_image_tag}"
    cpu    = "1.0"
    memory = "2.0"

    commands = ["./scripts/workers"]

    security {
      privilege_enabled = true
    }

    environment_variables = {
      REDIS_HOST    = var.redis_host
      REDIS_USE_SSL = var.redis_use_ssl

      INTERVAL       = var.worker_interval
      COUNT          = var.worker_count != null ? var.worker_count : ""
      MAX_QUEUE_SIZE = var.max_queue_size
      WORKER_ID      = tostring(count.index + 1)

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
    Environment    = "production"
    Application    = "judge0"
    Component      = "worker"
    ManagedBy      = "autoscaler"
    WorkerInstance = tostring(count.index + 1)
    WorkerType     = count.index < var.min_workers ? "baseline" : "scalable"
  }

  lifecycle {
    ignore_changes = [
      # Allow the autoscaler to manage start/stop state
      restart_policy,
    ]
  }
}

# Worker pool initialization script to stop non-baseline workers after creation
resource "terraform_data" "stop_excess_workers" {
  count = (var.max_workers > var.min_workers ? 1 : 0)

  depends_on = [azurerm_container_group.judge0_workers_pool]

  provisioner "local-exec" {
    command = <<-EOT
      echo "Stopping excess workers (keeping first ${var.min_workers} running)..."
      for i in $(seq $((${var.min_workers} + 2)) ${var.max_workers}); do
        echo "Stopping judge0-worker-$i..."
        az container stop --name "judge0-worker-$i" --resource-group "${azurerm_resource_group.main.name}" || true
      done
    EOT
  }
}

# Note: Workers beyond min_workers are stopped after creation for optimal scaling performance
# - Baseline workers (1 to min_workers): Always running
# - Scalable workers (min_workers+1 to max_workers): Stopped, ready for fast start
