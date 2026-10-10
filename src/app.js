import {createProgram} from "./program.js";
import {createCommercial} from "./commercial.js";
import { createOwnership } from "./ownership.js";
import { createHelp } from "./help.js";
import { productBanner } from "./branding.js";
import { productName, brandMark, navIcon } from "./identity.js";
import { createOverview } from "./overview.js";
import { createClient } from "@supabase/supabase-js";
import { fields, labels, parseFile, mapRows, toCSV } from "./records.js";
const $ = (s) => document.querySelector(s), esc = (v) => String(v ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
const nav = [["account", "Organization", "Account"], ["setup", "Readiness Dashboard", "Building"], ["program-wizard", "Setup Wizard", ""], ["program-milestones", "Milestone Timeline", ""], ["program-qa", "Commissioning QA/QC", ""], ["program-directory", "Document Directory", ""], ["program-history", "Readiness Decisions", ""], ["equipment", "Master Equipment", ""], ["schedule", "Source Cx Schedule", ""], ["milestones", "Milestones", ""], ["team", "Scopes & People", "Coordinate"], ["tasks", "Task Register", ""], ["capabilities", "Capabilities & Authority", ""], ["evidence", "Evidence & Sources", ""], ["soc", "SOC 2 Assurance", "Assure"], ["assurance", "Commissioning QA", ""], ["reviews", "Verification Queue", ""], ["readiness", "Readiness & Decisions", ""], ["history", "Change History", ""]];
const statusValues = ["Not Started", "In Progress", "Submitted", "Blocked", "Complete"];
const levels = ["V1 \xB7 Existence", "V2 \xB7 Administrative", "V3 \xB7 Technical", "V4 \xB7 Field", "V5 \xB7 Performance", "V6 \xB7 Operational"];
const milestoneNames = { L1: "L1", L2: "L2", L3: "L3", L4: "L4", L5: "L5", G0: "Activation Basis", G1: "System Readiness", G2: "Operations MVP", G3: "Integrated Operational Readiness", G4: "Building Handoff", G5: "Stabilization Exit", G6: "Steady State" };
let db, session, workspaces = [], members = [], people = [], catalog = [], sites = [], campuses = [], site = null, data = {}, route = "setup", taskFilters = { search: "", vertical: "", status: "", milestone: "" }, page = 0, renderId = 0, loadedAt = "", busy = false;
let commerce={vendor:false,accounts:[]},workspaceId=null,customerMode=false;
const vendorMode=()=>commerce.vendor&&!customerMode;
const role = () => commerce.accounts.find(a=>a.workspace_id===workspaceId)?.role || members.find(m=>m.workspace_id===workspaceId)?.role;
const manage = () => ["admin", "manager"].includes(role());
const verify = () => ["admin", "manager", "verifier"].includes(role());
const edit = () => ["admin", "manager", "verifier", "contributor"].includes(role());
const scoped = () => role() === "scoped";
const visibleNav = () => vendorMode() ? [["vendor","Customers & licenses","Platform"]] : nav.filter(([id]) => (!program.context().document||['account','setup','program-wizard','program-milestones','program-qa','program-directory','program-history','equipment','schedule','team'].includes(id))&&(!scoped() || ['account','setup','program-wizard','program-milestones','program-qa','program-directory','program-history','team','tasks','evidence','soc'].includes(id)));
const roleLabel = () => scoped() ? (ownership.access().owner ? 'Scope owner' : 'Executor') : ({admin:'Customer administrator',manager:'Program owner',verifier:'Verifier',contributor:'Contributor',viewer:'Viewer'}[role()] || 'No workspace access');
const opt = (v, label, selected) => `<option value="${esc(v)}" ${String(v) === String(selected) ? "selected" : ""}>${esc(label)}</option>`;
const options = (rows, selected, label = "name", empty = "Select\u2026") => opt("", empty, selected) + rows.map((r) => opt(r.id, typeof label === "function" ? label(r) : r[label], selected)).join("");
const input = (name, label, value = "", type = "text", extra = "") => `<label>${esc(label)}<input name="${name}" type="${type}" value="${esc(value)}" ${extra}></label>`;
const area = (name, label, value = "", extra = "") => `<label>${esc(label)}<textarea name="${name}" ${extra}>${esc(value)}</textarea></label>`;
const select = (name, label, opts, extra = "") => `<label>${esc(label)}<select name="${name}" ${extra}>${opts}</select></label>`;
const check = (name, label, checked = false) => `<label class="check"><input type="checkbox" name="${name}" ${checked ? "checked" : ""}>${esc(label)}</label>`;
const button = (label, action2, id = "", cls = "secondary") => `<button type="button" class="${cls}" data-action="${action2}" data-id="${esc(id)}">${esc(label)}</button>`;
const badge = (text) => `<span class="tag ${["Complete", "Verified", "Accepted"].includes(text) ? "green" : ["Blocked", "Rejected", "Degraded", "Not Eligible"].includes(text) ? "red" : ["Submitted", "Determination Required", "Eligible for Acceptance"].includes(text) ? "amber" : ""}">${esc(text)}</span>`;
const table = (heads, rows, empty = "No records yet.") => `<div class="table-wrap"><table><thead><tr>${heads.map((h) => `<th scope="col">${esc(h)}</th>`).join("")}</tr></thead><tbody>${rows.length ? rows.join("") : `<tr><td colspan="${heads.length}" class="empty">${esc(empty)}</td></tr>`}</tbody></table></div>`;
const heading = (title, subtitle) => `<div class="eyebrow">Threshold \xB7 Owner assurance</div><h1>${esc(title)}</h1><p class="sub">${esc(subtitle)}</p>`;
const date = (v) => v ? new Date(v).toLocaleString() : "\u2014";
const latestReview = (e) => (data.evidence_reviews || []).filter((r) => r.evidence_id === e.id).sort((a, b) => Number(b.review_seq) - Number(a.review_seq))[0];
const evidenceState = (e) => e.expires_on && e.expires_on < (/* @__PURE__ */ new Date()).toISOString().slice(0, 10) ? "Expired" : latestReview(e)?.verdict || "Pending review";
const taskName = (id) => data.tasks?.find((t) => t.id === id)?.code || "Unlinked";
function notice(message, error = false) {
  $("#notice").className = "notice" + (error ? " error" : "");
  $("#notice").textContent = message;
  clearTimeout(notice.timer);
  notice.timer = setTimeout(() => {
    const noticeEl=$("#notice");if(noticeEl)noticeEl.className = "";
    if(noticeEl)noticeEl.textContent = "";
  }, error ? 14e3 : 6500);
}
async function unwrap(p) {
  const r = await p;
  if (r.error) throw Error(r.error.message);
  return r.data;
}
async function rpc(name, args = {}) {
  return unwrap(db.rpc(name, args));
}
async function all(tableName, column, value, order = "id") {
  let list = [];
  for (let from = 0; ; from += 1e3) {
    let query = db.from(tableName).select("*").order(order).range(from, from + 999);
    if (tableName === "requirement_milestones") query = query.order("milestone_id");
    if (tableName === "task_dependencies") query = query.order("predecessor_id");
    if (tableName === "vertical_team") query = query.order("person_id");
    if (column) query = query.eq(column, value);
    const batch = await unwrap(query);
    list.push(...batch);
    if (batch.length < 1e3) return list;
  }
}
async function loadWorkspace() {
  await rpc("bootstrap_membership");
  commerce=await rpc('commercial_context');
  if(vendorMode()){
    site=null;data={};workspaces=[];members=[];sites=[];campuses=[];people=[];
    await commercial.loadVendor();route='vendor';history.replaceState(null,'','#vendor');return;
  }
  const savedWorkspace=workspaceId||sessionStorage.getItem('threshold-workspace');
  workspaceId=commerce.accounts.find(a=>a.workspace_id===savedWorkspace)?.workspace_id||commerce.accounts[0]?.workspace_id||null;
  if(workspaceId)sessionStorage.setItem('threshold-workspace',workspaceId);
  [workspaces,members,campuses,sites,people,catalog]=await Promise.all(["workspaces","workspace_members","campuses","sites","workspace_people","vertical_catalog"].map(t=>all(t,null,null,t==='workspace_members'?'workspace_id':t==='vertical_catalog'?'code':'id')));
  workspaces=workspaces.filter(w=>w.id===workspaceId);campuses=campuses.filter(c=>c.workspace_id===workspaceId);sites=sites.filter(s=>s.workspace_id===workspaceId);people=people.filter(p=>p.workspace_id===workspaceId);
  catalog.sort((a,b)=>a.sort_order-b.sort_order);
  const saved=sessionStorage.getItem('structive-site');
  site=sites.find(s=>s.id===(site?.id||saved))||(scoped()?sites[0]:null)||null;
  if(site)await loadSite();else data={tasks:[],site_verticals:[],vertical_team:[],milestones:[],requirement_milestones:[]};
  if(!site&&(!sites.length||!commerce.accounts.find(a=>a.workspace_id===workspaceId)?.active))route='account';
}
async function loadSite() {
  const loadingSiteId = site.id;
  const tables = ["assets", "milestones", "capabilities", "requirements", "requirement_milestones", "tasks", "task_dependencies", "evidence", "evidence_reviews", "schedule_activities", "gate_decisions", "site_dashboard_config", "assurance_scope", "assurance_reviews", "site_verticals", "vertical_team", "site_soc_profiles"];
  const values = await Promise.all(tables.map((t) => all(t, "site_id", loadingSiteId, t === "requirement_milestones" ? "requirement_id" : t === "task_dependencies" ? "task_id" : ["site_dashboard_config","site_soc_profiles"].includes(t) ? "site_id" : ["site_verticals","vertical_team"].includes(t) ? "vertical_code" : "id")));
  if (site?.id !== loadingSiteId) return;
  data = Object.fromEntries(tables.map((t, i) => [t, values[i]]));
  data.milestones.sort((a, b) => a.sort_order - b.sort_order);
  data.tasks.sort((a, b) => a.code.localeCompare(b.code));
  data.assuranceSummary = scoped() ? [] : await rpc("site_assurance_summary", { site_id: site.id });
  await program.load();
  await program.syncImported();
  loadedAt = (/* @__PURE__ */ new Date()).toLocaleTimeString();
  sessionStorage.setItem("structive-site", site.id);
}
function shell() {
  if(program.trial()){trialShell();return;}
  if(vendorMode()){
    $('#app').innerHTML=`<div class="app vendor-app"><aside><div class="brand"><span class="brand-icon">${brandMark}</span><div><b>Threshold</b><small>STRUCTIVE PLATFORM</small></div></div><nav aria-label="Vendor navigation"><div class="group">Platform</div><button type="button" data-action="vendor-home" aria-current="page">Customers & licenses</button>${commerce.accounts.length?'<button type="button" data-action="vendor-preview">Internal workspace</button>':''}</nav><div class="aside-note"><span class="rail-signature">STRUCTIVE</span><span>PLATFORM OWNER</span></div></aside><main>${productBanner()}<header><div><strong>Vendor console</strong><small class="vendor-subtitle">Customer accounts and commercial access</small></div><div class="row"><small>${esc(session?.user.email||'')}</small>${button('Refresh','refresh')}${button('Sign out','signout')}</div></header><section class="content" id="content" tabindex="-1">${commercial.vendorView()}</section></main></div>`;
    guide.setContext('vendor');guide.mount();return;
  }

  if(!visibleNav().some(([id])=>id===route)){route="setup";history.replaceState(null,"","#setup");}
  $("#app").innerHTML = `<div class="app"><aside><div class="brand"><span class="brand-icon">${brandMark}</span><div><b>${productName}</b><small>POWERED BY STRUCTIVE</small></div></div><nav aria-label="Main navigation">${visibleNav().map(([id, label, group]) => `${group ? `<div class="group">${group}</div>` : ""}<button type="button" data-route="${id}" ${route === id ? 'aria-current="page"' : ""}>${navIcon(id)}<span>${label}</span></button>`).join("")}</nav><div class="aside-note"><span class="rail-signature">STRUCTIVE</span><span>OWNER ASSURANCE<br>SITE ACTIVATION / OPERATIONS</span></div></aside><main>${productBanner()}<header><label>Organization<select id="workspace-select" aria-label="Select organization">${commerce.accounts.map(a=>opt(a.workspace_id,a.name,workspaceId)).join("")}</select></label><label>Campus / site<select id="site-select" aria-label="Select site">${opt("", sites.length ? "Set up or select a site" : "No site configured", site?.id || "")}${sites.map((s) => opt(s.id, `${campuses.find((c) => c.id === s.campus_id)?.name || ""} / ${s.code} \xB7 ${s.name}`, site?.id)).join("")}</select></label><div class="row"><small>${esc(roleLabel())}<br>${esc(session?.user.email || "")}</small>${commerce.vendor?button("Vendor console","vendor-home"):""}${button("Refresh", "refresh")}${button("Sign out", "signout")}</div></header><section class="content" id="content" tabindex="-1"></section></main></div>`;
  guide.mount();
  render();
}
function navigate(value) {
  if(program.trial()){route=value;trialShell();return;}
  const next = visibleNav().some((n) => n[0] === value) ? value : "setup";
  if (location.hash === "#" + next) {
    route = next;
    render();
  } else location.hash = next;
}
async function render() {
  if(program.trial()){trialRender();return;}
  if(vendorMode()){$('#content').innerHTML=commercial.vendorView();return;}

  guide.hideTip();
  if(!visibleNav().some(([id])=>id===route))route="setup";
  guide.setContext(scoped() && route==='setup' ? 'my-work' : route);
  const generation = ++renderId;
  if(route==='account'||(commercial.account()&&!commercial.account().active)){
    guide.setContext('account');$('#content').innerHTML=commercial.accountView();return;
  }
  if (!workspaces.length) {
    $("#content").innerHTML = heading("Workspace access required", "You are signed in, but this account has not been assigned to a Structive workspace.") + `<div class="card"><p>Use the email address authorized for this workspace. Signing in does not automatically grant access to site records.</p>${button("Sign out", "signout")}</div>`;
    return;
  }
  if(!site&&route==='team'&&manage()){$('#content').innerHTML=ownership.teamView();return;}
  if (!site && !manage()) {
    $("#content").innerHTML=heading("Your workspace is ready for an assignment", "Ask your program administrator to assign you to a vertical and link your tasks. Your individual sign-in is active.");
    return;
  }
  if (!site && route !== "setup") {
    $("#content").innerHTML = heading("Set up your first site", "Create the campus and site basis to start the execution register.") + button("Set up a site", "new-site", "", "");
    return;
  }
  const views = { setup: () => program.dashboard(), "program-wizard":()=>program.wizard(), "program-milestones":()=>program.milestonesView(), "program-qa":()=>program.qaView(), "program-directory":()=>program.directoryView(), "program-history":()=>program.historyView(), team: () => ownership.teamView(), soc: () => ownership.socView(), assurance: () => dashboard.qaView(), equipment: equipmentView, schedule: scheduleView, milestones: milestonesView, tasks: tasksView, capabilities: capabilitiesView, evidence: evidenceView, reviews: reviewsView, readiness: readinessView, history: historyView };
  $("#content").innerHTML = views[route]();
  program.mount(route);
  if (!scoped() && route === "readiness") {
    try {
      const results = await Promise.all(data.milestones.map((m) => rpc("evaluate_milestone", { milestone_id: m.id })));
      if (generation !== renderId) return;
      data.evaluations = results;
      if (route === "setup") {
        dashboard.refreshMetrics();
        return;
      }
      $("#gate-cards").innerHTML = results.map((g) => gateCard(g)).join("");
      $("#evaluated").textContent = "Evaluated against saved records at " + (/* @__PURE__ */ new Date()).toLocaleTimeString();
    } catch (e) {
      if (generation === renderId && $("#gate-cards")) $("#gate-cards").innerHTML = `<div class="callout error">Readiness could not be evaluated: ${esc(e.message)}. ${button("Retry", "refresh")}</div>`;
    }
  }
  if (route === "history") {
    try {
      const rows = await unwrap(db.from("audit_events").select("*").eq("site_id", site.id).order("id", { ascending: false }).limit(150));
      if (generation !== renderId) return;
      data.audit = rows;
      $("#audit").innerHTML = table(["When / actor", "Record", "Action", "Changes"], rows.map((r) => `<tr><td>${esc(date(r.created_at))}<small class="mono">${esc(r.actor_id)}</small></td><td>${esc(r.entity)}<small class="mono">${esc(r.record_id)}</small></td><td>${esc(r.action)}</td><td>${button("View changes", "audit", r.id, "link")}</td></tr>`));
    } catch (e) {
      if (generation === renderId) $("#audit").innerHTML = `<p role="alert">${esc(e.message)}</p>`;
    }
  }
}
function setupView() {
  const hero = heading("Sites & Setup", "Define the site, establish its activation basis, and build the execution register.");
  if (!site) return hero + `<div class="card empty"><div class="eyebrow">Start with the site</div><h2>${sites.length ? "Select a site above or set up a new site." : "Your activation workspace is ready for a site."}</h2><p>Choose a campus and building, set the operating model and milestone dates, then configure the equipment, requirements, and evidence needed for readiness.</p>${manage() ? button("Set up a site", "new-site", "", "") : "Ask a workspace administrator to create a site."}</div><div class="steps"><div><b>01 / Establish the basis</b><p>Campus, site, operating model and acceptance authority.</p></div><div><b>02 / Load source records</b><p>Master equipment list, commissioning schedule and scripts.</p></div><div><b>03 / Execute and verify</b><p>Coded tasks, responsible owners and retained evidence.</p></div><div><b>04 / Make the decision</b><p>Explainable eligibility and an authorized acceptance record.</p></div></div>`;
  return hero + `<div class="row between"><div>${badge(site.setup_confirmed ? "Basis confirmed" : "Basis review required")} <span class="muted">${esc(site.code)} \xB7 ${esc(site.building)} \xB7 ${esc(site.operating_model)}</span></div>${manage() ? button("Add another site", "new-site") : ""}</div><div class="callout">The execution register starts from the source workbook. Review applicability, verification levels, equipment links, and milestone mappings for this site. G5 Stabilization Exit requires site-specific requirements before it can become eligible.</div><div class="grid four"><div class="card metric"><small>Execution tasks</small><strong>${data.tasks.length}</strong><span>Unique task codes</span></div><div class="card metric"><small>Verticals</small><strong>${new Set(data.tasks.map((t) => t.vertical)).size}</strong><span>Functional ownership</span></div><div class="card metric"><small>Equipment records</small><strong>${data.assets.length}</strong><span>From the site's MEL</span></div><div class="card metric"><small>Evidence records</small><strong>${data.evidence.length}</strong><span>Files and source links</span></div></div><div class="grid two" style="margin-top:16px"><div class="card"><h2>Site basis</h2><p><b>Campus:</b> ${esc(campuses.find((c) => c.id === site.campus_id)?.name)}<br><b>Site:</b> ${esc(site.name)}<br><b>Acceptance authority:</b> ${esc(site.acceptance_authority || "Not assigned")}</p>${manage() ? button("Edit site basis", "edit-site") : ""}<div class="status-line">Template: ${esc(site.template_version)} \xB7 Refreshed ${esc(loadedAt)}</div></div><div class="card"><h2>Next setup actions</h2><p>Import the master equipment list and commissioning schedule, upload scripts, then assign owners and review the site's requirements.</p><div class="row">${button("Import MEL", "import", "assets")}${button("Import schedule", "import", "schedule")}${button("Upload source / script", "add-evidence")}</div></div></div>`;
}
function equipmentView() {
  return heading("Master Equipment", "The equipment baseline for this site. Imports retain their source document and revision.") + `<div class="toolbar">${edit() ? button("Import CSV / XLSX", "import", "assets", "") : ""}${button("Download CSV template", "template", "assets")}${edit() ? button("Add equipment", "new-asset") : ""}<span class="muted">${data.assets.length} records</span></div>` + table(["Equipment tag", "Name / type", "System / location", "Criticality", "Source revision", ""], data.assets.map((a) => `<tr><td class="mono">${esc(a.code)}</td><td>${esc(a.name)}<small>${esc(a.equipment_type)}</small></td><td>${esc(a.system)}<small>${esc(a.location)}</small></td><td>${esc(a.criticality)}</td><td>${esc(a.source_revision || "Manual entry")}</td><td>${button(edit() ? "Edit" : "View", "asset", a.id, "link")}</td></tr>`), "Import your master equipment list to begin.");
}
function scheduleView() {
  return heading("Commissioning Schedule", "Import activities and their dates from your commissioning source. Owner acceptance milestones stay explicitly mapped.") + `<div class="toolbar">${edit() ? button("Import CSV / XLSX", "import", "schedule", "") : ""}${button("Download CSV template", "template", "schedule")}${button("Upload native schedule", "add-evidence")}<span class="muted">${data.schedule_activities.length} activities</span></div><p class="muted">Structured imports support CSV and the first XLSX sheet. Native XER, MPP, PDFs and scripts can be retained in Evidence & Sources. Activity predecessor IDs are source references; task dependencies are configured in the task register.</p>` + table(["Activity", "Dates", "Cx level", "Equipment", "Milestone", "Source"], data.schedule_activities.map((a) => `<tr><td>${esc(a.external_id)}<small>${esc(a.name)}</small></td><td>${esc(a.start_date || "\u2014")} \u2192 ${esc(a.finish_date || "\u2014")}</td><td>${esc(a.level)}</td><td>${esc(a.asset_code)}</td><td>${esc(data.milestones.find((m) => m.id === a.milestone_id)?.code || "Unmapped")}</td><td>${a.source_evidence_id ? button("Open source", "open-evidence", a.source_evidence_id, "link") : "\u2014"}</td></tr>`));
}
function milestonesView() {
  return heading("Milestones", "Set L1\u2013L5 commissioning dates and G0\u2013G6 owner acceptance decisions. Planned and actual dates do not confer readiness.") + table(["Code / milestone", "Track", "Planned", "Actual", "Mapped requirements", ""], data.milestones.map((m) => `<tr><td><b>${esc(m.code)}</b><small>${esc(m.name)}</small></td><td>${esc(m.track)}</td><td>${esc(m.planned_date || "Not set")}</td><td>${esc(m.actual_date || "Not recorded")}</td><td>${data.requirement_milestones.filter((x) => x.milestone_id === m.id).length}</td><td>${manage() ? button("Configure", "milestone", m.id, "link") : ""}</td></tr>`)) + `<div class="callout">Initial mapping: source Ops MVP \u2192 G2; Handoff \u2192 G4; Steady State \u2192 G6. Suggested mappings L1 \u2192 G0, L3 \u2192 G1, L5 \u2192 G3 require review. Edit each task's requirement to change its milestone mapping.</div>`;
}
function filteredTasks() {
  return data.tasks.filter((t) => (!taskFilters.search || [t.code, t.title, t.owner, t.workstream].join(" ").toLowerCase().includes(taskFilters.search.toLowerCase())) && (!taskFilters.vertical || t.vertical === taskFilters.vertical) && (!taskFilters.status || t.status === taskFilters.status) && (!taskFilters.milestone || data.requirement_milestones.some((x) => x.requirement_id === t.requirement_id && x.milestone_id === taskFilters.milestone)));
}
function tasksView() {
  const tasks = filteredTasks();
  page = Math.min(page, Math.max(0, Math.ceil(tasks.length / 40) - 1));
  return heading("Task Register", "Every task has a stable code, requirement, owner, history, and evidence trail.") + `<form id="task-filters" class="toolbar">${input("search", "Search code, title or owner", taskFilters.search)}${select("vertical", "Vertical", opt("", "All verticals", taskFilters.vertical) + [...new Set(data.tasks.map((t) => t.vertical))].sort().map((v) => opt(v, (catalog.find(c=>c.name===v)?.code||'')+' · '+v, taskFilters.vertical)).join(""))}${select("status", "Status", opt("", "All statuses", taskFilters.status) + statusValues.map((v) => opt(v, v, taskFilters.status)).join(""))}${select("milestone", "Milestone", options(data.milestones, taskFilters.milestone, (m) => `${m.code} \xB7 ${m.name}`, "All milestones"))}<button>Apply filters</button></form><div class="row between"><p class="muted">${tasks.length} matching tasks \xB7 ${data.tasks.filter((t) => t.status === "Complete").length} marked complete; readiness also checks current evidence.</p><div class="row">${manage() ? button("Add site-specific task", "new-task") : ""}${button("Export filtered tasks", "export-tasks")}</div></div>` + table(["Task code", "Task / workstream", "Task owner / due", "Status", "Requirement", ""], tasks.slice(page * 40, page * 40 + 40).map((t) => {
    const q = data.requirements.find((q2) => q2.id === t.requirement_id) || {};
    return `<tr><td class="mono">${esc(t.code)}</td><td class="wrap">${esc(t.title)}<small>${esc(t.vertical)} \xB7 ${esc(t.workstream)}</small></td><td>${esc(t.owner || "Unassigned")}<small>${esc(t.due_date || "No due date")}</small></td><td>${badge(t.status)}</td><td>${q.critical ? badge("Critical No-Go") : ""}<small>${esc(q.applicability)} \xB7 V${q.min_verification}</small></td><td>${button("Open", "task", t.id, "link")}</td></tr>`;
  })) + `<div class="pager"><span>${tasks.length ? `${page * 40 + 1}\u2013${Math.min(tasks.length, (page + 1) * 40)}` : "0"} of ${tasks.length}</span><button type="button" data-action="prev" ${page === 0 ? "disabled" : ""}>Previous</button><button type="button" data-action="next" ${(page + 1) * 40 >= tasks.length ? "disabled" : ""}>Next</button></div>`;
}
function capabilitiesView() {
  return heading("Capabilities & Authority", "Verify how the contributing work fits together and who can accept operational responsibility.") + table(["Capability / vertical", "Owner", "Integration", "Operational authority", ""], data.capabilities.map((c) => `<tr><td>${esc(c.name)}<small>${esc(c.vertical)}</small></td><td>${esc(c.owner || "Unassigned")}</td><td>${badge(c.integration_verified ? "Verified" : "Unverified")}</td><td>${badge(c.authority_verified ? "Verified" : "Unverified")}<small>${esc(c.responsible_party)}</small></td><td>${button(manage() ? "Configure" : "View", "capability", c.id, "link")}</td></tr>`));
}
function evidenceView() {
  return heading("Evidence & Sources", "Retain equipment lists, schedules, scripts, test records and operational evidence. Each revision is a separate record.") + `<div class="toolbar">${edit() || scoped() ? button("Upload file or add source link", "add-evidence", "", "") : ""}<span class="muted">${data.evidence.length} retained records</span></div>` + evidenceTable(data.evidence);
}
function evidenceTable(rows) {
  return table(["Evidence / revision", "Provenance", "Task", "Verification", ""], rows.slice().sort((a, b) => b.created_at.localeCompare(a.created_at)).map((e) => `<tr><td>${esc(e.title)}<small>${esc(e.category)} \xB7 Revision ${esc(e.revision)}${e.file_name ? " \xB7 " + esc(e.file_name) : ""}</small></td><td>${esc(e.producing_party)}<small>${esc(e.source_system)}</small></td><td>${e.task_id ? button(taskName(e.task_id), "task", e.task_id, "link") : "Source document"}</td><td>${badge(evidenceState(e))}<small>${e.expires_on ? "Expires " + esc(e.expires_on) : "No expiry set"}</small></td><td>${button("Open", "open-evidence", e.id, "link")} ${verify() ? button("Review", "review", e.id, "link") : ""}</td></tr>`));
}
function reviewsView() {
  const pending = data.evidence.filter((e) => evidenceState(e) !== "Verified");
  return heading("Verification Queue", "Record the verification level, decision and rationale. Review history is retained; a rejection never erases an earlier decision.") + `<div class="callout">${levels.join(" \xB7 ")}. A task can complete only when current evidence meets its requirement's verification level.</div>` + evidenceTable(pending);
}
function readinessView() {
  return heading("Readiness & Decisions", "Eligibility is calculated from saved requirements, task dependencies, current verified evidence and capability controls.") + `<div class="row between"><p id="evaluated" class="muted">Evaluating saved records\u2026</p>${button("Re-evaluate", "refresh")}</div><div class="grid three" id="gate-cards"><div class="loading">Checking milestone requirements\u2026</div></div><div class="callout">This release blocks acceptance when requirements remain unresolved. QA coverage uses the configured, customer-confirmed test population. Weights affect reporting only; conditional acceptance and automatic sample selection are not enabled.</div>`;
}
function gateCard(g) {
  const m = data.milestones.find((m2) => m2.id === g.milestone_id);
  return `<article class="card milestone"><div class="eyebrow">${esc(m.track)}</div><h2>${esc(m.code)} \xB7 ${esc(m.name)}</h2><div class="value">${badge(g.state)}</div><p>${g.verified} / ${g.total} requirements satisfied<br><small class="muted">${g.critical_open} open Critical No-Go requirements \xB7 Planned ${esc(m.planned_date || "not set")}</small></p>${g.reasons.length ? `<ul>${g.reasons.map((r) => `<li>${esc(r)}</li>`).join("")}</ul>` : '<p class="muted">The configured readiness conditions are satisfied.</p>'}<div class="row">${button("View tasks", "milestone-tasks", m.id)}${manage() && g.eligible_for_acceptance ? button("Record acceptance", "accept", m.id, "") : ""}${manage() && ["Accepted", "Degraded"].includes(g.state) ? button("Withdraw acceptance", "withdraw", m.id) : ""}</div></article>`;
}
function historyView() {
  return heading("Change History", "Server-recorded changes and acceptance snapshots. The latest 150 changes are shown below.") + `<div class="card"><h2>Acceptance decisions</h2>${table(["When", "Milestone", "Decision", "Authority", ""], data.gate_decisions.slice().sort((a, b) => Number(b.decision_seq) - Number(a.decision_seq)).map((d) => `<tr><td>${esc(date(d.created_at))}</td><td>${esc(data.milestones.find((m) => m.id === d.milestone_id)?.code)}</td><td>${badge(d.decision)}</td><td>${esc(d.authority)}</td><td>${button("View snapshot", "decision", d.id, "link")}</td></tr>`))}</div><div id="audit" class="loading">Loading change history\u2026</div>`;
}
function modal(title, body) {
  const d = $("#dialog");
  d.innerHTML = `<div class="dialog-head"><h2 id="dialog-title">${esc(title)}</h2>${button("Close", "close")}</div><div class="dialog-body">${guide.inline()}<div id="form-error" role="alert"></div>${body}</div>`;
  if (!d.open) d.showModal();
}
function close() {
  if (busy) return;
  $("#dialog").close();
  $("#dialog").innerHTML = "";
}
function form(id, body, label = "Save changes") {
  return `<form id="${id}">${body}<div class="form-actions">${button("Cancel", "close")}<button type="submit">${esc(label)}</button></div></form>`;
}
function read(formEl) {
  return Object.fromEntries(new FormData(formEl));
}
async function save(formEl, fn, message = "Saved to the site record.") {
  if (busy) return;
  busy = true;
  const controls = [...$("#dialog").querySelectorAll("button")];
  controls.forEach((b) => b.disabled = true);
  $("#form-error").innerHTML = "";
  try {
    await fn();
    await loadWorkspace();
    busy = false;
    close();
    shell();
    notice(message);
  } catch (e) {
    $("#form-error").innerHTML = `<div class="callout error">${esc(e.message)}</div>`;
    $("#form-error").scrollIntoView({ block: "nearest" });
  } finally {
    busy = false;
    controls.forEach((b) => b.disabled = false);
  }
}
function newSite() {
  modal("Start a new build", form("site-create", `<p>One customer-owned readiness instance per building. Select your pillars and define criteria after creating the building.</p><div class="grid two">${input("campus_code","Campus code","","text","required")}${input("campus_name","Campus name","","text","required")}${input("site_code","Building code","","text","required")}${input("site_name","Site name","","text","required")}${input("building_name","Building / phase","","text","required")}${select("model","Operating model",["Self-Perform","3PDC","Colocation","Hybrid"].map(m=>opt(m,m,"Self-Perform")).join(""))}${input("authority_name","Acceptance authority / reference")}</div>`,"Start build"));
  $('#site-create').onsubmit=e=>{e.preventDefault();save(e.target,async()=>{const id=await rpc('create_threshold_build',{workspace_id:workspaceId,values_json:read(e.target)});sessionStorage.setItem('structive-site',id);site={id};route='program-wizard';history.replaceState(null,'','#program-wizard');await loadWorkspace();await program.handle('initialize');},'Building created. Configure the setup clock and selected pillars.');};
}
function editSite() {
  modal("Site basis", form("site-edit", `<div class="grid two">${input("name", "Site name", site.name, "text", "required")}${input("building", "Building / phase", site.building, "text", "required")}${select("operating_model", "Operating model", ["Self-Perform", "3PDC", "Colocation", "Hybrid"].map((m) => opt(m, m, site.operating_model)).join(""))}${input("acceptance_authority", "Owner acceptance authority", site.acceptance_authority, "text", "required")}</div><div class="callout">Confirm the basis only after reviewing the site's requirements, applicability, verification levels and milestone mappings. The initial template mapping is a starting point for that review.</div>${check("setup_confirmed", "I confirm the site basis and requirement mappings have been reviewed.", site.setup_confirmed)}`));
  $("#site-edit").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target);
    save(e.target, () => unwrap(db.from("sites").update({ ...v, setup_confirmed: !!v.setup_confirmed }).eq("id", site.id)));
  };
}
function assetModal(id) {
  const a = data.assets.find((a2) => a2.id === id) || {};
  modal(a.id ? "Equipment \xB7 " + a.code : "Add equipment", form("asset-edit", `<div class="grid two">${fields.assets.map((k) => input(k, labels[k], a[k] || "", "text", ["code", "name"].includes(k) ? "required" : "")).join("")}</div>`, a.id ? "Save equipment" : "Add equipment"));
  $("#asset-edit").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target);
    save(e.target, () => unwrap(a.id ? db.from("assets").update(v).eq("id", a.id) : db.from("assets").insert({ ...v, site_id: site.id })));
  };
  if (!edit()) $("#asset-edit button[type=submit]").disabled = true;
}
function milestoneModal(id) {
  const m = data.milestones.find((m2) => m2.id === id);
  modal(m.code + " \xB7 " + m.name, form("milestone-edit", `<div class="grid two">${input("name", "Milestone name", m.name, "text", "required")}${input("planned_date", "Planned date", m.planned_date, "date")}${input("actual_date", "Actual date", m.actual_date, "date")}${input("source_activity", "Source activity reference", m.source_activity)}</div><p class="muted">Dates are scheduling records. Readiness and acceptance are evaluated separately.</p>`));
  $("#milestone-edit").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target);
    v.planned_date ||= null;
    v.actual_date ||= null;
    save(e.target, () => unwrap(db.from("milestones").update(v).eq("id", id)));
  };
}
function taskModal(id) {
  const t=data.tasks.find(t=>t.id===id); if(!t)return;
  const q=data.requirements.find(q=>q.id===t.requirement_id)||{};
  const evidence=data.evidence.filter(e=>e.task_id===id),deps=data.task_dependencies.filter(d=>d.task_id===id);
  const assignment=ownership.canAssign(t),executionOnly=scoped()&&!assignment;
  const choices=statusValues.filter(v=>v!=='Complete'||verify()||t.status==='Complete');
  const planFields=executionOnly?'':`<div class="grid two">${assignment?ownership.assigneeSelect(t):`<p>Task owner: ${esc(t.owner||'Unassigned')}</p>`}${select('asset_id','Equipment record',options(data.assets,t.asset_id,a=>a.code+' · '+a.name,'No equipment link'))}${input('planned_start','Planned start',t.planned_start,'date')}${input('due_date','Due date',t.due_date,'date')}${select('priority','Priority',['Low','Medium','High','Critical'].map(v=>opt(v,v,t.priority)).join(''))}</div>`;
  modal(t.code+' · '+t.title, `${ownership.assignmentFields(t)}<div class="row">${badge(t.status)}${q.critical?badge('Critical No-Go'):''}<span class="muted">${esc(t.vertical)} · ${esc(t.workstream)}</span></div>
    <div class="card" style="margin-top:16px"><h3>Acceptance criterion</h3><p>${esc(q.criterion)}</p><h3>Required evidence · ${esc(levels[q.min_verification-1])}</h3><p>${esc(q.required_evidence)}</p><p class="muted">${esc(q.applicability)} · ${data.requirement_milestones.filter(x=>x.requirement_id===q.id).map(x=>esc(data.milestones.find(m=>m.id===x.milestone_id)?.code)).join(', ')}</p>${manage()?button('Configure requirement & milestones','requirement',q.id):''}</div>
    ${form('task-edit',`${planFields}${select('status','Execution status',choices.map(v=>opt(v,v,t.status)).join(''))}${area('blocker','Blocking issue',t.blocker)}${area('notes','Execution notes',t.notes)}${verify()?area('completion_note','Acceptance statement',t.completion_note):''}${assignment?input('soc_refs','SOC criteria references (comma-separated)',(t.soc_refs||[]).join(', '),'text','maxlength="1000" placeholder="e.g. CC6.4, A1.2"'):''}<p class="help">Submit finished work for verification. Verified completion requires the appropriate role, current evidence and satisfied predecessors.</p>`,'Save task')}
    <div class="split"><h3>Task evidence</h3>${edit()||scoped()?button('Add evidence to this task','add-evidence',t.id):''}${evidenceTable(evidence)}</div>
    <div class="split"><h3>Predecessors</h3>${deps.length?deps.map(d=>`<div class="row">${data.tasks.some(x=>x.id===d.predecessor_id)?button(taskName(d.predecessor_id),'task',d.predecessor_id,'link'):'<span class="muted">Predecessor managed outside your task view</span>'}${manage()?button('Remove relationship','remove-dep',id+':'+d.predecessor_id):''}</div>`).join(''):'<p class="muted">No task dependencies configured.</p>'}${manage()?form('dependency-add',select('predecessor_id','Add predecessor',options(data.tasks.filter(x=>x.id!==id&&!deps.some(d=>d.predecessor_id===x.id)),'',t=>t.code+' · '+t.title),'required'),'Add predecessor'):''}</div>`);
  $('#task-edit').onsubmit=e=>{
    e.preventDefault();const v=read(e.target);
    for(const k of ['assigned_person_id','asset_id','planned_start','due_date'])if(k in v)v[k]||=null;
    if('soc_refs' in v)v.soc_refs=[...new Set(v.soc_refs.split(',').map(x=>x.trim()).filter(Boolean))];
    save(e.target,()=>unwrap(db.from('tasks').update(v).eq('id',id).eq('updated_at',t.updated_at).select('id').single()));
  };
  if((!edit()&&!scoped())||(scoped()&&t.status==='Complete'))$('#task-edit button[type=submit]').disabled=true;
  if($('#dependency-add'))$('#dependency-add').onsubmit=e=>{e.preventDefault();save(e.target,()=>unwrap(db.from('task_dependencies').insert({site_id:site.id,task_id:id,predecessor_id:read(e.target).predecessor_id})));};
}
function requirementModal(id) {
  const q = data.requirements.find((q2) => q2.id === id);
  modal("Configure " + q.code, form("requirement-edit", `${area("criterion", "Acceptance criterion", q.criterion, "required")}${area("required_evidence", "Required evidence", q.required_evidence, "required")}<div class="grid two">${select("min_verification", "Minimum verification level", levels.map((l, i) => opt(i + 1, l, q.min_verification)).join(""))}${select("applicability", "Applicability", ["Required", "Determination Required", "Not Applicable"].map((v) => opt(v, v, q.applicability)).join(""))}</div>${area("applicability_reason", "Applicability decision rationale", q.applicability_reason)}${check("critical", "Critical No-Go requirement", q.critical)}<h3>Mapped milestones</h3><div class="grid three">${data.milestones.map((m) => check("milestone_" + m.id, m.code + " \xB7 " + m.name, data.requirement_milestones.some((x) => x.requirement_id === id && x.milestone_id === m.id))).join("")}</div><p class="help">Changes are audited and may invalidate a previous acceptance decision.</p>`));
  $("#requirement-edit").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target), milestone_ids = data.milestones.filter((m) => v["milestone_" + m.id]).map((m) => m.id), values_json = { criterion: v.criterion, required_evidence: v.required_evidence, min_verification: Number(v.min_verification), applicability: v.applicability, applicability_reason: v.applicability_reason, critical: !!v.critical };
    save(e.target, () => rpc("configure_requirement", { requirement_id: id, values_json, milestone_ids }));
  };
}
function newTask() {
  modal("Add a site-specific task", form("task-create", `<div class="grid two">${input("code", "Unique task code", "", "text", "required")}${input("title", "Task title", "", "text", "required")}${select("capability_id", "Capability / workstream", options(data.capabilities, "", (c) => c.vertical + " \xB7 " + c.name), "required")}${select("milestone_id", "Initial milestone", options(data.milestones, "", (m) => m.code + " \xB7 " + m.name), "required")}${select("assigned_person_id", "Task owner", options([],"",p=>p.display_name,"Unassigned"))}${input("due_date", "Due date", "", "date")}</div>${area("criterion", "Acceptance criterion", "", "required")}${area("required_evidence", "Required evidence", "", "required")}${select("min_verification", "Minimum verification level", levels.map((l, i) => opt(i + 1, l, 3)).join(""))}${check("critical", "Critical No-Go requirement")}`, "Create task"));
  $('#task-create [name=capability_id]').onchange=e=>{
    const capability=data.capabilities.find(c=>c.id===e.target.value);
    $('#task-create [name=assigned_person_id]').innerHTML=options(ownership.candidates({vertical:capability?.vertical}),"",p=>p.display_name,"Unassigned");
  };
  $("#task-create").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target);
    v.critical = !!v.critical;
    v.min_verification = Number(v.min_verification);
    v.due_date ||= null;
    save(e.target, () => rpc("create_site_task", { site_id: site.id, values_json: v }));
  };
}
function capabilityModal(id) {
  const c = data.capabilities.find((c2) => c2.id === id);
  modal(c.name, form("capability-edit", `${input("owner", "Accountable capability owner", c.owner)}${area("integration_note", "Contribution and interface verification rationale", c.integration_note)}${check("integration_verified", "Contributing work and operational interfaces have been verified.", c.integration_verified)}<div class="split">${input("responsible_party", "Party taking operational responsibility", c.responsible_party)}${area("delegated_authority", "Delegated authority and boundaries", c.delegated_authority)}${area("retained_authority", "Owner retained authority", c.retained_authority)}${check("authority_verified", "Responsibility and delegated authority have been verified.", c.authority_verified)}</div>`));
  $("#capability-edit").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target);
    save(e.target, () => unwrap(db.from("capabilities").update({ ...v, integration_verified: !!v.integration_verified, authority_verified: !!v.authority_verified }).eq("id", id)));
  };
  if (!manage()) $("#capability-edit button[type=submit]").disabled = true;
}
function evidenceFields(taskId = "") {
  return `<div class="grid two">${input("title", "Evidence / source title", "", "text", "required")}${select("category", "Category", ["Evidence", "Master Equipment List", "Commissioning Schedule", "Script", "Procedure", "Training", "Handoff Record"].map((v) => opt(v, v, "Evidence")).join(""))}${input("producing_party", "Producing party", "", "text", "required")}${input("source_system", "Source system / origin", "", "text", "required")}${input("revision", "Revision", "1", "text", "required")}${input("expires_on", "Expiry date (if applicable)", "", "date")}${select("task_id", "Linked task", options(data.tasks, taskId, (t) => t.code + " \xB7 " + t.title, scoped()?"Select your assigned task":"Source document \u2014 no task link"),scoped()?"required":"")}${select("asset_id", "Linked equipment", options(data.assets, "", (a) => a.code + " \xB7 " + a.name, "None"))}${select("milestone_id", "Linked milestone", options(data.milestones, "", (m) => m.code + " \xB7 " + m.name, "None"))}</div>`;
}
async function uploadEvidence(v, file) {
  const payload = { site_id: site.id, title: v.title, category: v.category, producing_party: v.producing_party, source_system: v.source_system, revision: v.revision, expires_on: v.expires_on || null, task_id: v.task_id || null, asset_id: v.asset_id || null, milestone_id: v.milestone_id || null };
  if (file?.size) {
    if (file.size > 50 * 1024 * 1024) throw Error("The private evidence limit is 50 MB per file.");
    const safe = file.name.replace(/[^a-zA-Z0-9._-]/g, "_"), path = site.id + "/" + session.user.id + "/" + crypto.randomUUID() + "/" + safe;
    const hash = await crypto.subtle.digest("SHA-256", await file.arrayBuffer());
    await unwrap(db.storage.from("activation-evidence").upload(path, file, { contentType: file.type || "application/octet-stream", upsert: false }));
    Object.assign(payload, { object_path: path, file_name: file.name, mime_type: file.type || "application/octet-stream", size_bytes: file.size, sha256: Array.from(new Uint8Array(hash)).map((b) => b.toString(16).padStart(2, "0")).join("") });
  } else {
    let url;
    try {
      url = new URL(v.external_url);
    } catch {
      throw Error("Choose a file or enter an HTTPS source link.");
    }
    if (url.protocol !== "https:") throw Error("Source links must use HTTPS.");
    payload.external_url = url.href;
  }
  return unwrap(db.from("evidence").insert(payload).select().single());
}
function addEvidence(taskId = "") {
  modal("Add evidence or source document", form("evidence-add", `${evidenceFields(taskId)}<div class="grid two"><label>Private file (up to 50 MB)<input type="file" name="file"></label>${input("external_url", "Or an HTTPS source link", "", "url")}</div><p class="help">Provide one file or one link. Uploaded files are private. New revisions are stored separately.</p>`, "Save evidence"));
  $("#evidence-add").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target);
    save(e.target, async () => {
      if (v.file?.size && v.external_url) throw Error("Choose a file or a link, not both.");
      await uploadEvidence(v, v.file);
    });
  };
}
async function openEvidence(id) {
  const e = data.evidence.find((e2) => e2.id === id);
  if (!e) throw Error("Evidence record unavailable.");
  let url = e.external_url;
  if (e.object_path) {
    const r = await unwrap(db.storage.from("activation-evidence").createSignedUrl(e.object_path, 60, { download: e.file_name || true }));
    url = r.signedUrl;
  }
  modal(e.title, `<p>Revision ${esc(e.revision)} \xB7 ${esc(e.producing_party)} \xB7 ${esc(e.source_system)}</p><p>${badge(evidenceState(e))}</p><p><a href="${esc(url)}" target="_blank" rel="noopener noreferrer">${e.object_path ? "Download private file" : "Open source link"}</a></p>${e.object_path ? '<p class="help">This download link expires after one minute. Reopen the record to get another link.</p>' : ""}${e.sha256 ? `<details><summary>File fingerprint</summary><pre>${esc(e.sha256)}</pre></details>` : ""}`);
}
function reviewEvidence(id) {
  const e = data.evidence.find((e2) => e2.id === id), t = data.tasks.find((t2) => t2.id === e.task_id), q = data.requirements.find((q2) => q2.id === t?.requirement_id);
  modal("Verify \xB7 " + e.title, `${button("Open evidence", "open-evidence", id)}${q ? `<div class="callout"><b>${esc(t.code)} \xB7 ${esc(levels[q.min_verification - 1])}</b><p>${esc(q.criterion)}</p><p>${esc(q.required_evidence)}</p></div>` : '<p class="muted">This is a retained source document; it is not linked to a task.</p>'}${form("evidence-review", `<div class="grid two">${select("verdict", "Review decision", ["Verified", "Rejected"].map((v) => opt(v, v, "Verified")).join(""))}${select("verification_level", "Verification performed", levels.map((v, i) => opt(i + 1, v, q?.min_verification || 1)).join(""))}</div>${area("note", "Review rationale and observed result", "", "required")}`, "Record verification")}<div class="split"><h3>Review history</h3>${data.evidence_reviews.filter((r) => r.evidence_id === id).sort((a, b) => Number(b.review_seq) - Number(a.review_seq)).map((r) => `<div class="card">${badge(r.verdict)} \xB7 V${r.verification_level} \xB7 ${esc(date(r.created_at))}<p>${esc(r.note)}</p><small class="mono">${esc(r.reviewer_id)}</small></div>`).join("") || '<p class="muted">No reviews yet.</p>'}</div>`);
  $("#evidence-review").onsubmit = (e2) => {
    e2.preventDefault();
    const v = read(e2.target);
    save(e2.target, () => unwrap(db.from("evidence_reviews").insert({ ...v, verification_level: Number(v.verification_level), site_id: site.id, evidence_id: id })));
  };
}
function acceptModal(id, withdraw = false) {
  const m = data.milestones.find((m2) => m2.id === id);
  modal((withdraw ? "Withdraw acceptance \xB7 " : "Record owner acceptance \xB7 ") + m.code, form("accept-gate", `<p>${esc(m.name)}</p><div class="callout">The server will re-evaluate the current record and retain an immutable decision snapshot under your signed-in identity.</div>${input("authority_name", "Named acceptance authority", site.acceptance_authority, "text", "required")}${area("decision_note", withdraw ? "Withdrawal rationale" : "Acceptance scope and rationale", "", 'required minlength="10"')}${check("confirm", "I am authorized to record this owner decision.")}`, withdraw ? "Record withdrawal" : "Record acceptance"));
  $("#accept-gate").onsubmit = (e) => {
    e.preventDefault();
    const v = read(e.target);
    save(e.target, async () => {
      if (!v.confirm) throw Error("Confirm your decision authority.");
      await rpc("record_gate_decision", { milestone_id: id, authority_name: v.authority_name, decision_note: v.decision_note, withdraw });
    });
  };
}
function download(name, text, mime = "text/plain") {
  const url = URL.createObjectURL(new Blob([text], { type: mime }));
  const a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1e3);
}
function importModal(kind) {
  let parsed, file, records, sourceId;
  modal(kind === "assets" ? "Import master equipment list" : "Import commissioning schedule", `<div class="callout">Choose CSV or XLSX with a header row and up to 2,000 records. Matching IDs update existing records in one transaction. Review column mappings before importing.</div><label>Source file<input id="import-file" type="file" accept=".csv,.xlsx"></label><div id="import-fields"></div>`);
  $("#import-file").onchange = async (e) => {
    try {
      file = e.target.files[0];
      if (!file) return;
      parsed = await parseFile(file);
      $("#import-fields").innerHTML = form("import-map", `<h3>Map the source columns</h3><div class="grid three">${fields[kind].map((k) => {
        const index = parsed.headers.findIndex((h) => [k, labels[k]].includes(h.toLowerCase().replaceAll(" ", "_")) || h.toLowerCase() === labels[k].toLowerCase());
        return select("map_" + k, labels[k], opt("", "Not mapped", index < 0 ? "" : index) + parsed.headers.map((h, i) => opt(i, h, index < 0 ? "" : index)).join(""), [kind === "assets" ? "code" : "external_id", "name"].includes(k) ? "required" : "");
      }).join("")}</div><h3>Source provenance</h3>${input("external_url","Original source document link","","url","required")}<div class="grid three">${input("producing_party", "Producing party", "", "text", "required")}${input("source_system", "Source system", "", "text", "required")}${input("revision", "Revision", "1", "text", "required")}</div><p class="help">Dates must use YYYY-MM-DD or native Excel date cells. Milestone codes must match this site's L1\u2013L5 or G0\u2013G6 codes.</p>`, "Review import");
      $("#import-map").onsubmit = (ev) => {
        ev.preventDefault();
        try {
          const v = read(ev.target), mapping = Object.fromEntries(fields[kind].map((k) => [k, v["map_" + k]]));
          records = mapRows(kind, parsed, mapping, data.milestones.map((m) => m.code));
          const current = new Set((kind === "assets" ? data.assets : data.schedule_activities).map((a) => kind === "assets" ? a.code : a.external_id)), updates = records.filter((r) => current.has(kind === "assets" ? r.code : r.external_id)).length;
          $("#import-fields").innerHTML = `<h3>Review ${records.length} records</h3><p>${records.length - updates} new \xB7 ${updates} updates \xB7 Showing first 8 rows.</p>${table(fields[kind].map((k) => labels[k]), records.slice(0, 8).map((r) => "<tr>" + fields[kind].map((k) => "<td>" + esc(r[k]) + "</td>").join("") + "</tr>"))}<p class="muted">Parsed records will be imported. The original document remains at your external link, revision ${esc(v.revision)}.</p>${form("import-confirm", check("confirm", "I have reviewed these mappings and approve this import."), "Import " + records.length + " records")}`;
          $("#import-confirm").onsubmit = (ex) => {
            ex.preventDefault();
            save(ex.target, async () => {
              if (!read(ex.target).confirm) throw Error("Confirm the reviewed import.");
              if (!sourceId) {
                const source = await uploadEvidence({ title: file.name, category: kind === "assets" ? "Master Equipment List" : "Commissioning Schedule", producing_party: v.producing_party, source_system: v.source_system, revision: v.revision, external_url:v.external_url }, null);
                sourceId = source.id;
              }
              await rpc("import_site_records", { site_id: site.id, kind, records, source_evidence_id: sourceId });
            }, "Imported " + records.length + " records with an external source reference.");
          };
        } catch (err) {
          $("#form-error").innerHTML = `<div class="callout error">${esc(err.message)}</div>`;
        }
      };
    } catch (err) {
      $("#form-error").innerHTML = `<div class="callout error">${esc(err.message)}</div>`;
    }
  };
}
async function action(name, id, element) {
  if(name?.startsWith("program-"))return program.handle(name.slice(8),id,element);
  if(name==="try-program"){program.startTrial();route="program-wizard";history.replaceState(null,"","#try");trialShell();return;}
  if(name==='vendor-home'){customerMode=false;await loadWorkspace();shell();return;}
  if(name==='vendor-preview'){customerMode=true;workspaceId=commerce.accounts.find(a=>a.billing_source==='internal')?.workspace_id||commerce.accounts[0]?.workspace_id;route='account';history.replaceState(null,'','#account');await loadWorkspace();shell();return;}
  if(name.startsWith('commercial-')){guide.setContext(vendorMode()?'vendor':'account');return commercial.handle(name,id);}
  if(name==='public-plans'){return showPurchaseOptions();}

  const helpContext = { "new-site": "setup-1", "edit-site": "setup-1", "task": "tasks", "new-task": "tasks", "requirement": "tasks", "asset": "equipment", "new-asset": "equipment", "milestone": "milestones", "capability": "capabilities", "add-evidence": "evidence", "open-evidence": "evidence", "review": "reviews", "accept": "readiness", "withdraw": "readiness", "decision": "history", "audit": "history", "import": id === "assets" ? "equipment" : "schedule" };
  if (helpContext[name]) guide.setContext(helpContext[name]);
  if(['person-new','person-edit','scope-edit','soc-edit'].includes(name)){guide.setContext(name==='soc-edit'?'soc':'team');return ownership.handle(name,id);}
  const actions = {
    close,
    "my-register": () => {taskFilters={search:'',vertical:'',status:'',milestone:''};page=0;navigate('tasks');},
    refresh: async () => {
      await loadWorkspace();
      shell();
      notice("Saved records refreshed.");
    },
    signout: async () => {
      await unwrap(db.auth.signOut());
      site = null;
      data = {};
      session = null;
      sessionStorage.removeItem("structive-site");
      authView();
    },
    "new-site": newSite,
    "edit-site": editSite,
    "new-asset": () => assetModal(),
    "asset": () => assetModal(id),
    "milestone": () => milestoneModal(id),
    "task": () => taskModal(id),
    "requirement": () => requirementModal(id),
    "new-task": newTask,
    "capability": () => capabilityModal(id),
    "add-evidence": () => addEvidence(id),
    "open-evidence": () => openEvidence(id),
    "review": () => reviewEvidence(id),
    "accept": () => acceptModal(id),
    "withdraw": () => acceptModal(id, true),
    "import": () => importModal(id),
    "template": () => download("structive-" + id + "-template.csv", fields[id].join(",") + "\r\n", "text/csv"),
    "export-tasks": () => download(site.code + "-tasks.csv", toCSV(filteredTasks().map((t) => ({ code: t.code, title: t.title, vertical: t.vertical, workstream: t.workstream, owner: t.owner, status: t.status, planned_start: t.planned_start, due_date: t.due_date, asset_code: data.assets.find((a) => a.id === t.asset_id)?.code || "", notes: t.notes }))), "text/csv"),
    "prev": () => {
      page--;
      render();
    },
    "next": () => {
      page++;
      render();
    },
    "milestone-tasks": () => {
      taskFilters = { search: "", vertical: "", status: "", milestone: id };
      page = 0;
      navigate("tasks");
    },
    "decision": () => {
      const d = data.gate_decisions.find((d2) => d2.id === id);
      modal("Acceptance record", `<p>${esc(d.authority)} \xB7 ${esc(date(d.created_at))}</p><p>${esc(d.note)}</p><pre>${esc(JSON.stringify(d.snapshot, null, 2))}</pre>${button("Download decision snapshot", "export-decision", id)}`);
    },
    "export-decision": () => {
      const d = data.gate_decisions.find((d2) => d2.id === id);
      download("structive-decision-" + id + ".json", JSON.stringify(d, null, 2), "application/json");
    },
    "audit": () => {
      const a = data.audit.find((a2) => String(a2.id) === id);
      modal(a.entity + " \xB7 " + a.action, `<p>${esc(date(a.created_at))}</p><h3>Before</h3><pre>${esc(JSON.stringify(a.before_value, null, 2))}</pre><h3>After</h3><pre>${esc(JSON.stringify(a.after_value, null, 2))}</pre>`);
    },
    "remove-dep": async () => {
      const [task_id, predecessor_id] = id.split(":");
      await unwrap(db.from("task_dependencies").delete().eq("site_id", site.id).eq("task_id", task_id).eq("predecessor_id", predecessor_id));
      await loadSite();
      taskModal(task_id);
      notice("Dependency relationship removed and logged.");
    }
  };
  if (actions[name]) await actions[name]();
}
document.addEventListener("click", async (e) => {
  const b = e.target.closest("[data-action],[data-route]");
  if (!b || b.disabled) return;
  e.preventDefault();
  try {
    if (b.dataset.route) {await program.flush();navigate(b.dataset.route);}
    else await action(b.dataset.action, b.dataset.id,b);
  } catch (err) {
    notice(err.message, true);
  }
});
document.addEventListener("submit", (e) => {
  if (e.target.id === "task-filters") {
    e.preventDefault();
    taskFilters = read(e.target);
    page = 0;
    render();
  }
});
document.addEventListener("change", async (e) => {
  if(e.target.id==='workspace-select'){
    try{await program.flush();workspaceId=e.target.value;site=null;route='account';history.replaceState(null,'','#account');await loadWorkspace();shell()}catch(err){notice(err.message,true)}return;
  }

  if (e.target.id === "site-select") {
    e.target.disabled = true;
    try {
      await program.flush();
      site = sites.find((s) => s.id === e.target.value) || null;
      if (!site) {
        sessionStorage.removeItem("structive-site");
        data = {};
        await program.load();
        route = "setup";
        history.replaceState(null, "", "#setup");
        shell();
        return;
      }
      page = 0;
      taskFilters = { search: "", vertical: "", status: "", milestone: "" };
      $("#content").innerHTML = '<p class="loading">Loading site records\u2026</p>';
      await loadSite();
      shell();
    } catch (err) {
      notice(err.message, true);
    } finally {
      e.target.disabled = false;
    }
  }
});
$("#dialog").addEventListener("cancel", (e) => {
  if (busy) e.preventDefault();
});
window.addEventListener("hashchange", () => {
  if (session && visibleNav().some((n) => n[0] === location.hash.slice(1))) {
    route = location.hash.slice(1);
    document.querySelectorAll("[data-route]").forEach((b) => {
      if (b.dataset.route === route) b.setAttribute("aria-current", "page");
      else b.removeAttribute("aria-current");
    });
    render();
  }
});
async function showPurchaseOptions(){
  const plans=await rpc('commercial_catalog');
  modal('Get Threshold',`<p class="muted">Each subscription includes an isolated organization, customer administration, coded vertical ownership and individual workspaces.</p><div class="commercial-plans">${plans.map(p=>`<article class="commercial-plan"><h3>${esc(p.name)}</h3><p>${p.max_users} users · ${p.max_sites} sites</p><a class="button" href="${esc(p.checkout_url)}" rel="noopener noreferrer">View price & subscribe →</a></article>`).join('')||'<p>Online purchase options are being configured. Contact Structive for a customer license.</p>'}</div><p class="help">After purchase, your administrator account is provisioned from confirmed payment. Sign in using the purchase email.</p>${button('Close','close')}`);
}
function authView(message = "") {
  guide.hide();
  $("#app").innerHTML = `<main class="auth">${productBanner()}<div class="card"><h1>Open your workspace</h1><p class="sub">From commissioning assurance to steady operations. One connected readiness workspace.</p>${message ? `<div class="callout">${esc(message)}</div>` : ""}<form id="signin">${input("email", "Authorized workspace email", "", "email", 'required autocomplete="email"')}<button type="submit">Email a sign-in link</button></form><p class="help">Use the email associated with your purchase or customer invitation. Your organization and role determine your workspace.</p>${button("Try the setup wizard","try-program","","")}${button("Purchase Threshold","public-plans","","link")}</div></main>`;
  $("#signin").onsubmit = async (e) => {
    e.preventDefault();
    const b = e.target.querySelector("button");
    b.disabled = true;
    try {
      await unwrap(db.auth.signInWithOtp({ email: read(e.target).email, options: { shouldCreateUser: true, emailRedirectTo: location.origin + location.pathname } }));
      authView("A sign-in link was requested. Check your inbox and open the link on this device.");
    } catch (err) {
      notice(err.message, true);
      b.disabled = false;
    }
  };
}
async function start() {
  if(location.hash==="#try"){program.startTrial();route="program-wizard";trialShell();return;}
  try {
    const response = await fetch("./config.json", { cache: "no-store" });
    if (!response.ok) throw Error("Connection configuration is unavailable.");
    const config = await response.json();
    if (!config.supabaseUrl || !config.supabasePublishableKey) {
      $("#app").innerHTML = `<main class="auth">${productBanner()}<div class="card"><h1>Backend connection pending</h1><p>The engine application is prepared. Its dedicated database, sign-in, and private evidence storage still need to be connected before sites can be created.</p><p class="muted">No demonstration records are loaded, and no site information is being saved by this page.</p></div></main>`;
      return;
    }
    const backend = new URL(config.supabaseUrl);
    if (backend.protocol !== "https:" || !backend.hostname.endsWith(".supabase.co")) throw Error("An HTTPS Supabase project URL is required.");
    db = createClient(config.supabaseUrl, config.supabasePublishableKey, { auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true } });
    session = (await unwrap(db.auth.getSession())).session;
    db.auth.onAuthStateChange((event, newSession) => {
      if (event === "SIGNED_OUT") {
        session = null;
        data = {};
        authView();
      }
      if (event === "SIGNED_IN" && !session) {
        session = newSession;
        setTimeout(async () => {
          try {
            await loadWorkspace();
            shell();
          } catch (e) {
            notice(e.message, true);
          }
        }, 0);
      }
    });
    if (!session) {
      authView();
      if(location.hash==="#plans")await showPurchaseOptions();
      return;
    }
    route = nav.some((n) => n[0] === location.hash.slice(1)) ? location.hash.slice(1) : "setup";
    await loadWorkspace();
    shell();
  } catch (err) {
    $("#app").innerHTML = `<main class="auth"><h1>Workspace unavailable</h1><div class="callout error">${esc(err.message)}</div><p>Reload to retry. Existing site records are retained on the server.</p></main>`;
  }
}
const commercial=createCommercial({state:()=>({commerce,workspaceId}),ui:{esc,button,badge,table,heading,input,select,check,opt,options,modal,form,read,save},rpc,notice,navigate,
 invoke:async body=>unwrap(db.functions.invoke('threshold-commerce',{body})),reload:async()=>{await loadWorkspace();shell()}});
