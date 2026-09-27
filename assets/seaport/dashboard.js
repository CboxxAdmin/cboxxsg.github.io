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

/* ---------- dashboards ---------- */
if ($("dash")) {
  const role = document.body.dataset.role;
  const who = SS.get("seaport-user");
  const nice = who && who !== "sso" ? who.replace(/[._-]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()) : null;
  const h = new Date().getHours();
  $("hello").textContent = `Good ${h < 12 ? "morning" : h < 18 ? "afternoon" : "evening"}${nice ? ", " + nice.split(" ")[0] : ""}`;
  const kpi = (icon, label, val, delta) => `<div class="kpi2"><small><i data-lucide="${icon}"></i>${label}</small><b>${val}</b><span class="delta">${delta}</span></div>`;
  const bars = (el, vals, labels, fmt) => {
    const max = Math.max(...vals);
    $(el).innerHTML = vals.map((v, i) => `<div class="b" title="${labels[i]}: ${fmt(v)}"><i data-h="${Math.round((v / max) * 100)}"></i><span>${labels[i]}</span></div>`).join("");
    setTimeout(() => document.querySelectorAll(`#${el} i`).forEach((b, i) => setTimeout(() => { b.style.height = b.dataset.h + "%"; }, i * 50)), 150);
  };
  const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep"];

  if (role === "company") {
    $("meAv").textContent = (nice || "RB").split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
    $("meName").textContent = nice || "Procurement lead"; $("meOrg").textContent = "Regional bank (sample)";
    $("kpis").innerHTML = kpi("briefcase", "Active projects", "6", "+2 this month") + kpi("scroll-text", "Licences in force", "14", "3 renew soon") +
      kpi("wallet", "Spend this quarter", money(84200), "Within budget") + kpi("users", "Creatives engaged", "11", "across 5 countries");
    const P = [[4, "60-second brand film", "Production", 65, "warn"], [1, "Festive campaign kit adaptation", "Review", 85, "ok"], [7, "Onboarding animation series", "Storyboard", 30, "gr"], [6, "Annual report copy", "Drafting", 45, "gr"], [5, "Sonic logo", "Final mix", 92, "ok"]];
    $("projects").innerHTML = `<table class="dtable"><thead><tr><th>Project</th><th>Stage</th><th>Progress</th></tr></thead><tbody>${P.map(([id, t, st, pc, cl]) => { const c = CREATIVES.find((x) => x.id === id);
      return `<tr><td><div class="who"><span class="av">${portraitSVG(c.id, c.d)}</span><span><b>${esc(t)}</b><small>${esc(c.name)} · ${esc(DISC[c.d].label)}</small></span></div></td><td><span class="pill2 ${cl}">${st}</span></td><td><div class="prog"><i style="width:${pc}%"></i></div></td></tr>`; }).join("")}</tbody></table>`;
    const spend = [18, 22, 26, 21, 29, 31, 24, 33, 27].map((v) => v * 1000);
    bars("spend", spend, MONTHS, money); $("spendTotal").textContent = money(spend.reduce((a, b) => a + b, 0)) + " so far";
    const L = [["LX-2041", 0, "Extended, 3 brands", "ok", "Active"], ["LX-2038", 1, "Global, 24 months", "ok", "Active"], ["LX-2033", 5, "Exclusive, APAC", "red", "Exclusive"], ["LX-2029", 3, "1 brand, 12 months", "warn", "Renews in 21 days"]];
    $("licences").innerHTML = `<table class="dtable"><thead><tr><th>Licence</th><th>Framework</th><th>Owner</th><th>Status</th></tr></thead><tbody>${L.map(([id, ti, sc, cl, st]) => { const t = TEMPLATES[ti];
      return `<tr><td><b>${id}</b><small>${sc}</small></td><td>${esc(t.title.split(":")[0])}</td><td>${esc(t.by.name)}</td><td><span class="pill2 ${cl}">${st}</span></td></tr>`; }).join("")}</tbody></table>`;
    const I = [["INV-0932", "Sep 2026", 27400, "warn", "Due in 30 days"], ["INV-0917", "Aug 2026", 33100, "ok", "Paid"], ["INV-0899", "Jul 2026", 24300, "ok", "Paid"]];
    $("invoices").innerHTML = `<table class="dtable"><tbody>${I.map(([n, m, a, cl, st]) => `<tr><td><b>${n}</b><small>${m} · one invoice, all suppliers</small></td><td style="text-align:right"><b>${money(a)}</b><span class="pill2 ${cl}">${st}</span></td></tr>`).join("")}</tbody></table>`;
  } else {
    const me = CREATIVES[0];
    $("meAv").innerHTML = portraitSVG(me.id, me.d);
    $("meName").textContent = nice || me.name; $("meOrg").textContent = "Brand and design · Singapore";
    $("kpis").innerHTML = kpi("coins", "Royalties this quarter", money(6300), "+18% on last quarter") + kpi("scroll-text", "Active licences", "7", "2 new this month") +
      kpi("clipboard-list", "Briefs matched", "4", "2 closing this week") + kpi("eye", "Profile views", "312", "+41 this week");
    const roy = [1200, 1450, 1300, 1900, 1750, 2300, 2050, 2600, 2400];
    bars("royalties", roy, MONTHS, money); $("royTotal").textContent = money(roy.reduce((a, b) => a + b, 0)) + " this year";
    const B = [["design", "palette", "Adapt a festive campaign kit", "For an FMCG group · Extended licence, 3 brands", "96% match"], ["digital", "layout-template", "Product launch landing page", "For a logistics group · Extended licence", "88% match"], ["illus", "pen-tool", "Mural for a head office lobby", "For a technology company · Commissioned", "81% match"], ["design", "palette", "Holiday packaging refresh", "For an F&B brand · Standard licence", "79% match"]];
    $("matched").innerHTML = B.map(([d, ic, t, s, m]) => `<div class="brow"><span class="ic" style="background:${DISC[d].c[0]}"><i data-lucide="${ic}"></i></span><span class="t"><b>${esc(t)}</b><small>${esc(s)}</small></span><span class="match">${m}</span></div>`).join("");
    $("frameworks").innerHTML = [0, 2, 10].map((i, k) => { const t = TEMPLATES[i]; return `<div class="fw">${coverHTML(t, "")}<div class="meta"><b>${[7, 4, 3][k]} licences</b><span>${money([2800, 1600, 900][k])}</span></div></div>`; }).join("");
    const PO = [["PO-2209", "Sep 2026", 2400, "warn", "Scheduled"], ["PO-2188", "Aug 2026", 2600, "ok", "Paid"], ["PO-2161", "Jul 2026", 2050, "ok", "Paid"]];
    $("payouts").innerHTML = `<table class="dtable"><tbody>${PO.map(([n, m, a, cl, st]) => `<tr><td><b>${n}</b><small>${m} · royalties and project fees</small></td><td style="text-align:right"><b>${money(a)}</b><span class="pill2 ${cl}">${st}</span></td></tr>`).join("")}</tbody></table>`;
  }
  $("logout").addEventListener("click", () => { try { sessionStorage.removeItem("seaport-user"); } catch (e) {} });
  icons();
}
