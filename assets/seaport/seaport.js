const $ = (id) => document.getElementById(id);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const money = (n) => "S$" + n.toLocaleString("en-SG");
const icons = () => window.lucide && lucide.createIcons();
let toastT; function toast(t) { let el = document.querySelector(".toast"); if (!el) { el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); document.body.appendChild(el); } el.textContent = t; clearTimeout(toastT); toastT = setTimeout(() => el.remove(), 2600); }

/* ---------- sample data ---------- */
const DISC = {
  design: { label: "Brand and design", c: ["#9C0018", "#3A0A0A"] },
  film: { label: "Film and video", c: ["#3A3129", "#110D0A"] },
  motion: { label: "Motion", c: ["#7A1E5A", "#200817"] },
  sound: { label: "Sound", c: ["#4B2E83", "#140A26"] },
  words: { label: "Writing", c: ["#165932", "#06190E"] },
  illus: { label: "Illustration", c: ["#B4541A", "#3B1A0A"] },
  digital: { label: "Digital", c: ["#2E6B5E", "#0C2420"] },
  spatial: { label: "Retail and spatial", c: ["#8C6A12", "#2E2305"] },
};
const CREATIVES = [
  { id: 1, name: "Studio Kopitiam", d: "design" }, { id: 2, name: "Nadia Rahman", d: "illus" }, { id: 3, name: "Lens & Lorong", d: "film" },
  { id: 4, name: "Wei Ling Tan", d: "film" }, { id: 5, name: "Harbour Sound Co.", d: "sound" }, { id: 6, name: "Ravi Menon", d: "words" },
  { id: 7, name: "Pixel Durian", d: "motion" }, { id: 8, name: "Aiko Tanaka", d: "digital" }, { id: 9, name: "Rattan Revival", d: "spatial" },
  { id: 10, name: "Typeface Kaki", d: "design" }, { id: 11, name: "Sofia Marín", d: "words" }, { id: 12, name: "Grid & Gutter", d: "digital" },
];
const TEMPLATES = [
  ["Festive campaign kit: Lunar New Year", 1, "design", ["Key visual system in layered files", "Social, email and out-of-home sizes", "Copy deck with bilingual headlines"], 1800, 5400],
  ["Employer brand film framework", 4, "film", ["60-second script structure", "Shot list and interview guide", "Edit template with caption styles"], 2400, 7200],
  ["Annual report layout system", 10, "design", ["Grid, type and chart styles", "40 page templates", "Three cover concepts"], 2200, 6600],
  ["Sonic logo starter and audio guide", 5, "sound", ["Three sonic logo directions", "Stems for adaptation", "Usage guidelines"], 1500, 4500],
  ["Product explainer animation", 7, "motion", ["45-second storyboard", "After Effects and Lottie templates", "Voice-over script"], 2000, 6000],
  ["Retail window display system", 9, "spatial", ["Modular display layouts", "Fabrication drawings", "Seasonal swap guide"], 2600, 7800],
  ["Product launch landing page", 8, "digital", ["Figma page system", "Component library", "Launch-day checklist"], 1700, 5100],
  ["ESG report infographic set", 2, "illus", ["30 editable infographics", "Icon set", "Data-to-chart guide"], 1400, 4200],
  ["Internal newsletter system", 6, "words", ["Tone-of-voice guide", "12 issue templates", "Headline formulas"], 900, 2700],
  ["Customer story video format", 3, "film", ["Interview and b-roll plan", "Edit template", "Release form pack"], 2100, 6300],
  ["Trade show graphics kit", 12, "digital", ["Booth wall and counter artwork", "Signage templates", "Print specs"], 1600, 4800],
  ["Keynote speech framework", 11, "words", ["Keynote structure", "Slide narrative template", "Rehearsal notes"], 1200, 3600],
].map((t, i) => ({ id: i + 1, title: t[0], by: CREATIVES.find((c) => c.id === t[1]), d: t[2], incl: t[3], std: t[4], ext: t[5], licences: 3 + ((i * 7) % 19) }));
const ROYALTY = 0.5; // sample creator share, after Envato's flat 50% author fee

