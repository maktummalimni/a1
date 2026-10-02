/* Mackinaw Petal — site behaviour and jacket tools.
   Paste a form-handling URL (e.g. Formspree, Getform, Basin) into MP_CONFIG.formEndpoint to receive
   messages by email automatically. While it's empty, the visitor's email app opens with the message filled in. */
window.MP_CONFIG = { formEndpoint: "", email: "hello@mackinawpetal.com" };

(function(){
  "use strict";
  const $ = (s,c=document)=>c.querySelector(s), $$ = (s,c=document)=>Array.from(c.querySelectorAll(s));
  const CFG = window.MP_CONFIG;
  const store = { get(k,d){ try{ const v = localStorage.getItem(k); return v ? JSON.parse(v) : d; }catch(e){ return d; } }, set(k,v){ try{ localStorage.setItem(k, JSON.stringify(v)); }catch(e){} } };
  const validEmail = v => /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(String(v).trim());
  const bad = (el,b) => { const f = el.closest(".fld"); if (f) f.classList.toggle("bad", b); return b; };
  const say = (box,t,k="err",after=false) => { let m = $(".msg", box); if (!m){ m = document.createElement("div"); after ? box.appendChild(m) : box.prepend(m); } m.className = "msg msg-"+k; m.setAttribute("role", k==="err"?"alert":"status"); m.innerHTML = t; };
  const send = async d => { if (!CFG.formEndpoint) return false; try{ const r = await fetch(CFG.formEndpoint,{method:"POST",headers:{"Content-Type":"application/json","Accept":"application/json"},body:JSON.stringify(d)}); return r.ok; }catch(e){ return false; } };

  /* nav */
  const burger = $(".burger"), nav = $(".nav");
  burger?.addEventListener("click", () => { const o = nav.classList.toggle("open"); burger.setAttribute("aria-expanded", o); });
  document.addEventListener("keydown", e => { if (e.key === "Escape"){ nav?.classList.remove("open"); burger?.setAttribute("aria-expanded", false); } });
  $$("[data-year]").forEach(e => e.textContent = new Date().getFullYear());

  /* cookie consent — Google Consent Mode v2 */
  const ck = $(".cookie"), choice = store.get("mp_consent", null);
  const apply = ok => { if (typeof gtag === "function") gtag("consent","update",{analytics_storage:ok?"granted":"denied",ad_storage:ok?"granted":"denied",ad_user_data:ok?"granted":"denied",ad_personalization:ok?"granted":"denied"}); };
  const st = $("#consent-status"), show = c => { if (st) st.textContent = c==="all" ? "Analytics and advertising cookies are allowed." : c==="essential" ? "Only essential storage is active." : "You haven't made a choice yet."; };
  if (choice) apply(choice==="all"); else ck?.classList.add("show"); show(choice);
  $$("[data-consent]").forEach(b => b.addEventListener("click", () => { store.set("mp_consent", b.dataset.consent); apply(b.dataset.consent==="all"); ck?.classList.remove("show"); show(b.dataset.consent); }));
  $$("[data-cookie-settings]").forEach(b => b.addEventListener("click", () => ck?.classList.add("show")));

  /* tabs */
  $$("[role=tablist]").forEach(tl => { const tabs = $$("[role=tab]", tl);
    tabs.forEach((t,i) => { t.addEventListener("click", () => tabs.forEach(x => { const on = x===t; x.setAttribute("aria-selected", on); x.tabIndex = on?0:-1; $("#"+x.getAttribute("aria-controls")).hidden = !on; }));
      t.addEventListener("keydown", e => { if (e.key==="ArrowRight"||e.key==="ArrowLeft"){ const n = tabs[(i+(e.key==="ArrowRight"?1:-1)+tabs.length)%tabs.length]; n.focus(); n.click(); } }); }); });

  /* jacket type filter */
  const tf = $("#type-filter");
  if (tf){ const cards = $$(".type"), cnt = $("#type-count");
    $$("button", tf).forEach(b => b.addEventListener("click", () => { $$("button", tf).forEach(x => x.setAttribute("aria-pressed", x===b)); const f = b.dataset.f; let n = 0;
      cards.forEach(c => { const on = f==="all" || c.dataset.use.split(" ").includes(f); c.hidden = !on; if (on) n++; }); cnt.textContent = `Showing ${n} of ${cards.length} jacket styles`; })); }

  /* layering planner */
  const lp = $("#layer-plan");
  if (lp){
    const r = $("#lp-temp"), out = $("#lp-read"), rain = $("#lp-rain"), wind = $("#lp-wind"), act = $("#lp-active"); let unit = "F";
    const BANDS = [
      [65, "Light layer, if any", ["A breathable tee or shirt","—","An overshirt or denim jacket for the evening"], "Most people are comfortable without a jacket. Carry something light if you'll be out after sunset."],
      [50, "Light jacket weather", ["Tee, shirt or light knit","Optional thin sweater","Denim, bomber, chore coat or trench"], "An unlined or lightly lined jacket is ideal. Choose natural fibers if you run warm."],
      [40, "Midweight jacket", ["Long-sleeve base","Sweater or flannel shirt","Wool shirt-jacket, Mackinaw, field jacket or leather"], "This is classic Mackinaw territory: dense wool blocks wind and stays warm even when a little damp."],
      [32, "Warm coat", ["Long-sleeve base","Wool or fleece mid layer","Wool overcoat or lightweight insulated jacket"], "Add a scarf. A collar that stands up or a hood makes a bigger difference than you'd expect."],
      [15, "Cold-weather insulation", ["Thermal base layer","Fleece or heavy knit","Insulated parka or puffer (down or synthetic)"], "Cover your hands, ears and neck. Look for a hem that seals and cuffs that close."],
      [-99, "Very cold — build a full system", ["Merino or synthetic thermal base","Thick fleece or insulated mid layer","Heavy parka with a hood, below-hip length"], "Limit exposed skin, keep layers dry and plan shorter stretches outdoors."]];
    const run = () => { const v = +r.value; const f = unit==="F" ? v : v*9/5+32; out.textContent = `${v}°${unit}`;
      const b = BANDS.find(x => f >= x[0]); let shell = "";
      if (rain.checked) shell = "Add a waterproof shell or choose a jacket with a waterproof membrane. Wool resists light drizzle, but not a downpour.";
      else if (wind.checked) shell = "Choose a tightly woven or windproof outer layer — wind can make it feel 10°F (5–6°C) colder.";
      const mid = act.checked ? "Skip or thin this layer while moving; carry it for stops." : b[2][1];
      $("#lp-verdict").textContent = b[1];
      $("#lp-layers").innerHTML = [["Base",b[2][0]],["Mid",mid],["Outer",b[2][2]]].map(([k,t])=>`<div class="layer"><small>${k}</small><span>${t}</span></div>`).join("") + (shell ? `<div class="layer"><small>Shell</small><span>${shell}</span></div>` : "");
      $("#lp-note").textContent = b[3]; };
    $$("#lp-unit button").forEach(btn => btn.addEventListener("click", () => { if (btn.dataset.u === unit) return; const v = +r.value;
      unit = btn.dataset.u; $$("#lp-unit button").forEach(x => x.setAttribute("aria-pressed", x===btn));
      if (unit==="C"){ r.min=-25; r.max=30; r.value=Math.round((v-32)*5/9); } else { r.min=-15; r.max=85; r.value=Math.round(v*9/5+32); } run(); }));
    [r,rain,wind,act].forEach(el => el.addEventListener("input", run)); run();
  }

  /* fit calculator */
  const fc = $("#fitcalc");
  if (fc){ let unit = "in"; const inp = $("#fc-chest"), lay = $("#fc-layer");
    const SIZES = [[34,"XS"],[37,"S"],[40,"M"],[43,"L"],[46,"XL"],[49,"XXL"],[99,"3XL"]];
    const run = () => { const v = parseFloat(inp.value); const ins = unit==="in" ? v : v/2.54;
      if (!v || ins < 26 || ins > 64){ $("#fc-out").textContent = "—"; $("#fc-note").textContent = unit==="in" ? "Enter a chest measurement between 26 and 64 inches." : "Enter a chest measurement between 66 and 162 cm."; return; }
      const ease = +lay.value, g = ins + ease, size = SIZES.find(s => ins <= s[0])[1];
      const f = x => unit==="in" ? `${x.toFixed(1)} in` : `${Math.round(x*2.54)} cm`;
      $("#fc-out").textContent = `Garment chest ≈ ${f(g)}`;
      $("#fc-note").textContent = `Look for a pit-to-pit (flat) measurement of about ${f(g/2)}. On a typical unisex chart, a ${f(ins)} chest usually falls around size ${size} — but sizing differs a lot between makers, so always compare against the garment's measurements.`; };
    $$(".seg button", fc).forEach(b => b.addEventListener("click", () => { if (b.dataset.u === unit) return; unit = b.dataset.u; $$(".seg button", fc).forEach(x => x.setAttribute("aria-pressed", x===b));
      if (inp.value) inp.value = unit==="cm" ? Math.round(parseFloat(inp.value)*2.54) : (parseFloat(inp.value)/2.54).toFixed(1); $("#fc-u").textContent = unit; run(); }));
    inp.addEventListener("input", run); lay.addEventListener("change", run); run(); }

  /* care-label symbol decoder */
  const sy = $("#symbols");
  if (sy){
    const tub = '<path d="M5 12l3.5 20h23L35 12"/><path d="M5 12q3.75-4 7.5 0t7.5 0t7.5 0t7.5 0"/>', tri = '<path d="M20 5L36 33H4z"/>', sq = '<rect x="5" y="5" width="30" height="30" rx="2"/>',
      iron = '<path d="M4 31L9 17h19c4 0 7 4 7 14z"/><path d="M13 17v-5h17"/>', circ = '<circle cx="20" cy="20" r="14"/>', x = '<path d="M6 6l28 28M34 6L6 34"/>',
      dot = (n,y=24,x0=20) => Array.from({length:n},(_,i)=>`<circle cx="${x0+(i-(n-1)/2)*6}" cy="${y}" r="1.8" fill="currentColor"/>`).join("");
    const S = [
      ["Machine wash cold", tub+dot(1), "Wash at up to 30°C / 86°F on a normal cycle. The safest setting for most jacket fabrics."],
      ["Machine wash warm", tub+dot(2), "Wash at up to 40°C / 104°F. Common on cotton canvas and some synthetic shells."],
      ["Gentle / delicate cycle", tub+dot(1)+'<path d="M8 36h24M8 39h24"/>', "Two lines under the tub mean a gentle cycle with low spin — typical for technical shells and down."],
      ["Hand wash only", tub+'<path d="M15 26v-7m3 7v-8m3 8v-7m3 7v-5m-12 5c0 3 3 5 6.5 5S27 29 27 26"/>', "Wash by hand in cool or lukewarm water. Press water out — never wring."],
      ["Do not wash", tub+x, "The garment can't be washed with water. Most tailored wool coats and many leathers carry this symbol."],
      ["Any bleach allowed", tri, "Chlorine or oxygen bleach may be used. Rare on outerwear."],
      ["Non-chlorine bleach only", tri+'<path d="M15 31l8-14M19 31l8-14"/>', "Only oxygen-based (color-safe) bleach may be used."],
      ["Do not bleach", tri+x, "No bleach of any kind. The most common bleach symbol on jackets."],
      ["Tumble dry low", sq+'<circle cx="20" cy="20" r="11"/>'+dot(1,20), "Tumble dry on low heat. Down jackets often dry best this way with a few clean tennis balls."],
      ["Do not tumble dry", sq+'<circle cx="20" cy="20" r="11"/>'+x, "Heat and tumbling could shrink, felt or melt the fabric. Air-dry instead."],
      ["Line dry", sq+'<path d="M5 13q15 10 30 0"/>', "Hang to dry, ideally on a wide hanger that supports the shoulders."],
      ["Dry flat", sq+'<path d="M11 20h18"/>', "Lay flat on a towel to dry so heavy, wet fabric doesn't stretch out of shape."],
      ["Iron low heat", iron+dot(1,25,21), "Iron at up to 110°C / 230°F. Use a pressing cloth on dark fabrics to avoid shine."],
      ["Do not iron", iron+x, "Don't iron. Common on nylon shells, coated fabrics and prints."],
      ["Professional dry clean", circ+'<text x="20" y="25.5" text-anchor="middle" font-size="15" font-family="sans-serif" fill="currentColor" stroke="none">P</text>', "Take it to a dry cleaner. The letter tells the cleaner which solvents are safe."],
      ["Do not dry clean", circ+x, "Solvents could damage this garment — often seen on waterproof membranes and some trims."]];
    const svg = p => `<svg viewBox="0 0 40 40" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round" aria-hidden="true">${p}</svg>`;
    sy.innerHTML = S.map((s,i)=>`<button type="button" aria-pressed="${i===0}" data-i="${i}" aria-label="${s[0]}">${svg(s[1])}</button>`).join("");
    const pick = i => { $$("button", sy).forEach(b => b.setAttribute("aria-pressed", +b.dataset.i===i)); $("#sym-out").innerHTML = `${svg(S[i][1])}<div><h3>${S[i][0]}</h3><p>${S[i][2]}</p></div>`; };
    sy.addEventListener("click", e => { const b = e.target.closest("button"); if (b) pick(+b.dataset.i); }); pick(0);
  }

  /* storage checklist */
  const cl = $("#store-list");
  if (cl){ const boxes = $$("input", cl);
    const run = () => { const n = boxes.filter(b=>b.checked).length; $("#store-bar").style.width = (n/boxes.length*100)+"%"; $("#store-count").textContent = n===boxes.length ? "All done — your jackets are ready for the off-season." : `${n} of ${boxes.length} steps done`; };
    boxes.forEach(b => b.addEventListener("change", run)); run(); }

  /* glossary */
  const gi = $("#g-q");
  if (gi){ const terms = $$(".term"), c = $("#g-count");
    const run = () => { const q = gi.value.trim().toLowerCase(); let n = 0; terms.forEach(t => { const on = !q || t.textContent.toLowerCase().includes(q); t.hidden = !on; if (on) n++; }); c.textContent = `${n} ${n===1?"term":"terms"}`; };
    gi.addEventListener("input", run); run(); }

  /* newsletter */
  $$(".newsletter").forEach(f => f.addEventListener("submit", async e => {
    e.preventDefault(); const em = $("input[type=email]", f).value.trim(), box = f.parentElement;
    if (!validEmail(em)) return say(box, "Please enter a valid email address.", "err", true);
    if (await send({_subject:"Newsletter sign-up", email:em})){ say(box, "Thank you — you're on the Seasonal Notes list.", "ok", true); f.reset(); }
    else say(box, `Almost done — <a href="mailto:${CFG.email}?subject=${encodeURIComponent("Newsletter sign-up")}&body=${encodeURIComponent("Please add "+em+" to the Seasonal Notes list.")}" style="font-weight:700">send us a quick email</a> to confirm.`, "info", true);
  }));

  /* contact & enquiry forms */
  $$("form[data-form]").forEach(cf => cf.addEventListener("submit", async e => {
    e.preventDefault(); $(".msg", cf)?.remove(); let ok = true; const g = n => $(`[name="${n}"]`, cf);
    if (bad(g("name"), g("name").value.trim().length < 2)) ok = false;
    if (bad(g("email"), !validEmail(g("email").value))) ok = false;
    if (g("topic") && bad(g("topic"), !g("topic").value)) ok = false;
    if (bad(g("message"), g("message").value.trim().length < 15)) ok = false;
    if (bad(g("agree"), !g("agree").checked)) ok = false;
    if (!ok) return say(cf, "Please check the highlighted fields.");
    const d = {}; $$("input,select,textarea", cf).forEach(el => { if (el.name && el.type !== "checkbox") d[el.name] = el.value.trim(); });
    const label = cf.dataset.form === "enquiry" ? "Service enquiry" : "Website message";
    if (await send({_subject:`${label}: ${d.topic||""}`, ...d})){ cf.reset(); say(cf, "Thank you — your message is with us. We reply within two business days.", "ok"); }
    else { say(cf, "Opening your email app so you can send this message to us…", "info");
      location.href = `mailto:${CFG.email}?subject=${encodeURIComponent(label+": "+(d.topic||""))}&body=${encodeURIComponent(Object.entries(d).map(([k,v])=>k[0].toUpperCase()+k.slice(1)+": "+v).join("\n"))}`; }
  }));
})();
