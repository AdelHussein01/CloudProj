# XO/RPS GitOps Platform

Repository target: [AdelHussein01/CloudProj](https://github.com/AdelHussein01/CloudProj)

This repository is a complete student project for **Cloud-Native CI/CD Pipelines with GitOps**.

It includes:

- A **Next.js** web app where a host creates a share link and chooses either XO or rock-paper-scissors.
- A **NestJS** WebSocket API that manages real-time rooms and game state.
- Docker images for both services.
- Kubernetes + Helm manifests ready for **ArgoCD**.
- GitHub Actions workflows for CI, image publishing, GitOps manifest updates, security scanning, and rollback.
- AWS EKS infrastructure notes and secure secret management using AWS Secrets Manager, IRSA, and External Secrets Operator.
- Demo scripts, diagrams, and a GitOps-vs-traditional-CI/CD comparison.

Start with:

- [docs/local-development.md](docs/local-development.md)
- [docs/deployment-guide.md](docs/deployment-guide.md)
- [docs/aws-final-phase.md](docs/aws-final-phase.md)
- [docs/demo-script.md](docs/demo-script.md)
- [docs/presentation-outline.md](docs/presentation-outline.md)
