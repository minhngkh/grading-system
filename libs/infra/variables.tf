# Judge0 on Azure - Variables
# Input variables for the Judge0 deployment

# Database Configuration
variable "postgres_url" {
  description = "PostgreSQL connection URL"
  type        = string
  sensitive   = true
}

# Redis Configuration
variable "redis_url" {
  description = "Redis connection URL (optional, if using Redis with SSL)"
  type        = string
  sensitive   = true
}
variable "redis_host" {
  description = "Redis server hostname"
  type        = string
  sensitive   = true
}

variable "redis_port" {
  description = "Redis server port"
  type        = string
  default     = "6379"
}

variable "redis_password" {
  description = "Redis password"
  type        = string
  sensitive   = true
}

# General Configuration
variable "location" {
  description = "Azure region"
  type        = string
  default     = "East US"
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

variable "max_workers" {
  description = "Maximum number of worker instances (Note: Container Instances don't auto-scale, this is for future use)"
  type        = number
  default     = 1
}

variable "max_servers" {
  description = "Maximum number of server instances"
  type        = number
  default     = 5
}

# Optional Security
variable "auth_token" {
  description = "API authentication token (optional)"
  type        = string
  default     = ""
  sensitive   = true
}
