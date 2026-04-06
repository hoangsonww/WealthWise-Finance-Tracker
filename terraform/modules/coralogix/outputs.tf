# -----------------------------------------------------------------------------
# Coralogix Module — Outputs
# WealthWise Finance Tracker
# -----------------------------------------------------------------------------

output "tco_policy_ids" {
  description = "Map of TCO policy tier name to Coralogix policy ID"
  value = {
    high   = coralogix_tco_policy_logs.high_priority.id
    medium = coralogix_tco_policy_logs.medium_priority.id
    low    = coralogix_tco_policy_logs.low_priority.id
  }
}

output "alert_ids" {
  description = "Map of alert descriptive name to Coralogix alert ID"
  value = {
    api_5xx_spike       = coralogix_alert.api_5xx_spike.id
    high_error_rate     = coralogix_alert.high_error_rate.id
    service_down        = coralogix_alert.service_down.id
    slow_api_response   = coralogix_alert.slow_api_response.id
    mongo_conn_failure  = coralogix_alert.mongo_connection_failure.id
    auth_brute_force    = coralogix_alert.auth_brute_force.id
    memory_pressure     = coralogix_alert.memory_pressure.id
  }
}

output "dashboard_id" {
  description = "Coralogix dashboard ID for the WealthWise service overview"
  value       = coralogix_dashboard.wealthwise.id
}

output "parsing_rule_ids" {
  description = "List of Coralogix parsing rule group IDs"
  value = [
    coralogix_rules_group.json_parsing.id,
    coralogix_rules_group.severity_extraction.id,
    coralogix_rules_group.timestamp_extraction.id,
    coralogix_rules_group.subsystem_extraction.id,
  ]
}

output "webhook_id" {
  description = "Coralogix webhook integration ID (empty string when no webhook URL is configured)"
  value       = local.has_webhook ? coralogix_webhook.alerts[0].id : ""
}
