/* Seaport login + dashboards (preview). Uses the data and helpers from seaport.js.
   There are no real accounts: the login never sends or stores the password. It keeps only the chosen
   role and the part of the email before "@" in sessionStorage, so the dashboard can greet the visitor. */

const SS = { get: (k) => { try { return sessionStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { sessionStorage.setItem(k, v); } catch (e) {} } };
const DASH_URL = { company: "seaport-dashboard-company.html", creative: "seaport-dashboard-creative.html" };

/* ---------- login ---------- */
if ($("loginForm")) {
  const ROLE = {
    company: { title: "Welcome back", sub: "Sign in to manage briefs, licences and invoices.", email: "you@company.com", label: "Work email",
      alt: ["building-2", "Continue with company SSO"], foot: 'New to Seaport? <a href="seaport-contact.html">Talk to our team</a>',
      img: "photo-1758518729685-f88df7890776", q: "One agreement for every creative you work with.", by: "Seaport for companies", credit: "Photo: Vitaly Gariev / Unsplash" },
    creative: { title: "Welcome back", sub: "Sign in to see your briefs, frameworks and royalties.", email: "you@studio.com", label: "Email",
      alt: ["mail", "Email me a sign-in link"], foot: 'Not in the network yet? <a href="seaport-contact.html">Apply to join</a>',
      img: "photo-1767330855351-480010c6c194", q: "Keep your IP. Earn every time your work is licensed.", by: "Seaport for creatives", credit: "Photo: Samiul Haque Bhuyan / Unsplash" },
  };
  let role = SS.get("seaport-role") === "creative" ? "creative" : "company";
  const seg = $("roleSeg"), tabs = [...seg.querySelectorAll("button")];
  const setRole = (r, focus) => {
    role = r; const R = ROLE[r];
    tabs.forEach((b) => { const on = b.dataset.role === r; b.setAttribute("aria-selected", on); b.tabIndex = on ? 0 : -1; if (on && focus) b.focus(); });
    seg.dataset.on = r === "creative" ? 1 : 0;
    $("authSub").textContent = R.sub;
    $("lEmail").placeholder = R.email; $("lEmail").previousSibling.textContent = R.label;
    $("altBtn").innerHTML = `<i data-lucide="${R.alt[0]}"></i><span>${R.alt[1]}</span>`;
    $("authFoot").innerHTML = R.foot;
    // swap the photo and the line over it
    const art = $("authArt"); art.classList.add("swap");
    setTimeout(() => { art.style.setProperty("--img", `url('https://images.unsplash.com/${R.img}?auto=format&fit=crop&w=1600&q=75')`); $("authQuote").textContent = R.q; $("authBy").textContent = R.by; $("authCredit").textContent = R.credit; art.classList.remove("swap"); }, 180);
    $("lErr").textContent = "";
    icons();
  };
  tabs.forEach((b, i) => {
    b.onclick = () => setRole(b.dataset.role);
    b.onkeydown = (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); setRole(tabs[1 - i].dataset.role, true); } };
  });
  $("lEye").onclick = () => { const p = $("lPass"); const show = p.type === "password"; p.type = show ? "text" : "password"; $("lEye").setAttribute("aria-label", show ? "Hide password" : "Show password"); $("lEye").innerHTML = `<i data-lucide="${show ? "eye-off" : "eye"}"></i>`; icons(); };
  const go = (email) => { SS.set("seaport-role", role); SS.set("seaport-user", (email || "").split("@")[0].slice(0, 40)); location.href = DASH_URL[role]; };
  $("loginForm").addEventListener("submit", (e) => {
    e.preventDefault();
    const em = $("lEmail"), pw = $("lPass");
    if (!em.value.trim() || !em.checkValidity()) { $("lErr").textContent = "Please enter a valid email address."; em.focus(); return; }
    if (!pw.value) { $("lErr").textContent = "Please enter your password."; pw.focus(); return; }
    pw.value = ""; // never kept
    go(em.value.trim());
  });
  $("altBtn").onclick = () => {
    const em = $("lEmail");
    if (role === "creative" && (!em.value.trim() || !em.checkValidity())) { $("lErr").textContent = "Enter your email and we'll send a sign-in link."; em.focus(); return; }
    go(em.value.trim() || "sso");
  };
  setRole(role);
}

/* ---------- dashboards ----------
   Each sidebar item is its own view (#overview, #briefs, ...). Everything is sample data; changes the visitor makes
   (a new brief, a brief taken, settings) are kept only in this browser's localStorage and can be reset in settings/profile. */
