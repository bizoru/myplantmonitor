# DNS — Route53 hosted zone for miplanta.app.
#
# After `terraform apply`, read the NS records from the output and paste them
# into name.com as custom nameservers:
#   name.com → My Domains → miplanta.app → Nameservers → Custom Nameservers
#
# Propagation takes 1-24h (usually <30 min). Caddy's Let's Encrypt cert
# provision happens automatically once DNS resolves to the EIP.

resource "aws_route53_zone" "main" {
  name = var.domain
}

resource "aws_route53_record" "apex" {
  zone_id = aws_route53_zone.main.zone_id
  name    = var.domain
  type    = "A"
  ttl     = 300
  records = [aws_eip.plant.public_ip]
}

resource "aws_route53_record" "wildcard" {
  zone_id = aws_route53_zone.main.zone_id
  name    = "*.${var.domain}"
  type    = "A"
  ttl     = 300
  records = [aws_eip.plant.public_ip]
}

output "route53_nameservers" {
  value       = aws_route53_zone.main.name_servers
  description = "Paste these 4 values as custom nameservers at name.com."
}
