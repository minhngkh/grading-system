################################################################################
# Judge0 Configuration Variables
################################################################################

################################################################################
# Judge0 Server Configuration
################################################################################

variable "judge0_telemetry_enable" {
  description = "Enable or disable Judge0 Telemetry"
  type        = bool
  default     = true
}

variable "restart_max_tries" {
  description = "Automatically restart Judge0 server if it fails to start"
  type        = number
  default     = 10
}

variable "maintenance_mode" {
  description = "Maintenance mode prevents clients from creating or deleting submissions"
  type        = bool
  default     = false
}

variable "maintenance_message" {
  description = "Custom maintenance message returned to clients"
  type        = string
  default     = "Judge0 is currently in maintenance."
}

variable "enable_wait_result" {
  description = "Allow user to request synchronous wait for submission result"
  type        = bool
  default     = true
}

variable "enable_compiler_options" {
  description = "Allow user to set custom compiler options"
  type        = bool
  default     = true
}

variable "allowed_languages_for_compiler_options" {
  description = "List of language names for which setting compiler options is allowed"
  type        = string
  default     = ""
}

variable "enable_command_line_arguments" {
  description = "Allow user to set custom command line arguments"
  type        = bool
  default     = true
}

variable "enable_submission_delete" {
  description = "Allow authorized users to delete submissions"
  type        = bool
  default     = false
}

variable "enable_batched_submissions" {
  description = "Allow user to GET and POST batched submissions"
  type        = bool
  default     = true
}

variable "max_submission_batch_size" {
  description = "Maximum number of submissions that can be created or get in a batch"
  type        = number
  default     = 20
}

variable "enable_callbacks" {
  description = "Allow user to use callbacks"
  type        = bool
  default     = true
}

variable "callbacks_max_tries" {
  description = "Maximum number of callback tries before giving up"
  type        = number
  default     = 3
}

variable "callbacks_timeout" {
  description = "Timeout callback call after this many seconds"
  type        = number
  default     = 5
}

variable "enable_additional_files" {
  description = "Allow user to preset additional files in the sandbox"
  type        = bool
  default     = true
}

variable "submission_cache_duration" {
  description = "Duration (in seconds) of submission cache. Set to 0 to turn off caching"
  type        = number
  default     = 1
}

variable "use_docs_as_homepage" {
  description = "Use documentation page as homepage"
  type        = bool
  default     = false
}

################################################################################
# Judge0 Workers Configuration
################################################################################

variable "worker_interval" {
  description = "Polling frequency in seconds for workers"
  type        = number
  default     = 0.1
}

variable "worker_count" {
  description = "Number of parallel workers to run"
  type        = number
  default     = null # Defaults to 2*nproc
}

variable "max_queue_size" {
  description = "Maximum queue size for submissions"
  type        = number
  default     = 100
}

################################################################################
# Judge0 Server Access Configuration
################################################################################

variable "allow_origin" {
  description = "Allow only specified origins (space-separated list)"
  type        = string
  default     = ""
}

variable "disallow_origin" {
  description = "Disallow specified origins (space-separated list)"
  type        = string
  default     = ""
}

variable "allow_ip" {
  description = "Allow only specified IP addresses (space-separated list)"
  type        = string
  default     = ""
}

variable "disallow_ip" {
  description = "Disallow specified IP addresses (space-separated list)"
  type        = string
  default     = ""
}

################################################################################
# Judge0 Authentication Configuration
################################################################################

variable "authn_header" {
  description = "Authentication header name"
  type        = string
  default     = "X-Auth-Token"
}

variable "authn_token" {
  description = "Valid authentication tokens"
  type        = string
  default     = ""
  sensitive   = true
}

################################################################################
# Judge0 Authorization Configuration
################################################################################

variable "authz_header" {
  description = "Authorization header name"
  type        = string
  default     = "X-Auth-User"
}

variable "authz_token" {
  description = "Valid authorization tokens"
  type        = string
  default     = ""
  sensitive   = true
}

################################################################################
# Redis Configuration
################################################################################

variable "redis_host" {
  description = "Redis host"
  type        = string
}

variable "redis_password" {
  description = "Redis password for secure connections"
  type        = string
  sensitive   = true
}

variable "redis_port" {
  description = "Redis port"
  type        = number
  default     = 6379
}

# variable "redis_url" {
#   description = "Redis URL"
#   type        = string
#   sensitive   = true
# }

