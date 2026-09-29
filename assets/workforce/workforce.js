/* Seaport Workforce site behaviour: menus, the home audience switch, the relay timeline, pay estimator, FAQ tabs and forms. */
const $ = (id) => document.getElementById(id);
const icons = () => window.lucide && lucide.createIcons();
const toast = (t) => { document.querySelector(".toast")?.remove(); const el = document.createElement("div"); el.className = "toast"; el.setAttribute("role", "status"); el.textContent = t; document.body.appendChild(el); setTimeout(() => el.remove(), 2800); };
const money = (n) => "S$" + Math.round(n).toLocaleString("en-SG");

/* dropdown menus: click or hover on desktop, tap on mobile */
document.querySelectorAll(".dd").forEach((dd) => {
  const a = dd.querySelector(":scope > a");
  const set = (on) => { dd.classList.toggle("open", on); a.setAttribute("aria-expanded", on); };
  a.addEventListener("click", (e) => { if (window.innerWidth > 860 && !dd.classList.contains("open")) { e.preventDefault(); document.querySelectorAll(".dd.open").forEach((o) => o !== dd && o.classList.remove("open")); set(true); } });
  let t; // small delay so the menu doesn't vanish on the way to a sub-item
  dd.addEventListener("mouseenter", () => { if (window.innerWidth <= 860) return; clearTimeout(t); document.querySelectorAll(".dd.open").forEach((o) => o !== dd && o.classList.remove("open")); set(true); });
  dd.addEventListener("mouseleave", () => { if (window.innerWidth <= 860) return; t = setTimeout(() => set(false), 250); });
  dd.addEventListener("keydown", (e) => { if (e.key === "Escape") { set(false); a.focus(); } });
});
document.addEventListener("click", (e) => { if (!e.target.closest(".dd")) document.querySelectorAll(".dd.open").forEach((d) => d.classList.remove("open")); });
const burger = document.querySelector(".burger");
if (burger) burger.onclick = () => { const h = document.querySelector(".hdr"), on = !h.classList.contains("open"); h.classList.toggle("open", on); burger.setAttribute("aria-expanded", on); };

/* home: "I'm looking for work / I'm hiring" switch changes the hero copy and buttons */
const sw = $("aud");
if (sw) {
  const COPY = [
    { h: `Five companies. Fifteen months.<br><em>One real chance.</em>`, p: "Out of work? Seaport places you in five companies for three months each, paid the whole way. Then we train you, keep paying a basic allowance and help you land the job that fits.",
      c: `<a class="btn pri" href="workforce-apply.html#jobseeker">Apply to Seaport</a><a class="btn line" href="workforce-jobseekers.html">How it works for you</a>`, f: ["15", "months of paid work in five different companies"] },
    { h: `See the work first.<br><em>Then decide.</em>`, p: "Host a Seaport participant for three months. Watch real work on your real tasks, score their skills, and hire them the moment you're sure, even mid-rotation, with no contract hire and no long commitment.",
      c: `<a class="btn pri" href="workforce-apply.html#host">Host a participant</a><a class="btn line" href="workforce-employers.html">How hosting works</a>`, f: ["3", "months to see someone's real skills before you hire"] },
  ];
  const tabs = [...sw.querySelectorAll("button")];
  const set = (i) => { sw.dataset.on = i; tabs.forEach((b, k) => { b.setAttribute("aria-selected", k === i); b.tabIndex = k === i ? 0 : -1; });
    const c = COPY[i]; $("heroH").innerHTML = c.h; $("heroP").textContent = c.p; $("heroCta").innerHTML = c.c; $("fNum").textContent = c.f[0]; $("fTxt").textContent = c.f[1]; };
  tabs.forEach((b, i) => { b.onclick = () => set(i); b.onkeydown = (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); set(1 - i); tabs[1 - i].focus(); } }; });
}

/* the relay: pick a leg to see what happens for the participant and the host */
const LEGS = [
  { t: "Rotation 1 · Months 1 to 3", h: "Find your feet", p: ["Start at a host picked for your strongest current skills", "A named buddy at the host and a Seaport coach", "First skills review at week 12"], you: "Paid from day one, with CPF where it applies.", host: "Gets a pre-screened person, and can hire them at any point." },
  { t: "Rotation 2 · Months 4 to 6", h: "Stretch", p: ["A different company, and usually a different kind of team", "Take on tasks one step harder than before", "Second skills review, compared with the first"], you: "Same pay, a new reference, a wider network.", host: "Sees the first host's review before day one." },
  { t: "Rotation 3 · Months 7 to 9", h: "Try a new field", p: ["A sector you haven't worked in, chosen with your coach", "Short on-site training where the host needs it", "Mid-point check-in on the jobs you're aiming for"], you: "Finds out what you enjoy, not just what you've done.", host: "Tests someone new to the sector at no hiring risk." },
  { t: "Rotation 4 · Months 10 to 12", h: "Go deeper", p: ["Back towards your target field, with more responsibility", "Lead a small piece of work end to end", "Fourth review: evidence for interviews"], you: "Proof you can own work, not just join it.", host: "Can offer a job at any point, not only at month three." },
  { t: "Rotation 5 · Months 13 to 15", h: "Audition", p: ["Placed where a real vacancy is likely", "Work as if you already have the job", "Final review completes your Skills Passport"], you: "Five verified reviews from five employers.", host: "The closest thing to a full-length interview." },
  { t: "Cool-down · up to 3 months", h: "Train, rest and land the job", p: ["Skills training aimed at the gaps your five reviews found", "A basic training allowance while you search", "Job matching, with your five hosts getting the first look"], you: "Paid a minimum allowance while you train and apply.", host: "Hires from a pool it has already seen at work." },
];
const relay = $("relay");
if (relay) {
  const legs = [...relay.querySelectorAll(".leg")];
  const show = (i) => { legs.forEach((l, k) => l.setAttribute("aria-pressed", k === i)); const L = LEGS[i];
    $("legT").textContent = L.t; $("legH").textContent = L.h; $("legP").innerHTML = L.p.map((x) => `<li><i data-lucide="check-circle-2"></i>${x}</li>`).join(""); $("legYou").textContent = L.you; $("legHost").textContent = L.host; icons(); };
  legs.forEach((l, i) => { l.onclick = () => show(i); });
  show(0);
}

