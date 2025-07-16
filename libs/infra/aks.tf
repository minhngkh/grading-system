resource "azurerm_kubernetes_cluster" "aks" {
  name                = "aks"
  location            = azurerm_resource_group.main.location
  resource_group_name = azurerm_resource_group.main.name

  tags = {
    Environment = var.environment
    Component   = "k8s"
  }

  lifecycle {
    ignore_changes = [
      default_node_pool[0].node_count,
    ]
  }

  default_node_pool {
    name                 = "default"
    node_count           = 1
    min_count            = 0
    max_count            = 3
    vm_size              = "Standard_B2s"
    auto_scaling_enabled = true
  }

  identity {
    type = "SystemAssigned"
  }

  oms_agent {
    log_analytics_workspace_id = azurerm_log_analytics_workspace.log.id
  }
}