# variable "redis_use_ssl" {
#   description = "Use SSL for Redis connection"
#   type        = bool
#   default     = true
# }

################################################################################
# PostgreSQL Configuration
################################################################################

variable "database_url" {
  description = "PostgreSQL connection URL"
  type        = string
  sensitive   = true
}

################################################################################
# Submission Configuration
################################################################################

variable "cpu_time_limit" {
  description = "Default runtime limit for every program (in seconds)"
  type        = number
  default     = 5
}

variable "max_cpu_time_limit" {
  description = "Maximum custom CPU_TIME_LIMIT"
  type        = number
  default     = 15
}

variable "cpu_extra_time" {
  description = "Extra time to wait before killing program when time limit exceeded"
  type        = number
  default     = 1
}

variable "max_cpu_extra_time" {
  description = "Maximum custom CPU_EXTRA_TIME"
  type        = number
  default     = 5
}

variable "wall_time_limit" {
  description = "Wall-clock time limit in seconds"
  type        = number
  default     = 10
}

variable "max_wall_time_limit" {
  description = "Maximum custom WALL_TIME_LIMIT"
  type        = number
  default     = 20
}

variable "memory_limit" {
  description = "Address space limit in kilobytes"
  type        = number
  default     = 128000
}

variable "max_memory_limit" {
  description = "Maximum custom MEMORY_LIMIT"
  type        = number
  default     = 512000
}

variable "stack_limit" {
  description = "Process stack limit in kilobytes"
  type        = number
  default     = 64000
}

variable "max_stack_limit" {
  description = "Maximum custom STACK_LIMIT"
  type        = number
  default     = 128000
}

variable "max_processes_and_or_threads" {
  description = "Maximum number of processes and/or threads program can create"
  type        = number
  default     = 60
}

variable "max_max_processes_and_or_threads" {
  description = "Maximum custom MAX_PROCESSES_AND_OR_THREADS"
  type        = number
  default     = 120
}

variable "enable_per_process_and_thread_time_limit" {
  description = "Use CPU_TIME_LIMIT per process and thread"
  type        = bool
  default     = false
}

variable "allow_enable_per_process_and_thread_time_limit" {
  description = "Allow user to set ENABLE_PER_PROCESS_AND_THREAD_TIME_LIMIT"
  type        = bool
  default     = true
}

variable "enable_per_process_and_thread_memory_limit" {
  description = "Use MEMORY_LIMIT per process and thread"
  type        = bool
  default     = false
}

variable "allow_enable_per_process_and_thread_memory_limit" {
  description = "Allow user to set ENABLE_PER_PROCESS_AND_THREAD_MEMORY_LIMIT"
  type        = bool
  default     = true
}

variable "max_file_size" {
  description = "Maximum size of files created by program in kilobytes"
  type        = number
  default     = 1024
}

variable "max_max_file_size" {
  description = "Maximum custom MAX_FILE_SIZE"
  type        = number
  default     = 4096
}

variable "number_of_runs" {
  description = "Run each program this many times and take average"
  type        = number
  default     = 1
}

variable "max_number_of_runs" {
  description = "Maximum custom NUMBER_OF_RUNS"
  type        = number
  default     = 20
}

variable "redirect_stderr_to_stdout" {
  description = "Redirect stderr to stdout"
  type        = bool
  default     = false
}

variable "max_extract_size" {
  description = "Maximum total size of extracted files from additional files archive in kilobytes"
  type        = number
  default     = 10240
}

variable "allow_enable_network" {
  description = "Allow user to set ENABLE_NETWORK"
  type        = bool
  default     = true
}

variable "enable_network" {
  description = "Allow submissions to make network calls by default"
  type        = bool
  default     = false
}

################################################################################
# Rails Configuration
################################################################################

variable "rails_env" {
  description = "Rails environment: production or development"
  type        = string
  default     = "production"
  validation {
    condition     = contains(["production", "development"], var.rails_env)
    error_message = "Rails environment must be either 'production' or 'development'."
  }
}

variable "rails_max_threads" {
  description = "Maximum number of concurrent Rails threads"
  type        = number
  default     = null # Defaults to nproc
}

variable "rails_server_processes" {
  description = "Number of processes for handling requests"
  type        = number
  default     = 2
}

variable "secret_key_base" {
  description = "Secret key base for production"
  type        = string
  default     = ""
  sensitive   = true
}