/* ---------- portraits (drawn, since this preview has no real photos) ---------- */
function portraitSVG(k, d) {
  const [a, b] = DISC[d].c;
  const skin = ["#F3CFAE", "#E3AE86", "#C98E66", "#9A6242", "#F7DCC0", "#B97A52"][k % 6];
  const hair = ["#1E1A17", "#3B2618", "#6B4423", "#2A2A2E", "#8C5A2B", "#141414"][(k * 5) % 6];
  const hp = [
    `<path d="M32 46 C29 25 43 18 52 19 C65 20 72 30 68 46 C65 35 58 31 50 31 C42 31 36 37 32 46Z" fill="${hair}"/>`,
    `<path d="M30 50 C26 23 44 17 52 19 C67 20 74 32 70 52 L71 72 C66 64 66 54 67 44 C60 34 41 34 33 44 C34 55 33 64 29 72Z" fill="${hair}"/>`,
    `<path d="M32 46 C29 27 43 21 52 22 C65 23 71 31 68 46 C65 36 58 33 50 33 C42 33 36 38 32 46Z" fill="${hair}"/><circle cx="50" cy="19" r="8.5" fill="${hair}"/>`,
    `<path d="M31 43 C31 21 69 21 69 43Z" fill="${b}"/><rect x="29" y="40" width="42" height="5" rx="2.5" fill="${b}"/>`,
    `<path d="M33 42 C33 27 67 27 67 42 C63 35 37 35 33 42Z" fill="${hair}" opacity="0.85"/>`,
  ][(k * 7) % 5];
  const gl = k % 4 === 0 ? `<g fill="none" stroke="#211D17" stroke-width="1.6"><circle cx="43.5" cy="47" r="4.6"/><circle cx="56.5" cy="47" r="4.6"/><path d="M48 47h4"/></g>` : "";
  return `<svg viewBox="0 0 100 100" aria-hidden="true"><rect width="100" height="100" fill="${a}"/><rect width="100" height="100" fill="${b}" opacity="0.45"/>
    <path d="M12 100 C12 79 29 70 50 70 C71 70 88 79 88 100Z" fill="#2C2C31"/>
    <rect x="43" y="58" width="14" height="15" rx="5" fill="${skin}"/><ellipse cx="50" cy="46" rx="17" ry="20" fill="${skin}"/>${hp}
    <circle cx="43.5" cy="47.5" r="1.7" fill="#211D17"/><circle cx="56.5" cy="47.5" r="1.7" fill="#211D17"/>${gl}
    <path d="M44.5 56 Q50 60.5 55.5 56" fill="none" stroke="#211D17" stroke-width="1.6" stroke-linecap="round"/></svg>`;
}
const coverBg = (d) => `background:linear-gradient(160deg,${DISC[d].c[0]},${DISC[d].c[1]})`;

/* ---------- hero ---------- */
function buildHero() {
  const n = CREATIVES.length;
  $("fan").innerHTML = CREATIVES.map((c, i) => `<button class="fcard" style="--a:${(360 / n) * i}deg" aria-label="${esc(c.name)}, ${esc(DISC[c.d].label)}">
      <span class="fface"><b>${esc(c.name)}</b><span class="pic">${portraitSVG(c.id, c.d)}</span></span></button>`).join("");
  $("fan").querySelectorAll(".fcard").forEach((b, i) => {
    const c = CREATIVES[i];
    const show = () => { $("fanNow").textContent = `${c.name}, ${DISC[c.d].label.toLowerCase()}`; };
    b.addEventListener("mouseenter", show); b.addEventListener("focus", show);
    b.addEventListener("mouseleave", () => { $("fanNow").textContent = ""; });
    b.addEventListener("click", () => { location.href = "seaport-library.html?d=" + c.d; });
  });
  if ($("matched")) $("matched").innerHTML = [[4, "Film lead", "ok", "Contracted"], [5, "Sound", "pend", "Licence sent"], [8, "Digital", "pend", "Shortlisted"]].map(([id, role, s, label]) => {
    const c = CREATIVES.find((x) => x.id === id);
    return `<div class="row"><span class="av">${portraitSVG(c.id, c.d)}</span><div>${esc(c.name)}<br><small>${role}</small></div><span class="status ${s}">${label}</span></div>`;
  }).join("");
}

/* ---------- visuals made from the creatives' work ---------- */
const tilesComp = (ids) => ids.map((i) => { const t = TEMPLATES[i]; return `<div class="tile" style="${coverBg(t.d)}"><small>${esc(DISC[t.d].label)}</small>${esc(t.title)}</div>`; }).join("");
const docComp = (title, rows) => `<div class="doc"><b>${title}</b>${rows.map(([a, b]) => `<div><span>${a}</span>${b}</div>`).join("")}</div>`;

