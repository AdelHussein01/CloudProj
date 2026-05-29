# Architecture

## Goal

The project demonstrates a cloud-native GitOps CI/CD pipeline for a real-time two-player game platform. A host creates a private room, chooses XO or rock-paper-scissors, sends the generated link, and the first invited player joins the selected game.

## Main Components

- **Next.js web app**: user interface, room creation, share link flow, and game screens.
- **NestJS API**: Socket.IO gateway for real-time room updates and game moves.
- **GitHub Actions**: CI, Docker image publishing to GHCR, image scanning, and GitOps manifest promotion.
- **GitHub Container Registry**: immutable image storage using commit-SHA tags.
- **Helm chart**: declarative Kubernetes deployment for web, API, services, ingress, autoscaling, and optional External Secrets.
- **ArgoCD**: watches the Git repository and reconciles the Kubernetes cluster to the desired state.
- **AWS EKS**: managed Kubernetes runtime.
- **AWS Load Balancer Controller**: provisions the public Application Load Balancer from Kubernetes Ingress.
- **AWS Secrets Manager + External Secrets Operator**: keeps runtime secrets out of Git.

## Request Flow

1. User opens the Next.js app.
2. Host chooses XO or rock-paper-scissors and creates a room.
3. Browser navigates to `/room/{code}` with host metadata.
4. Next.js connects to the NestJS Socket.IO namespace `/games`.
5. Host sends the clean room link to another user.
6. First invited player opens the link, enters a name, and joins the room.
7. Moves are sent through WebSockets and broadcast to both players.

## Deployment Flow

1. Developer merges application code to `main`.
2. GitHub Actions runs type checks, tests, and builds.
3. Release workflow builds Docker images tagged with `sha-{commit}`.
4. Trivy scans the images.
5. Workflow updates `deploy/helm/xo-rps/values.yaml` with the immutable image tags.
6. ArgoCD detects the Git change and syncs the EKS cluster.
7. Kubernetes rolls out new pods using readiness/liveness probes.

## Important Design Tradeoff

The demo API keeps room state in memory and deploys the API as a single replica. This keeps the student demo simple and predictable. A production version should move room state to Redis or a database and use a Socket.IO Redis adapter before scaling the API horizontally.

The web app is stateless and can scale horizontally today.

## Diagram

See [docs/diagrams/architecture.mmd](diagrams/architecture.mmd).
