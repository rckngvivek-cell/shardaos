# Owner Account Bootstrap

This document defines the supported operator flow for creating the first and only bootstrap-enabled platform owner account.

## When to use this flow

Use this runbook whenever the environment needs a real JWT-backed owner account for:

- first-time platform owner provisioning

The dedicated owner app exposes a secure browser bootstrap flow, but the API enforces the one-time rule. After the first successful bootstrap, the route is permanently consumed and the owner app removes the bootstrap entry point automatically.

## Preconditions

- API reachable at `http://localhost:3000` or your chosen base URL
- API process already configured for Firestore access
- `AUTH_MODE=jwt` when you want the API to enforce bearer tokens after bootstrap
- `OWNER_BOOTSTRAP_KEY`, `OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET`, or `OWNER_BOOTSTRAP_KEY_FILE` configured on the API process
- optional `OWNER_BOOTSTRAP_SESSION_TTL_MIN` if you want to shorten or lengthen the bootstrap session lifetime
- Owner login URL available at `http://localhost:5174/login` if you want to verify sign-in immediately

The repo-root `.env` is no longer a supported place for bootstrap secrets or local auth passwords. Keep bootstrap secrets in the process environment, in Windows Credential Manager via `OWNER_BOOTSTRAP_KEY_CREDENTIAL_TARGET`, or in a file outside the repo and inject the path with `OWNER_BOOTSTRAP_KEY_FILE`.
The included local `.env` only needs the Firestore emulator settings for emulator-backed bootstrap work.

## UI bootstrap flow

If you prefer a browser flow, open `http://localhost:5174/bootstrap` and enter:

- the offline one-time bootstrap key
- the owner email
- an optional display name
- the new owner password

Bootstrap password policy:

- minimum 14 characters
- at least one uppercase letter
- at least one lowercase letter
- at least one number
- at least one symbol

The UI first opens a short-lived secure bootstrap session from the offline key and then completes owner provisioning with that ephemeral session token. The raw bootstrap key is not reused for the final owner-creation call and is not stored in browser storage.

## Canonical operator command

Unix-like shells:

```bash
OWNER_BOOTSTRAP_KEY_FILE=/secure/owner-bootstrap.key \
npm run owner:bootstrap -- --email owner@example.com --display-name "Platform Owner"
```

PowerShell:

```powershell
$env:OWNER_BOOTSTRAP_KEY_FILE='C:\secure\owner-bootstrap.key'
npm run owner:bootstrap -- --email owner@example.com --display-name "Platform Owner"
```

The CLI will prompt for the owner password if you do not pass it explicitly. For non-interactive automation, pass the password through stdin:

```bash
printf '%s' "$OWNER_PASSWORD" | node scripts/bootstrap-owner.cjs --email owner@example.com --password-stdin
```

## What the bootstrap does

The API route is implemented in [auth.routes.ts](/c:/Users/vivek/OneDrive/Scans/files/shardaos/apps/api/src/modules/auth/auth.routes.ts:1) and the service logic lives in [owner-auth.service.ts](/c:/Users/vivek/OneDrive/Scans/files/shardaos/apps/api/src/modules/auth/owner-auth.service.ts:1).

On success the service will:

- create the platform owner credential in `auth_credentials`
- hash the submitted password before it is stored
- record that bootstrap has been consumed in Firestore bootstrap state
- delete the short-lived bootstrap session token used for the request
- revoke existing platform sessions for that owner UID so old refresh tokens cannot linger
- keep the owner identity scoped to `role=owner` and `plane=platform`

The service will not allow bootstrap-based password rotation or second-owner creation after success. From that point on, password changes must go through normal authenticated owner flows.

## Verification

After a successful bootstrap:

1. Open `http://localhost:5174/login`
2. Sign in with the bootstrapped email and password
3. Confirm the browser lands on `/`
4. Confirm these endpoints return `200` with the signed-in owner token:
   - `GET /api/auth/owner/session`
   - `GET /api/owner/owner/me`
   - `GET /api/owner/owner/summary`

## Failure modes

- `503 BOOTSTRAP_DISABLED`
  - Cause: `OWNER_BOOTSTRAP_KEY` is not configured on the API process.
- `401 UNAUTHORIZED`
  - Cause: the supplied bootstrap key is incorrect.
- `401 INVALID_BOOTSTRAP_SESSION`
  - Cause: the short-lived secure bootstrap session is missing, expired, or invalid.
- `400 WEAK_OWNER_PASSWORD`
  - Cause: the submitted owner password does not meet the enforced bootstrap password policy.
- `410 BOOTSTRAP_CONSUMED`
  - Cause: bootstrap has already been used successfully or an owner already exists for this environment.

## Security notes

- Treat `OWNER_BOOTSTRAP_KEY` as a provisioning secret, not a normal application credential.
- Even if the bootstrap key still exists in the process environment, the API will reject further use after the first successful bootstrap.
- In production, keep `ADMIN_ALLOWED_IPS` and `ADMIN_MFA_REQUIRED` configured before granting owner-plane access.
- Do not commit `GOOGLE_APPLICATION_CREDENTIALS`, passwords, or bootstrap keys into the repository.
