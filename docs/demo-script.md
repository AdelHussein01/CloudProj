# Demo Script

This script is written for a class presentation or project defense.

## 1. Introduce the Problem

Traditional CI/CD often pushes changes directly from a pipeline into a live environment. That works, but the pipeline becomes a privileged deployment actor and the cluster can drift from what is stored in Git.

This project uses GitOps: Git is the desired state, ArgoCD reconciles the cluster, and every deployment or rollback is represented as a Git change.

## 2. Show the Architecture

Open [docs/diagrams/architecture.mmd](diagrams/architecture.mmd).

Explain:

- Next.js is the frontend.
- NestJS handles WebSocket game events.
- GitHub Actions builds immutable images.
- Helm stores the desired Kubernetes state.
- ArgoCD pulls the desired state into EKS.
- AWS Secrets Manager keeps secrets outside Git.

## 3. Demonstrate the App

1. Open the deployed app URL.
2. Enter a name.
3. Choose XO.
4. Create a link.
5. Copy the link and open it in another browser.
6. Join as the second player.
7. Play a full XO game.
8. Return home, create another room, choose RPS, and play a few rounds.

## 4. Demonstrate CI

Make a small visible UI change, for example button text or color.

```bash
git checkout -b demo/change-ui
git add .
git commit -m "demo: update room UI"
git push origin demo/change-ui
```

Open a pull request and show the CI workflow:

- Type check
- Tests
- Build

Merge the PR after checks pass.

## 5. Demonstrate GitOps CD

Open the release workflow after merging to `main`.

Show:

- Docker images are built.
- Images are tagged with `sha-{commit}`.
- Images are scanned.
- Helm values are updated in Git.
- ArgoCD syncs the Kubernetes cluster.

Then show:

```bash
kubectl -n xo-rps get pods
kubectl -n xo-rps rollout status deployment/xo-rps-web
kubectl -n xo-rps rollout status deployment/xo-rps-api
```

## 6. Demonstrate Self-Healing

Manually create drift:

```bash
kubectl -n xo-rps scale deployment/xo-rps-web --replicas=1
```

ArgoCD should detect drift and restore the Git-declared replica count.

## 7. Demonstrate Rollback

Use one of the rollback methods:

- Preferred GitOps method: revert the GitOps values commit.
- Controlled method: run `.github/workflows/rollback.yml` with known previous image tags.

Then show ArgoCD syncing the older immutable image tag.

## 8. Discuss Evaluation

Suggested metrics:

- Deployment frequency: number of successful deployments per day/week.
- Lead time for change: merge time to healthy ArgoCD sync.
- Change failure rate: failed deployments divided by total deployments.
- Mean time to recovery: time from failed release to healthy rollback.
- Drift recovery time: time ArgoCD takes to repair manual cluster changes.

## 9. Close with Lessons Learned

GitOps improves auditability, rollback safety, and reliability because deployment state is declarative and versioned. The major challenges are secrets management, cloud IAM setup, and designing the app for horizontal scalability.
