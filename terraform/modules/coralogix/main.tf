# -----------------------------------------------------------------------------
# Coralogix Observability Module — WealthWise Finance Tracker
#
# Provisions log-tiering (TCO) policies, alerting rules, parsing pipelines,
# dashboards, and notification integrations against the Coralogix platform.
#
# WealthWise services:
#   api        — Express.js API   (port 4000)
#   web        — Next.js frontend (port 3000)
#   mcp        — MCP service      (port 5100)
#   agentic-ai — Agentic AI       (port 5200)
# -----------------------------------------------------------------------------

# ─── Locals ──────────────────────────────────────────────────────────────────

locals {
  resource_prefix = "${var.project_name}-${var.environment}"

  services = ["api", "web", "mcp", "agentic-ai"]

  common_labels = {
    managed_by  = "terraform"
    project     = var.project_name
    environment = var.environment
  }

  # Notification target flags — drive dynamic blocks in alert definitions
  has_webhook = var.alert_webhook_url != ""
  has_emails  = length(var.notification_emails) > 0
}

# ═════════════════════════════════════════════════════════════════════════════
# 1. WEBHOOK INTEGRATION
# ═════════════════════════════════════════════════════════════════════════════

resource "coralogix_webhook" "alerts" {
  count = local.has_webhook ? 1 : 0

  name = "${local.resource_prefix}-alert-webhook"

  custom {
    url    = var.alert_webhook_url
    method = "post"
    headers = {
      "Content-Type" = "application/json"
    }
    body = jsonencode({
      alert_name  = "$ALERT_NAME"
      severity    = "$ALERT_SEVERITY"
      description = "$ALERT_DESCRIPTION"
      timestamp   = "$EVENT_TIMESTAMP"
      alert_url   = "$ALERT_URL"
      log_url     = "$LOG_URL"
      environment = var.environment
      project     = var.project_name
    })
  }
}

# ═════════════════════════════════════════════════════════════════════════════
# 2. TCO POLICIES — Log Tiering for Cost Optimization
#
# Coralogix TCO (Total Cost of Ownership) policies route logs to different
# storage tiers.  High-priority logs are indexed for fast search; medium are
# available with moderate latency; low are archived cheaply.
# ═════════════════════════════════════════════════════════════════════════════

resource "coralogix_tco_policy_logs" "high_priority" {
  name        = "${local.resource_prefix}-high-priority"
  description = "Index ERROR/CRITICAL severity logs from the API subsystem for real-time alerting"
  priority    = "high"
  order       = 1
  enabled     = true

  severities = ["error", "critical"]

  applications {
    rule_type = "is"
    names     = [var.application_name]
  }

  subsystems {
    rule_type = "is"
    names     = ["api"]
  }
}

resource "coralogix_tco_policy_logs" "medium_priority" {
  name        = "${local.resource_prefix}-medium-priority"
  description = "Retain WARN/INFO severity logs across all subsystems with moderate search latency"
  priority    = "medium"
  order       = 2
  enabled     = true

  severities = ["warning", "info"]

  applications {
    rule_type = "is"
    names     = [var.application_name]
  }
}

resource "coralogix_tco_policy_logs" "low_priority" {
  name        = "${local.resource_prefix}-low-priority"
  description = "Archive DEBUG logs from the web subsystem (static asset requests) for cost savings"
  priority    = "low"
  order       = 3
  enabled     = true

  severities = ["debug"]

  applications {
    rule_type = "is"
    names     = [var.application_name]
  }

  subsystems {
    rule_type = "is"
    names     = ["web"]
  }
}

# ═════════════════════════════════════════════════════════════════════════════
# 3. ALERT RULES
#
# Seven production alerts covering error rates, latency, availability,
# database connectivity, security, and resource saturation.
# ═════════════════════════════════════════════════════════════════════════════

# ── 3a. API 5xx Spike — Ratio Alert ─────────────────────────────────────────
#
# Fires when the ratio of HTTP 5xx responses to total API requests exceeds 5 %
# within a rolling 5-minute window.

