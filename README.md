# Threshold · Powered by Structive

Threshold is a customer-owned commissioning QA/QC and operational readiness portal, with one acceptance program per building. Structive provides two to three days of portal instruction; the customer configures, verifies and owns the program thereafter.

## Version 0.4 — customer-defined readiness

The seven-step wizard establishes the building setup clock, selects applicable pillars, assigns pillar owners, collects customer acceptance criteria, configures L1–L5 inspection coverage, requests required inputs, and sets milestone dates. Thirteen recommended pillar/bucket structures supply organization; they do not impose acceptance requirements.

Each criterion has a customer-defined passing condition, weight, an explicit gating choice, milestone mappings, an accountable owner and reviewer. Numeric thresholds can record required and actual values. Separate contributions distinguish document providers from internal coordinators and verifiers. Bucket defaults, same-as-previous assignments, duplication and bulk changes reduce repeated entry while preserving individual overrides.

The dashboard displays weighted readiness, unmet gates, overdue setup by pillar, accountable people, input requests and milestones. Inspection coverage distinguishes progress against the selected sample from coverage of the full population. Samples round up; an undefined population cannot claim coverage. Auditors submit observations and assigned reviewers record verdicts. Scores cannot override gates. Customer acceptance is authorized and checked by the server, with immutable revision history and recorded rationale. Material criterion changes reopen verification; previously accepted milestones can become degraded.

Default milestones include Threshold Go-Live, L1–L5, Operations MVP, Building Handoff and Threshold Closeout. Dates and dependencies are customer-defined. Custom milestones are supported. Original target dates remain visible after rescheduling. Closeout archives the program; reopening requires an owner and reason.

CSV and first-sheet XLSX imports retain only the equipment and schedule records needed by the portal, plus a reference to the original document. Scripts and other documents remain external. Individual criteria, contributions and inspections support external links, opening in new tabs. The Document Directory automatically organizes references under building / pillar / bucket folders with optional custom subfolders. ZIP folder-tree export and a clickable HTML index require no repository integration. Browsers supporting directory selection can create the template locally.

## Input help

Every visible input has a short field explanation. Hover over the field or its question-mark button, focus it with the keyboard, or tap the button on a phone. Escape or a second tap closes the tip. Help also covers dynamically added criteria, links, assignments and import mappings. Acceptance authority means the person the customer allows to approve a milestone or building handoff; a text reference does not grant portal permissions.

## Interactive trial

Open https://carlosbaeza-design.github.io/structive-site-activation/#try to explore the wizard without a sign-in. Trial changes persist only in that browser session and never affect customer records. The trial uses four labeled roles and is not a permissions demonstration. Leave the trial to access licensed customer workspaces.

Existing legacy records are retained. Newly created buildings start with no preloaded construction tasks. The customer program presents its own readiness routes; existing commercial administration and equipment/schedule imports remain available.

## Build and checks

Requires Node.js 22 or later:

```sh
npm ci
npm test
npm run build
```

The build writes static assets to `dist/`. GitHub Pages serves generated assets from the repository root. Private database rules and tests are maintained in the separate backend release. The public client contains only the project URL and publishable key, never private migrations, server credentials or customer source files.

Automated checks cover scoring, numeric gates, sample ceilings, assignment inheritance, dependency cycles, safe links, folder exports and a DOM-level wizard journey. Separate PostgreSQL checks exercise customer isolation, contributor/reviewer boundaries, stale revisions, verified results, decisions and private-table protection. This release has not received live authenticated browser or visual QA.

## Existing account layer

The Structive vendor console manages customer accounts, plans and license limits separately from customer operational membership. Customer administrators authorize their own people. Existing billing and email-link onboarding configurations are retained. Native schedule formats, direct Box/SharePoint replication, automatic random sampling and external work-management integrations are outside this release.

## Fonts

Self-hosted Montserrat and Space Grotesk fonts retain their bundled licenses. Space Grotesk is by Florian Karsten and contributors under the SIL Open Font License: https://github.com/floriankarsten/space-grotesk.