const program=createProgram({state:()=>({site,data,people,manage:manage()}),ui:{esc,heading,button,table,badge,input,area,select,check,opt,options,modal,form,read},rpc,notice,navigate,paint:()=>render(),close,createBuild:newSite,importRecords:importModal});
function trialShell(){
 const tn=[["setup","Readiness Dashboard"],["program-wizard","Setup Wizard"],["program-milestones","Milestone Timeline"],["program-qa","Commissioning QA/QC"],["program-directory","Document Directory"],["program-history","Readiness Decisions"]];
 $('#app').innerHTML=`<div class="app"><aside><div class="brand"><span class="brand-icon">${brandMark}</span><div><b>Threshold</b><small>INTERACTIVE TRIAL</small></div></div><nav aria-label="Trial navigation">${tn.map(([id,label])=>`<button type="button" data-route="${id}" ${id===route?'aria-current="page"':''}>${navIcon(id)}<span>${label}</span></button>`).join('')}</nav></aside><main>${productBanner()}<header><b>Trial Building</b><span>Browser-session trial</span></header><section id="content" class="content"></section></main></div>`;trialRender();
}
function trialRender(){const views={setup:program.dashboard,'program-wizard':program.wizard,'program-milestones':program.milestonesView,'program-qa':program.qaView,'program-directory':program.directoryView,'program-history':program.historyView};$('#content').innerHTML=(views[route]||program.wizard)();program.mount(route);}
const ownership = createOwnership({state:()=>({site,workspaceId,data,people,catalog,userId:session?.user.id,role:role(),manage:manage()}),ui:{esc,heading,button,table,badge,input,area,select,check,opt,options,modal,form,save,read},rpc,notice});
const guide = createHelp({ state: () => ({ site, data, allowedRoutes:visibleNav().map(([id])=>id) }), esc });
const dashboard = createOverview({ state: () => ({ site, data, campuses, manage: manage(), verify: verify() }), ui: { esc, input, area, select, check, opt, options, button, table, badge, heading, modal, form, save, read, levels }, onContext: (key) => guide.setContext(key), hideTip: () => guide.hideTip(), rpc, reload: async () => {
  await loadWorkspace();
  shell();
}, navigate, notice });
start();

