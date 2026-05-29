# AWS EKS Infrastructure

This Terraform stack creates the base AWS infrastructure for the project:

- VPC across three availability zones
- Public subnets for AWS load balancers
- Private subnets for EKS worker nodes
- EKS managed node group
- EKS OIDC provider for IRSA

The stack intentionally keeps add-ons such as ArgoCD, AWS Load Balancer Controller, and External Secrets Operator out of Terraform. They are bootstrapped with Helm/Kubernetes commands so the GitOps part of the project remains easy to demonstrate.

## Commands

```bash
terraform init
terraform plan -out tfplan
terraform apply tfplan
aws eks update-kubeconfig --region eu-central-1 --name xo-rps-prod
```

Before applying, confirm:

- AWS credentials are configured for the correct account.
- The selected `cluster_version` is supported by Amazon EKS in your region.
- You are comfortable with the AWS cost of EKS, NAT Gateway, EC2 worker nodes, load balancers, and data transfer.
