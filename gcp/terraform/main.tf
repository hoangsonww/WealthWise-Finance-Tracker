# WealthWise GCP Infrastructure

terraform {
  required_version = ">= 1.5"

  required_providers {
    google = {
      source  = "hashicorp/google"
      version = "~> 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Enable required APIs
resource "google_project_service" "apis" {
  for_each = toset([
    "run.googleapis.com",
    "compute.googleapis.com",
    "secretmanager.googleapis.com",
    "artifactregistry.googleapis.com",
    "vpcaccess.googleapis.com",
    "certificatemanager.googleapis.com",
  ])
  service            = each.key
  disable_on_destroy = false
}

# Artifact Registry
resource "google_artifact_registry_repository" "api" {
  location      = var.region
  repository_id = "wealthwise-api"
  format        = "DOCKER"
  description   = "WealthWise API container images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.apis["artifactregistry.googleapis.com"]]
}

resource "google_artifact_registry_repository" "web" {
  location      = var.region
  repository_id = "wealthwise-web"
  format        = "DOCKER"
  description   = "WealthWise Web container images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.apis["artifactregistry.googleapis.com"]]
}

resource "google_artifact_registry_repository" "mcp" {
  location      = var.region
  repository_id = "wealthwise-mcp"
  format        = "DOCKER"
  description   = "WealthWise MCP server container images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.apis["artifactregistry.googleapis.com"]]
}

resource "google_artifact_registry_repository" "agentic_ai" {
  location      = var.region
  repository_id = "wealthwise-agentic-ai"
  format        = "DOCKER"
  description   = "WealthWise Agentic AI container images"

  cleanup_policies {
    id     = "keep-recent"
    action = "KEEP"
    most_recent_versions {
      keep_count = 10
    }
  }

  depends_on = [google_project_service.apis["artifactregistry.googleapis.com"]]
}

# VPC Connector for Cloud Run → MongoDB Atlas
resource "google_vpc_access_connector" "connector" {
  name          = "wealthwise-connector"
  region        = var.region
  ip_cidr_range = "10.8.0.0/28"
  network       = "default"

  depends_on = [google_project_service.apis["vpcaccess.googleapis.com"]]
}

# Service accounts
resource "google_service_account" "api" {
  account_id   = "wealthwise-api"
  display_name = "WealthWise API Service Account"
}

resource "google_service_account" "web" {
  account_id   = "wealthwise-web"
  display_name = "WealthWise Web Service Account"
}

resource "google_service_account" "mcp" {
  account_id   = "wealthwise-mcp"
  display_name = "WealthWise MCP Service Account"
}

resource "google_service_account" "agentic_ai" {
  account_id   = "wealthwise-agentic-ai"
  display_name = "WealthWise Agentic AI Service Account"
}

# Secret Manager access for API
resource "google_secret_manager_secret_iam_member" "api_secrets" {
  for_each  = toset(["jwt-secret", "jwt-refresh-secret", "mongodb-uri"])
  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.api.email}"
}

# Secret Manager access for Web
resource "google_secret_manager_secret_iam_member" "web_secrets" {
  for_each  = toset(["nextauth-secret"])
  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.web.email}"
}

# Secret Manager access for MCP
resource "google_secret_manager_secret_iam_member" "mcp_secrets" {
  for_each  = toset(["jwt-secret", "mongodb-uri"])
  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.mcp.email}"
}

# Secret Manager access for Agentic AI
resource "google_secret_manager_secret_iam_member" "agentic_ai_secrets" {
  for_each  = toset(["jwt-secret", "anthropic-api-key"])
  secret_id = each.key
  role      = "roles/secretmanager.secretAccessor"
  member    = "serviceAccount:${google_service_account.agentic_ai.email}"
}

# Cloud Run - API
resource "google_cloud_run_v2_service" "api" {
  name     = "wealthwise-api"
  location = var.region

  template {
    service_account = google_service_account.api.email

    scaling {
      min_instance_count = var.api_min_instances
      max_instance_count = var.api_max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.api_image

      ports {
        container_port = 4000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "API_PORT"
        value = "4000"
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt-secret"
            version = "latest"
          }
        }
      }

      env {
        name = "JWT_REFRESH_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt-refresh-secret"
            version = "latest"
          }
        }
      }

      env {
        name = "MONGODB_URI"
        value_source {
          secret_key_ref {
            secret  = "mongodb-uri"
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/api/health"
          port = 4000
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 12
      }

      liveness_probe {
        http_get {
          path = "/api/health"
          port = 4000
        }
        period_seconds    = 10
        failure_threshold = 3
      }
    }
  }

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_secret_manager_secret_iam_member.api_secrets,
  ]
}