if ($("dash")) {
  const role = document.body.dataset.role;
  const KEY = "seaport-dash-" + role;
  const who = SS.get("seaport-user");
  const nice = who && who !== "sso" ? who.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  const main = $("dash");
  const cr = (id) => CREATIVES.find((c) => c.id === id);
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];
  const UI = {}; // filters per view
  let q = "", cur = role === "company" ? "overview" : "board", S;
  const save = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) {} };
  const load = () => { try { return JSON.parse(localStorage.getItem(KEY)); } catch (e) { return null; } };
  const hit = (...parts) => !q || parts.join(" ").toLowerCase().includes(q);
  const day = (s) => new Date(s + "T00:00:00").toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const addMonths = (s, m) => { const d = new Date(s + "T00:00:00"); d.setMonth(d.getMonth() + m); return d.toISOString().slice(0, 10); };
  const today = () => new Date().toISOString().slice(0, 10);
  const greet = () => { const h = new Date().getHours(), n = (S.me || "").split(" ")[0]; return `Good ${h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"}${n ? ", " + esc(n) : ""}`; };
  const kpi = (href, icon, label, val, delta) => `<a class="kpi2" href="${href}"><small><i data-lucide="${icon}"></i>${label}</small><b>${val}</b><span class="delta">${delta}</span></a>`;
  const bars = (vals, labels, fmt, cls) => { const max = Math.max(...vals);
    return `<div class="bars ${cls || ""}">${vals.map((v, i) => `<div class="b" title="${labels[i]}: ${fmt(v)}"><i data-h="${Math.round((v / max) * 100)}"></i><span>${labels[i]}</span></div>`).join("")}</div>`; };
  const grow = () => setTimeout(() => main.querySelectorAll(".bars i[data-h]").forEach((b, i) => setTimeout(() => { b.style.height = b.dataset.h + "%"; }, i * 40)), 60);
  const chips = (name, opts) => `<div class="chips" role="group">${opts.map(([k, t, n]) => `<button type="button" data-act="chip" data-arg="${name}:${k}" aria-pressed="${(UI[name] || "all") === k}">${t}${n != null ? `<span class="n">${n}</span>` : ""}</button>`).join("")}</div>`;
  const head = (title, sub, acts) => `<div class="dhead"><div><h1>${title}</h1><p class="sub">${sub}</p></div>${acts ? `<div class="acts">${acts}</div>` : ""}</div>`;
  const empty = (t) => `<p class="empty">${t}</p>`;
  const av = (c) => `<span class="av">${portraitSVG(c.id, c.d)}</span>`;
  const meta = (pairs) => `<div class="mmeta">${pairs.map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join("")}</div>`;
  const row = (act, arg, cells) => `<tr class="rowlink" data-act="${act}" data-arg="${arg}" tabindex="0">${cells}</tr>`;

  /* ----- modal ----- */
  let lastFocus = null;
  const closeModal = () => { const m = $("mback"); if (!m) return; m.remove(); document.body.classList.remove("mopen"); if (lastFocus && lastFocus.isConnected) lastFocus.focus(); };
  const modal = (html, cls) => {
    const had = $("mback"); if (had) had.remove(); else lastFocus = document.activeElement;
    const m = document.createElement("div"); m.className = "mback"; m.id = "mback";
    m.innerHTML = `<div class="modal ${cls || ""}" role="dialog" aria-modal="true" aria-labelledby="mTitle"><button type="button" class="mx" data-act="close" aria-label="Close"><i data-lucide="x"></i></button>${html}</div>`;
    m.addEventListener("mousedown", (e) => { if (e.target === m) closeModal(); });
    document.body.appendChild(m); document.body.classList.add("mopen"); icons();
    const f = m.querySelector(".modal input, .modal select, .modal textarea") || m.querySelector(".mx"); f.focus();
    return m;
  };
  const mcls = role === "creative" ? "parch" : "";
  const printModal = () => { document.body.classList.add("printing"); window.print(); setTimeout(() => document.body.classList.remove("printing"), 300); };

  /* ================= company ================= */
  const CX = { 1: ["Singapore", 4.9, 38, 1200], 2: ["Malaysia", 4.8, 26, 900], 3: ["Singapore", 4.7, 19, 1500], 4: ["Singapore", 4.9, 31, 1800], 5: ["Australia", 4.8, 22, 1300], 6: ["India", 4.7, 40, 800],
    7: ["Indonesia", 4.9, 27, 1100], 8: ["Japan", 5.0, 17, 1400], 9: ["Philippines", 4.6, 14, 1000], 10: ["Singapore", 4.8, 33, 1100], 11: ["Spain", 4.9, 21, 1200], 12: ["Vietnam", 4.7, 24, 950] };
  const BST = { open: ["Open", "gr"], short: ["Shortlisting", "warn"], prog: ["In progress", "blue"], rev: ["In review", "warn"], done: ["Delivered", "ok"] };
  const LST = { active: ["Active", "ok"], renew: ["Renews soon", "warn"], expired: ["Expired", "gr"] };
  const tpl = (i) => ({ title: TEMPLATES[i].title.split(":")[0], owner: TEMPLATES[i].by.id });
  const coSeed = () => ({
    me: nice || "Alex Tan", title: "Procurement lead", org: "Regional bank (sample)", read: false, saved: [2, 8],
    notif: { brief: true, deliv: true, licence: true, invoice: false },
    team: [["Alex Tan", "Procurement lead", "Owner"], ["Priya Nair", "Brand manager", "Editor"], ["Marcus Lim", "Finance", "Billing"]],
    briefs: [
      { id: "BR-121", t: "Employee app icon set", d: "illus", lic: "Standard", mk: "Internal use, Singapore", budget: 6400, due: "2026-11-28", st: "open", short: [], desc: "Forty line icons for the staff app, drawn on the new brand grid, with light and dark versions." },
      { id: "BR-120", t: "Holiday store windows", d: "spatial", lic: "Commissioned", mk: "4 markets, 6 months", budget: 22000, due: "2026-11-05", st: "short", short: [9, 1, 12], desc: "Window displays for four flagship branches that can be stored and reused next year." },
      { id: "BR-118", t: "60-second brand film", d: "film", lic: "Extended", mk: "2 markets, 24 months", budget: 38000, due: "2026-11-14", st: "prog", cr: 4, pc: 65, desc: "A 60-second film for the savings app launch, with 15 and 6-second cut-downs for social." },
      { id: "BR-117", t: "Festive campaign kit adaptation", d: "design", lic: "Extended", mk: "3 brands, Singapore and Malaysia", budget: 9600, due: "2026-10-20", st: "rev", cr: 1, pc: 85, desc: "Adapt the licensed Lunar New Year kit to three of our consumer brands." },
      { id: "BR-115", t: "Onboarding animation series", d: "motion", lic: "Extended", mk: "Global, 24 months", budget: 27500, due: "2026-12-12", st: "prog", cr: 7, pc: 30, desc: "Six short animations that explain the app's main features to new customers." },
      { id: "BR-114", t: "Annual report copy", d: "words", lic: "Commissioned", mk: "Group, all channels", budget: 12000, due: "2026-12-01", st: "prog", cr: 6, pc: 45, desc: "Chairman's letter, business review and section openers for the annual report." },
      { id: "BR-112", t: "Sonic logo", d: "sound", lic: "Exclusive", mk: "APAC, 12 months", budget: 15800, due: "2026-10-09", st: "rev", cr: 5, pc: 92, desc: "A three-second sonic logo for app, TV and branch use, with stems for adaptation." },
      { id: "BR-104", t: "ESG report infographics", d: "illus", lic: "Standard", mk: "Group, 12 months", budget: 7400, due: "2026-08-30", st: "done", cr: 2, pc: 100, desc: "Thirty editable infographics for the sustainability report." },
    ],
    licences: [
      { id: "LX-2041", ...tpl(0), type: "Extended", scope: "3 brands, Singapore and Malaysia", start: "2026-01-12", end: "2027-01-11", st: "active", fee: 5400 },
      { id: "LX-2038", ...tpl(1), type: "Extended", scope: "Global, all channels", start: "2025-10-01", end: "2027-09-30", st: "active", fee: 7200 },
      { id: "LX-2033", ...tpl(5), type: "Exclusive", scope: "APAC retail, no other licensees", start: "2026-03-01", end: "2027-08-31", st: "active", fee: 15600 },
      { id: "LX-2029", ...tpl(3), type: "Standard", scope: "1 brand, app and TV", start: "2025-10-20", end: "2026-10-19", st: "renew", fee: 1500 },
      { id: "LX-2017", ...tpl(7), type: "Standard", scope: "1 brand, report only", start: "2025-06-01", end: "2026-05-31", st: "expired", fee: 1400 },
    ],
    invoices: [
      { id: "INV-0932", date: "2026-09-26", due: "2026-10-26", st: "due", lines: [["Brand film, milestone 2 (Wei Ling Tan)", 12400], ["Sonic logo, final mix (Harbour Sound Co.)", 7900], ["Licence LX-2041, second instalment", 5400], ["Seaport service fee", 1700]] },
      { id: "INV-0917", date: "2026-08-28", due: "2026-09-27", st: "paid", lines: [["Brand film, milestone 1 (Wei Ling Tan)", 12400], ["Onboarding animation, storyboard (Pixel Durian)", 8200], ["Annual report copy, outline (Ravi Menon)", 4800], ["ESG infographics, final (Nadia Rahman)", 5700], ["Seaport service fee", 2000]] },
      { id: "INV-0899", date: "2026-07-29", due: "2026-08-28", st: "paid", lines: [["Licence LX-2033, exclusive (Rattan Revival)", 15600], ["Festive kit adaptation, deposit (Studio Kopitiam)", 4800], ["Seaport service fee", 1400]] },
      { id: "INV-0871", date: "2026-06-27", due: "2026-07-27", st: "paid", lines: [["ESG infographics, deposit (Nadia Rahman)", 1700], ["Licence LX-2038, first instalment", 3600], ["Seaport service fee", 600]] },
    ],
    brand: {
      colors: [["Harbour red", "#B0001C"], ["Deep navy", "#0F2742"], ["Sand", "#E9DCC3"], ["Ink", "#111114"], ["Signal teal", "#1C8C7A"]],
      voice: ["Clear", "Warm", "Confident", "Plain English", "Local, never slang"],
      files: [{ n: "Logo pack (SVG, PNG)", s: "4.2 MB", sh: true }, { n: "Brand guidelines 2026.pdf", s: "18.6 MB", sh: true }, { n: "Photography style guide.pdf", s: "9.1 MB", sh: true }, { n: "Tone of voice.pdf", s: "1.3 MB", sh: false }, { n: "Legal disclaimers and T&Cs.docx", s: "240 KB", sh: false }],
    },
  });
  const inv = (i) => { const sub = i.lines.reduce((a, l) => a + l[1], 0), gst = Math.round(sub * 0.09); return { sub, gst, total: sub + gst }; };
  const projRows = (list) => list.map((b) => { const c = b.cr && cr(b.cr);
    return row("brief", b.id, `<td><div class="who">${c ? av(c) : `<span class="av none"><i data-lucide="users"></i></span>`}<span><b>${esc(b.t)}</b><small>${c ? esc(c.name) : b.short.length ? b.short.length + " shortlisted" : "Not matched yet"} · ${esc(DISC[b.d].label)}</small></span></div></td>
      <td><span class="pill2 ${BST[b.st][1]}">${BST[b.st][0]}</span></td><td>${b.pc ? `<div class="prog"><i style="width:${b.pc}%"></i></div>` : `<span class="muted">-</span>`}</td><td class="muted">${day(b.due)}</td>`); }).join("");
  const projTable = (list) => `<table class="dtable"><thead><tr><th>Project</th><th>Stage</th><th>Progress</th><th>Due</th></tr></thead><tbody>${projRows(list)}</tbody></table>`;
  const licTable = (list) => `<table class="dtable"><thead><tr><th>Licence</th><th>Work</th><th>IP owner</th><th>Status</th></tr></thead><tbody>${list.map((l) =>
    row("lic", l.id, `<td><b>${l.id}</b><small>${l.type} · until ${day(l.end)}</small></td><td>${esc(l.title)}</td><td>${esc(cr(l.owner).name)}</td><td><span class="pill2 ${LST[l.st][1]}">${LST[l.st][0]}</span></td>`)).join("")}</tbody></table>`;
  const invTable = (list) => `<table class="dtable"><thead><tr><th>Invoice</th><th>Issued</th><th>Items</th><th class="r">Total</th><th>Status</th></tr></thead><tbody>${list.map((i) =>
    row("inv", i.id, `<td><b>${i.id}</b></td><td class="muted">${day(i.date)}</td><td class="muted">${i.lines.length}</td><td class="r"><b>${money(inv(i).total)}</b></td><td><span class="pill2 ${i.st === "paid" ? "ok" : "warn"}">${i.st === "paid" ? "Paid" : "Due " + day(i.due)}</span></td>`)).join("")}</tbody></table>`;

  const CO = {
    overview: () => { const act = S.briefs.filter((b) => b.st === "prog" || b.st === "rev"), spend = [18, 22, 26, 21, 29, 31, 24, 33, 27].map((v) => v * 1000);
      const engaged = new Set(S.briefs.filter((b) => b.cr).map((b) => b.cr)).size;
      return head(greet(), "Here's what's happening across your creative work.", `<a class="btn primary" href="#briefs/new"><i data-lucide="plus"></i>New brief</a>`) +
        `<div class="kpis">${kpi("#briefs", "briefcase", "Active projects", act.length, S.briefs.filter((b) => b.st === "open" || b.st === "short").length + " more being matched")}${kpi("#licences", "scroll-text", "Licences in force", S.licences.filter((l) => l.st !== "expired").length, S.licences.filter((l) => l.st === "renew").length + " renew soon")}
        ${kpi("#invoices", "wallet", "Spend this quarter", money(84200), "Within budget")}${kpi("#creatives", "users", "Creatives engaged", engaged, "across " + new Set(S.briefs.filter((b) => b.cr).map((b) => CX[b.cr][0])).size + " countries")}</div>
        <div class="dgrid2"><section class="dcard"><div class="dch"><h2>Active projects</h2><a href="#briefs" class="small">All briefs</a></div>${act.length ? projTable(act) : empty("No active projects.")}</section>
        <section class="dcard"><div class="dch"><h2>Spend this year</h2><span class="small muted">${money(spend.reduce((a, b) => a + b, 0))} so far</span></div>${bars(spend, MONTHS, money)}</section></div>
        <div class="dgrid2 wide1"><section class="dcard"><div class="dch"><h2>Licence register</h2><a href="#licences" class="small">All licences</a></div>${licTable(S.licences.slice(0, 4))}</section>
        <section class="dcard"><div class="dch"><h2>Latest invoices</h2><a href="#invoices" class="small">All invoices</a></div>${invTable(S.invoices.slice(0, 3))}</section></div>`; },

    briefs: () => { const f = UI.bf || "all", list = S.briefs.filter((b) => (f === "all" || b.st === f) && hit(b.id, b.t, DISC[b.d].label, b.cr ? cr(b.cr).name : ""));
      return head("Briefs", "Everything you've asked creatives for, from first post to delivery. Click a brief to act on it.", `<a class="btn primary" href="#briefs/new"><i data-lucide="plus"></i>New brief</a>`) +
        `<section class="dcard"><div class="dch">${chips("bf", [["all", "All", S.briefs.length], ...Object.entries(BST).map(([k, v]) => [k, v[0], S.briefs.filter((b) => b.st === k).length])])}</div>
        ${list.length ? projTable(list) : empty(q ? `No briefs match "${esc(q)}".` : "No briefs here yet.")}</section>`; },

    creatives: () => { const f = UI.cf || "all", list = CREATIVES.filter((c) => (f === "all" || (f === "saved" ? S.saved.includes(c.id) : c.d === f)) && hit(c.name, DISC[c.d].label, CX[c.id][0]));
      return head("Creatives", "Vetted creatives in the Seaport network. Save the ones you like or invite them to a brief.", "") +
        `${chips("cf", [["all", "All"], ["saved", "Saved", S.saved.length], ...Object.entries(DISC).map(([k, v]) => [k, v.label])])}
        <div class="crgrid">${list.map((c) => { const [ctry, rt, n, rate] = CX[c.id], on = S.saved.includes(c.id);
          return `<article class="crcard"><button type="button" class="crpic" data-act="profile" data-arg="${c.id}" aria-label="View ${esc(c.name)}">${portraitSVG(c.id, c.d)}</button>
          <button type="button" class="save" data-act="save" data-arg="${c.id}" aria-pressed="${on}" aria-label="${on ? "Remove from saved" : "Save"} ${esc(c.name)}"><i data-lucide="heart"></i></button>
          <div class="crb"><b>${esc(c.name)}</b><small>${esc(DISC[c.d].label)} · ${ctry}</small><div class="crs"><span><i data-lucide="star"></i>${rt.toFixed(1)}</span><span>${n} projects</span><span>from ${money(rate)}/day</span></div>
          <div class="crbtns"><button type="button" class="btn outline-dark sm" data-act="profile" data-arg="${c.id}">Profile</button><button type="button" class="btn primary sm" data-act="invite" data-arg="${c.id}">Invite to brief</button></div></div></article>`; }).join("") || empty("No creatives match.")}</div>`; },

    licences: () => { const f = UI.lf || "all", list = S.licences.filter((l) => (f === "all" || (f === "exclusive" ? l.type === "Exclusive" : l.st === f)) && hit(l.id, l.title, cr(l.owner).name, l.type, l.scope));
      return head("Licences", "Every licence you hold. The creatives keep the IP; Seaport holds the licensing rights and grants these to you.", `<a class="btn outline-dark" href="seaport-licensing.html"><i data-lucide="info"></i>How licensing works</a>`) +
        `<section class="dcard"><div class="dch">${chips("lf", [["all", "All", S.licences.length], ["active", "Active"], ["renew", "Renews soon"], ["expired", "Expired"], ["exclusive", "Exclusive"]])}</div>${list.length ? licTable(list) : empty("No licences match.")}</section>`; },

    invoices: () => { const due = S.invoices.filter((i) => i.st === "due"), paid = S.invoices.filter((i) => i.st === "paid");
      const list = S.invoices.filter((i) => (UI.inf || "all") === "all" || i.st === UI.inf).filter((i) => hit(i.id, ...i.lines.map((l) => l[0])));
      return head("Invoices", "One monthly invoice covers every creative, licence and fee. Prices include 9% GST.", "") +
        `<div class="kpis three">${kpi("#invoices", "clock", "Outstanding", money(due.reduce((a, i) => a + inv(i).total, 0)), due.length ? "Next due " + day(due[0].due) : "Nothing due")}${kpi("#invoices", "check-circle", "Paid this year", money(paid.reduce((a, i) => a + inv(i).total, 0)), paid.length + " invoices")}${kpi("#licences", "scroll-text", "Of which licences", money(S.licences.reduce((a, l) => a + (l.st !== "expired" ? l.fee : 0), 0)), "across " + S.licences.length + " licences")}</div>
        <section class="dcard"><div class="dch">${chips("inf", [["all", "All"], ["due", "Due"], ["paid", "Paid"]])}</div>${list.length ? invTable(list) : empty("No invoices match.")}</section>`; },

    brand: () => head("Brand hub", "Everything creatives need to stay on brand. You decide which files they can see.", `<label class="btn primary"><i data-lucide="upload"></i>Add a file<input type="file" id="bhFile" hidden></label>`) +
      `<div class="dgrid2 even"><section class="dcard"><div class="dch"><h2>Colours</h2><span class="small muted">Click to copy</span></div><div class="swatches">${S.brand.colors.map(([n, h]) => `<button type="button" class="swatch" data-act="copy" data-arg="${h}"><i style="background:${h}"></i><b>${n}</b><small>${h}</small></button>`).join("")}</div></section>
      <section class="dcard"><div class="dch"><h2>Type and voice</h2></div><div class="typeset"><div><small>Headlines · Inter Tight</small><p class="t1">Money made simple.</p></div><div><small>Body · Inter</small><p class="t2">We write the way we speak to customers in branch: short sentences, no jargon, and always the next step.</p></div></div>
      <div class="voice">${S.brand.voice.map((v) => `<span>${esc(v)}</span>`).join("")}</div></section></div>
      <section class="dcard"><div class="dch"><h2>Files</h2><span class="small muted">${S.brand.files.filter((f) => f.sh).length} of ${S.brand.files.length} shared with creatives</span></div>
      <table class="dtable"><thead><tr><th>File</th><th>Size</th><th class="r">Shared with creatives</th></tr></thead><tbody>${S.brand.files.filter((f) => hit(f.n)).map((f, i) => `<tr><td><div class="who"><span class="av none"><i data-lucide="${/\.pdf$/.test(f.n) ? "file-text" : /\.docx?$/.test(f.n) ? "file-type" : "image"}"></i></span><b>${esc(f.n)}</b></div></td><td class="muted">${esc(f.s)}</td>
      <td class="r"><label class="switch"><input type="checkbox" data-act="share" data-arg="${S.brand.files.indexOf(f)}" ${f.sh ? "checked" : ""} aria-label="Share ${esc(f.n)} with creatives"><span></span></label></td></tr>`).join("")}</tbody></table>
      <p class="fine">Preview: added files are listed by name only and never leave this browser.</p></section>`,

    settings: () => head("Settings", "Your profile, notifications and team.", "") +
      `<div class="dgrid2 even"><section class="dcard"><div class="dch"><h2>Profile</h2></div><form class="mform" id="setForm">
        <label class="full">Your name<input name="me" value="${esc(S.me)}" maxlength="60" required></label><label>Job title<input name="title" value="${esc(S.title)}" maxlength="60"></label><label>Company<input name="org" value="${esc(S.org)}" maxlength="80"></label>
        <fieldset class="full checks"><legend>Email me when</legend>${[["brief", "A creative is shortlisted for my brief"], ["deliv", "Work is delivered for review"], ["licence", "A licence is about to renew"], ["invoice", "An invoice is issued"]].map(([k, t]) => `<label><input type="checkbox" name="${k}" ${S.notif[k] ? "checked" : ""}>${t}</label>`).join("")}</fieldset>
        <div class="mact full"><button class="btn primary">Save changes</button></div></form></section>
      <section class="dcard"><div class="dch"><h2>Team</h2><span class="small muted">${S.team.length} people</span></div><table class="dtable"><tbody>${S.team.map(([n, t, r], i) => `<tr><td><div class="who"><span class="av ini">${esc(n.split(" ").map((w) => w[0]).join("").slice(0, 2))}</span><span><b>${esc(n)}</b><small>${esc(t)}</small></span></div></td><td><span class="pill2 ${r === "Invited" ? "warn" : "gr"}">${esc(r)}</span></td><td class="r">${i ? `<button type="button" class="linkbtn" data-act="rmteam" data-arg="${i}">Remove</button>` : ""}</td></tr>`).join("")}</tbody></table>
        <form class="invite" id="teamForm"><input name="n" placeholder="Name" maxlength="50" required aria-label="Name"><select name="r" aria-label="Access"><option>Editor</option><option>Viewer</option><option>Billing</option></select><button class="btn outline-dark">Invite</button></form>
        <div class="reset"><b>Sample data</b><p>Undo everything you changed in this preview.</p><button type="button" class="btn outline-dark sm" data-act="reset">Reset sample data</button></div></section></div>`,
  };
  const coActs = {
    brief: (id) => { const b = S.briefs.find((x) => x.id === id); if (!b) return; const c = b.cr && cr(b.cr);
      let body = "";
      if (b.st === "open") body = `<div class="msec"><h3>Matching</h3><p>No creatives shortlisted yet. Seaport usually shortlists three within two working days.</p></div><div class="mact"><button type="button" class="btn primary" data-act="doshort" data-arg="${id}"><i data-lucide="sparkles"></i>Shortlist creatives now</button></div>`;
      if (b.st === "short") body = `<div class="msec"><h3>Your shortlist</h3>${b.short.map((k) => { const s = cr(k), [ctry, rt, , rate] = CX[k]; return `<div class="prow">${av(s)}<span><b>${esc(s.name)}</b><small>${esc(DISC[s.d].label)} · ${ctry} · <i data-lucide="star"></i>${rt.toFixed(1)} · from ${money(rate)}/day</small></span><button type="button" class="btn primary sm" data-act="choose" data-arg="${id}:${k}">Choose</button></div>`; }).join("")}</div>`;
      if (b.st === "prog" || b.st === "rev" || b.st === "done") { const ms = [["Brief agreed and contract signed", 1], ["Concepts", 30], ["First draft", 60], ["Final delivery", 90]];
        body = `<div class="msec"><h3>Creative</h3><div class="prow">${av(c)}<span><b>${esc(c.name)}</b><small>${esc(DISC[c.d].label)} · ${CX[c.id][0]}</small></span><button type="button" class="btn outline-dark sm" data-act="msg" data-arg="${esc(c.name)}"><i data-lucide="message-square"></i>Message</button></div></div>
        <div class="msec"><h3>Milestones · ${b.pc}%</h3><div class="prog big"><i style="width:${b.pc}%"></i></div><ul class="miles">${ms.map(([t, p]) => `<li class="${b.pc >= p ? "done" : ""}"><i data-lucide="${b.pc >= p ? "check-circle-2" : "circle"}"></i>${t}</li>`).join("")}</ul></div>`;
        if (b.st === "rev") body += `<div class="note-in"><i data-lucide="inbox"></i>${esc(c.name)} has delivered. Review the files, then approve or ask for changes.</div><div class="mact"><button type="button" class="btn outline-dark" data-act="changes" data-arg="${id}">Ask for changes</button><button type="button" class="btn primary" data-act="approve" data-arg="${id}"><i data-lucide="check"></i>Approve delivery</button></div>`;
        if (b.st === "done") { const l = S.licences.find((x) => x.brief === id); body += `<div class="note-in ok"><i data-lucide="badge-check"></i>Delivered and approved.${l ? ` Licence <a href="#licences/${l.id}">${l.id}</a> was added to your register.` : ""}</div>`; } }
      modal(`<span class="pill2 ${BST[b.st][1]}">${BST[b.st][0]}</span><h2 id="mTitle">${esc(b.t)}</h2><p class="sub">${b.id} · ${esc(b.desc || "")}</p>` +
        meta([["Discipline", esc(DISC[b.d].label)], ["Licence", esc(b.lic)], ["Where it's used", esc(b.mk || "-")], ["Budget", money(b.budget)], ["Due", day(b.due)], ["IP owner", c ? esc(c.name) : "The creative you choose"]]) + body, "wide"); },
    doshort: (id) => { const b = S.briefs.find((x) => x.id === id), pool = CREATIVES.filter((c) => c.d === b.d).concat(CREATIVES.filter((c) => c.d !== b.d));
      b.short = [...new Set([...b.short, ...pool.map((c) => c.id)])].slice(0, 3); b.st = "short"; save(); render(); coActs.brief(id); toast("Three creatives shortlisted"); },
    choose: (arg) => { const [id, k] = arg.split(":"), b = S.briefs.find((x) => x.id === id); b.cr = +k; b.st = "prog"; b.pc = 10; save(); render(); coActs.brief(id); toast(`${cr(+k).name} chosen. Agreement sent for signature (preview).`); },
    approve: (id) => { const b = S.briefs.find((x) => x.id === id); b.st = "done"; b.pc = 100;
      const n = Math.max(...S.licences.map((l) => +l.id.slice(3))) + 1, start = today();
      S.licences.unshift({ id: "LX-" + n, title: b.t, owner: b.cr, type: b.lic === "Commissioned" ? "Commissioned" : b.lic, scope: b.mk || "As briefed", start, end: addMonths(start, 12), st: "active", fee: Math.round(b.budget * 0.15), brief: id });
      save(); render(); coActs.brief(id); toast("Delivery approved. Licence LX-" + n + " issued."); },
    changes: (id) => { const b = S.briefs.find((x) => x.id === id); b.st = "prog"; b.pc = 70; save(); render(); coActs.brief(id); toast("Change request sent to " + cr(b.cr).name); },
    msg: (name) => { modal(`<h2 id="mTitle">Message ${esc(name)}</h2><p class="sub">Messages go through Seaport so the agreement stays the record.</p><form class="mform" id="msgForm"><label class="full">Message<textarea name="m" rows="5" maxlength="1000" required placeholder="Hi, a quick note on the latest draft..."></textarea></label><div class="mact full"><button type="button" class="btn outline-dark" data-act="close">Cancel</button><button class="btn primary">Send</button></div></form>`, mcls);
      $("msgForm").onsubmit = (e) => { e.preventDefault(); closeModal(); toast("Preview: message not sent. Messaging arrives with real accounts."); }; },
    profile: (id) => { const c = cr(+id), [ctry, rt, n, rate] = CX[c.id], works = WORKS.filter((w) => w.by.id === c.id), fws = TEMPLATES.filter((t) => t.by.id === c.id);
      modal(`<div class="phead">${av(c)}<div><h2 id="mTitle">${esc(c.name)}</h2><p class="sub">${esc(DISC[c.d].label)} · ${ctry}</p></div></div>` + meta([["Rating", `★ ${rt.toFixed(1)}`], ["Projects on Seaport", n], ["Day rate from", money(rate)]]) +
        `<div class="msec"><h3>Selected work</h3><div class="thumbs">${[...works, ...fws].slice(0, 3).map((t) => `<div>${coverHTML(t, "")}<small>${esc(t.title)}${t.client ? " · for " + esc(t.client) : " · framework"}</small></div>`).join("") || "<p class='muted'>New to the network.</p>"}</div></div>
        <div class="mact"><button type="button" class="btn outline-dark" data-act="save" data-arg="${c.id}">${S.saved.includes(c.id) ? "Saved" : "Save"}</button><button type="button" class="btn primary" data-act="invite" data-arg="${c.id}">Invite to a brief</button></div>`, "wide"); },
    save: (id) => { id = +id; S.saved = S.saved.includes(id) ? S.saved.filter((x) => x !== id) : [...S.saved, id]; save(); render(); if ($("mback")) coActs.profile(id); toast(S.saved.includes(id) ? "Saved to your list" : "Removed from saved"); },
    invite: (id) => { const c = cr(+id), open = S.briefs.filter((b) => b.st === "open" || b.st === "short");
      modal(`<h2 id="mTitle">Invite ${esc(c.name)}</h2><p class="sub">They'll be added to the brief's shortlist.</p>` + (open.length ? `<form class="mform" id="invForm"><label class="full">Brief<select name="b">${open.map((b) => `<option value="${b.id}">${esc(b.t)} (${b.id})</option>`).join("")}</select></label><div class="mact full"><button type="button" class="btn outline-dark" data-act="close">Cancel</button><button class="btn primary">Add to shortlist</button></div></form>`
        : `<p>You have no briefs being matched right now.</p><div class="mact"><a class="btn primary" href="#briefs/new">Post a brief</a></div>`));
      if ($("invForm")) $("invForm").onsubmit = (e) => { e.preventDefault(); const b = S.briefs.find((x) => x.id === e.target.b.value); if (!b.short.includes(c.id)) b.short.push(c.id); b.st = "short"; save(); closeModal(); render(); toast(`${c.name} added to ${b.id}`); }; },
    lic: (id) => { const l = S.licences.find((x) => x.id === id); if (!l) return; const c = cr(l.owner);
      modal(`<span class="pill2 ${LST[l.st][1]}">${LST[l.st][0]}</span><h2 id="mTitle">${l.id}</h2><p class="sub">${esc(l.title)}</p>` +
        meta([["IP owner", esc(c.name)], ["Licensee", esc(S.org)], ["Licence type", esc(l.type)], ["Scope", esc(l.scope)], ["Term", `${day(l.start)} to ${day(l.end)}`], ["Fee", money(l.fee)], ["Royalty to creative", "50% of the fee"], ["Granted by", "Seaport (exclusive licensing rights)"], ["Register", "Recorded"]]) +
        `<p class="fine">The creative keeps the copyright. Seaport holds the licensing rights under a written exclusive agreement with them and grants this licence to you.</p>
        <div class="mact"><button type="button" class="btn outline-dark" data-act="print"><i data-lucide="printer"></i>Print record</button>${l.st === "active" ? `<button type="button" class="btn primary" data-act="widen" data-arg="${l.id}">Request wider use</button>` : `<button type="button" class="btn primary" data-act="renew" data-arg="${l.id}"><i data-lucide="refresh-cw"></i>Renew for 12 months</button>`}</div>`, "wide"); },
    renew: (id) => { const l = S.licences.find((x) => x.id === id); const base = l.end > today() ? l.end : today(); l.end = addMonths(base, 12); l.st = "active"; save(); render(); coActs.lic(id); toast(`${id} renewed to ${day(l.end)} (preview)`); },
    widen: (id) => { const l = S.licences.find((x) => x.id === id);
      modal(`<h2 id="mTitle">Request wider use</h2><p class="sub">${id} · ${esc(l.title)}. Seaport checks with ${esc(cr(l.owner).name)} and sends you a quote.</p><form class="mform" id="wideForm"><label>Add brands<input name="b" type="number" min="0" max="20" value="1"></label><label>Add markets<input name="m" placeholder="e.g. Thailand"></label><label class="full">Anything else<textarea name="x" rows="3" maxlength="400"></textarea></label><div class="mact full"><button type="button" class="btn outline-dark" data-act="close">Cancel</button><button class="btn primary">Request quote</button></div></form>`);
      $("wideForm").onsubmit = (e) => { e.preventDefault(); closeModal(); toast("Preview: request noted. A real account would send it to Seaport licensing."); }; },
    inv: (id) => { const i = S.invoices.find((x) => x.id === id); if (!i) return; const t = inv(i);
      modal(`<div class="invhead"><div><span class="pill2 ${i.st === "paid" ? "ok" : "warn"}">${i.st === "paid" ? "Paid" : "Due " + day(i.due)}</span><h2 id="mTitle">Invoice ${i.id}</h2><p class="sub">Issued ${day(i.date)} to ${esc(S.org)}</p></div><div class="from"><b>Seaport</b><small>Singapore · sample invoice</small></div></div>
        <table class="dtable lines"><thead><tr><th>Item</th><th class="r">Amount</th></tr></thead><tbody>${i.lines.map(([n, a]) => `<tr><td>${esc(n)}</td><td class="r">${money(a)}</td></tr>`).join("")}</tbody>
        <tfoot><tr><td>Subtotal</td><td class="r">${money(t.sub)}</td></tr><tr><td>GST 9%</td><td class="r">${money(t.gst)}</td></tr><tr class="tot"><td>Total</td><td class="r">${money(t.total)}</td></tr></tfoot></table>
        <div class="mact"><button type="button" class="btn outline-dark" data-act="print"><i data-lucide="printer"></i>Print or save as PDF</button>${i.st === "due" ? `<button type="button" class="btn primary" data-act="paid" data-arg="${i.id}">Record as paid</button>` : ""}</div>`, "wide"); },
    paid: (id) => { S.invoices.find((x) => x.id === id).st = "paid"; save(); render(); coActs.inv(id); toast(id + " recorded as paid (no money moves in this preview)"); },
    copy: (hex) => { try { navigator.clipboard.writeText(hex).then(() => toast(hex + " copied"), () => toast(hex)); } catch (e) { toast(hex); } },
    rmteam: (i) => { S.team.splice(+i, 1); save(); render(); },
  };
  const coForms = {
    newbrief: () => { const d = addMonths(today(), 1);
      modal(`<h2 id="mTitle">New brief</h2><p class="sub">Tell us what you need. Seaport shortlists three creatives, usually within two working days.</p>
      <form class="mform" id="nbForm" novalidate><label class="full">Project title<input name="t" maxlength="80" placeholder="e.g. Launch film for a savings app" required></label>
      <label>Discipline<select name="d">${Object.entries(DISC).map(([k, v]) => `<option value="${k}">${v.label}</option>`).join("")}</select></label>
      <label>Licence type<select name="lic"><option>Standard</option><option selected>Extended</option><option>Exclusive</option><option>Commissioned</option></select></label>
      <label>Where it will be used<input name="mk" maxlength="80" placeholder="e.g. Singapore and Malaysia, 12 months"></label>
      <label>Budget (S$)<input name="budget" type="number" min="500" step="100" placeholder="10000" required></label>
      <label>Deadline<input name="due" type="date" min="${today()}" value="${d}" required></label>
      <label class="full">What you need<textarea name="desc" rows="4" maxlength="600" placeholder="Audience, deliverables, formats, anything to avoid"></textarea></label>
      <p class="err full" id="mErr" role="alert"></p><div class="mact full"><button type="button" class="btn outline-dark" data-act="close">Cancel</button><button class="btn primary">Post brief</button></div></form>`, "wide");
      $("nbForm").onsubmit = (e) => { e.preventDefault(); const f = e.target, t = f.t.value.trim(), budget = +f.budget.value;
        if (!t) { $("mErr").textContent = "Give the brief a title."; f.t.focus(); return; }
        if (!(budget >= 500)) { $("mErr").textContent = "Budgets start at S$500."; f.budget.focus(); return; }
        if (!f.due.value || f.due.value < today()) { $("mErr").textContent = "Pick a deadline in the future."; f.due.focus(); return; }
        const n = Math.max(...S.briefs.map((b) => +b.id.slice(3))) + 1;
        S.briefs.unshift({ id: "BR-" + n, t, d: f.d.value, lic: f.lic.value, mk: f.mk.value.trim(), budget, due: f.due.value, st: "open", short: [], desc: f.desc.value.trim() });
        save(); closeModal(); UI.bf = "all"; if (cur === "briefs") render(); else location.hash = "briefs"; toast(`BR-${n} posted. It's now open for matching.`); }; },
  };

  /* ================= creative (quest-board style) ================= */
  const QST = { open: "Open", applied: "Applied", passed: "Passed" };
  const WST = { applied: "Applied", prog: "In progress", rev: "In review", done: "Delivered" };
  const tilt = (i) => [-2.5, 1.8, -1.2, 2.4, -1.8, 1, -2.2, 1.4, -0.8, 2][i % 10];
  const crSeed = () => ({
    me: nice || "Studio Kopitiam", read: false, disc: "design", country: "Singapore", rate: 1200, avail: true,
    bio: "Brand and packaging studio. We make campaign kits that big brands can adapt without losing the craft.", skills: "Brand identity, Packaging, Campaign kits, Wayfinding",
    method: "Bank transfer (SGD)", sched: "Monthly", ccy: "SGD",
    board: [
      { id: "Q-301", d: "design", t: "Adapt a festive campaign kit", who: "An FMCG group", lic: "Extended licence, 3 brands", fee: 4800, due: "2026-10-24", match: 96, st: "open", desc: "Adapt an existing Lunar New Year kit to three consumer brands: key visual, social sizes and in-store posters." },
      { id: "Q-302", d: "digital", t: "Product launch landing page", who: "A logistics group", lic: "Extended licence", fee: 5200, due: "2026-11-02", match: 88, st: "open", desc: "A landing page system for a same-day delivery launch, built in Figma with a component library." },
      { id: "Q-303", d: "illus", t: "Mural for a head office lobby", who: "A technology company", lic: "Commissioned, exclusive", fee: 14000, due: "2026-12-10", match: 81, st: "open", desc: "An 8-metre lobby mural about the city's shipping history. Concept, artwork and on-site painting." },
      { id: "Q-304", d: "design", t: "Holiday packaging refresh", who: "An F&B brand", lic: "Standard licence", fee: 3600, due: "2026-10-30", match: 79, st: "open", desc: "Seasonal sleeves for a range of six biscuit tins." },
      { id: "Q-309", d: "spatial", t: "Holiday store windows", who: "A department store", lic: "4 markets, 6 months", fee: 22000, due: "2026-11-05", match: 63, st: "open", desc: "Window scheme for four flagship stores that can be reused next year." },
      { id: "Q-307", d: "motion", t: "Onboarding animation series", who: "An insurer", lic: "Global, 24 months", fee: 27500, due: "2026-12-12", match: 58, st: "open", desc: "Six short explainers for new customers, in English and Bahasa Indonesia." },
      { id: "Q-305", d: "film", t: "60-second brand film", who: "A retail bank", lic: "2 markets, 24 months", fee: 38000, due: "2026-11-14", match: 52, st: "open", desc: "Launch film for a savings app with 15 and 6-second cut-downs." },
      { id: "Q-306", d: "sound", t: "Sonic logo", who: "A transport operator", lic: "Exclusive, 12 months", fee: 9800, due: "2026-11-20", match: 47, st: "open", desc: "A three-second sonic logo for stations, trains and the app." },
      { id: "Q-308", d: "words", t: "Keynote speech and script", who: "A listed REIT", lic: "Commissioned", fee: 6200, due: "2026-10-28", match: 44, st: "open", desc: "A 20-minute keynote for the annual investor day, with slide narrative." },
    ],
    work: [
      { id: "W-90", t: "Brand refresh for a clinic group", d: "design", who: "A healthcare group", fee: 9200, due: "2026-11-30", st: "prog", tasks: [["Discovery workshop", 1], ["Logo directions", 0], ["Brand guidelines", 0]] },
      { id: "W-88", t: "Wayfinding for a hawker centre", d: "design", who: "A town council", fee: 12800, due: "2026-10-18", st: "prog", tasks: [["Site survey and sign audit", 1], ["Sign family concepts", 1], ["Artwork for 42 signs", 0], ["Fabrication files", 0]] },
      { id: "W-86", t: "Packaging refresh for a tea range", d: "design", who: "An F&B brand", fee: 7600, due: "2026-10-06", st: "rev", tasks: [["Range architecture", 1], ["Six pack designs", 1], ["Print-ready files", 1]] },
      { id: "W-83", t: "Festive campaign kit: Lunar New Year", d: "design", who: "An FMCG group", fee: 5400, due: "2026-09-12", st: "done", tasks: [["Key visual", 1], ["Social and OOH sizes", 1], ["Copy deck", 1]] },
    ],
    fw: [
      { id: 1, title: "Festive campaign kit: Lunar New Year", d: "design", std: 1800, lic: 7, earned: 2800, st: "live", incl: ["Key visual system in layered files", "Social, email and out-of-home sizes", "Copy deck with bilingual headlines"] },
      { id: 2, title: "Hawker stall menu board system", d: "design", std: 900, lic: 4, earned: 1600, st: "live", incl: ["Menu board layouts", "Price strip templates", "Photo style guide"] },
      { id: 3, title: "Packaging label template set", d: "design", std: 700, lic: 3, earned: 900, st: "live", incl: ["Twelve label dielines", "Nutrition panel styles", "Print specs"] },
    ],
    lics: [
      { id: "LX-2041", fw: 1, who: "An FMCG group", type: "Extended", scope: "3 brands, Singapore and Malaysia", start: "2026-01-12", end: "2027-01-11", fee: 5400 },
      { id: "LX-2036", fw: 1, who: "A retail bank", type: "Standard", scope: "1 brand, social and email", start: "2025-12-01", end: "2026-11-30", fee: 1800 },
      { id: "LX-2031", fw: 2, who: "A hawker centre operator", type: "Standard", scope: "12 stalls, in-store", start: "2026-02-15", end: "2027-02-14", fee: 900 },
      { id: "LX-2027", fw: 2, who: "A food court chain", type: "Extended", scope: "8 outlets, 2 markets", start: "2026-04-01", end: "2027-03-31", fee: 2700 },
      { id: "LX-2019", fw: 3, who: "A craft soda brand", type: "Standard", scope: "1 brand, packaging", start: "2026-05-20", end: "2027-05-19", fee: 700 },
    ],
    news: [
      { id: "N-5", t: "October payout date", d: "2026-09-26", read: false, body: "September royalties and project fees will be paid on 30 September. Statements are on the Madame Fortune notice." },
      { id: "N-4", t: "New: Extended+ licences", d: "2026-09-18", read: false, body: "Companies can now license a framework for regional campaigns across up to five markets. Your royalty share stays at 50%." },
      { id: "N-3", t: "Portfolio reviews are open", d: "2026-09-10", read: true, body: "Book a free 20-minute review with the Seaport curation team. We'll suggest which of your ideas could become frameworks." },
      { id: "N-2", t: "Holiday season briefs", d: "2026-09-02", read: true, body: "Retail and F&B companies are posting holiday briefs early this year. Keep your availability up to date on your Wanted poster." },
    ],
    payouts: [
      { id: "PO-2209", date: "2026-09-30", roy: 1700, fees: 700, st: "sched" }, { id: "PO-2188", date: "2026-08-31", roy: 1300, fees: 1300, st: "paid" },
      { id: "PO-2161", date: "2026-07-31", roy: 1050, fees: 1000, st: "paid" }, { id: "PO-2140", date: "2026-06-30", roy: 1150, fees: 1150, st: "paid" }, { id: "PO-2117", date: "2026-05-31", roy: 900, fees: 850, st: "paid" },
    ],
  });
  const fwObj = (f) => ({ id: f.id, title: f.title, d: f.d, by: cr(1) });
  const note = (b, i, act) => `<button type="button" class="note ${b.st}" style="--r:${tilt(i)}deg" data-act="${act}" data-arg="${b.id}"><span class="pin" aria-hidden="true"></span>
    <span class="dsc">${esc(DISC[b.d].label)}</span><b>${esc(b.t)}</b><span class="who">${esc(b.who)}</span>
    <span class="terms">${money(b.fee)} · due ${day(b.due)}</span>${b.match ? `<span class="mt">${b.match}% match</span>` : ""}${b.st !== "prog" && (WST[b.st] || QST[b.st]) && b.st !== "open" ? `<span class="stamp ${b.st}">${WST[b.st] || QST[b.st]}</span>` : ""}</button>`;
  const royRows = () => S.fw.map((f) => ({ f, gross: f.earned * 2 }));

  /* The creative side is one big notice board. Each notice opens its own page, drawn as a board of the same kind of notice. */
  const CAT = {
    bounties: ["Bounties", "p-bounty", "Paid briefs from companies, matched to your work. Take one and it joins your Call to arms."],
    contracts: ["Call to arms", "p-arms", "Every job you've taken, from application to delivery. Open one to tick off its steps."],
    rewards: ["Rewards", "p-reward", "What your work has earned. You receive 50% of every licence fee."],
    decree: ["Seaport decree", "p-decree", "Your agreement with Seaport, and every licence granted on your work. You keep the IP."],
    help: ["Help needed", "p-help", "Open briefs due within a month. These companies need someone soon."],
    warnings: ["Warnings", "p-warn", "Deadlines coming up on the jobs you're working on."],
    notices: ["Attention", "p-attn", "News and notices from the Seaport team."],
    fortune: ["Madame Fortune", "p-fortune", "Your payouts: what's been paid, and what the cards say is coming."],
    trade: ["For trade", "p-trade", "Your frameworks: small ideas, packaged so many companies can license them."],
    wanted: ["Wanted", "p-wanted", "Your profile, the way companies see it when Seaport shortlists you."],
  };
  const daysTo = (s) => Math.round((new Date(s + "T00:00:00") - new Date(today() + "T00:00:00")) / 864e5);
  const urgent = () => S.board.filter((b) => b.st === "open" && daysTo(b.due) >= 0 && daysTo(b.due) <= 31);
  const deadlines = () => S.work.filter((w) => w.st === "prog" || w.st === "rev").sort((a, b) => a.due.localeCompare(b.due));
  const page = (key, inner, top) => `<a class="nbback" href="#board"><i data-lucide="arrow-left"></i>Back to the notice board</a>
    <div class="nboard"><div class="nbsign"><span>${CAT[key][0]}</span></div><p class="nbintro">${CAT[key][2]}</p>${top || ""}<div class="nbgrid">${inner}</div></div>`;
  const pst = (key, i, act, arg, title, body, extra) => `<button type="button" class="pst ${CAT[key][1]} t${i % 3}" style="--r:${tilt(i)}deg" data-act="${act}" data-arg="${arg}"><span class="nail" aria-hidden="true"></span><span class="ph">${title}</span>${body}${extra || ""}</button>`;
  const none = (t) => `<p class="nbnone">${t}</p>`;
  const briefBody = (b) => `<span class="pk">${esc(DISC[b.d].label)}</span><b class="pt">${esc(b.t)}</b><span class="pb">${esc(b.who)}</span><span class="pf">${money(b.fee)}</span><span class="pb sm">Due ${day(b.due)} · ${b.match}% match</span>`;

  const CR = {
    board: () => { const open = S.board.filter((b) => b.st === "open"), top = [...open].sort((a, b) => b.fee - a.fee)[0], jobs = S.work.filter((w) => w.st === "prog" || w.st === "applied"),
        dl = deadlines()[0], unread = S.news.filter((n) => !n.read), po = S.payouts.find((p) => p.st === "sched") || S.payouts[0], lic = S.fw.reduce((a, f) => a + f.lic, 0);
      const card = (key, cls, r, inner) => `<a class="pst ${CAT[key][1]} ${cls}" href="#${key}" style="--r:${r}deg"><span class="nail" aria-hidden="true"></span>${inner}</a>`;
      return `<div class="nbhello"><h1>${greet()}</h1><p>Pick a notice to open it.</p></div>
      <div class="nboard front"><div class="nbsign big"><span>Notice board</span></div><div class="nbfront">
        ${card("rewards", "g-reward t0", -2, `<span class="ph">Reward</span><span class="pb">Paid to you this year for your work</span><span class="big">${money(16950)}</span><span class="pb">${money(6300)} this quarter, up 18%. You earn on every licence.</span><span class="seal red" aria-hidden="true"></span>`)}
        ${card("contracts", "g-arms t1", 1.5, `<span class="ph">Call to arms</span><span class="pb">${jobs.length} ${jobs.length === 1 ? "job needs" : "jobs need"} you</span>${jobs.slice(0, 2).map((w) => `<span class="pli">${esc(w.t)}</span>`).join("")}<span class="pgo">Report for duty</span>`)}
        ${card("decree", "g-decree t2", -1, `<span class="ph sm">Seaport decree</span><span class="pb">Be it known: you own the IP of all you make. Seaport holds the licensing rights, in writing.</span><span class="pb"><b>${S.lics.length} licences</b> granted on your work</span><span class="seal red sm" aria-hidden="true"></span>`)}
        ${card("wanted", "g-wanted t0", 2, `<span class="ph">Wanted</span><span class="wp">${portraitSVG(1, S.disc)}</span><span class="pb"><b>${esc(S.me)}</b></span><span class="pb sm">${S.avail ? "Available for briefs" : "Fully booked"}</span>`)}
        ${card("trade", "g-trade t1", -1.5, `<span class="ph">For trade</span><span class="pb">${S.fw.length} of your frameworks, open for licence</span><span class="big sm">${lic} sold</span><span class="pgo">See your wares</span>`)}
        ${card("fortune", "g-fortune t2", 1.8, `<span class="ph sm">Madame Fortune</span><span class="pb">The cards foretell</span><span class="big sm">${money(po.roy + po.fees)}</span><span class="pb sm">on ${day(po.date)}</span>`)}
        ${card("help", "g-help t0", -1.2, `<span class="ph">Help needed</span><span class="pb">${urgent().length} ${urgent().length === 1 ? "company needs" : "companies need"} a creative this month</span>${urgent().slice(0, 2).map((b) => `<span class="pli">${esc(b.t)}</span>`).join("")}`)}
        ${card("bounties", "g-bounty t1", 1, `<span class="ph">Bounty</span><span class="pb">${open.length} paid briefs on offer</span>${top ? `<span class="big">${money(top.fee)}</span><span class="pb sm">top bounty: ${esc(top.t)}</span>` : ""}<span class="pgo">Claim a bounty</span>`)}
        ${card("warnings", "g-warn t2", -2.2, `<span class="ph">Warning!</span><span class="pb">${deadlines().length} deadlines ahead</span>${dl ? `<span class="pb"><b>${esc(dl.t)}</b></span><span class="pb sm">${daysTo(dl.due) >= 0 ? "due in " + daysTo(dl.due) + " days" : "overdue"}</span>` : ""}`)}
        ${card("notices", "g-attn t0", 1.2, `<span class="ph">Attention</span><span class="pb">${unread.length ? unread.length + (unread.length === 1 ? " new notice" : " new notices") + " from Seaport" : "No new notices"}</span>${(unread[0] || S.news[0]) ? `<span class="pli">${esc((unread[0] || S.news[0]).t)}</span>` : ""}`)}
      </div></div>`; },

    bounties: () => { const f = UI.qf || "all", discs = [...new Set(S.board.map((b) => b.d))], passed = S.board.filter((b) => b.st === "passed").length;
      const list = S.board.filter((b) => b.st !== "passed" && (f === "all" || (f === "best" ? b.match >= 80 : f === "applied" ? b.st === "applied" : b.d === f)) && hit(b.t, b.who, DISC[b.d].label, b.lic));
      return page("bounties", list.map((b, i) => pst("bounties", i, "quest", b.id, "Bounty", briefBody(b), b.st === "applied" ? `<span class="stamp applied">Applied</span>` : "")).join("") || none("No bounties with this tag."),
        `<div class="nbtools">${chips("qf", [["all", "All"], ["best", "Best matches"], ["applied", "Applied"], ...discs.map((d) => [d, DISC[d].label])])}${passed ? `<button type="button" class="linkbtn" data-act="unpass">Show ${passed} passed</button>` : ""}</div>`); },

    help: () => page("help", urgent().filter((b) => hit(b.t, b.who)).map((b, i) => pst("help", i, "quest", b.id, "Help needed", briefBody(b), `<span class="pb sm red">${daysTo(b.due)} days left</span>`)).join("") || none("No urgent briefs right now.")),

    contracts: () => { const order = { applied: 0, prog: 1, rev: 2, done: 3 };
      return page("contracts", [...S.work].sort((a, b) => order[a.st] - order[b.st]).filter((w) => hit(w.t, w.who)).map((w, i) => { const d = w.tasks.filter((t) => t[1]).length;
        return pst("contracts", i, "work", w.id, "Call to arms", `<span class="pk">${WST[w.st]}</span><b class="pt">${esc(w.t)}</b><span class="pb">${esc(w.who)}</span><span class="pbar"><i style="width:${Math.round((d / w.tasks.length) * 100)}%"></i></span><span class="pb sm">${d} of ${w.tasks.length} steps · due ${day(w.due)}</span>`,
          w.st === "prog" ? "" : `<span class="stamp ${w.st}">${WST[w.st]}</span>`); }).join("") || none("No jobs yet. Claim a bounty to start one.")); },

    warnings: () => page("warnings", deadlines().filter((w) => hit(w.t, w.who)).map((w, i) => { const n = daysTo(w.due);
      return pst("warnings", i, "work", w.id, "Warning!", `<b class="pt">${esc(w.t)}</b><span class="pb">${esc(w.who)}</span><span class="big sm">${n < 0 ? "Overdue" : n + " days"}</span><span class="pb sm">${w.st === "rev" ? "Delivered, waiting on the client" : "until the deadline on " + day(w.due)}</span>`); }).join("") || none("No deadlines ahead. Well done.")),

    rewards: () => { const roy = [1200, 1450, 1300, 1900, 1750, 2300, 2050, 2600, 2400];
      return page("rewards", S.fw.filter((f) => hit(f.title)).map((f, i) => pst("rewards", i, "fw", f.id, "Reward", `<b class="pt">${esc(f.title)}</b><span class="big">${money(f.earned)}</span><span class="pb sm">${f.lic} licences · ${money(f.earned * 2)} in licence fees, half to you</span>`, `<span class="seal red sm" aria-hidden="true"></span>`)).join(""),
        `<div class="sheet wide"><span class="nail" aria-hidden="true"></span><div class="shead"><h2>Ledger of rewards</h2><span>${money(roy.reduce((a, b) => a + b, 0))} this year</span></div>${bars(roy, MONTHS, money, "gold")}<p class="fine">Sample split, modelled on marketplaces that pay authors half of each sale. Your real rate is in your agreement with Seaport.</p></div>`); },

    decree: () => page("decree", S.lics.filter((l) => hit(l.id, l.who, l.type)).map((l, i) => { const f = S.fw.find((x) => x.id === l.fw);
      return pst("decree", i, "clic", l.id, "Licence granted", `<span class="pk">${l.id} · ${esc(l.type)}</span><b class="pt">${esc(f ? f.title : "")}</b><span class="pb">to ${esc(l.who.replace(/^A /, "a ").replace(/^An /, "an "))}</span><span class="pb sm">${esc(l.scope)}</span><span class="pb sm">until ${day(l.end)}</span>`, `<span class="seal red sm" aria-hidden="true"></span>`); }).join(""),
      `<div class="sheet decree"><span class="nail" aria-hidden="true"></span><h2>By order of your agreement</h2><ol><li>You own the copyright in everything you make. It is never transferred to Seaport or to any company.</li><li>You grant Seaport the exclusive right to license your work, in a written agreement you both sign.</li><li>Seaport licenses your work to companies, and records every licence here.</li><li>You receive 50% of every licence fee, paid on your chosen schedule.</li></ol><span class="seal red" aria-hidden="true"></span></div>`),

    notices: () => page("notices", S.news.filter((n) => hit(n.t, n.body)).map((n, i) => pst("notices", i, "news", n.id, "Attention", `<span class="pk">${day(n.d)}</span><b class="pt">${esc(n.t)}</b><span class="pb sm">${esc(n.body.slice(0, 90))}${n.body.length > 90 ? "..." : ""}</span>`, n.read ? "" : `<span class="stamp open">New</span>`)).join("")),

    fortune: () => { const next = S.payouts.find((p) => p.st === "sched");
      return page("fortune", S.payouts.filter((p) => hit(p.id)).map((p, i) => pst("fortune", i, "po", p.id, p.st === "paid" ? "Paid" : "Foretold", `<span class="pk">${p.id}</span><span class="big sm">${money(p.roy + p.fees)}</span><span class="pb sm">${day(p.date)}</span><span class="pb sm">${money(p.roy)} royalties · ${money(p.fees)} fees</span>`)).join(""),
        `<div class="sheet wide"><span class="nail" aria-hidden="true"></span><div class="fsplit"><div><h2>The cards foretell</h2><p>${next ? `Your next payout of <b>${money(next.roy + next.fees)}</b> arrives on <b>${day(next.date)}</b>, by ${esc(S.method)}.` : "No payout is scheduled yet."}</p></div>
        <form class="mform" id="poForm"><label>Method<select name="method">${["Bank transfer (SGD)", "PayNow", "Wise (multi-currency)", "PayPal"].map((m) => `<option ${m === S.method ? "selected" : ""}>${m}</option>`).join("")}</select></label>
        <label>Schedule<select name="sched">${["Monthly", "Quarterly"].map((m) => `<option ${m === S.sched ? "selected" : ""}>${m}</option>`).join("")}</select></label>
        <label>Currency<select name="ccy">${["SGD", "USD", "EUR", "JPY", "MYR"].map((m) => `<option ${m === S.ccy ? "selected" : ""}>${m}</option>`).join("")}</select></label>
        <div class="mact"><button class="btn primary">Save</button></div><p class="fine full">Account details are added in a secure form once real accounts open. None are collected in this preview.</p></form></div></div>`); },

    trade: () => page("trade", S.fw.filter((f) => hit(f.title, DISC[f.d].label)).map((f, i) => pst("trade", i, "fw", f.id, "For trade", `${coverHTML(fwObj(f), "")}<b class="pt">${esc(f.title)}</b><span class="pb sm">From ${money(f.std)} · ${f.lic} licences sold</span>`,
      `<span class="stamp ${f.st}">${{ live: "Live", review: "In review", paused: "Paused" }[f.st]}</span>`)).join("") +
      `<button type="button" class="pst p-new t1" style="--r:1deg" data-act="newfw"><span class="nail" aria-hidden="true"></span><span class="ph">Post a new ware</span><span class="pb">Package a small idea as a framework. You keep the IP.</span><span class="pgo">Submit a framework</span></button>`),

    wanted: () => page("wanted", `<div class="wanted" id="wanted">${wantedHTML()}</div>
      <div class="sheet"><span class="nail" aria-hidden="true"></span><h2>Edit your poster</h2><form class="mform" id="profForm">
      <label class="full">Name or studio<input name="me" value="${esc(S.me)}" maxlength="60" required></label>
      <label>Main discipline<select name="disc">${Object.entries(DISC).map(([k, v]) => `<option value="${k}" ${k === S.disc ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
      <label>Based in<input name="country" value="${esc(S.country)}" maxlength="40"></label>
      <label>Day rate from (S$)<input name="rate" type="number" min="100" step="50" value="${S.rate}"></label>
      <label class="chkrow"><input type="checkbox" name="avail" ${S.avail ? "checked" : ""}>Available for new briefs</label>
      <label class="full">Skills (comma separated)<input name="skills" value="${esc(S.skills)}" maxlength="160"></label>
      <label class="full">Short bio<textarea name="bio" rows="3" maxlength="300">${esc(S.bio)}</textarea></label>
      <div class="mact full"><button type="button" class="btn outline-dark sm" data-act="reset">Reset sample data</button><button class="btn primary">Save poster</button></div></form></div>`),
  };
  function poTable(list) { return `<table class="dtable"><thead><tr><th>Payout</th><th>Date</th><th class="r">Amount</th><th>Status</th></tr></thead><tbody>${list.map((p) =>
    row("po", p.id, `<td><b>${p.id}</b><small>Royalties and project fees</small></td><td class="muted">${day(p.date)}</td><td class="r"><b>${money(p.roy + p.fees)}</b></td><td><span class="pill2 ${p.st === "paid" ? "ok" : "warn"}">${p.st === "paid" ? "Paid" : "Scheduled"}</span></td>`)).join("")}</tbody></table>`; }
  function wantedHTML() { const c = { id: 1, d: S.disc };
    return `<span class="pin" aria-hidden="true"></span><h3>Creative for hire</h3><div class="wpic">${portraitSVG(c.id, c.d)}</div><b class="wname">${esc(S.me)}</b><span class="wdisc">${esc(DISC[S.disc].label)} · ${esc(S.country)}</span>
      <p>${esc(S.bio)}</p><div class="wskills">${S.skills.split(",").map((s) => s.trim()).filter(Boolean).slice(0, 6).map((s) => `<span>${esc(s)}</span>`).join("")}</div>
      <div class="wfoot"><span>From <b>${money(+S.rate || 0)}</b> a day</span><span>★ 4.9 · 38 projects</span></div>${S.avail ? `<span class="stamp open">Available</span>` : `<span class="stamp done">Fully booked</span>`}`; }
  const crActs = {
    quest: (id) => { const b = S.board.find((x) => x.id === id); if (!b) return;
      modal(`<span class="pin" aria-hidden="true"></span><span class="kicker">${esc(DISC[b.d].label)} · ${b.match}% match</span><h2 id="mTitle">${esc(b.t)}</h2><p class="sub">${esc(b.who)} · ${b.id}</p><p>${esc(b.desc)}</p>` +
        meta([["Fee", money(b.fee)], ["Due", day(b.due)], ["Licence", esc(b.lic)], ["Who owns the IP", "You do"], ["Seaport holds", "The licensing rights"], ["Your share of licence fees", "50%"]]) +
        (b.st === "applied" ? `<div class="note-in"><i data-lucide="hourglass"></i>You've applied. The company is shortlisting and Seaport will tell you within five working days.</div><div class="mact"><button type="button" class="btn outline-dark" data-act="withdraw" data-arg="${b.id}">Withdraw</button></div>`
          : `<div class="mact"><button type="button" class="btn outline-dark" data-act="pass" data-arg="${b.id}">Not for me</button><button type="button" class="btn primary" data-act="take" data-arg="${b.id}"><i data-lucide="hand"></i>Take this brief</button></div>`), mcls); },
    take: (id) => { const b = S.board.find((x) => x.id === id); b.st = "applied";
      S.work.unshift({ id: "W-" + id.slice(2), from: id, t: b.t, d: b.d, who: b.who, fee: b.fee, due: b.due, st: "applied", tasks: [["Application sent", 1], ["Shortlisted", 0], ["Agreement signed", 0]] });
      save(); render(); crActs.quest(id); toast("Bounty claimed. It's pinned on your Call to arms."); },
    withdraw: (id) => { const b = S.board.find((x) => x.id === id); b.st = "open"; S.work = S.work.filter((w) => w.from !== id); save(); render(); crActs.quest(id); toast("Application withdrawn"); },
    clic: (id) => { const l = S.lics.find((x) => x.id === id); if (!l) return; const f = S.fw.find((x) => x.id === l.fw);
      modal(`<span class="pin" aria-hidden="true"></span><span class="kicker">Licence granted</span><h2 id="mTitle">${l.id}</h2><p class="sub">${esc(f ? f.title : "")}</p>` +
        meta([["IP owner", esc(S.me) + " (you)"], ["Licensee", esc(l.who)], ["Licence type", esc(l.type)], ["Scope", esc(l.scope)], ["Term", `${day(l.start)} to ${day(l.end)}`], ["Licence fee", money(l.fee)], ["Your 50%", money(l.fee / 2)], ["Granted by", "Seaport"], ["Register", "Recorded"]]) +
        `<div class="mact"><button type="button" class="btn outline-dark" data-act="print"><i data-lucide="printer"></i>Print record</button></div>`, mcls); },
    news: (id) => { const n = S.news.find((x) => x.id === id); if (!n) return; n.read = true; save(); render();
      modal(`<span class="pin" aria-hidden="true"></span><span class="kicker">From Seaport · ${day(n.d)}</span><h2 id="mTitle">${esc(n.t)}</h2><p>${esc(n.body)}</p>`, mcls); },
    newfw: () => crForms.newfw(),
    pass: (id) => { S.board.find((x) => x.id === id).st = "passed"; save(); closeModal(); render(); toast("Brief taken off your board"); },
    unpass: () => { S.board.forEach((b) => { if (b.st === "passed") b.st = "open"; }); save(); render(); },
    work: (id) => { const w = S.work.find((x) => x.id === id); if (!w) return; const done = w.tasks.filter((t) => t[1]).length, pc = Math.round((done / w.tasks.length) * 100);
      modal(`<span class="pin" aria-hidden="true"></span><span class="kicker">${WST[w.st]}</span><h2 id="mTitle">${esc(w.t)}</h2><p class="sub">${esc(w.who)} · ${w.id}</p>` + meta([["Fee", money(w.fee)], ["Due", day(w.due)], ["Progress", pc + "%"]]) +
        `<div class="msec"><h3>Checklist</h3><div class="prog big"><i style="width:${pc}%"></i></div><ul class="tasks">${w.tasks.map(([t, d], i) => `<li><label><input type="checkbox" data-act="task" data-arg="${w.id}:${i}" ${d ? "checked" : ""} ${w.st !== "prog" ? "disabled" : ""}>${esc(t)}</label></li>`).join("")}</ul></div>` +
        (w.st === "applied" ? `<div class="note-in"><i data-lucide="hourglass"></i>Waiting for the company to shortlist.</div><div class="mact"><button type="button" class="btn outline-dark" data-act="withdraw" data-arg="${w.from}">Withdraw application</button></div>`
          : w.st === "prog" ? `<div class="mact"><button type="button" class="btn primary" data-act="deliver" data-arg="${w.id}" ${done < w.tasks.length ? "disabled" : ""}><i data-lucide="send"></i>Send for review</button></div>${done < w.tasks.length ? `<p class="fine r">Tick off every step to send it for review.</p>` : ""}`
          : w.st === "rev" ? `<div class="note-in"><i data-lucide="inbox"></i>Delivered. The company is reviewing your files.</div>` : `<div class="note-in ok"><i data-lucide="badge-check"></i>Approved and paid out with your next payout.</div>`), mcls); },
    task: (arg, el) => { const [id, i] = arg.split(":"), w = S.work.find((x) => x.id === id); w.tasks[+i][1] = el.checked ? 1 : 0; save(); render(); crActs.work(id); },
    deliver: (id) => { S.work.find((x) => x.id === id).st = "rev"; save(); render(); crActs.work(id); toast("Sent for review"); },
    fw: (id) => { const f = S.fw.find((x) => x.id === +id); if (!f) return;
      modal(`<span class="pin" aria-hidden="true"></span><div class="fwhead">${coverHTML(fwObj(f), "")}<div><span class="kicker">${esc(DISC[f.d].label)}</span><h2 id="mTitle">${esc(f.title)}</h2></div></div>` +
        meta([["Standard licence", money(f.std)], ["Extended licence", money(f.std * 3)], ["Licences sold", f.lic], ["You've earned", money(f.earned)], ["IP owner", esc(S.me)], ["Status", { live: "Live", review: "In review", paused: "Paused" }[f.st]]]) +
        `<div class="msec"><h3>What's included</h3><ul class="incl">${f.incl.map((x) => `<li><i data-lucide="check"></i>${esc(x)}</li>`).join("")}</ul></div>` +
        (f.st === "review" ? `<div class="note-in"><i data-lucide="hourglass"></i>Seaport is checking the files. Most frameworks go live within a week.</div>` : `<div class="mact"><button type="button" class="btn outline-dark" data-act="pause" data-arg="${f.id}">${f.st === "paused" ? "Resume new licences" : "Pause new licences"}</button></div>`), mcls); },
    pause: (id) => { const f = S.fw.find((x) => x.id === +id); f.st = f.st === "paused" ? "live" : "paused"; save(); render(); crActs.fw(id); toast(f.st === "paused" ? "Paused. Existing licences continue." : "Live again"); },
    po: (id) => { const p = S.payouts.find((x) => x.id === id); if (!p) return;
      modal(`<span class="pin" aria-hidden="true"></span><span class="kicker">${p.st === "paid" ? "Paid" : "Scheduled"}</span><h2 id="mTitle">Statement ${p.id}</h2><p class="sub">${day(p.date)} · ${esc(S.me)}</p>
        <table class="dtable lines"><tbody><tr><td>Royalties (your 50% of licence fees)</td><td class="r">${money(p.roy)}</td></tr><tr><td>Project fees</td><td class="r">${money(p.fees)}</td></tr></tbody><tfoot><tr class="tot"><td>Paid to you</td><td class="r">${money(p.roy + p.fees)}</td></tr></tfoot></table>
        <div class="mact"><button type="button" class="btn outline-dark" data-act="print"><i data-lucide="printer"></i>Print or save as PDF</button></div>`, mcls); },
  };
  const crForms = {
    newfw: () => { modal(`<span class="pin" aria-hidden="true"></span><h2 id="mTitle">Submit a framework</h2><p class="sub">A small idea, packaged so companies can adapt it. You keep the IP; Seaport licenses it and pays you 50% of every fee.</p>
      <form class="mform" id="fwForm" novalidate><label class="full">Title<input name="t" maxlength="70" placeholder="e.g. Retail promo poster system" required></label>
      <label>Discipline<select name="d">${Object.entries(DISC).map(([k, v]) => `<option value="${k}" ${k === S.disc ? "selected" : ""}>${v.label}</option>`).join("")}</select></label>
      <label>Standard licence price (S$)<input name="std" type="number" min="200" step="50" value="900" required></label>
      <label class="full">What's included<input name="i1" maxlength="80" placeholder="e.g. 12 layered poster templates" required></label><label class="full"><input name="i2" maxlength="80" placeholder="Another item (optional)" aria-label="Another included item"></label>
      <p class="err full" id="mErr" role="alert"></p><div class="mact full"><button type="button" class="btn outline-dark" data-act="close">Cancel</button><button class="btn primary">Submit for review</button></div></form>`, mcls);
      $("fwForm").onsubmit = (e) => { e.preventDefault(); const f = e.target, t = f.t.value.trim(), std = +f.std.value;
        if (!t) { $("mErr").textContent = "Give your framework a title."; f.t.focus(); return; }
        if (!(std >= 200)) { $("mErr").textContent = "The lowest standard price is S$200."; f.std.focus(); return; }
        if (!f.i1.value.trim()) { $("mErr").textContent = "List at least one thing that's included."; f.i1.focus(); return; }
        S.fw.push({ id: Math.max(...S.fw.map((x) => x.id)) + 1, title: t, d: f.d.value, std, lic: 0, earned: 0, st: "review", incl: [f.i1.value.trim(), f.i2.value.trim()].filter(Boolean) });
        save(); closeModal(); if (cur === "trade") render(); else location.hash = "trade"; toast("Submitted. It's pinned on your For trade notice as In review."); }; },
  };

  /* ----- wiring ----- */
  const V = role === "company" ? CO : CR;
  const A = Object.assign({}, role === "company" ? coActs : crActs, {
    close: closeModal, print: printModal,
    chip: (arg) => { const [k, v] = arg.split(":"); UI[k] = v; render(); },
    share: (i, el) => { S.brand.files[+i].sh = el.checked; save(); render(); toast(el.checked ? "Shared with creatives" : "Hidden from creatives"); },
    reset: () => { if (!confirm("Reset all sample data in this preview?")) return; try { localStorage.removeItem(KEY); } catch (e) {} S = role === "company" ? coSeed() : crSeed(); render(); setMe(); toast("Sample data reset"); },
  });
  const OPEN = role === "company" ? { briefs: "brief", licences: "lic", invoices: "inv" } : { bounties: "quest", help: "quest", contracts: "work", warnings: "work", trade: "fw", rewards: "fw", fortune: "po", decree: "clic", notices: "news" };
  const NEW = role === "company" ? { briefs: coForms.newbrief } : { trade: crForms.newfw };
  const HOME = role === "company" ? "overview" : "board";
  const TITLE = role === "creative" ? Object.assign({ board: "Notice board" }, ...Object.entries(CAT).map(([k, v]) => ({ [k]: v[0] }))) : { overview: "Overview", briefs: role === "company" ? "Briefs" : "Quest board", creatives: "Creatives", licences: "Licences", invoices: "Invoices", brand: "Brand hub", settings: "Settings", work: "My work", frameworks: "Frameworks", royalties: "Royalties", payouts: "Payouts", profile: "Profile" };

  function bindForms() {
    if ($("bhFile")) $("bhFile").onchange = (e) => { const f = e.target.files[0]; if (!f) return; const kb = f.size / 1024;
      S.brand.files.push({ n: f.name.slice(0, 80), s: kb > 1024 ? (kb / 1024).toFixed(1) + " MB" : Math.max(1, Math.round(kb)) + " KB", sh: false }); save(); render(); toast("Added to the list (stays in this browser)"); };
    if ($("setForm")) $("setForm").onsubmit = (e) => { e.preventDefault(); const f = e.target; S.me = f.me.value.trim() || S.me; S.title = f.title.value.trim(); S.org = f.org.value.trim() || S.org;
      Object.keys(S.notif).forEach((k) => { S.notif[k] = f[k].checked; }); save(); setMe(); toast("Settings saved"); };
    if ($("teamForm")) $("teamForm").onsubmit = (e) => { e.preventDefault(); const f = e.target, n = f.n.value.trim(); if (!n) return; S.team.push([n, f.r.value, "Invited"]); save(); render(); toast(`Invite for ${n} noted (preview, no email sent)`); };
    if ($("poForm")) $("poForm").onsubmit = (e) => { e.preventDefault(); const f = e.target; S.method = f.method.value; S.sched = f.sched.value; S.ccy = f.ccy.value; save(); toast("Payout preferences saved"); };
    if ($("profForm")) { const f = $("profForm"), sync = () => { S.me = f.me.value.trim() || "Your name"; S.disc = f.disc.value; S.country = f.country.value.trim(); S.rate = +f.rate.value || 0; S.avail = f.avail.checked; S.skills = f.skills.value; S.bio = f.bio.value; $("wanted").innerHTML = wantedHTML(); };
      f.oninput = sync; f.onchange = sync; f.onsubmit = (e) => { e.preventDefault(); sync(); save(); setMe(); toast("Profile saved"); }; }
  }
  function render() { main.innerHTML = V[cur](); icons(); grow(); bindForms(); }
  function route() {
    const [v, sub] = decodeURIComponent(location.hash.slice(1) || "overview").split("/");
    const nv = V[v] ? v : HOME, changed = nv !== cur; cur = nv;
    closeNotes(); if (changed && q && !document.activeElement.matches("#dq")) { q = ""; $("dq").value = ""; }
    document.querySelectorAll(".dside nav a").forEach((a) => { const on = a.dataset.view === cur; a.classList.toggle("on", on); if (on) a.setAttribute("aria-current", "page"); else a.removeAttribute("aria-current"); });
    document.title = `${TITLE[cur]} | Seaport`;
    if ($("crumb")) $("crumb").textContent = cur === HOME ? "" : TITLE[cur];
    closeModal(); render(); if (changed) { window.scrollTo(0, 0); main.focus({ preventScroll: true }); }
    if (sub) { history.replaceState(null, "", "#" + cur); if (sub === "new" && NEW[cur]) NEW[cur](); else if (OPEN[cur]) A[OPEN[cur]](sub); }
  }
  function setMe() {
    if (role === "company") { $("meAv").textContent = S.me.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase(); $("meName").textContent = S.me; $("meOrg").textContent = S.org; }
    else { $("meAv").innerHTML = portraitSVG(1, S.disc); $("meName").textContent = S.me; $("meOrg").textContent = `${DISC[S.disc].label} · ${S.country}`; }
    if (cur === HOME) render();
  }

  // clicks, keyboard and changes on anything with data-act (views and modals)
  document.addEventListener("click", (e) => { const t = e.target.closest("[data-act]"); if (!t || t.matches("input")) return; const fn = A[t.dataset.act]; if (fn) { e.preventDefault(); fn(t.dataset.arg, t, e); } });
  document.addEventListener("change", (e) => { const t = e.target; if (t.matches("input[data-act]") && A[t.dataset.act]) A[t.dataset.act](t.dataset.arg, t, e); });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") { if ($("npanel")) closeNotes(); else closeModal(); }
    if ((e.key === "Enter" || e.key === " ") && e.target.matches("tr.rowlink")) { e.preventDefault(); A[e.target.dataset.act](e.target.dataset.arg, e.target, e); }
  });
  // links inside a modal that point at the current view (e.g. #licences/LX-2042) still need to route
  document.addEventListener("click", (e) => { const a = e.target.closest(".modal a[href^='#']"); if (a && a.getAttribute("href") === location.hash) { e.preventDefault(); route(); } });

  // search filters the list on the current view
  $("dq").addEventListener("input", (e) => { q = e.target.value.trim().toLowerCase();
    if (q && (role === "company" ? ["overview", "settings"] : ["board", "rewards", "wanted", "fortune"]).includes(cur)) { location.hash = role === "company" ? "briefs" : "bounties"; return; } render(); });

  // notifications
  const NOTES = role === "company"
    ? [["inbox", "Harbour Sound Co. delivered the sonic logo", "#briefs/BR-112", "2h"], ["refresh-cw", "LX-2029 renews in 21 days", "#licences/LX-2029", "1d"], ["receipt", "Invoice INV-0932 issued", "#invoices/INV-0932", "2d"]]
    : [["scroll", "New bounty posted: Adapt a festive campaign kit (96% match)", "#bounties/Q-301", "1h"], ["coins", "S$450 royalty from licence LX-2041", "#decree/LX-2041", "1d"], ["wallet", "Payout PO-2209 foretold for 30 Sep", "#fortune/PO-2209", "3d"]];
  function closeNotes() { const p = $("npanel"); if (p) { p.remove(); $("bell").setAttribute("aria-expanded", "false"); } }
  $("bell").addEventListener("click", (e) => { e.stopPropagation(); if ($("npanel")) return closeNotes();
    const p = document.createElement("div"); p.className = "npanel"; p.id = "npanel";
    p.innerHTML = `<div class="nh"><b>Notifications</b><span class="muted">${S.read ? "All read" : NOTES.length + " new"}</span></div>${NOTES.map(([ic, t, h, ago]) => `<a href="${h}" class="${S.read ? "" : "unread"}"><i data-lucide="${ic}"></i><span>${esc(t)}<small>${ago} ago</small></span></a>`).join("")}`;
    $("bell").after(p); $("bell").setAttribute("aria-expanded", "true"); icons(); S.read = true; save(); $("bell").querySelector(".dot")?.remove();
    p.addEventListener("click", (ev) => { if (ev.target.closest("a")) closeNotes(); }); });
  document.addEventListener("click", (e) => { if ($("npanel") && !e.target.closest("#npanel")) closeNotes(); });

  $("logout").addEventListener("click", () => { try { sessionStorage.removeItem("seaport-user"); } catch (e) {} });

  S = Object.assign(role === "company" ? coSeed() : crSeed(), load() || {});
  if (nice) S.me = nice; // greet whoever signed in this session
  $("dq").value = ""; // browsers can restore an old search on reload
  if (S.read) $("bell").querySelector(".dot")?.remove();
  setMe();
  window.addEventListener("hashchange", route);
  route();
}
