# Presentation Outline

## Slide 1: Title

Cloud-Native CI/CD Pipelines with GitOps

## Slide 2: Project Objective

Build and deploy a real-time two-player game platform using Next.js, NestJS, AWS EKS, GitHub Actions, and ArgoCD.

## Slide 3: Application Demo

Show the room creation flow, link sharing, XO, and rock-paper-scissors.

## Slide 4: Architecture

Use [docs/diagrams/architecture.mmd](diagrams/architecture.mmd).

## Slide 5: CI Pipeline

Explain type checks, tests, build, Docker image publishing, and image scanning.

## Slide 6: GitOps Deployment

Use [docs/diagrams/pipeline.mmd](diagrams/pipeline.mmd). Emphasize that ArgoCD pulls desired state from Git.

## Slide 7: Security and Secrets

Explain AWS Secrets Manager, External Secrets Operator, IRSA, immutable image tags, and GitHub token permissions.

## Slide 8: Rollback Strategy

Use [docs/diagrams/rollback.mmd](diagrams/rollback.mmd). Explain Git revert and rollback workflow.

## Slide 9: Observability

Discuss ArgoCD health, Kubernetes readiness, ALB metrics, CloudWatch, and future Prometheus/Grafana integration.

## Slide 10: GitOps vs Traditional CI/CD

Use the comparison table from [docs/gitops-comparison.md](gitops-comparison.md).

## Slide 11: Evaluation Metrics

Deployment frequency, lead time, change failure rate, MTTR, and drift repair time.

## Slide 12: Lessons Learned

GitOps improves auditability and reliability, but secrets, IAM, and stateful real-time services require careful design.
