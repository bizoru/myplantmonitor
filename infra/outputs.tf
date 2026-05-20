output "instance_id" {
  description = "EC2 instance ID for SSM."
  value       = aws_instance.plant.id
}

output "eip" {
  description = "Elastic IP — point your domain's A-record at this."
  value       = aws_eip.plant.public_ip
}

output "public_dns" {
  description = "AWS-assigned public DNS for the instance."
  value       = aws_instance.plant.public_dns
}

output "ssm_session_command" {
  description = "Copy/paste this to open a shell on the box."
  value       = "aws ssm start-session --target ${aws_instance.plant.id} --region us-east-1"
}

output "suggested_a_record" {
  description = "What to set at your DNS registrar."
  value       = "${var.domain}  A  ${aws_eip.plant.public_ip}  TTL 300"
}
