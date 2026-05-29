# Observability

## What to Observe

- Web and API pod health.
- ArgoCD sync status and sync duration.
- Deployment success/failure rate.
- ALB request count, latency, and 5xx responses.
- Pod restarts and CPU/memory pressure.
- WebSocket connection errors.

## AWS-Native Options

- Amazon CloudWatch Container Insights for EKS workload metrics.
- ALB metrics in CloudWatch.
- EKS control plane logs for API server and audit events.
- CloudWatch log groups for application logs if a log collector is installed.

## Cloud-Native Options

- Prometheus for metrics.
- Grafana for dashboards.
- Loki or OpenSearch for logs.
- OpenTelemetry Collector for traces and metrics.
- ArgoCD dashboard for desired-state and drift visibility.

## Suggested Demo Measurements

| Metric | How to Measure |
| --- | --- |
| Deployment frequency | Count successful release workflow runs |
| Lead time | Time from merge to ArgoCD healthy sync |
| Change failure rate | Failed releases divided by total releases |
| MTTR | Time from bad release detection to healthy rollback |
| Drift repair time | Time from manual scale/edit to ArgoCD correction |

## Future Improvement

Add `/metrics` endpoints to the NestJS API and Next.js runtime, then enable a `ServiceMonitor` if Prometheus Operator is installed.