# Cloud Run - Web
resource "google_cloud_run_v2_service" "web" {
  name     = "wealthwise-web"
  location = var.region

  template {
    service_account = google_service_account.web.email

    scaling {
      min_instance_count = var.web_min_instances
      max_instance_count = var.web_max_instances
    }

    containers {
      image = var.web_image

      ports {
        container_port = 3000
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "NEXT_TELEMETRY_DISABLED"
        value = "1"
      }

      env {
        name = "NEXTAUTH_SECRET"
        value_source {
          secret_key_ref {
            secret  = "nextauth-secret"
            version = "latest"
          }
        }
      }

      env {
        name  = "NEXTAUTH_URL"
        value = "https://${var.domain}"
      }

      env {
        name  = "NEXT_PUBLIC_API_URL"
        value = "https://${var.domain}/api/v1"
      }

      startup_probe {
        http_get {
          path = "/"
          port = 3000
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 12
      }

      liveness_probe {
        http_get {
          path = "/"
          port = 3000
        }
        period_seconds    = 10
        failure_threshold = 3
      }
    }
  }

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_secret_manager_secret_iam_member.web_secrets,
  ]
}

# Cloud Run - MCP
resource "google_cloud_run_v2_service" "mcp" {
  name     = "wealthwise-mcp"
  location = var.region

  template {
    service_account = google_service_account.mcp.email

    scaling {
      min_instance_count = var.mcp_min_instances
      max_instance_count = var.mcp_max_instances
    }

    vpc_access {
      connector = google_vpc_access_connector.connector.id
      egress    = "PRIVATE_RANGES_ONLY"
    }

    containers {
      image = var.mcp_image

      ports {
        container_port = 5100
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "MCP_PORT"
        value = "5100"
      }

      env {
        name  = "MCP_TRANSPORT"
        value = "sse"
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt-secret"
            version = "latest"
          }
        }
      }

      env {
        name = "MONGODB_URI"
        value_source {
          secret_key_ref {
            secret  = "mongodb-uri"
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 5100
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 12
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 5100
        }
        period_seconds    = 10
        failure_threshold = 3
      }
    }
  }

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_secret_manager_secret_iam_member.mcp_secrets,
  ]
}

# Cloud Run - Agentic AI
resource "google_cloud_run_v2_service" "agentic_ai" {
  name     = "wealthwise-agentic-ai"
  location = var.region

  template {
    service_account = google_service_account.agentic_ai.email

    scaling {
      min_instance_count = var.agentic_ai_min_instances
      max_instance_count = var.agentic_ai_max_instances
    }

    containers {
      image = var.agentic_ai_image

      ports {
        container_port = 5200
      }

      resources {
        limits = {
          cpu    = "1"
          memory = "512Mi"
        }
      }

      env {
        name  = "NODE_ENV"
        value = "production"
      }

      env {
        name  = "AGENT_PORT"
        value = "5200"
      }

      env {
        name  = "MCP_SERVER_URL"
        value = "https://${var.domain}/mcp"
      }

      env {
        name = "JWT_SECRET"
        value_source {
          secret_key_ref {
            secret  = "jwt-secret"
            version = "latest"
          }
        }
      }

      env {
        name = "ANTHROPIC_API_KEY"
        value_source {
          secret_key_ref {
            secret  = "anthropic-api-key"
            version = "latest"
          }
        }
      }

      startup_probe {
        http_get {
          path = "/health"
          port = 5200
        }
        initial_delay_seconds = 5
        period_seconds        = 5
        failure_threshold     = 12
      }

      liveness_probe {
        http_get {
          path = "/health"
          port = 5200
        }
        period_seconds    = 10
        failure_threshold = 3
      }
    }
  }

  ingress = "INGRESS_TRAFFIC_INTERNAL_LOAD_BALANCER"

  depends_on = [
    google_project_service.apis["run.googleapis.com"],
    google_secret_manager_secret_iam_member.agentic_ai_secrets,
  ]
}

