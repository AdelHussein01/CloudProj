# Deployment Guide

This guide describes the real AWS deployment path. The local repository contains everything needed except your real AWS account, domain, and GitHub repository details.

## Prerequisites

- Public GitHub repository.
- AWS account with permissions to create VPC, EKS, IAM, EC2, load balancers, and Secrets Manager resources.
- Local tools: `git`, `node`, `npm`, `docker`, `aws`, `kubectl`, `helm`, and `terraform`.
- Optional but useful: `eksctl` and `argocd` CLI.

## 1. Publish the Repository

Create a public GitHub repository and push this code.

This project is configured for:

```text
https://github.com/AdelHussein01/CloudProj
ghcr.io/adelhussein01/cloudproj
```

Before the AWS deployment, replace `xo-rps.example.com` in `deploy/helm/xo-rps/values.yaml` with your real domain, or keep it as a placeholder and use the AWS ALB DNS name for the first demo. The release workflow will keep image tags updated automatically after the first merge to `main`.

## 2. Create AWS Infrastructure

From `infra/terraform`:

```bash
terraform init
terraform plan -out tfplan
terraform apply tfplan
aws eks update-kubeconfig --region eu-central-1 --name xo-rps-prod
kubectl get nodes
```

Before applying, confirm the EKS version in `infra/terraform/variables.tf` is supported in your AWS region.

## 3. Install AWS Load Balancer Controller

Follow the official AWS EKS Helm installation guide for the AWS Load Balancer Controller:

https://docs.aws.amazon.com/eks/latest/userguide/lbc-helm.html

High-level steps:

```bash
helm repo add eks https://aws.github.io/eks-charts
helm repo update
```

Create the controller IAM policy and IRSA service account as described by AWS, then install:

```bash
helm upgrade --install aws-load-balancer-controller eks/aws-load-balancer-controller \
  -n kube-system \
  --set clusterName=xo-rps-prod \
  --set serviceAccount.create=false \
  --set serviceAccount.name=aws-load-balancer-controller
```

## 4. Install External Secrets Operator

Create an IAM policy that only reads the project secret path:

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": [
        "secretsmanager:GetSecretValue",
        "secretsmanager:DescribeSecret"
      ],
      "Resource": "arn:aws:secretsmanager:eu-central-1:ACCOUNT_ID:secret:xo-rps/*"
    }
  ]
}
```

Create an IRSA service account named `external-secrets` in namespace `external-secrets`, attach the policy, then install the operator:

```bash
helm repo add external-secrets https://charts.external-secrets.io
helm repo update
helm upgrade --install external-secrets external-secrets/external-secrets \
  -n external-secrets \
  --create-namespace \
  --set installCRDs=true \
  --set serviceAccount.create=false \
  --set serviceAccount.name=external-secrets
```

Create the runtime secret in AWS Secrets Manager:

```bash
aws secretsmanager create-secret \
  --name xo-rps/prod/session \
  --secret-string '{"SESSION_SECRET":"replace-with-a-generated-random-value"}'
```

Apply the ClusterSecretStore after checking the region:

```bash
kubectl apply -f deploy/platform/clustersecretstore.yaml
```

Enable External Secrets in `deploy/helm/xo-rps/values.yaml`:

```yaml
externalSecrets:
  enabled: true
```

## 5. Install ArgoCD

Use the official ArgoCD installation manifests:

```bash
kubectl create namespace argocd
kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
kubectl -n argocd rollout status deployment/argocd-server
```

Apply this project's ArgoCD resources:

```bash
kubectl apply -f deploy/argocd/project.yaml
kubectl apply -f deploy/argocd/application.yaml
```

ArgoCD will create the `xo-rps` namespace and deploy the Helm chart.

## 6. Configure DNS and TLS

After the Ingress provisions an AWS ALB:

```bash
kubectl -n xo-rps get ingress
```

Create a DNS record pointing your domain to the ALB hostname.

The default Helm values use HTTP so the first demo can work without a certificate. For HTTPS, create or import an ACM certificate, then copy the annotations from `deploy/helm/xo-rps/values-aws-https-example.yaml` into `values.yaml` and set `api.corsOrigin` to the HTTPS URL.

## 7. Verify

```bash
kubectl -n xo-rps get pods
kubectl -n xo-rps get svc
kubectl -n xo-rps get ingress
kubectl -n argocd get applications
```

Open the app URL, create a room, copy the link, open the link in a second browser, and play both games.

## Official References

- Amazon EKS cluster documentation: https://docs.aws.amazon.com/eks/latest/userguide/create-cluster.html
- AWS Load Balancer Controller on EKS: https://docs.aws.amazon.com/eks/latest/userguide/lbc-helm.html
- ArgoCD installation: https://argo-cd.readthedocs.io/en/latest/operator-manual/installation/
- ArgoCD automated sync: https://argo-cd.readthedocs.io/en/stable/user-guide/auto_sync/
- GitHub Container Registry: https://docs.github.com/en/packages/working-with-a-github-packages-registry/working-with-the-container-registry
- External Secrets Operator: https://github.com/external-secrets/external-secrets
