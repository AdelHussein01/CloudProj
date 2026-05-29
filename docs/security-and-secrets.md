# Security and Secrets

## Principles

- No raw secrets in Git.
- Least-privilege IAM for cloud access.
- Immutable image tags.
- Image scanning before promotion.
- Runtime secrets come from AWS Secrets Manager.
- Kubernetes service accounts use IRSA instead of static AWS keys.

## Secret Flow

1. Secret is created in AWS Secrets Manager under `xo-rps/prod/session`.
2. External Secrets Operator authenticates to AWS using IRSA.
3. `ExternalSecret` reads only the allowed secret path.
4. Kubernetes Secret is generated inside the `xo-rps` namespace.
5. API pod consumes the generated Secret as environment variables.

## What Not to Do

- Do not commit `.env` files.
- Do not paste AWS keys into GitHub Actions.
- Do not create broad `secretsmanager:*` IAM policies.
- Do not use `latest` as the deployment tag in production.
- Do not manually edit live Kubernetes manifests and leave Git unchanged.

## GitHub Actions Security

The workflows use repository-scoped `GITHUB_TOKEN` permissions:

- `contents: read` for CI.
- `contents: write` and `packages: write` only for release and rollback.
- Container images are scanned with Trivy before promotion.

## Kubernetes Security

The Helm chart includes:

- Separate service accounts for web and API.
- Resource requests and limits.
- Readiness and liveness probes.
- Optional External Secrets integration.
- Optional NetworkPolicy placeholder.

For a production hardening pass, add:

- TLS certificate through ACM.
- WAF on the public ALB.
- Strict NetworkPolicies after confirming the CNI supports enforcement.
- Pod Security Admission labels.
- Redis or database-backed game state with encrypted storage.
- API rate limiting for room creation and moves.
