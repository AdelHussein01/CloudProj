# AWS Final Phase

The project is intentionally built so the application, CI/CD definition, GitOps manifests, report, and slides can be completed before touching AWS.

## Finish First

Complete and push these project parts first:

- Next.js and NestJS source code.
- Dockerfiles.
- GitHub Actions workflows.
- Helm chart.
- ArgoCD Application and AppProject.
- Documentation, PDF report, and slide deck.

## Deploy Last

Only after the project repository is reviewed, deploy to AWS:

1. Confirm the AWS account and region.
2. Confirm estimated cost and cleanup plan.
3. Apply Terraform for the VPC and EKS cluster.
4. Install AWS Load Balancer Controller.
5. Install External Secrets Operator.
6. Create the required AWS Secrets Manager value.
7. Install ArgoCD.
8. Apply the ArgoCD project and application manifests.
9. Configure DNS or use the ALB DNS name for demo.
10. Run the demo script and collect screenshots/metrics.

## Safe Access Options

Preferred options, from safest to broadest:

| Option | How it works | Notes |
| --- | --- | --- |
| You run commands | I provide exact commands and review outputs | Safest for your AWS account |
| Temporary IAM user/role | Limited permissions for EKS, VPC, IAM, ALB, Secrets Manager | Delete after project |
| Screen-share execution | You stay signed in and run commands while I guide | Good for learning |

Do not share root credentials. Do not send long-lived AWS access keys in chat.

## Cleanup

After the demo, remove paid resources if you do not need the environment:

```bash
kubectl delete -f deploy/argocd/application.yaml
kubectl delete -f deploy/argocd/project.yaml
terraform destroy
```

Also confirm that load balancers, NAT gateways, and EBS volumes were removed in the AWS console.
