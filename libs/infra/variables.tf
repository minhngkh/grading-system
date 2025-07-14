variable "name" {
  description = "The name of the deployment"
  type        = string
}

variable "region" {
  description = "The region for the deployment"
  type        = string
  default     = "Southeast Asia"
}

variable "environment" {
  description = "The environment for the deployment"
  type        = string
  default     = "development"
}
