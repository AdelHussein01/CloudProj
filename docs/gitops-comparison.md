# GitOps vs Traditional CI/CD

| Area | Traditional CI/CD | GitOps CI/CD in This Project |
| --- | --- | --- |
| Deployment trigger | Pipeline pushes to cluster | Git change updates desired state; ArgoCD pulls |
| Source of truth | Often split between pipeline config and cluster | Git repository |
| Cluster credentials | CI system usually needs write access | ArgoCD owns cluster reconciliation |
| Rollback | Re-run pipeline or deploy old artifact | Revert Git commit or set previous immutable tag |
| Drift handling | Manual detection or periodic checks | ArgoCD detects and self-heals drift |
| Auditability | Pipeline logs plus release notes | Git history plus ArgoCD history |
| Immutability | Depends on tagging discipline | Commit-SHA image tags are promoted |
| Secret handling | Often CI secrets injected into deployment | AWS Secrets Manager and External Secrets Operator |
| Reliability | Strong when carefully engineered | Stronger desired-state recovery model |

## Impact on Deployment Frequency

GitOps can increase deployment frequency because the deployment process becomes repeatable. Once a PR is merged, the pipeline builds the image, updates the Helm value, and ArgoCD handles rollout without a human running deployment commands.

## Impact on Reliability

Reliability improves because:

- Desired state is declarative.
- Manual cluster drift is corrected.
- Rollbacks are Git operations.
- Images are immutable and traceable to commits.
- Health checks protect rollouts from unhealthy pods.

## Challenges

- Secrets must not be committed to Git.
- IAM and IRSA setup can be complex.
- ArgoCD needs clear repository structure and access rules.
- Rollbacks must keep Git and cluster state aligned.
- Real-time WebSocket services need shared state before horizontal API scaling.
