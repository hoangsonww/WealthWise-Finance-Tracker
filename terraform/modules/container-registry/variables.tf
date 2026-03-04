variable "repository_names" {
  description = "List of ECR repository names to create"
  type        = list(string)
  default     = ["wealthwise-api", "wealthwise-web", "wealthwise-mcp", "wealthwise-agentic-ai"]
}

variable "scan_on_push" {
  description = "Enable image scanning on push"
  type        = bool
  default     = true
}

variable "image_tag_mutability" {
  description = "Image tag mutability setting"
  type        = string
  default     = "MUTABLE"
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
