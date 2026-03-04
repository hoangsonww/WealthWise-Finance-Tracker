variable "cluster_name" {
  description = "Name of the ECS cluster"
  type        = string
}

variable "api_service_name" {
  description = "Name of the API ECS service"
  type        = string
}

variable "web_service_name" {
  description = "Name of the web ECS service"
  type        = string
}

variable "alb_arn_suffix" {
  description = "ARN suffix of the Application Load Balancer"
  type        = string
}

variable "api_target_group_arn_suffix" {
  description = "ARN suffix of the API target group"
  type        = string
}

variable "web_target_group_arn_suffix" {
  description = "ARN suffix of the web target group"
  type        = string
}

variable "mcp_service_name" {
  description = "Name of the MCP ECS service"
  type        = string
}

variable "agentic_ai_service_name" {
  description = "Name of the agentic AI ECS service"
  type        = string
}

variable "mcp_target_group_arn_suffix" {
  description = "ARN suffix of the MCP target group"
  type        = string
}

variable "agentic_ai_target_group_arn_suffix" {
  description = "ARN suffix of the agentic AI target group"
  type        = string
}

variable "alarm_email" {
  description = "Email address for alarm notifications"
  type        = string
}

variable "cpu_threshold" {
  description = "CPU utilization threshold for alarms (percent)"
  type        = number
  default     = 80
}

variable "error_threshold" {
  description = "5XX error count threshold for alarms"
  type        = number
  default     = 1
}

variable "environment" {
  description = "Environment name"
  type        = string
}

variable "project_name" {
  description = "Project name used for resource naming"
  type        = string
  default     = "wealthwise"
}