resource "coralogix_alert" "api_5xx_spike" {
  name        = "${local.resource_prefix}-api-5xx-spike"
  description = "HTTP 5xx errors exceed 5 %% of all API requests in a 5-minute window"
  severity    = "critical"
  enabled     = true
  labels      = local.common_labels

  notification_group {
    dynamic "notification" {
      for_each = local.has_webhook ? [1] : []
      content {
        integration_id             = coralogix_webhook.alerts[0].id
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 15
      }
    }

    dynamic "notification" {
      for_each = local.has_emails ? [1] : []
      content {
        recipients {
          emails = var.notification_emails
        }
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 15
      }
    }
  }

  type_definition {
    logs_ratio_threshold {
      numerator_alias   = "5xx_errors"
      denominator_alias = "all_api_requests"

      rules {
        condition {
          threshold      = 5
          time_window    = "5_minutes"
          condition_type = "more_than"
        }
      }

      numerator {
        simple_filter {
          lucene_query = "status:[500 TO 599]"
          label_filters {
            application_name {
              rule_type = "is"
              values    = [var.application_name]
            }
            subsystem_name {
              rule_type = "is"
              values    = ["api"]
            }
          }
        }
      }

      denominator {
        simple_filter {
          lucene_query = "_exists_:status"
          label_filters {
            application_name {
              rule_type = "is"
              values    = [var.application_name]
            }
            subsystem_name {
              rule_type = "is"
              values    = ["api"]
            }
          }
        }
      }

      notification_payload_filter = ["coralogix.metadata.subsystemName", "status"]
    }
  }
}

# ── 3b. High Error Rate — Threshold Alert ───────────────────────────────────
#
# Fires when more than 50 error-severity logs are observed across any
# subsystem in 5 minutes.

resource "coralogix_alert" "high_error_rate" {
  name        = "${local.resource_prefix}-high-error-rate"
  description = "More than 50 error-severity logs in 5 minutes across any subsystem"
  severity    = "error"
  enabled     = true
  labels      = local.common_labels

  notification_group {
    group_by_fields = ["coralogix.metadata.subsystemName"]

    dynamic "notification" {
      for_each = local.has_webhook ? [1] : []
      content {
        integration_id             = coralogix_webhook.alerts[0].id
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 10
      }
    }

    dynamic "notification" {
      for_each = local.has_emails ? [1] : []
      content {
        recipients {
          emails = var.notification_emails
        }
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 10
      }
    }
  }

  type_definition {
    logs_threshold {
      rules {
        condition {
          threshold      = 50
          time_window    = "5_minutes"
          condition_type = "more_than"
        }
      }

      logs_filter {
        simple_filter {
          lucene_query = "*"
          label_filters {
            application_name {
              rule_type = "is"
              values    = [var.application_name]
            }
            severities = ["error", "critical"]
          }
        }
      }

      notification_payload_filter = ["coralogix.metadata.subsystemName"]

      undetected_values_management {
        auto_retire_timeframe = "never"
      }
    }
  }
}

# ── 3c. Service Down — Unique Count Alert ───────────────────────────────────
#
# Fires when the number of unique subsystems emitting logs drops below the
# expected count (4 services) over a 10-minute window, signalling that one or
# more services have stopped producing logs entirely.

resource "coralogix_alert" "service_down" {
  name        = "${local.resource_prefix}-service-down"
  description = "Fewer than ${length(local.services)} services are emitting logs over 10 minutes — a service may be down"
  severity    = "critical"
  enabled     = true
  labels      = local.common_labels

  notification_group {
    dynamic "notification" {
      for_each = local.has_webhook ? [1] : []
      content {
        integration_id             = coralogix_webhook.alerts[0].id
        notify_on                  = "triggered_only"
        retriggering_period_minutes = 5
      }
    }

    dynamic "notification" {
      for_each = local.has_emails ? [1] : []
      content {
        recipients {
          emails = var.notification_emails
        }
        notify_on                  = "triggered_only"
        retriggering_period_minutes = 5
      }
    }
  }

  type_definition {
    logs_unique_count {
      rules {
        condition {
          unique_count_key = "coralogix.metadata.subsystemName"
          max_unique_count = length(local.services) - 1
          time_window      = "10_minutes"
        }
      }

      logs_filter {
        simple_filter {
          lucene_query = "*"
          label_filters {
            application_name {
              rule_type = "is"
              values    = [var.application_name]
            }
          }
        }
      }

      notification_payload_filter = ["coralogix.metadata.subsystemName"]
    }
  }
}