/* ---------- engagement models ---------- */
const MODELS = [
  { k: "commission", t: "Commissioned projects", h: "Commission a project from a vetted studio",
    p: "Hand over a brief and we scope it, match the right studio or team, and manage delivery. The creative keeps the IP; you get a licence for the use you need, or you can negotiate a full transfer with them.",
    facts: [["Pricing", "Fixed fee per statement of work"], ["Contract", "Master agreement + SOW"], ["Best for", "Campaigns, rebrands, films"]],
    vis: () => `<div class="comp" style="background:#F6E3E5">${tilesComp([0, 1, 9])}</div>`,
    stories: [["A regional bank launched a brand campaign with studios in two countries in three weeks.", "3 wks", "brief to first assets"], ["A public agency ran 20 commissions with licence terms written into each one.", "20", "commissions, one agreement"]] },
  { k: "team", t: "Dedicated creative team", h: "A standing creative team, without hiring",
    p: "Designers, editors, writers and motion artists on a monthly creative budget, briefed through your brand guidelines. Suited to steady, high-volume work.",
    facts: [["Pricing", "Monthly budget + platform fee"], ["Contract", "Annual term"], ["Best for", "Always-on content"]],
    vis: () => `<div class="comp" style="background:#EFE7F6">${docComp("Team this month", [["Creative lead", "1"], ["Designers", "3"], ["Editor", "1"], ["Budget used", "72%"]])}${tilesComp([4])}</div>`,
    stories: [["A retail group moved its social content to one Seaport team across four markets.", "4", "markets, one team"], ["An insurer cut its creative supplier list down to a single contract.", "1", "contract instead of nine"]] },
  { k: "library", t: "Library licensing", h: "License a framework that already works",
    p: "Pick a framework from the Seaport library and have it adapted to your brand, often by the creative who made it. Many companies can license the same framework, so it costs less than starting from scratch.",
    facts: [["Pricing", "Per licence, or yearly library access"], ["Rights", "Non-exclusive licence"], ["Owner", "The creative"]],
    vis: () => `<div class="comp" style="background:#E3F0EC">${tilesComp([3, 6, 7])}</div>`,
    stories: [["An FMCG group rolled out one festive kit across eleven markets.", "11", "markets on one licence"], ["A telco adapted an explainer framework in ten days.", "10 days", "to adapted video"]] },
  { k: "exclusive", t: "Exclusive licence", h: "Keep a framework to yourself for a term",
    p: "Take a framework out of the library for your category and territory, so no competitor can license it for the term you choose. Ownership stays with the creative.",
    facts: [["Pricing", "Quoted on term and territory"], ["Rights", "Exclusive licence"], ["Owner", "The creative"]],
    vis: () => `<div class="comp" style="background:#F5EEDB">${docComp("Exclusive licence", [["Framework", "Retail window system"], ["Category", "Cosmetics"], ["Territory", "Singapore, UK, Australia"], ["Term", "12 months"]])}${tilesComp([5])}</div>`,
    stories: [["A beauty brand reserved a window display system for its flagship launch.", "12 mo", "category exclusivity"], ["A developer licensed a sales gallery concept for two territories.", "2", "territories reserved"]] },
  { k: "byo", t: "Bring your own creatives", h: "Keep your favourite studios, lose the paperwork",
    p: "Move the agencies and freelancers you already use onto Seaport contracts, licences and payments, so every supplier works on the same terms.",
    facts: [["Pricing", "Platform fee"], ["Contract", "Seaport master agreement"], ["Invoicing", "One invoice"]],
    vis: () => `<div class="comp" style="background:#E6ECF5">${docComp("Supplier onboarding", [["Studios", "6"], ["Freelancers", "8"], ["NDAs signed", "14 of 14"], ["Licence terms", "Standardised"]])}</div>`,
    stories: [["A travel operator brought 14 suppliers onto one invoice.", "14", "suppliers, one invoice"], ["A university standardised licence terms across its agencies.", "100%", "work with written licences"]] },
];
function renderModels() {
  $("mlist").innerHTML = MODELS.map((m, i) => `<li><a href="#m-${m.k}" data-k="${m.k}" class="${i ? "" : "on"}">${m.t}</a></li>`).join("");
  $("mpanels").innerHTML = MODELS.map((m) => `<article class="mp" id="m-${m.k}" aria-labelledby="mt-${m.k}">
    <div class="vis">${m.vis()}</div>
    <div class="body"><h4 id="mt-${m.k}">${m.h}</h4><p>${m.p}</p>
      <div class="facts">${m.facts.map(([a, b]) => `<div><span>${a}</span>${b}</div>`).join("")}</div>
      <a class="link" href="seaport-contact.html">Talk to us about ${m.t.toLowerCase()} <i data-lucide="arrow-right"></i></a>
      <div class="stories">${m.stories.map(([p, n, s]) => `<div class="story"><p>${p}</p><div class="num">${n}<small>${s}</small></div><span class="tag">Sample</span></div>`).join("")}</div>
    </div></article>`).join("");
  // Highlight the model in view in the sticky list, as on Lifted.
  const links = [...$("mlist").querySelectorAll("a")];
  const io = new IntersectionObserver((es) => es.forEach((e) => {
    if (e.isIntersecting) links.forEach((a) => a.classList.toggle("on", a.dataset.k === e.target.id.slice(2)));
  }), { rootMargin: "-45% 0px -50% 0px" });
  document.querySelectorAll(".mp").forEach((el) => io.observe(el));
}