# Serverless NEGs for Load Balancer
resource "google_compute_region_network_endpoint_group" "api_neg" {
  name                  = "wealthwise-api-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.api.name
  }
}

resource "google_compute_region_network_endpoint_group" "web_neg" {
  name                  = "wealthwise-web-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.web.name
  }
}

resource "google_compute_region_network_endpoint_group" "mcp_neg" {
  name                  = "wealthwise-mcp-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.mcp.name
  }
}

resource "google_compute_region_network_endpoint_group" "agentic_ai_neg" {
  name                  = "wealthwise-agentic-ai-neg"
  network_endpoint_type = "SERVERLESS"
  region                = var.region

  cloud_run {
    service = google_cloud_run_v2_service.agentic_ai.name
  }
}

# Backend services
resource "google_compute_backend_service" "api" {
  name                  = "wealthwise-api-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.api_neg.id
  }
}

resource "google_compute_backend_service" "web" {
  name                  = "wealthwise-web-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.web_neg.id
  }
}

resource "google_compute_backend_service" "mcp" {
  name                  = "wealthwise-mcp-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.mcp_neg.id
  }
}

resource "google_compute_backend_service" "agentic_ai" {
  name                  = "wealthwise-agentic-ai-backend"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  protocol              = "HTTPS"

  backend {
    group = google_compute_region_network_endpoint_group.agentic_ai_neg.id
  }
}

# URL Map
resource "google_compute_url_map" "default" {
  name            = "wealthwise-url-map"
  default_service = google_compute_backend_service.web.id

  host_rule {
    hosts        = [var.domain]
    path_matcher = "main"
  }

  path_matcher {
    name            = "main"
    default_service = google_compute_backend_service.web.id

    path_rule {
      paths   = ["/api/*"]
      service = google_compute_backend_service.api.id
    }
  }
}

# SSL Certificate
resource "google_compute_managed_ssl_certificate" "default" {
  name = "wealthwise-ssl-cert"

  managed {
    domains = [var.domain]
  }
}

# HTTPS Proxy
resource "google_compute_target_https_proxy" "default" {
  name             = "wealthwise-https-proxy"
  url_map          = google_compute_url_map.default.id
  ssl_certificates = [google_compute_managed_ssl_certificate.default.id]
}

# Global IP
resource "google_compute_global_address" "default" {
  name = "wealthwise-lb-ip"
}

# Forwarding rule
resource "google_compute_global_forwarding_rule" "https" {
  name                  = "wealthwise-https-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "443"
  target                = google_compute_target_https_proxy.default.id
  ip_address            = google_compute_global_address.default.id
}

# HTTP → HTTPS redirect
resource "google_compute_url_map" "redirect" {
  name = "wealthwise-http-redirect"

  default_url_redirect {
    https_redirect         = true
    redirect_response_code = "MOVED_PERMANENTLY_DEFAULT"
    strip_query            = false
  }
}

resource "google_compute_target_http_proxy" "redirect" {
  name    = "wealthwise-http-proxy"
  url_map = google_compute_url_map.redirect.id
}

resource "google_compute_global_forwarding_rule" "http" {
  name                  = "wealthwise-http-rule"
  ip_protocol           = "TCP"
  load_balancing_scheme = "EXTERNAL_MANAGED"
  port_range            = "80"
  target                = google_compute_target_http_proxy.redirect.id
  ip_address            = google_compute_global_address.default.id
}

# Cloud Armor security policy
resource "google_compute_security_policy" "default" {
  name = "wealthwise-security-policy"

  rule {
    action   = "allow"
    priority = 2147483647

    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }

    description = "Default allow rule"
  }

  rule {
    action   = "throttle"
    priority = 1000

    match {
      versioned_expr = "SRC_IPS_V1"
      config {
        src_ip_ranges = ["*"]
      }
    }

    rate_limit_options {
      conform_action = "allow"
      exceed_action  = "deny(429)"

      rate_limit_threshold {
        count        = 100
        interval_sec = 60
      }
    }

    description = "Rate limiting"
  }
}
