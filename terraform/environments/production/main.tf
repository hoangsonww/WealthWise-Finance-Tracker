terraform {
  required_version = ">= 1.5"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
    coralogix = {
      source  = "coralogix/coralogix"
      version = "~> 2.0"
    }
  }
}

provider "aws" {
  region = var.region

  default_tags {
    tags = {
      Project     = "wealthwise"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}

provider "coralogix" {
  api_key = var.coralogix_api_key
  domain  = var.coralogix_domain
}

# --- IAM Roles for ECS ---

resource "aws_iam_role" "ecs_execution" {
  name = "wealthwise-${var.environment}-ecs-execution"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ecs_execution" {
  role       = aws_iam_role.ecs_execution.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

resource "aws_iam_role" "ecs_task" {
  name = "wealthwise-${var.environment}-ecs-task"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "ecs-tasks.amazonaws.com"
        }
      }
    ]
  })
}

# --- ALB ---

resource "aws_security_group" "alb" {
  name_prefix = "wealthwise-${var.environment}-alb-"
  description = "Security group for ALB"
  vpc_id      = module.networking.vpc_id

  ingress {
    description = "HTTP"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
}

resource "aws_lb" "main" {
  name               = "wealthwise-${var.environment}"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb.id]
  subnets            = module.networking.public_subnet_ids

  enable_deletion_protection = true
}

resource "aws_lb_target_group" "api" {
  name        = "wealthwise-${var.environment}-api"
  port        = 4000
  protocol    = "HTTP"
  vpc_id      = module.networking.vpc_id
  target_type = "ip"

  health_check {
    path                = "/api/health"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_target_group" "web" {
  name        = "wealthwise-${var.environment}-web"
  port        = 3000
  protocol    = "HTTP"
  vpc_id      = module.networking.vpc_id
  target_type = "ip"

  health_check {
    path                = "/"
    healthy_threshold   = 2
    unhealthy_threshold = 3
    timeout             = 5
    interval            = 30
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.main.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.web.arn
  }
}

resource "aws_lb_listener_rule" "api" {
  listener_arn = aws_lb_listener.http.arn
  priority     = 100

  action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.api.arn
  }

  condition {
    path_pattern {
      values = ["/api/*"]
    }
  }
}

# --- Modules ---

module "networking" {
  source = "../../modules/networking"

  environment = var.environment
  vpc_cidr    = "10.2.0.0/16"
}

module "container_registry" {
  source = "../../modules/container-registry"

  environment          = var.environment
  image_tag_mutability = "IMMUTABLE"
}

module "compute" {
  source = "../../modules/compute"

  environment           = var.environment
  api_image             = "${module.container_registry.repository_urls["wealthwise-api"]}:latest"
  web_image             = "${module.container_registry.repository_urls["wealthwise-web"]}:latest"
  cpu                   = 512
  memory                = 1024
  min_capacity          = 3
  max_capacity          = 10
  vpc_id                = module.networking.vpc_id
  private_subnet_ids    = module.networking.private_subnet_ids
  alb_security_group_id = aws_security_group.alb.id
  api_target_group_arn  = aws_lb_target_group.api.arn
  web_target_group_arn  = aws_lb_target_group.web.arn
  execution_role_arn    = aws_iam_role.ecs_execution.arn
  task_role_arn         = aws_iam_role.ecs_task.arn
}

module "database" {
  source = "../../modules/database"

  environment                = var.environment
  instance_class             = "db.r6g.large"
  instance_count             = 2
  master_password            = var.db_password
  vpc_id                     = module.networking.vpc_id
  private_subnet_ids         = module.networking.private_subnet_ids
  allowed_security_group_ids = [module.compute.ecs_tasks_security_group_id]
}

module "monitoring" {
  source = "../../modules/monitoring"

  environment                 = var.environment
  cluster_name                = module.compute.cluster_name
  api_service_name            = module.compute.api_service_name
  web_service_name            = module.compute.web_service_name
  alb_arn_suffix              = aws_lb.main.arn_suffix
  api_target_group_arn_suffix = aws_lb_target_group.api.arn_suffix
  web_target_group_arn_suffix = aws_lb_target_group.web.arn_suffix
  alarm_email                 = var.alarm_email
  cpu_threshold               = 70
  error_threshold             = 0.5
}

module "coralogix" {
  source = "../../modules/coralogix"

  environment         = var.environment
  coralogix_api_key   = var.coralogix_api_key
  coralogix_domain    = var.coralogix_domain
  application_name    = "wealthwise"
  notification_emails = [var.alarm_email]
}
