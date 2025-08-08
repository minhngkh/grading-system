resource "azurerm_resource_group" "main" {
  name     = var.name
  location = var.region

  tags = {
    Environment = var.environment
  }
}

# Outputs for Resource Group
output "resource_group_name" {
  description = "Name of the resource group"
  value       = azurerm_resource_group.main.name
}

output "resource_group_location" {
  description = "Location of the resource group"
  value       = azurerm_resource_group.main.location
}

