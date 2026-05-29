# Operations Runbook

## Health Checks

```bash
kubectl -n xo-rps get pods
kubectl -n xo-rps get deployment
kubectl -n xo-rps get ingress
kubectl -n argocd get application xo-rps
```

API health endpoint:

```bash
curl https://YOUR_DOMAIN/health
```

## Logs

```bash
kubectl -n xo-rps logs deployment/xo-rps-api
kubectl -n xo-rps logs deployment/xo-rps-web
```

## Rollout Status

```bash
kubectl -n xo-rps rollout status deployment/xo-rps-api
kubectl -n xo-rps rollout status deployment/xo-rps-web
```

## Preferred Rollback

Use Git to roll back the desired state:

```bash
git log --oneline -- deploy/helm/xo-rps/values.yaml
git revert COMMIT_THAT_PROMOTED_BAD_TAG
git push origin main
```

ArgoCD will detect the reverted values and sync the previous image tags.

## Workflow Rollback

Run `.github/workflows/rollback.yml` manually and provide known-good image tags:

```text
web_tag = sha-previouscommit
api_tag = sha-previouscommit
```

This creates a Git commit, preserving Git as the source of truth.

## Avoid Cluster-Only Rollback

ArgoCD supports application rollback, but using it without updating Git can create drift. For this project, use Git revert or the rollback workflow so the repository and cluster remain aligned.

## Incident Checklist

- Check ArgoCD app health and sync status.
- Check pod readiness and recent events.
- Check ALB target health.
- Check GitHub Actions release logs.
- Check image scan result.
- Roll back through Git if user-facing behavior is broken.
- Open a follow-up issue with cause, impact, recovery time, and prevention.
