(() => {
  "use strict";

  // Relative path: works at the site root and under a GitHub Pages subpath (user.github.io/repo/).
  const DATA_URL = "./gemini-code-1791389610349.json";

  // One colour per track so the five team members' lanes are easy to tell apart.
  const TRACK_STYLES = [
    "border-sky-400 bg-sky-50 text-sky-900",
    "border-violet-400 bg-violet-50 text-violet-900",
    "border-emerald-400 bg-emerald-50 text-emerald-900",
    "border-amber-400 bg-amber-50 text-amber-900",
    "border-rose-400 bg-rose-50 text-rose-900",
  ];

  const $ = (id) => document.getElementById(id);
  const esc = (s) =>
    String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
  const asArray = (v) => (Array.isArray(v) ? v : v ? [v] : []);

  // The source text contains "[cite: 12, 14]" markers; hide them on screen (the JSON file is untouched).
  const clean = (s) => String(s ?? "").replace(/\s*\[cite:[^\]]*\]/gi, "").replace(/\s+/g, " ").trim();

  // "Role: responsibility" -> ["Role", "responsibility"]; no colon -> ["", whole text]
  const splitFirst = (s) => {
    const i = s.indexOf(":");
    return i > 0 ? [s.slice(0, i).trim(), s.slice(i + 1).trim()] : ["", s];
  };

  // Split on commas that are not inside parentheses.
  const splitList = (s) => {
    const out = [];
    let depth = 0, cur = "";
    for (const ch of s) {
      if (ch === "(") depth++;
      if (ch === ")") depth = Math.max(0, depth - 1);
      if (ch === "," && depth === 0) { out.push(cur); cur = ""; } else cur += ch;
    }
    out.push(cur);
    return out.map((x) => x.trim().replace(/\.$/, "")).filter(Boolean);
  };

  function normalize(p, i) {
    const hw = clean(p.hardware_components);
    const isSoftware = /^software-based/i.test(hw);
    return {
      n: i + 1,
      title: clean(p.title),
      category: clean(p.category),
      source: clean(p.source),
      reference: clean(p.reference),
      description: clean(p.description),
      hardware: hw,
      isSoftware,
      softwareNote: isSoftware ? hw.replace(/^software-based\.?\s*/i, "").replace(/^\(|\)\.?$/g, "").trim() : "",
      tracks: asArray(p.team_tracks).map(clean),
      risks: clean(p.potential_risks),
      contribution: clean(p.added_contribution),
      steps: asArray(p.steps_to_goal).map(clean),
    };
  }

  const section = (label, meta, body) => `
    <details class="group border-t border-slate-200">
      <summary class="flex cursor-pointer items-center justify-between gap-3 py-3 text-sm font-semibold text-slate-800 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/40">
        <span>${label}</span>
        <span class="flex items-center gap-2 text-xs font-normal text-slate-500">${meta}
          <svg class="h-4 w-4 transition-transform group-open:rotate-180" viewBox="0 0 20 20" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="m5 8 5 5 5-5" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </span>
      </summary>
      <div class="pb-4">${body}</div>
    </details>`;

  function renderCard(p) {
    const [a, b] = splitFirst(p.title);
    const name = a || b;
    const subtitle = a ? b : "";

    const badge = p.isSoftware
      ? `<span class="shrink-0 rounded-full bg-teal-50 px-2.5 py-1 text-xs font-semibold text-teal-800 ring-1 ring-inset ring-teal-600/25">Software-based</span>`
      : `<span class="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-xs font-semibold text-amber-900 ring-1 ring-inset ring-amber-600/30">Hardware integrated</span>`;

    const hardware = p.isSoftware
      ? `<p class="text-sm text-slate-700">No physical components needed.${p.softwareNote ? ` <span class="text-slate-500">${esc(p.softwareNote)}.</span>` : ""}</p>`
      : `<ul class="flex flex-wrap gap-1.5">${splitList(p.hardware)
          .map((h) => `<li class="rounded-md bg-slate-100 px-2 py-1 text-sm text-slate-800">${esc(h)}</li>`)
          .join("")}</ul>`;

    const tracks = `<ol class="space-y-2">${p.tracks
      .map((t, i) => {
        const [role, duty] = splitFirst(t);
        return `<li class="rounded-lg border-l-4 p-3 ${TRACK_STYLES[i % TRACK_STYLES.length]}">
          <p class="text-sm font-semibold">Track ${i + 1}: ${esc(role || "Team member " + (i + 1))}</p>
          <p class="mt-1 text-sm leading-relaxed text-slate-700">${esc(duty)}</p></li>`;
      })
      .join("")}</ol>`;

    const steps = `<ol class="space-y-3 border-l-2 border-slate-200 pl-4">${p.steps
      .map((s, i) => {
        const [label, text] = splitFirst(s);
        return `<li><p class="text-sm font-semibold text-slate-800">${esc(label || "Step " + (i + 1))}</p>
          <p class="text-sm leading-relaxed text-slate-700">${esc(text)}</p></li>`;
      })
      .join("")}</ol>`;

    const el = document.createElement("article");
    el.className = `rounded-xl border-t-4 bg-white shadow-sm ring-1 ring-slate-200 ${p.isSoftware ? "border-teal-500" : "border-amber-500"}`;
    el.innerHTML = `
      <div class="p-5">
        <div class="flex items-start justify-between gap-3">
          <p class="text-sm font-semibold text-slate-500">Project ${p.n}</p>
          ${badge}
        </div>
        <h2 class="mt-2 text-lg font-bold leading-snug">${esc(name)}</h2>
        ${subtitle ? `<p class="text-sm font-medium text-slate-600">${esc(subtitle)}</p>` : ""}
        ${p.category ? `<p class="mt-1 text-xs text-slate-500">${esc(p.category)}</p>` : ""}
        <p class="mt-3 text-sm leading-relaxed text-slate-700">${esc(p.description)}</p>

        <h3 class="mt-5 text-sm font-semibold text-slate-800">Hardware components</h3>
        <div class="mt-2">${hardware}</div>

        <div class="mt-5 rounded-lg border-l-4 border-indigo-400 bg-indigo-50 p-3">
          <h3 class="text-sm font-semibold text-indigo-900">Added contribution</h3>
          <p class="mt-1 text-sm leading-relaxed text-slate-800">${esc(p.contribution)}</p>
        </div>
      </div>
      <div class="px-5">
        ${section("The five tracks", `${p.tracks.length} roles`, tracks)}
        ${section("Potential risks", "", `<p class="text-sm leading-relaxed text-slate-700">${esc(p.risks)}</p>`)}
        ${section("Steps to reach the final goal", `${p.steps.length} phases`, steps)}
      </div>
      ${p.source ? `<p class="border-t border-slate-200 px-5 py-3 text-xs text-slate-500">Source: <span class="font-semibold text-slate-700">${esc(p.source)}</span>${p.reference ? ` - ${esc(p.reference)}` : ""}</p>` : ""}`;
    return el;
  }

  function showError(msg) {
    $("count").textContent = "";
    $("error").hidden = false;
    $("error").textContent = msg;
  }

  async function init() {
    let list;
    try {
      const res = await fetch(DATA_URL);
      if (!res.ok) throw new Error(`The data file could not be loaded (HTTP ${res.status}).`);
      const data = await res.json();
      list = Array.isArray(data) ? data : data.capstone_projects;
      if (!Array.isArray(list) || !list.length) throw new Error("The data file has no projects in capstone_projects.");
    } catch (err) {
      showError(
        `${err.message} Check that gemini-code-1791389610349.json sits next to index.html. ` +
        `If you opened index.html straight from your disk, start a local server instead (for example: python -m http.server).`
      );
      return;
    }

    const projects = list.map(normalize);
    const grid = $("grid");
    const cards = projects.map((p) => {
      const el = renderCard(p);
      grid.appendChild(el);
      return { p, el, text: `${p.title} ${p.description} ${p.contribution}`.toLowerCase() };
    });

    const sw = projects.filter((p) => p.isSoftware).length;
    $("type").options[0].textContent = `All projects (${projects.length})`;
    $("type").options[1].textContent = `Software-based only (${sw})`;
    $("type").options[2].textContent = `Hardware integrated (${projects.length - sw})`;

    const countBy = (src) => projects.filter((p) => p.source === src).length;
    $("source").options[0].textContent = `All sources (${projects.length})`;
    $("source").options[1].textContent = `ITAC (${countBy("ITAC")})`;
    $("source").options[2].textContent = `Big Ideas (${countBy("Big Ideas")})`;

    function apply() {
      const q = $("search").value.trim().toLowerCase();
      const t = $("type").value;
      const src = $("source").value;
      let shown = 0;
      for (const c of cards) {
        const typeOk = t === "all" || (t === "software") === c.p.isSoftware;
        const ok = typeOk && (src === "all" || c.p.source === src) && (!q || c.text.includes(q));
        c.el.hidden = !ok;
        if (ok) shown++;
      }
      $("count").textContent = `Showing ${shown} of ${cards.length} projects`;
      $("empty").hidden = shown !== 0;
    }

    $("search").addEventListener("input", apply);
    $("type").addEventListener("change", apply);
    $("source").addEventListener("change", apply);

    const toggle = $("toggle-all");
    let expanded = false;
    toggle.addEventListener("click", () => {
      expanded = !expanded;
      for (const c of cards) if (!c.el.hidden) c.el.querySelectorAll("details").forEach((d) => (d.open = expanded));
      toggle.textContent = expanded ? "Collapse all" : "Expand all";
    });

    apply();
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
