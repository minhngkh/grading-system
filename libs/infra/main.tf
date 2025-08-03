# Main Terraform configuration for Azure Grading System infrastructure
# This file serves as the entry point and data source definitions

# Get current Azure client configuration
data "azurerm_client_config" "current" {}

# Random string for unique resource naming
resource "random_string" "suffix" {
  length  = 6
  special = false
  upper   = false
}
