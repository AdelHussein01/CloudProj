variable "aws_region" {
  description = "AWS region for the EKS cluster."
  type        = string
  default     = "eu-central-1"
}

variable "project_name" {
  description = "Project name used in AWS resource names."
  type        = string
  default     = "xo-rps"
}

variable "environment" {
  description = "Environment name."
  type        = string
  default     = "prod"
}

variable "cluster_version" {
  description = "EKS Kubernetes version. Confirm supported versions in AWS before applying."
  type        = string
  default     = "1.32"
}

variable "node_instance_types" {
  description = "Managed node group instance types."
  type        = list(string)
  default     = ["t3.small"]
}

variable "node_min_size" {
  description = "Minimum worker nodes."
  type        = number
  default     = 2
}

variable "node_desired_size" {
  description = "Desired worker nodes."
  type        = number
  default     = 2
}

variable "node_max_size" {
  description = "Maximum worker nodes."
  type        = number
  default     = 4
}
