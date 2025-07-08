# General Configuration
variable "location" {
  description = "Azure region"
  type        = string
  default     = "Southeast Asia"
}

variable "resource_group_name" {
  description = "Resource group name"
  type        = string
  default     = "judge0-rg"
}

variable "judge0_image_tag" {
  description = "Judge0 Docker image tag"
  type        = string
  default     = "1.13.1"
}

# Optional Security
variable "auth_token" {
  description = "API authentication token (optional)"
  type        = string
  default     = ""
  sensitive   = true
}

# Scaling Configuration
variable "min_workers" {
  description = "Minimum number of worker instances"
  type        = number
  default     = 0
}

variable "max_workers" {
  description = "Maximum number of worker instances"
  type        = number
  default     = 1
}

variable "min_servers" {
  description = "Minimum number of server instances"
  type        = number
  default     = 0
}

variable "max_servers" {
  description = "Maximum number of server instances"
  type        = number
  default     = 1
}

variable "scale_up_threshold" {
  description = "Queue size threshold to scale up workers"
  type        = number
  default     = 5
}

variable "scale_down_threshold" {
  description = "Queue size threshold to scale down workers"
  type        = number
  default     = 2
}

variable "max_idle_workers" {
  description = "Maximum number of idle workers before scaling down"
  type        = number
  default     = 1
}
