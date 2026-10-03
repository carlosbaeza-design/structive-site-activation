# Structive Site Activation

Candidate application for site configuration, equipment and schedule imports, coded task execution, evidence verification, and owner readiness decisions.

## Status

This branch is prepared for backend integration. It is not the deployed engine. The dedicated Supabase project must be provisioned and configured before this branch replaces the GitHub Pages prototype.

The public client contains no demonstration site records or task-library seed. It reads authorized workspace data from the dedicated backend. Private methodology, database rules and source task templates are maintained separately.

## Workflows

- Campus and site setup, operating model, acceptance authority, and milestone dates.
- Master equipment list and commissioning activity imports with column mapping, validation and retained source revisions.
- Task register with stable codes, owners, due dates, equipment links, predecessor relationships and execution notes.
- Private evidence files and HTTPS source references with provenance, revision, expiry and verification history.
- Capability integration and responsibility/authority verification.
- Server-calculated milestone eligibility, authorized acceptance, withdrawal and immutable decision records.
- Audited configuration and execution history.

L1–L5 commissioning levels and G0–G6 owner acceptance gates remain separate. Initial mappings and verification levels require site review. No percentage is presented as proof of readiness.

## Local build

Requires Node.js 22 or later.

```sh
npm ci
npm test
npm run build
```

The build writes deployable static assets to `dist/`. Copy the generated assets to the repository root for GitHub Pages only after backend integration and browser verification.

`config.json` accepts a dedicated Supabase project URL and its publishable key. Never put database passwords, service-role keys, secret keys, task-library seeds, private migrations or customer evidence in this public repository. An empty configuration displays an explicit connection-pending message.

## Integration requirements

Provision a separate free project for Structive Site Activation; do not use the existing NOOLY project. Apply the private schema, configuration functions, workflow functions and task-library seed to that project. Enable confirmed email sign-in and configure the published GitHub Pages URL as the permitted sign-in redirect. Workspace membership is server assigned.

Validate row-level access, private file uploads/downloads, email sign-in, site creation, structured imports and an evidence-to-acceptance workflow against the hosted project before publishing.

## Current scope

This is an execution and readiness foundation. Enterprise inheritance, automated assurance sampling, controlled conditional exceptions, native P6/MPP parsing, forecasting, external CMMS integration and an administration UI for team invitations are not implemented. CSV and first-sheet XLSX structured imports are supported; other source formats are retained as files. Source schedule predecessor IDs do not automatically become execution dependencies.

Frontend import validation has automated tests. The private backend has separate PostgreSQL tests for access isolation, site/task instantiation, verification, atomic imports, dependency cycles, degraded acceptance and immutable history. Hosted integration and browser testing are pending.
