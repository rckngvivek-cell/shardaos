# Current Deployment Baseline

This document defines the only supported deployment path in the current repo baseline.

## Supported path

- Runtime target: single-region Google Cloud Run
- Service name: `school-erp-api`
- Build system: Google Cloud Build
- Container source: [apps/api/Dockerfile](/c:/Users/vivek/OneDrive/Scans/files/shardaos/apps/api/Dockerfile:1)
- Cloud Build config: [cloudbuild.yaml](/c:/Users/vivek/OneDrive/Scans/files/shardaos/cloudbuild.yaml:1)
- Reference manifest: [service.yaml](/c:/Users/vivek/OneDrive/Scans/files/shardaos/infrastructure/cloud-run/service.yaml:1)
- Manual fallback script: [deploy-autoscaling.sh](/c:/Users/vivek/OneDrive/Scans/files/shardaos/infrastructure/cloud-run/deploy-autoscaling.sh:1)

## Canonical deploy command

```bash
gcloud builds submit \
  --config cloudbuild.yaml \
  --substitutions=_SERVICE_NAME=school-erp-api,_REGION=asia-south1 \
  .
```

This builds `gcr.io/$PROJECT_ID/school-erp-api:$SHORT_SHA`, pushes `:$SHORT_SHA` and `:latest`, then deploys the new image to Cloud Run.

## Manual fallback

```bash
PROJECT_ID=your-gcp-project-id \
REGION=asia-south1 \
IMAGE_TAG=latest \
sh infrastructure/cloud-run/deploy-autoscaling.sh
```

Use the manual path only when Cloud Build is unavailable or when you need a controlled operator-driven deploy.

## Contract for the deployed service

- Port: `3000`
- Health endpoints:
  - `/api/health`
  - `/health/live`
  - `/health/ready`
- Default production env vars set by deployment:
  - `NODE_ENV=production`
  - `AUTH_MODE=jwt`
  - `PORT=3000`

## Explicitly draft paths

The following assets are not part of the supported deployment baseline and should not be treated as live production automation:

- [vercel.json](/c:/Users/vivek/OneDrive/Scans/files/shardaos/vercel.json:1)
- [.github/workflows/06-deploy-staging.yml](/c:/Users/vivek/OneDrive/Scans/files/shardaos/.github/workflows/06-deploy-staging.yml:1)
- [.github/workflows/07-deploy-production.yml](/c:/Users/vivek/OneDrive/Scans/files/shardaos/.github/workflows/07-deploy-production.yml:1)
- `terraform/*` resources still carrying `deerflow` naming

Those files remain in the repo for future infrastructure hardening, but they are not the runtime source of truth today.
