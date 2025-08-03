# Azure Storage Account and Blob Containers for Grading System
# Provides storage for student submissions and rubric contexts

# # Generate a random suffix to ensure unique storage account name
# resource "random_string" "storage_suffix" {
#   length  = 6
#   special = false
#   upper   = false
# }

# Main storage account
resource "azurerm_storage_account" "main" {
  name                     = "${var.name}-storage"
  resource_group_name      = azurerm_resource_group.main.name
  location                 = azurerm_resource_group.main.location
  account_tier             = "Standard"
  account_replication_type = var.environment == "production" ? "GRS" : "LRS"

  allow_nested_items_to_be_public = false


  tags = {
    Environment = var.environment
    Component   = "storage"
  }
}

# Blob container for student submissions
resource "azurerm_storage_container" "submissions" {
  name                  = "submissions-store"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"

  metadata = {
    purpose     = "Student assignment submissions"
    environment = var.environment
  }
}

# Blob container for rubric contexts
resource "azurerm_storage_container" "rubric_context" {
  name                  = "rubric-context-store"
  storage_account_id    = azurerm_storage_account.main.id
  container_access_type = "private"

  metadata = {
    purpose     = "Rubric context storage for AI processing"
    environment = var.environment
  }
}

# Managed Identity for Container Apps to access storage
resource "azurerm_user_assigned_identity" "container_apps" {
  name                = "${var.name}-container-identity"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    Environment = var.environment
    Component   = "identity"
  }
}

# Role assignment: Storage Blob Data Contributor for container apps
resource "azurerm_role_assignment" "storage_blob_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Blob Data Contributor"
  principal_id         = azurerm_user_assigned_identity.container_apps.principal_id
}

# Role assignment: Storage Account Contributor for container apps
resource "azurerm_role_assignment" "storage_account_contributor" {
  scope                = azurerm_storage_account.main.id
  role_definition_name = "Storage Account Contributor"
  principal_id         = azurerm_user_assigned_identity.container_apps.principal_id
}

# Storage account key for legacy connection string access (if needed)
resource "azurerm_storage_account_network_rules" "main" {
  storage_account_id = azurerm_storage_account.main.id

  default_action             = "Allow"
  ip_rules                   = []
  virtual_network_subnet_ids = []
  bypass                     = ["AzureServices"]
}

# Outputs for storage configuration
# output "storage_account_name" {
#   description = "Name of the storage account"
#   value       = azurerm_storage_account.main.name
# }

# output "storage_account_id" {
#   description = "ID of the storage account"
#   value       = azurerm_storage_account.main.id
# }

# output "storage_primary_endpoint" {
#   description = "Primary blob endpoint of the storage account"
#   value       = azurerm_storage_account.main.primary_blob_endpoint
# }

output "storage_connection_string" {
  description = "Connection string for the storage account"
  value       = azurerm_storage_account.main.primary_connection_string
  sensitive   = true
}

# output "submissions_container_name" {
#   description = "Name of the submissions blob container"
#   value       = azurerm_storage_container.submissions.name
# }

# output "rubric_context_container_name" {
#   description = "Name of the rubric context blob container"
#   value       = azurerm_storage_container.rubric_context.name
# }

# output "container_apps_identity_id" {
#   description = "ID of the managed identity for container apps"
#   value       = azurerm_user_assigned_identity.container_apps.id
# }

# output "container_apps_identity_principal_id" {
#   description = "Principal ID of the managed identity for container apps"
#   value       = azurerm_user_assigned_identity.container_apps.principal_id
# }

# output "container_apps_identity_client_id" {
#   description = "Client ID of the managed identity for container apps"
#   value       = azurerm_user_assigned_identity.container_apps.client_id
# }

# # Connection string format for .NET applications
# output "submissions_store_connection_string" {
#   description = "Connection string for submissions blob store (.NET format)"
#   value       = "DefaultEndpointsProtocol=https;AccountName=${azurerm_storage_account.main.name};AccountKey=${azurerm_storage_account.main.primary_access_key};EndpointSuffix=core.windows.net"
#   sensitive   = true
# }

# output "rubric_context_store_connection_string" {
#   description = "Connection string for rubric context blob store (.NET format)"
#   value       = "DefaultEndpointsProtocol=https;AccountName=${azurerm_storage_account.main.name};AccountKey=${azurerm_storage_account.main.primary_access_key};EndpointSuffix=core.windows.net"
#   sensitive   = true
# }
