variable "region" {
  description = "AWS region"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Environment name"
  type        = string
  default     = "production"
}

variable "alarm_email" {
  description = "Email address for CloudWatch alarm notifications"
  type        = string
}

variable "db_password" {
  description = "DocumentDB master password"
  type        = string
  sensitive   = true
}

# ── Coralogix ────────────────────────────────────────────────────────────────

variable "coralogix_api_key" {
  description = "Coralogix Alerts, Rules & Tags API key for the observability module"
  type        = string
  sensitive   = true
}

variable "coralogix_domain" {
  description = "Coralogix platform domain matching your account region (coralogix.com, coralogix.us, eu2.coralogix.com, coralogix.in, coralogix.sg)"
  type        = string
  default     = "coralogix.us"
}