/* ---------- library ---------- */
let filter = "all";
function setFilter(k) { filter = k; renderLibrary(); }
function renderLibrary() {
  const keys = ["all", ...Object.keys(DISC).filter((k) => TEMPLATES.some((t) => t.d === k))];
  $("filters").innerHTML = keys.map((k) => `<button data-k="${k}" aria-pressed="${filter === k}">${k === "all" ? "All" : DISC[k].label}</button>`).join("");
  $("filters").querySelectorAll("button").forEach((b) => b.onclick = () => setFilter(b.dataset.k));
  $("lgrid").innerHTML = TEMPLATES.filter((t) => filter === "all" || t.d === filter).map((t) => `<button class="item" data-id="${t.id}">
      <div class="cov">${coverHTML(t, "")}</div>
      <h4>${esc(t.by.name)}</h4><div class="meta"><span>${t.licences} licences</span><span>from ${money(t.std)}</span></div></button>`).join("");
  $("lgrid").querySelectorAll(".item").forEach((b) => b.onclick = () => openLicence(+b.dataset.id, b));
}
function openLicence(id, from) {
  const t = TEMPLATES.find((x) => x.id === id);
  const tiers = [["Standard licence", "One brand, one campaign or product. Non-exclusive.", t.std], ["Extended licence", "Several brands or markets, or paid distribution. Non-exclusive.", t.ext], ["Exclusive licence", "Removed from the library in your category for 12 months.", t.ext * 3]];
  const scrim = document.createElement("div"); scrim.className = "scrim";
  scrim.innerHTML = `<aside class="drawer" role="dialog" aria-modal="true" aria-labelledby="dTitle">
    <button class="close" aria-label="Close"><i data-lucide="x"></i></button>
    <h3 id="dTitle">${esc(t.title)}</h3>
    <div class="by">Owned by ${esc(t.by.name)} · Licensed through Seaport · ${t.licences} licences so far</div>
    <ul>${t.incl.map((x) => `<li>${esc(x)}</li>`).join("")}<li>Adaptation to your brand by ${esc(t.by.name)}, quoted separately</li></ul>
    <div class="tiers" role="radiogroup" aria-label="Licence">${tiers.map(([n, d, p], i) => `<label><input type="radio" name="tier" value="${i}" ${i ? "" : "checked"}><span><b>${n}</b><small>${d}</small></span><span class="p">${money(p)}</span></label>`).join("")}</div>
    <div class="split" id="split"></div>
    <button class="btn primary" id="req" style="width:100%;justify-content:center;margin-top:18px">Request licence</button>
    <p class="fine" style="margin-top:10px">Sample prices; nothing is charged. The 50/50 split is only an example (it matches Envato's author fee). Seaport sets its own rate.</p>
  </aside>`;
  document.body.appendChild(scrim); icons();
  const draw = () => { const p = tiers[+scrim.querySelector("input:checked").value][2]; const c = Math.round(p * ROYALTY);
    scrim.querySelector("#split").innerHTML = `<b>Where the ${money(p)} goes</b><div class="bar"><i style="width:${ROYALTY * 100}%"></i><i style="width:${(1 - ROYALTY) * 100}%"></i></div><div class="rows"><span>${esc(t.by.name)} ${money(c)}</span><span>Seaport ${money(p - c)}</span></div>`; };
  draw(); scrim.querySelectorAll("input").forEach((r) => r.onchange = draw);
  const close = () => { scrim.remove(); document.removeEventListener("keydown", onKey); from && from.focus(); };
  const onKey = (e) => { if (e.key === "Escape") close(); };
  document.addEventListener("keydown", onKey);
  scrim.addEventListener("click", (e) => { if (e.target === scrim) close(); });
  scrim.querySelector(".close").onclick = close;
  scrim.querySelector("#req").onclick = () => { const n = tiers[+scrim.querySelector("input:checked").value][0]; close(); toast(`${n} requested for ${t.title}. Preview only, nothing was sent.`); };
  scrim.querySelector(".close").focus();
}


