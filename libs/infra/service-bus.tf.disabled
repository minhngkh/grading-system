# Azure Service Bus for message queuing and event-driven communication
# Replaces RabbitMQ for cloud deployment
# Using Standard tier to support Topics and Subscriptions

resource "azurerm_servicebus_namespace" "main" {
  name                = "${var.name}-servicebus"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  # sku                 = "Basic"
  sku                 = "Standard"

  tags = {
    Environment = var.environment
    Component   = "messaging"
  }
}

# Authorization rule for applications (Standard tier supports granular permissions)
resource "azurerm_servicebus_namespace_authorization_rule" "applications" {
  name         = "${var.name}-app-access"
  namespace_id = azurerm_servicebus_namespace.main.id

  listen = true
  send   = true
  manage = true # Required to create/manage topics and subscriptions
}

# Outputs for Service Bus
output "servicebus_namespace_name" {
  description = "Name of the Service Bus namespace"
  value       = azurerm_servicebus_namespace.main.name
}

output "servicebus_connection_string" {
  description = "Connection string for the Service Bus namespace"
  value       = azurerm_servicebus_namespace_authorization_rule.applications.primary_connection_string
  sensitive   = true
}