# ── 3d. Slow API Response — Metric Alert ────────────────────────────────────
#
# Fires when the p95 HTTP response time for the API subsystem exceeds 2000 ms
# over a 5-minute evaluation window.

resource "coralogix_alert" "slow_api_response" {
  name        = "${local.resource_prefix}-slow-api-response"
  description = "P95 API response time exceeds 2000 ms over a 5-minute window"
  severity    = "warning"
  enabled     = true
  labels      = local.common_labels

  notification_group {
    dynamic "notification" {
      for_each = local.has_webhook ? [1] : []
      content {
        integration_id             = coralogix_webhook.alerts[0].id
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 15
      }
    }

    dynamic "notification" {
      for_each = local.has_emails ? [1] : []
      content {
        recipients {
          emails = var.notification_emails
        }
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 15
      }
    }
  }

  type_definition {
    metric_threshold {
      metric_filter {
        promql = "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{subsystem=\"api\"}[5m])) by (le)) * 1000"
      }

      rules {
        condition {
          threshold      = 2000
          time_window    = "5_minutes"
          condition_type = "more_than"
          min_non_null_values_percentage = 50
        }
      }

      notification_payload_filter = []

      undetected_values_management {
        auto_retire_timeframe = "never"
      }
    }
  }
}

# ── 3e. MongoDB Connection Failure — Immediate Alert ────────────────────────
#
# Fires immediately on any log line containing MongoDB driver errors or TCP
# connection refusals — no time-window aggregation.

resource "coralogix_alert" "mongo_connection_failure" {
  name        = "${local.resource_prefix}-mongo-connection-failure"
  description = "Immediate alert on MongoDB driver errors (MongoServerError) or TCP connection refusals (ECONNREFUSED)"
  severity    = "critical"
  enabled     = true
  labels      = local.common_labels

  notification_group {
    dynamic "notification" {
      for_each = local.has_webhook ? [1] : []
      content {
        integration_id             = coralogix_webhook.alerts[0].id
        notify_on                  = "triggered_only"
        retriggering_period_minutes = 5
      }
    }

    dynamic "notification" {
      for_each = local.has_emails ? [1] : []
      content {
        recipients {
          emails = var.notification_emails
        }
        notify_on                  = "triggered_only"
        retriggering_period_minutes = 5
      }
    }
  }

  type_definition {
    logs_immediate {
      logs_filter {
        simple_filter {
          lucene_query = "\"MongoServerError\" OR \"ECONNREFUSED\""
          label_filters {
            application_name {
              rule_type = "is"
              values    = [var.application_name]
            }
            severities = ["error", "critical"]
          }
        }
      }

      notification_payload_filter = ["coralogix.metadata.subsystemName", "msg"]
    }
  }
}

# ── 3f. Auth Brute Force — Ratio Alert ──────────────────────────────────────
#
# Fires when the ratio of failed authentication attempts to total auth
# requests exceeds 20 % in a 5-minute window on the API subsystem.