/* jobseekers: what you could earn across the programme (indicative) */
const calc = $("calc");
if (calc) {
  const R = 2000, C = 800; // indicative monthly allowances
  const upd = () => { const r = +$("cR").value, c = +$("cC").value; $("cRv").textContent = r + (r === 1 ? " rotation" : " rotations") + ` (${r * 3} months)`; $("cCv").textContent = c + (c === 1 ? " month" : " months");
    $("cOut").textContent = money(r * 3 * R + c * C); $("cSub").textContent = `${money(R)} a month on rotation, ${money(C)} a month in cool-down, before CPF. Indicative only.`; };
  calc.addEventListener("input", upd); upd();
}

/* FAQ page tabs */
const ft = document.querySelector(".faqtabs");
if (ft) {
  const btns = [...ft.querySelectorAll("button")];
  const set = (k) => { btns.forEach((b) => b.setAttribute("aria-selected", b.dataset.k === k)); document.querySelectorAll(".faq[data-k]").forEach((f) => { f.hidden = k !== "all" && f.dataset.k !== k; }); };
  btns.forEach((b) => b.onclick = () => set(b.dataset.k));
  if (location.hash === "#employers" || location.hash === "#jobseekers") set(location.hash.slice(1));
}

/* apply page: two forms, no data leaves the browser in this preview */
const t2 = document.querySelector(".tabs2");
if (t2) {
  const btns = [...t2.querySelectorAll("button")];
  const set = (k) => { btns.forEach((b) => b.setAttribute("aria-selected", b.dataset.k === k)); document.querySelectorAll("[data-form]").forEach((f) => { f.hidden = f.dataset.form !== k; }); history.replaceState(null, "", "#" + k); };
  btns.forEach((b) => b.onclick = () => set(b.dataset.k));
  set(location.hash === "#host" ? "host" : "jobseeker");
  document.querySelectorAll("form[data-send]").forEach((f) => f.addEventListener("submit", (e) => {
    e.preventDefault();
    const bad = [...f.elements].find((x) => x.required && (x.type === "checkbox" ? !x.checked : !x.value.trim() || !x.checkValidity()));
    if (bad) { f.querySelector(".err").textContent = bad.type === "checkbox" ? "Please tick the box to continue." : bad.type === "email" ? "Please enter a valid email address." : "Please fill in the fields marked with *."; bad.focus(); return; }
    const who = f.dataset.send === "host" ? (f.company.value || "your company") : (f.name.value.split(" ")[0] || "there");
    f.parentElement.innerHTML = `<div class="done" role="status"><div class="ok"><i data-lucide="check"></i></div><h3>Thanks, ${who.replace(/[<>&"]/g, "")}</h3><p style="color:var(--muted);margin-top:8px">${f.dataset.send === "host" ? "Our partnerships team will call you within two working days to talk through roles and timing." : "A Seaport coach will contact you within five working days to book your skills conversation."}</p>
      <p style="color:var(--muted);font-size:13px;margin-top:14px">Preview: this form isn't connected yet, so nothing was sent.</p><a class="btn line sm" style="margin-top:18px" href="workforce.html">Back to home</a></div>`;
    icons(); window.scrollTo({ top: 0, behavior: "smooth" });
  }));
}
icons();

/* side-scrolling rows: arrow buttons, drag with the mouse, and fade/disable at the ends */
document.querySelectorAll(".hscroll").forEach((row) => {
  const sec = row.closest(".wrap"), btns = sec ? [...sec.querySelectorAll(".sbtn")] : [];
  const step = () => (row.firstElementChild ? row.firstElementChild.getBoundingClientRect().width + 20 : 300);
  const sync = () => { const end = row.scrollLeft + row.clientWidth >= row.scrollWidth - 4;
    row.classList.toggle("at-end", end); btns.forEach((b) => { b.disabled = b.dataset.dir === "-1" ? row.scrollLeft <= 4 : end; }); };
  btns.forEach((b) => b.onclick = () => row.scrollBy({ left: +b.dataset.dir * step() }));
  row.addEventListener("scroll", sync, { passive: true }); window.addEventListener("resize", sync); sync();
  row.addEventListener("keydown", (e) => { if (e.key === "ArrowRight" || e.key === "ArrowLeft") { e.preventDefault(); row.scrollBy({ left: (e.key === "ArrowRight" ? 1 : -1) * step() }); } });
  let down = false, x0 = 0, s0 = 0, moved = false;
  row.addEventListener("pointerdown", (e) => { if (e.pointerType !== "mouse") return; down = true; moved = false; x0 = e.clientX; s0 = row.scrollLeft; });
  window.addEventListener("pointermove", (e) => { if (!down) return; const dx = e.clientX - x0; if (Math.abs(dx) > 4) { moved = true; row.classList.add("dragging"); } row.scrollLeft = s0 - dx; });
  window.addEventListener("pointerup", () => { if (!down) return; down = false; row.classList.remove("dragging"); if (moved) row.scrollBy({ left: 0 }); sync(); });
  row.addEventListener("click", (e) => { if (moved) { e.preventDefault(); e.stopPropagation(); moved = false; } }, true);
});
icons();