/* ---------- creative 30%: covers, gallery, discipline band, collage ---------- */
// One of three cover styles per project, so rows read like different people's work.
function coverHTML(t, cls) {
  const v = (t.id + t.by.id) % 3; const [a] = DISC[t.d].c;
  const inner = v === 2 ? `<div class="mock"><i style="background:${a}"></i><b>${esc(t.title)}</b></div>` : `<small>${esc(DISC[t.d].label)}</small><b>${esc(t.title)}</b>`;
  return `<div class="cv v${v} ${cls || ""}" style="${coverBg(t.d)}"><div class="in">${inner}</div></div>`;
}
// Commissioned work for the gallery: different pieces from the library, so nothing repeats.
// [title, creator id, discipline, commissioned by] (sample)
const WORKS = [
  ["Wayfinding for a hawker centre", 10, "design", "a town council"], ["Launch film for a banking app", 4, "film", "a retail bank"],
  ["Sonic identity for a transport campaign", 5, "sound", "a transport operator"], ["Mascot family for a children's museum", 2, "illus", "a museum"],
  ["Onboarding animation series", 7, "motion", "an insurer"], ["Holiday store windows", 9, "spatial", "a department store"],
  ["Employee app redesign", 8, "digital", "a logistics group"], ["Letter to shareholders", 6, "words", "a listed REIT"],
  ["Heritage food photo series", 3, "film", "a tourism campaign"], ["Packaging refresh for a tea range", 1, "design", "an F&B brand"],
  ["Sustainability report podcast", 11, "words", "an energy company"], ["Trade event microsite", 12, "digital", "a trade association"],
].map((w, i) => ({ id: 100 + i, title: w[0], by: CREATIVES.find((c) => c.id === w[1]), d: w[2], client: w[3] }));
function buildGallery() {
  const tile = (w, i) => { const v = (w.id + w.by.id) % 3;
    return `<div class="gtile ${i % 3 === 1 ? "tall" : ""} cv v${v}" style="${coverBg(w.d)}" tabindex="0" aria-label="${esc(w.title)} by ${esc(w.by.name)}, for ${esc(w.client)}">
      <div class="in">${v === 2 ? `<div class="mock"><i style="background:${DISC[w.d].c[0]}"></i><b>${esc(w.title)}</b></div>` : `<small>${esc(DISC[w.d].label)}</small><b>${esc(w.title)}</b>`}</div>
      <span class="by">${esc(w.by.name)} · for ${esc(w.client)}</span></div>`; };
  const a = WORKS.slice(0, 6), b = WORKS.slice(6);
  // Each row is doubled so the drift loops without a gap.
  $("row1").innerHTML = [...a, ...a].map(tile).join("");
  $("row2").innerHTML = [...b, ...b].map(tile).join("");
}
function buildWords() {
  $("words").innerHTML = Object.values(DISC).map((d) => `<span style="color:${d.c[0] === "#3A3129" ? "#C9B79C" : d.c[0]}">${esc(d.label.split(" ")[0])}</span>`).join("");
}
function buildCollage() {
  $("collage").innerHTML = CREATIVES.slice(0, 9).map((c) => `<div class="pc">${portraitSVG(c.id, c.d)}<span>${esc(c.name)}</span></div>`).join("");
}

/* ---------- contact (preview: nothing is sent) ---------- */
if ($("form")) $("form").addEventListener("submit", (e) => {
  e.preventDefault();
  const f = e.target; const bad = [...f.querySelectorAll("[required]")].find((x) => !x.value.trim() || (x.type === "email" && !x.checkValidity()));
  if (bad) { bad.focus(); toast("Please add your name, a work email and your company."); return; }
  f.reset(); toast("Thanks. On the live site this would reach the Seaport team.");
});

// Each page only has some of these sections; build whichever are present.

/* ---------- lifecycle tabs (home) ----------
   The floating UI cards (ui) are defined but not shown for now.
   Photos: Unsplash (free to use, no attribution required; credited anyway). */