resource "coralogix_alert" "auth_brute_force" {
  name        = "${local.resource_prefix}-auth-brute-force"
  description = "Failed authentication attempts exceed 20 %% of all auth requests in a 5-minute window"
  severity    = "error"
  enabled     = true
  labels      = local.common_labels

  notification_group {
    dynamic "notification" {
      for_each = local.has_webhook ? [1] : []
      content {
        integration_id             = coralogix_webhook.alerts[0].id
        notify_on                  = "triggered_only"
        retriggering_period_minutes = 10
      }
    }

    dynamic "notification" {
      for_each = local.has_emails ? [1] : []
      content {
        recipients {
          emails = var.notification_emails
        }
        notify_on                  = "triggered_only"
        retriggering_period_minutes = 10
      }
    }
  }

  type_definition {
    logs_ratio_threshold {
      numerator_alias   = "failed_auth_attempts"
      denominator_alias = "all_auth_requests"

      rules {
        condition {
          threshold      = 20
          time_window    = "5_minutes"
          condition_type = "more_than"
        }
      }

      numerator {
        simple_filter {
          lucene_query = "(status:401 OR status:403) AND (path:\"/api/auth/*\" OR path:\"/api/login\")"
          label_filters {
            application_name {
              rule_type = "is"
              values    = [var.application_name]
            }
            subsystem_name {
              rule_type = "is"
              values    = ["api"]
            }
          }
        }
      }

      denominator {
        simple_filter {
          lucene_query = "path:\"/api/auth/*\" OR path:\"/api/login\""
          label_filters {
            application_name {
              rule_type = "is"
              values    = [var.application_name]
            }
            subsystem_name {
              rule_type = "is"
              values    = ["api"]
            }
          }
        }
      }

      notification_payload_filter = ["coralogix.metadata.subsystemName", "path", "status"]
    }
  }
}

# ── 3g. Memory Pressure — Metric Alert ──────────────────────────────────────
#
# Fires when container memory utilisation exceeds 85 % for a sustained
# 5-minute window.

resource "coralogix_alert" "memory_pressure" {
  name        = "${local.resource_prefix}-memory-pressure"
  description = "Container memory utilisation exceeds 85 %% for 5 minutes"
  severity    = "warning"
  enabled     = true
  labels      = local.common_labels

  notification_group {
    group_by_fields = ["container_name"]

    dynamic "notification" {
      for_each = local.has_webhook ? [1] : []
      content {
        integration_id             = coralogix_webhook.alerts[0].id
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 15
      }
    }

    dynamic "notification" {
      for_each = local.has_emails ? [1] : []
      content {
        recipients {
          emails = var.notification_emails
        }
        notify_on                  = "triggered_and_resolved"
        retriggering_period_minutes = 15
      }
    }
  }

  type_definition {
    metric_threshold {
      metric_filter {
        promql = "max by (container_name) (container_memory_usage_bytes / container_spec_memory_limit_bytes) * 100"
      }

      rules {
        condition {
          threshold      = 85
          time_window    = "5_minutes"
          condition_type = "more_than"
          min_non_null_values_percentage = 80
        }
      }

      notification_payload_filter = []

      undetected_values_management {
        auto_retire_timeframe = "never"
      }
    }
  }
}

# ═════════════════════════════════════════════════════════════════════════════
# 4. PARSING RULES
#
# Rule groups that structure raw log text into queryable fields before
# indexing.  Organised as separate groups so individual pipelines can be
# toggled independently.
# ═════════════════════════════════════════════════════════════════════════════

# ── 4a. JSON Auto-Parse ─────────────────────────────────────────────────────

resource "coralogix_rules_group" "json_parsing" {
  name        = "${local.resource_prefix}-json-auto-parse"
  description = "Automatically extract JSON fields from structured log bodies across all WealthWise services"
  enabled     = true
  creator     = "terraform"
  order       = 1

  rule_subgroups {
    rules {
      name         = "Parse JSON log body"
      description  = "Extract all top-level keys from the JSON log payload into searchable fields"
      enabled      = true
      source_field = "text"

      parse_json_field {
        destination_field      = "json"
        keep_source_field      = true
        keep_destination_field = true
      }
    }
  }
}

# ── 4b. Severity Extraction ─────────────────────────────────────────────────

resource "coralogix_rules_group" "severity_extraction" {
  name        = "${local.resource_prefix}-severity-extraction"
  description = "Map the application-level 'level' field to Coralogix severity metadata"
  enabled     = true
  creator     = "terraform"
  order       = 2

  rule_subgroups {
    rules {
      name         = "Extract severity from level field"
      description  = "Capture the value of json.level (e.g. error, warn, info, debug) as the log severity"
      enabled      = true
      source_field = "json.level"

      extract {
        regular_expression = "^(?P<severity>.+)$"
      }
    }
  }
}

# ── 4c. Timestamp Extraction ────────────────────────────────────────────────

