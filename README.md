# Threshold · Powered by Structive

Owner assurance and readiness workspace for data center activation. Commissioning is executed by the delivery team; Threshold supports its QA/QC, evidence review and owner acceptance.

## Contextual reference

The right-side User guide tab follows the active screen, setup step and selected milestone. Edit windows also contain an expandable guide. Timeline tiles expose definitions before configuration and saved-record snapshots afterward. Hover, keyboard focus and information buttons provide access; Escape dismisses a tip or closes the guide. Snapshots keep task progress separate from server-evaluated acceptance and use saved dates and QA records, even while setup has unsaved edits.

## Status

The dedicated free backend is installed and connected. The release is prepared for https://carlosbaeza-design.github.io/structive-site-activation/ with a connected preview at /engine/. Authenticated browser verification has exercised campus/site setup, the 832-task register, equipment and schedule imports, private script retrieval, evidence review, task completion, owner decision snapshots, evidence rejection and degraded readiness. Verification records are clearly labeled TEST ONLY and do not certify operational readiness.

The public client contains no demonstration site records or task-library seed. It reads authorized workspace data from the dedicated backend. Private methodology, database rules and source task templates are maintained separately.

## Branding iteration

The shared Threshold title banner retains its animated wordmark, illuminated geometric frames and horizon graphic. Motion can be paused and respects reduced-motion preferences. The activation timeline remains ahead of the metrics.

## Identity and interface refinement

Threshold is the current product name, powered by Structive. The public route and backend project retain their original repository identifiers. The interface uses a navy foundation, warm neutral timeline surface, orange accents, a custom vector mark and self-hosted Montserrat for the wordmark and headings, with Space Grotesk for body text and controls.

Space Grotesk is by Florian Karsten and its contributors, distributed under the SIL Open Font License. Source: https://github.com/floriankarsten/space-grotesk . The bundled font license is in `assets/fonts/OFL-SpaceGrotesk.txt`.

## Commercial account layer

The Structive platform owner lands in a dedicated vendor console. Customer accounts,
plans, user/site limits and setup-link delivery are administered separately from the
operational dashboard. The platform role does not automatically grant customer
operational membership. The existing verification workspace remains internal.

Each customer has its own administrator, users and sites. Customer administrators
can authorize other administrators, program owners, verifiers, scoped team members
and viewers. The last active administrator is protected. Active and pending people
both consume seats; site and user limits are enforced in the database.

The private commercial backend includes a Stripe signature-verified payment receiver,
idempotent customer provisioning, current subscription synchronization, setup-email
delivery tracking and a customer billing-portal endpoint. Public purchase options are
returned only for published plans linked to a Stripe price and payment link.

Live sales require Stripe credentials and webhook configuration, approved pricing,
and working authentication email delivery. No paid offers were invented or published
as part of this release. Draft plans and manual contract accounts can be managed in
the vendor console. Private migration and Edge Function source remain outside this
public repository.

## Scope ownership and individual workspaces

- Thirteen canonical scope codes: GOV, OPS, MNT, REL, CTL, TRN, EHS, SEC, LOG, VEN, BCM, DOC and ITOT.
- Each site has an accountable scope owner / sponsor and an eligible task team for each code. The owner can delegate within that team or assign work to themselves.
- Authorized email identities link to individual verified sign-ins. New users receive scoped membership; existing program administrators and verification roles retain their authorities.
- Scope owners see their scope's tasks, deadlines, blockers, evidence and assignments. Executors see their assigned tasks and can update execution status, notes, blockers and evidence. Row-level policies and checked database functions enforce these boundaries.
- SOC 2 Type 1 / Type 2 targets, selected Trust Services Criteria categories, system boundary and observation dates can be configured. Tasks can carry agreed criterion references. This supports preparation and does not constitute an attestation or an automatic control library.
- The contextual guide includes Scopes & People, personal workspaces and SOC 2 assurance.

Deployment prerequisite: production email-link onboarding requires a configured email provider. At the October 3, 2026 release, this project has neither custom SMTP nor a Send Email hook. Authorizing a person does not send an invitation. Configure delivery before onboarding new users, then have each authorized person request their own sign-in link.

## Version 0.3 — setup-driven executive view

- Navy dark interface with a five-step site setup banner and live unsaved previews.
- Delivery models for in-house / agency commissioning, owner / third-party operations, operations establishment and construction delivery.
- Scope ownership and task assignments are managed through Scopes & People and the task register. Legacy free-text owner labels remain visible until linked to an authorized person.
- Clickable L1–L5, Ops MVP, handoff, stabilization and steady-state timeline, plus G0/G1/G3, filters tasks and source activities.
- Saved document-review and field-observation targets, evidence verification levels, findings thresholds, qualifiers and explicitly confirmed source-event populations.
- Append-only owner assurance reviews; repeated reviews count one event, with current verified evidence required for positive coverage.
- Required samples round up. Empty/unconfirmed applicable populations never pass. Changes to selected source activities reset confirmation.
- Priority, vertical and milestone reporting weights are editable. They never override gate acceptance rules or alter the accepted evidence basis when only weights change.

QA is enforced for its corresponding L3/L4/L5 gate and for G3–G6. G2 Ops MVP continues to use its configured requirements, rather than universally requiring L5 completion. Setup review does not accept a gate or substitute for the separate site basis review.

Weighted completion = completed Required task weight / all applicable task weight. Each task counts once; task weight is priority × vertical × average mapped-milestone weight. Not Applicable work is excluded; unresolved applicability cannot earn completion credit. Displayed work completion is not evidence-based readiness.

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

`config.json` accepts a dedicated Supabase project URL and its publishable key. Never put database passwords, service-role keys, secret keys, task-library seeds, private migrations or customer evidence in this public repository. The current configuration contains only the dedicated project URL and its publishable key. An empty configuration displays an explicit connection-pending message.

## Integration requirements

The separate free Structive Site Activation project has its private schema, configuration/workflow functions, task-library seed and hosted hardening migration installed. Confirmed email is enabled; anonymous sign-in is disabled. Exact root and /engine/ redirects are configured. Workspace membership is server assigned. The existing NOOLY project remains untouched.

Validate row-level access, private file uploads/downloads, email sign-in, site creation, structured imports and an evidence-to-acceptance workflow against the hosted project before publishing.

## Current scope

This is an owner assurance and readiness foundation. Enterprise inheritance, automated assurance sampling, controlled conditional exceptions, native P6/MPP parsing, forecasting, external CMMS integration and automatic invitation emails are not implemented. CSV and first-sheet XLSX structured imports are supported; other source formats are retained as files. Source schedule predecessor IDs do not automatically become execution dependencies.

Frontend import validation has automated tests. The private backend has separate PostgreSQL tests for access isolation, site/task instantiation, verification, atomic imports, dependency cycles, degraded acceptance and immutable history. Hosted anonymous REST requests are rejected, every public table has RLS, private file storage is configured, and no new database security warnings were introduced. The hosted Auth advisor reports compromised-password protection disabled; this client uses email-link sign-in. Authenticated browser testing confirmed private file retrieval byte-for-byte, server rejection of completion without evidence, acceptance after configured controls, degraded readiness after evidence rejection, retained review/decision history, and saved records after reload. The 10 navigation destinations were exercised. First entry asks the user to choose or configure a site; no test site is automatically selected.
