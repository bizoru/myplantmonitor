variable "domain" {
  description = "Public domain for the stack (Caddy uses this for ACME)."
  type        = string
}

variable "instance_type" {
  description = "EC2 instance type. ARM (t4g.*) is cheapest for this workload."
  type        = string
  default     = "t4g.small"
}

variable "key_name" {
  description = "Optional EC2 keypair name for SSH fallback. SSM is the primary access path; leave empty if you only use SSM."
  type        = string
  default     = ""
}

variable "allowed_ssh_cidr" {
  description = "CIDR allowed to reach port 22. Default opens to the world for first-deploy convenience — RESTRICT to your home/office IP after bootstrap."
  type        = string
  default     = "0.0.0.0/0"
}

variable "tags" {
  description = "Tags applied to every taggable resource."
  type        = map(string)
  default = {
    Project = "myplantmonitor"
    Owner   = "steven"
  }
}