resource "coralogix_rules_group" "timestamp_extraction" {
  name        = "${local.resource_prefix}-timestamp-extraction"
  description = "Extract the application-emitted timestamp so Coralogix uses it for ordering rather than ingestion time"
  enabled     = true
  creator     = "terraform"
  order       = 3

  rule_subgroups {
    rules {
      name         = "Extract ISO-8601 timestamp"
      description  = "Parse json.timestamp into the Coralogix event timestamp"
      enabled      = true
      source_field = "json.timestamp"

      extract {
        regular_expression = "^(?P<timestamp>.+)$"
      }
    }
  }
}

# ── 4d. Subsystem Extraction from Kubernetes Labels ─────────────────────────

resource "coralogix_rules_group" "subsystem_extraction" {
  name        = "${local.resource_prefix}-subsystem-extraction"
  description = "Derive the Coralogix subsystem name from Kubernetes pod labels (app.kubernetes.io/name)"
  enabled     = true
  creator     = "terraform"
  order       = 4

  rule_subgroups {
    rules {
      name         = "Extract subsystem from k8s app label"
      description  = "Use the Kubernetes app.kubernetes.io/name label as the Coralogix subsystem identifier"
      enabled      = true
      source_field = "json.kubernetes.labels.app_kubernetes_io_name"

      extract {
        regular_expression = "^(?P<subsystemName>.+)$"
      }
    }
  }

  rule_subgroups {
    rules {
      name         = "Fallback: extract subsystem from container name"
      description  = "If the Kubernetes app label is absent, fall back to the container name for subsystem identification"
      enabled      = true
      source_field = "json.kubernetes.container_name"

      extract {
        regular_expression = "^(?P<subsystemName>.+)$"
      }
    }
  }
}

# ═════════════════════════════════════════════════════════════════════════════
# 5. DASHBOARD
#
# Single-pane overview covering service health, latency distribution, log
# volume, database performance, and authentication activity.
# ═════════════════════════════════════════════════════════════════════════════

