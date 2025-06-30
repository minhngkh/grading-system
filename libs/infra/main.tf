# Judge0 on Azure - Main Configuration
# Complete Terraform implementation for zero-cost scaling Judge0 deployment

terraform {
  required_version = ">= 1.12.0"
  required_providers {
    azurerm = {
      source  = "hashicorp/azurerm"
      version = "~> 4.34.0"
    }
  }
}

# Configure the Microsoft Azure Provider
provider "azurerm" {
  features {}
}

# Resource Group
resource "azurerm_resource_group" "main" {
  name     = var.resource_group_name
  location = var.location

  tags = {
    Environment = "production"
    Application = "judge0"
    Purpose     = "code-execution-platform"
  }
}
