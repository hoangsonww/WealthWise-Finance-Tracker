terraform {
  required_version = ">= 1.5"

  required_providers {
    coralogix = {
      source  = "coralogix/coralogix"
      version = "~> 2.0"
    }
  }
}