resource "coralogix_dashboard" "wealthwise" {
  name        = "${local.resource_prefix}-service-overview"
  description = "WealthWise ${var.environment} — unified service health, latency, log volume, MongoDB, and auth overview"

  layout {
    # ── Section 1: Service Health Overview ──────────────────────────────────
    sections {
      id {
        value = "${local.resource_prefix}-health-overview"
      }

      rows {
        id {
          value = "${local.resource_prefix}-health-row-errors-per-service"
        }
        height = 19

        widgets {
          id {
            value = "${local.resource_prefix}-widget-error-rate-timeseries"
          }
          title       = "Error Rate by Service"
          description = "Error-severity log count per service over time"
          definition {
            line_chart {
              legend {
                is_visible   = true
                columns      = ["avg", "max", "last"]
                group_by_query = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-error-rate"
                name         = "Errors / 5m"
                color_scheme = "classic"
                is_visible   = true

                query {
                  logs {
                    lucene_query = "*"
                    group_by     = ["coralogix.metadata.subsystemName"]
                    aggregations {
                      type = "count"
                    }
                    filters {
                      field = "coralogix.metadata.applicationName"
                      operator {
                        type            = "equals"
                        selected_values = [var.application_name]
                      }
                    }
                    filters {
                      field = "coralogix.metadata.severity"
                      operator {
                        type            = "equals"
                        selected_values = ["error", "critical"]
                      }
                    }
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }

        widgets {
          id {
            value = "${local.resource_prefix}-widget-5xx-counter"
          }
          title       = "HTTP 5xx Count (API)"
          description = "Total 5xx responses from the API subsystem"
          definition {
            line_chart {
              legend {
                is_visible = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-5xx"
                name         = "5xx Count"
                color_scheme = "classic"
                is_visible   = true

                query {
                  logs {
                    lucene_query = "status:[500 TO 599]"
                    aggregations {
                      type = "count"
                    }
                    filters {
                      field = "coralogix.metadata.subsystemName"
                      operator {
                        type            = "equals"
                        selected_values = ["api"]
                      }
                    }
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }
      }
    }

    # ── Section 2: Request Latency ─────────────────────────────────────────
    sections {
      id {
        value = "${local.resource_prefix}-latency"
      }

      rows {
        id {
          value = "${local.resource_prefix}-latency-row-percentiles"
        }
        height = 22

        widgets {
          id {
            value = "${local.resource_prefix}-widget-latency-p50"
          }
          title       = "API Latency — p50"
          description = "Median request duration for the API service"
          definition {
            line_chart {
              legend {
                is_visible = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-p50"
                name         = "p50 (ms)"
                color_scheme = "classic"
                is_visible   = true

                query {
                  metrics {
                    promql_query = "histogram_quantile(0.50, sum(rate(http_request_duration_seconds_bucket{subsystem=\"api\"}[5m])) by (le)) * 1000"
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }

        widgets {
          id {
            value = "${local.resource_prefix}-widget-latency-p95"
          }
          title       = "API Latency — p95"
          description = "95th-percentile request duration for the API service"
          definition {
            line_chart {
              legend {
                is_visible = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-p95"
                name         = "p95 (ms)"
                color_scheme = "classic"
                is_visible   = true

                query {
                  metrics {
                    promql_query = "histogram_quantile(0.95, sum(rate(http_request_duration_seconds_bucket{subsystem=\"api\"}[5m])) by (le)) * 1000"
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }

        widgets {
          id {
            value = "${local.resource_prefix}-widget-latency-p99"
          }
          title       = "API Latency — p99"
          description = "99th-percentile request duration for the API service"
          definition {
            line_chart {
              legend {
                is_visible = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-p99"
                name         = "p99 (ms)"
                color_scheme = "classic"
                is_visible   = true

                query {
                  metrics {
                    promql_query = "histogram_quantile(0.99, sum(rate(http_request_duration_seconds_bucket{subsystem=\"api\"}[5m])) by (le)) * 1000"
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }
      }
    }

    # ── Section 3: Log Volume by Severity ──────────────────────────────────
    sections {
      id {
        value = "${local.resource_prefix}-log-volume"
      }

      rows {
        id {
          value = "${local.resource_prefix}-log-volume-row"
        }
        height = 19

        widgets {
          id {
            value = "${local.resource_prefix}-widget-log-volume-severity"
          }
          title       = "Log Volume by Severity"
          description = "Log count grouped by severity level across all services"
          definition {
            line_chart {
              legend {
                is_visible   = true
                columns      = ["avg", "sum", "last"]
                group_by_query = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-log-vol-severity"
                name         = "Logs / 5m"
                color_scheme = "severity"
                is_visible   = true

                query {
                  logs {
                    lucene_query = "*"
                    group_by     = ["coralogix.metadata.severity"]
                    aggregations {
                      type = "count"
                    }
                    filters {
                      field = "coralogix.metadata.applicationName"
                      operator {
                        type            = "equals"
                        selected_values = [var.application_name]
                      }
                    }
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }

        widgets {
          id {
            value = "${local.resource_prefix}-widget-log-volume-service"
          }
          title       = "Log Volume by Service"
          description = "Log count grouped by subsystem to identify noisy services"
          definition {
            line_chart {
              legend {
                is_visible   = true
                group_by_query = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-log-vol-service"
                name         = "Logs / 5m"
                color_scheme = "classic"
                is_visible   = true

                query {
                  logs {
                    lucene_query = "*"
                    group_by     = ["coralogix.metadata.subsystemName"]
                    aggregations {
                      type = "count"
                    }
                    filters {
                      field = "coralogix.metadata.applicationName"
                      operator {
                        type            = "equals"
                        selected_values = [var.application_name]
                      }
                    }
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }
      }
    }

    # ── Section 4: MongoDB Performance ─────────────────────────────────────
    sections {
      id {
        value = "${local.resource_prefix}-mongodb"
      }

      rows {
        id {
          value = "${local.resource_prefix}-mongodb-row"
        }
        height = 19

        widgets {
          id {
            value = "${local.resource_prefix}-widget-mongo-errors"
          }
          title       = "MongoDB Errors"
          description = "MongoServerError and connection refusal logs over time"
          definition {
            line_chart {
              legend {
                is_visible = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-mongo-err"
                name         = "Mongo Errors"
                color_scheme = "classic"
                is_visible   = true

                query {
                  logs {
                    lucene_query = "\"MongoServerError\" OR \"ECONNREFUSED\" OR \"MongoNetworkError\""
                    aggregations {
                      type = "count"
                    }
                    filters {
                      field = "coralogix.metadata.applicationName"
                      operator {
                        type            = "equals"
                        selected_values = [var.application_name]
                      }
                    }
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }

        widgets {
          id {
            value = "${local.resource_prefix}-widget-mongo-latency"
          }
          title       = "MongoDB Query Latency"
          description = "Average MongoDB operation duration reported by the application"
          definition {
            line_chart {
              legend {
                is_visible = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-mongo-latency"
                name         = "Avg Duration (ms)"
                color_scheme = "classic"
                is_visible   = true

                query {
                  metrics {
                    promql_query = "avg(rate(mongodb_operation_duration_seconds_sum[5m]) / rate(mongodb_operation_duration_seconds_count[5m])) * 1000"
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }
      }
    }

    # ── Section 5: Authentication Events ───────────────────────────────────
    sections {
      id {
        value = "${local.resource_prefix}-auth"
      }

      rows {
        id {
          value = "${local.resource_prefix}-auth-row"
        }
        height = 19

        widgets {
          id {
            value = "${local.resource_prefix}-widget-auth-success-fail"
          }
          title       = "Authentication Outcomes"
          description = "Successful vs. failed login and auth requests on the API"
          definition {
            line_chart {
              legend {
                is_visible   = true
                group_by_query = true
              }
              tooltip {
                show_labels = true
                type        = "all"
              }
              query_definitions {
                id           = "${local.resource_prefix}-q-auth-success"
                name         = "Successful Auth"
                color_scheme = "classic"
                is_visible   = true

                query {
                  logs {
                    lucene_query = "(path:\"/api/auth/*\" OR path:\"/api/login\") AND status:[200 TO 299]"
                    aggregations {
                      type = "count"
                    }
                    filters {
                      field = "coralogix.metadata.subsystemName"
                      operator {
                        type            = "equals"
                        selected_values = ["api"]
                      }
                    }
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }

              query_definitions {
                id           = "${local.resource_prefix}-q-auth-fail"
                name         = "Failed Auth"
                color_scheme = "classic"
                is_visible   = true

                query {
                  logs {
                    lucene_query = "(path:\"/api/auth/*\" OR path:\"/api/login\") AND (status:401 OR status:403)"
                    aggregations {
                      type = "count"
                    }
                    filters {
                      field = "coralogix.metadata.subsystemName"
                      operator {
                        type            = "equals"
                        selected_values = ["api"]
                      }
                    }
                  }
                }

                resolution {
                  buckets_presented = 120
                }
              }
            }
          }
        }

        widgets {
          id {
            value = "${local.resource_prefix}-widget-auth-failure-rate"
          }
          title       = "Auth Failure Ratio"
          description = "Percentage of authentication requests that result in 401/403 responses"
          definition {
            gauge {
              min   = 0
              max   = 100
              unit  = "percent"

              query {
                metrics {
                  promql_query = "sum(rate(http_requests_total{path=~\"/api/auth/.*|/api/login\",status=~\"401|403\",subsystem=\"api\"}[10m])) / sum(rate(http_requests_total{path=~\"/api/auth/.*|/api/login\",subsystem=\"api\"}[10m])) * 100"
                }
              }

              thresholds {
                color = "#22c55e"
                value = 0
              }
              thresholds {
                color = "#f59e0b"
                value = 10
              }
              thresholds {
                color = "#ef4444"
                value = 25
              }
            }
          }
        }
      }
    }
  }

  filters {
    source {
      logs {
        observation_field {
          keypath = ["coralogix.metadata.applicationName"]
          scope   = "metadata"
        }
        operator {
          type            = "equals"
          selected_values = [var.application_name]
        }
      }
    }
  }

  time_frame {
    relative {
      duration = "24h"
    }
  }
}