const u = (id) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1100&q=75`;
const LIFE = [
  { t: "Brief", pop: ["file-text", "Brief received"],  icon: "file-text", h: "Brief once, in your brand",
    p: "Tell us the goal, markets and timing. Your brand guidelines and past work are kept on file, so no brief starts from scratch.",
    ul: ["Brief the Seaport team, or start from a library framework", "Brand guidelines and approved assets stored centrally", "Scope and budget agreed before any work starts"],
    img: u("photo-1573167507387-6b4b98cb7c13"), alt: "A woman presenting to colleagues around a meeting table", by: ["Christina @ wocintechchat.com", "https://unsplash.com/photos/people-on-conference-table-looking-at-talking-woman-Q80LYxv_Tbs"],
    ui: () => `<span class="lchip"><i data-lucide="file-text"></i>Brief received</span><span class="lchip"><i data-lucide="palette"></i>Brand guidelines attached</span><span class="lchip"><i data-lucide="badge-check"></i>Budget approved</span>` },
  { t: "Match", pop: ["users", "3 creatives matched"],  icon: "users", h: "Find the right creatives, faster",
    p: "A shortlist of vetted studios and independents for each brief, with availability and licence terms agreed up front.",
    ul: ["Creatives vetted on portfolio, references and delivery", "Shortlists across eight creative disciplines", "Bring studios you already use into the same process"],
    img: u("photo-1632187981988-40f3cbaeef5e"), alt: "A film crew gathered around a camera on set", by: ["Jakob Owens", "https://unsplash.com/photos/xKfS7Hll0Ck"],
    ui: () => `<div class="lcard"><b>Matched creatives</b><div class="ppl">${[3, 7, 1].map((id) => { const c = CREATIVES.find((x) => x.id === id); return `<div class="pp">${portraitSVG(c.id, c.d)}${esc(c.name)}<small>${esc(DISC[c.d].label)}</small></div>`; }).join("")}</div></div><span class="lbtn">Shortlist</span>` },
  { t: "Contract", pop: ["file-signature", "Agreement signed"],  icon: "file-signature", h: "One agreement for every supplier",
    p: "Work runs under a single master agreement with Seaport. Each job adds a statement of work or a licence, never a new contract.",
    ul: ["Master services agreement, signed once", "A statement of work or licence per job", "NDAs with every creative before a brief is shared"],
    img: u("photo-1562564055-71e051d33c19"), alt: "A woman signing a document at a desk", by: ["Gabrielle Henderson", "https://unsplash.com/photos/HJckKnwCXxQ"],
    ui: () => `<div class="lcard"><b>Statement of work SW-118 <span class="status ok">Signed</span></b><div class="r"><span>Client</span>Regional bank</div><div class="r"><span>Creatives</span>Studio Kopitiam, Lens &amp; Lorong</div><div class="r"><span>Under</span>Master agreement MSA-07</div></div>` },
  { t: "License", pop: ["shield-check", "Licence issued"],  icon: "shield-check", h: "Rights you can prove",
    p: "Every deliverable comes with a written licence that names the owner, the scope, the markets and the term.",
    ul: ["Creatives keep the IP; you get the rights you need", "Non-exclusive or exclusive, for a set term", "A record of every licence for audit"],
    img: u("photo-1690733546551-1007bc0a3414"), alt: "Photographs, cut-outs and scissors laid out on a designer's table", by: ["Fiona Murray-deGraaff", "https://unsplash.com/photos/HszbGgaGjOg"],
    ui: () => `<div class="lcard"><b>Licence LX-2041 <span class="status ok">Active</span></b><div class="r"><span>Framework</span>Festive campaign kit</div><div class="r"><span>Owner</span>Studio Kopitiam</div><div class="r"><span>Licensed via</span>Seaport</div><div class="r"><span>Scope</span>3 markets, 12 months</div></div>` },
  { t: "Pay", pop: ["receipt", "Creatives paid"],  icon: "receipt", h: "One invoice, everyone paid",
    p: "You pay Seaport once. We pay the creatives, including a royalty every time their work is licensed.",
    ul: ["One consolidated invoice across suppliers", "Cost-centre and purchase-order references", "Creator royalties paid out automatically"],
    img: u("photo-1752649937951-a2c8a0017a53"), alt: "A smiling artist standing in her painting studio", by: ["Vitaly Gariev", "https://unsplash.com/photos/a-female-artist-stands-in-her-art-studio-pgC_bvEz_XA"],
    ui: () => `<div class="lcard"><b>Invoice INV-0932 <span class="status pend">Due in 30 days</span></b><div class="r"><span>Projects</span>3</div><div class="r"><span>Licences</span>2</div><div class="r"><span>Suppliers covered</span>5</div><div class="bar"><i style="width:50%"></i><i style="width:50%"></i></div><div class="r" style="border:none;padding:0"><span>Creator royalties</span>Seaport fee</div></div>` },
];
let lifeIdx = 0, lifeSeen = false;
// All five steps are built once as slides; the text tabs, arrows and keys just scroll the track.
function renderLife() {
  const track = $("ltrack"), tabs = $("ltabs");
  tabs.innerHTML = LIFE.map((s, i) => `<button role="tab" id="lt-${i}" aria-selected="${i === 0}" aria-controls="ls-${i}" tabindex="${i === 0 ? 0 : -1}">${s.t}</button>`).join("");
  track.innerHTML = LIFE.map((s, i) => `<div class="lpanel" id="ls-${i}" role="tabpanel" aria-labelledby="lt-${i}" aria-roledescription="slide">
    <div class="txt"><div><div class="eb"><i data-lucide="${s.icon}"></i>${s.t}</div><h3>${s.h}</h3><p>${s.p}</p></div>
      <ul>${s.ul.map((x) => `<li><i data-lucide="check"></i>${x}</li>`).join("")}</ul></div>
    <div class="lphoto"><img src="${s.img}" alt="${esc(s.alt)}" loading="lazy" draggable="false">
      <div class="lpop" aria-hidden="true"><span class="pic"><i data-lucide="${s.pop[0]}"></i></span><span class="type" data-text="${esc(s.pop[1])}"></span></div>
      <span class="credit">Photo: <a href="${s.by[1]}" target="_blank" rel="noopener">${esc(s.by[0])}</a> / Unsplash</span></div></div>`).join("");
  icons();
  const step = () => track.children[0].offsetWidth + parseFloat(getComputedStyle(track).columnGap || 0);
  const go = (i, focusTab) => { i = Math.max(0, Math.min(LIFE.length - 1, i)); track.scrollTo({ left: i * step(), behavior: matchMedia("(prefers-reduced-motion: reduce)").matches ? "auto" : "smooth" }); if (focusTab) tabs.children[i].focus(); };
  const mark = () => {
    const i = Math.max(0, Math.min(LIFE.length - 1, Math.round(track.scrollLeft / step())));
    lifeIdx = i;
    [...tabs.children].forEach((b, k) => { b.setAttribute("aria-selected", k === i); b.tabIndex = k === i ? 0 : -1; });
    $("lprev").disabled = i === 0; $("lnext").disabled = i === LIFE.length - 1;
    if (lifeSeen) playPop(track.children[i].querySelector(".lpop"));
  };
  let raf = 0; track.addEventListener("scroll", () => { if (!raf) raf = requestAnimationFrame(() => { raf = 0; mark(); }); }, { passive: true });
  [...tabs.children].forEach((b, i) => {
    b.onclick = () => go(i);
    b.onkeydown = (e) => { const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0; if (d) { e.preventDefault(); go(lifeIdx + d, true); } };
  });
  $("lprev").onclick = () => go(lifeIdx - 1);
  $("lnext").onclick = () => go(lifeIdx + 1);
  // Mouse: drag the slides sideways, like a finger. Trackpads and touch scroll natively.
  let drag = null;
  track.addEventListener("pointerdown", (e) => {
    if (e.pointerType !== "mouse" || e.button !== 0 || e.target.closest("a")) return;
    drag = { x: e.clientX, left: track.scrollLeft, moved: false };
  });
  window.addEventListener("pointermove", (e) => {
    if (!drag) return;
    const dx = e.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 6) return;
    if (!drag.moved) { drag.moved = true; track.classList.add("dragging"); }
    track.scrollLeft = drag.left - dx;
  });
  window.addEventListener("pointerup", (e) => {
    if (!drag) return;
    const d = drag; drag = null;
    if (!d.moved) return;
    track.classList.remove("dragging");
    const dx = e.clientX - d.x, from = Math.round(d.left / step());
    go(Math.abs(dx) > 60 ? from - Math.sign(dx) : from);
  });
  window.addEventListener("resize", () => { track.scrollLeft = lifeIdx * step(); });
  mark();
  onVisible(track, () => { lifeSeen = true; playPop(track.children[lifeIdx].querySelector(".lpop")); });
}


/* ---------- side pop-ups: slide in, icon pops, text types letter by letter ---------- */
const calm = () => matchMedia("(prefers-reduced-motion: reduce)").matches;
// Types el's data-text one character at a time; returns a promise that resolves when done.
function typeText(el, speed = 45) {
  const text = el.dataset.text || ""; clearInterval(el._t);
  if (calm()) { el.textContent = text; return Promise.resolve(); }
  el.textContent = ""; el.classList.add("typing");
  return new Promise((res) => { let n = 0; el._t = setInterval(() => { el.textContent = text.slice(0, ++n); if (n >= text.length) { clearInterval(el._t); el.classList.remove("typing"); res(); } }, speed); });
}
function playPop(pop) {
  if (!pop) return;
  document.querySelectorAll(".lpop.show").forEach((p) => p !== pop && p.classList.remove("show"));
  pop.classList.remove("show"); void pop.offsetWidth; pop.classList.add("show");
  const t = pop.querySelector(".type"); t.textContent = "";
  setTimeout(() => typeText(t, 40), calm() ? 0 : 450);
}
// Runs fn once, the first time el scrolls into view.
function onVisible(el, fn) {
  if (!("IntersectionObserver" in window)) { fn(); return; }
  const io = new IntersectionObserver((es) => { if (es.some((e) => e.isIntersecting)) { io.disconnect(); fn(); } }, { threshold: 0.35 });
  io.observe(el);
}
if ($("gpop")) onVisible($("gpop").closest(".gstage"), () => {
  const g = $("gpop"); g.classList.add("show");
  setTimeout(() => typeText(g.querySelector(".type"), 55).then(() => g.classList.add("done")), calm() ? 0 : 500);
});

if ($("ltabs")) renderLife();
if ($("fan")) {
  buildHero();
  // Scale the fan so the whole ring fits its stage at any window size (it's drawn for 520 x 560).
  const fitFan = () => { const s = document.querySelector(".stage"); const k = Math.min(1, s.clientHeight / 520, s.clientWidth / 560); document.querySelectorAll(".fan, .fan-mid").forEach((el) => el.style.setProperty("--fs", k.toFixed(3))); };
  fitFan(); window.addEventListener("resize", fitFan);
}
if ($("mpanels")) renderModels();
if ($("lgrid")) { const d = new URLSearchParams(location.search).get("d"); if (d && DISC[d]) filter = d; renderLibrary(); }
if ($("howComp")) $("howComp").innerHTML = docComp("Statement of work SW-118", [["Client", "Regional bank"], ["Creatives", "Studio Kopitiam, Lens & Lorong"], ["Licence", "3 markets, 24 months"], ["IP owner", "The creatives"], ["Invoice", "One, monthly"]]) + tilesComp([0]);
if ($("row1")) buildGallery();
if ($("words")) buildWords();
if ($("collage")) buildCollage();
if ($("whyMosaic")) $("whyMosaic").innerHTML = WORKS.slice(0, 6).map((w) => { const v = (w.id + w.by.id) % 3;
  return `<div class="cv v${v}" style="${coverBg(w.d)}"><div class="in">${v === 2 ? `<div class="mock"><i style="background:${DISC[w.d].c[0]}"></i><b>${esc(w.title)}</b></div>` : `<small>${esc(DISC[w.d].label)}</small><b>${esc(w.title)}</b>`}</div></div>`; }).join("");
icons();

/* ---------- nav mega menus: open on hover or keyboard focus, close on leave, Esc or outside click ---------- */
document.querySelectorAll(".dd").forEach((dd) => {
  const top = dd.querySelector(".ddtop"); let t = 0;
  const open = () => { clearTimeout(t); document.querySelectorAll(".dd.open").forEach((o) => o !== dd && close(o)); dd.classList.add("open"); top.setAttribute("aria-expanded", "true"); };
  const close = (el = dd) => { el.classList.remove("open"); el.querySelector(".ddtop").setAttribute("aria-expanded", "false"); };
  dd.addEventListener("mouseenter", open);
  dd.addEventListener("mouseleave", () => { t = setTimeout(() => close(), 140); });
  dd.addEventListener("focusin", open);
  dd.addEventListener("focusout", (e) => { if (!dd.contains(e.relatedTarget)) close(); });
  dd.addEventListener("keydown", (e) => { if (e.key === "Escape") { close(); top.focus(); } });
});
document.addEventListener("click", (e) => { if (!e.target.closest(".dd")) document.querySelectorAll(".dd.open").forEach((o) => { o.classList.remove("open"); o.querySelector(".ddtop").setAttribute("aria-expanded", "false"); }); });

/* ---------- light / dark toggle (the page's <head> applies the saved choice before painting) ---------- */
function syncThemeButtons() {
  const t = document.documentElement.getAttribute("data-theme");
  document.querySelectorAll("[data-set-theme]").forEach((b) => b.setAttribute("aria-pressed", b.dataset.setTheme === t));
}
document.querySelectorAll("[data-set-theme]").forEach((b) => b.addEventListener("click", () => {
  document.documentElement.setAttribute("data-theme", b.dataset.setTheme);
  try { localStorage.setItem("seaport-theme", b.dataset.setTheme); } catch (e) {}
  syncThemeButtons();
}));
syncThemeButtons();

