# myplantmonitor — root Terraform module.
#
# State is local for now (terraform.tfstate next to this file). When we want
# multi-machine collaboration or remote locking, migrate to S3 + DynamoDB:
#
#   terraform {
#     backend "s3" {
#       bucket         = "myplantmonitor-tfstate"
#       key            = "infra/terraform.tfstate"
#       region         = "us-east-1"
#       dynamodb_table = "myplantmonitor-tflock"
#       encrypt        = true
#     }
#   }
#
# Then `terraform init -migrate-state`.

terraform {
  required_version = ">= 1.6"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = "us-east-1"

  default_tags {
    tags = var.tags
  }
}
