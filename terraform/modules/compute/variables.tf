variable "api_image" {
  description = "Docker image for the API service"
  type        = string
}

variable "web_image" {
  description = "Docker image for the web service"
  type        = string
}

variable "api_port" {
  description = "Port the API container listens on"
  type        = number
  default     = 4000
}

variable "web_port" {
  description = "Port the web container listens on"
  type        = number
  default     = 3000
}

variable "cpu" {
  description = "CPU units for ECS tasks"
  type        = number
  default     = 512
}

variable "memory" {
  description = "Memory in MiB for ECS tasks"
  type        = number
  default     = 1024
}

variable "min_capacity" {
  description = "Minimum number of ECS tasks"
  type        = number
  default     = 2
}

variable "max_capacity" {
  description = "Maximum number of ECS tasks"
  type        = number
  default     = 10
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

variable "vpc_id" {
  description = "ID of the VPC"
  type        = string
}

variable "private_subnet_ids" {
  description = "IDs of private subnets for ECS tasks"
  type        = list(string)
}

variable "alb_security_group_id" {
  description = "Security group ID of the ALB"
  type        = string
}

variable "api_target_group_arn" {
  description = "ARN of the API ALB target group"
  type        = string
}

variable "web_target_group_arn" {
  description = "ARN of the web ALB target group"
  type        = string
}

variable "mcp_image" {
  description = "Docker image for the MCP service"
  type        = string
}

variable "agentic_ai_image" {
  description = "Docker image for the agentic AI service"
  type        = string
}

variable "mcp_port" {
  description = "Port the MCP container listens on"
  type        = number
  default     = 5100
}

variable "agentic_ai_port" {
  description = "Port the agentic AI container listens on"
  type        = number
  default     = 5200
}

variable "mcp_target_group_arn" {
  description = "ARN of the MCP ALB target group"
  type        = string
}

variable "agentic_ai_target_group_arn" {
  description = "ARN of the agentic AI ALB target group"
  type        = string
}

variable "execution_role_arn" {
  description = "ARN of the ECS task execution IAM role"
  type        = string
}

variable "task_role_arn" {
  description = "ARN of the ECS task IAM role"
  type        = string
}
