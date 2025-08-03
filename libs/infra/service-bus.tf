# Azure Service Bus for message queuing and event-driven communication
# Replaces RabbitMQ for cloud deployment
# Using Basic tier for cost optimization

resource "azurerm_servicebus_namespace" "main" {
  name                = "${var.name}-servicebus"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "Basic"

  tags = {
    Environment = var.environment
    Component   = "messaging"
  }
}

# Authorization rule for applications (Basic tier only supports Manage=true)
resource "azurerm_servicebus_namespace_authorization_rule" "applications" {
  name         = "${var.name}-app-access"
  namespace_id = azurerm_servicebus_namespace.main.id

  listen = true
  send   = true
  manage = true
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
