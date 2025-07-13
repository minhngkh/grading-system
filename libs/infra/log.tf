resource "azurerm_log_analytics_workspace" "judge0_log" {
  name                = "judge0-log"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name
  sku                 = "PerGB2018"
  retention_in_days   = 30

  tags = {
    Environment = "production"
    Application = "judge0"
    Component   = "logging"
  }
}