# Judge0 on Azure - Outputs

output "deployment_summary" {
  description = "Deployment summary with key endpoints"
  value = {
    server_url           = "https://${azurerm_container_app.judge0_server.ingress[0].fqdn}"
    # server_url_current   = "https://${data.azurerm_container_app.judge0_server_current.ingress[0].fqdn}"
    # latest_revision_name = data.azurerm_container_app.judge0_server_current.latest_revision_name
    resource_group       = azurerm_resource_group.main.name
    location             = azurerm_resource_group.main.location
  }
}
