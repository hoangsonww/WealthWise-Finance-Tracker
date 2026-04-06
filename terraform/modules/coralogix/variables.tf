# -----------------------------------------------------------------------------
# Coralogix Module — Input Variables
# WealthWise Finance Tracker
# -----------------------------------------------------------------------------

# ── Provider Authentication ──────────────────────────────────────────────────

variable "coralogix_api_key" {
  description = "Coralogix Alerts, Rules & Tags API key used for provider authentication"
  type        = string
  sensitive   = true
}

variable "coralogix_domain" {
  description = "Coralogix domain endpoint matching your account region (coralogix.com, coralogix.us, eu2.coralogix.com, coralogix.in, coralogix.sg)"
  type        = string
  default     = "coralogix.us"

  validation {
    condition = contains([
      "coralogix.com",
      "coralogix.us",
      "eu2.coralogix.com",
      "coralogix.in",
      "coralogix.sg",
    ], var.coralogix_domain)
    error_message = "coralogix_domain must be one of: coralogix.com, coralogix.us, eu2.coralogix.com, coralogix.in, coralogix.sg."
  }
}

# ── Resource Identification ──────────────────────────────────────────────────

variable "environment" {
  description = "Deployment environment name (e.g. production, staging, dev)"
  type        = string

  validation {
    condition     = can(regex("^[a-z][a-z0-9-]{1,30}$", var.environment))
    error_message = "environment must be lowercase alphanumeric with hyphens, 2-31 characters, starting with a letter."
  }
}

variable "project_name" {
  description = "Project identifier used as a prefix for all Coralogix resource names"
  type        = string
  default     = "wealthwise"
}

variable "application_name" {
  description = "Coralogix application name used for log filtering and TCO policy scoping"
  type        = string
  default     = "wealthwise"
}

# ── Notification Targets ─────────────────────────────────────────────────────

variable "notification_emails" {
  description = "List of email addresses that receive alert notifications"
  type        = list(string)
  default     = []

  validation {
    condition     = alltrue([for e in var.notification_emails : can(regex("^[^@]+@[^@]+\\.[^@]+$", e))])
    error_message = "All notification_emails entries must be valid email addresses."
  }
}

variable "alert_webhook_url" {
  description = "Webhook URL for alert delivery (Slack, PagerDuty, custom endpoint, etc.)"
  type        = string
  default     = ""
}

# ── TCO Quota Configuration ─────────────────────────────────────────────────

variable "logs_critical_daily_quota_gb" {
  description = "Daily ingestion quota in GB for high-priority logs (ERROR/CRITICAL from API)"
  type        = number
  default     = 5

  validation {
    condition     = var.logs_critical_daily_quota_gb > 0 && var.logs_critical_daily_quota_gb <= 100
    error_message = "logs_critical_daily_quota_gb must be between 1 and 100."
  }
}

variable "logs_normal_daily_quota_gb" {
  description = "Daily ingestion quota in GB for medium-priority logs (WARN/INFO across all services)"
  type        = number
  default     = 20

  validation {
    condition     = var.logs_normal_daily_quota_gb > 0 && var.logs_normal_daily_quota_gb <= 500
    error_message = "logs_normal_daily_quota_gb must be between 1 and 500."
  }
}
