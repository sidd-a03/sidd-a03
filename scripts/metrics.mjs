#!/usr/bin/env node
// Metrics dashboard: KPI tiles, a year of contributions, and language split, as an animated SVG.
// CI:    GITHUB_TOKEN=... node metrics.mjs <username> <out.svg>
// Local: node metrics.mjs --sample <out.svg>
import { writeFileSync } from "node:fs";

const T = {
  bg: "#0A0F0D", bgEdge: "#060908", panel: "#0D1411", line: "#1A2420", border: "#16201C",
  text: "#E5E7EB", dim: "#9CA3AF", faint: "#5B6660", accent: "#10B981", mint: "#6EE7B7", gold: "#D4A24C",
  langs: ["#10B981", "#D4A24C", "#6EE7B7", "#94A3B8", "#A3B18A"],
};
const W = 960, H = 410, PAD = 28;
const SANS = `"Segoe UI",Ubuntu,"Helvetica Neue",Arial,sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace`;

// ---------------- data ----------------
const QUERY = `query($login:String!){ user(login:$login){
  followers{totalCount}
  pullRequests{totalCount}
  repositories(ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false, first:100){
    totalCount
    nodes{ stargazerCount languages(first:8, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } }
  }
  contributionsCollection{ contributionCalendar{ totalContributions weeks{ contributionDays{ date contributionCount } } } }
}}`;

async function fetchData(login, token) {
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "profile-metrics" },
    body: JSON.stringify({ query: QUERY, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
  const u = json.data.user;
  const langBytes = {};
  for (const r of u.repositories.nodes)
    for (const e of r.languages.edges) langBytes[e.node.name] = (langBytes[e.node.name] || 0) + e.size;
  const cal = u.contributionsCollection.contributionCalendar;
  return {
    repos: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0),
    prs: u.pullRequests.totalCount,
    followers: u.followers.totalCount,
    total: cal.totalContributions,
    days: cal.weeks.flatMap((w) => w.contributionDays).map((d) => ({ date: d.date, n: d.contributionCount })),
    langBytes,
  };
}

function sampleData() {
  const days = [];
  const start = new Date(Date.UTC(2025, 10, 9));
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 365; i++) {
    const d = new Date(start.getTime() + i * 864e5);
    const busy = 0.4 + 0.6 * Math.sin(i / 40) ** 2;
    const n = rnd() < 0.3 + busy * 0.5 ? Math.round(rnd() * 9 * busy) : 0;
    days.push({ date: d.toISOString().slice(0, 10), n: i > 352 ? 2 + (i % 4) : n });
  }
  return {
    repos: 32, stars: 4, prs: 41, followers: 18, total: days.reduce((s, d) => s + d.n, 0), days,
    langBytes: { TypeScript: 812000, CSS: 104000, JavaScript: 101000, "C++": 68000, Go: 41000, HTML: 20000 },
  };
}

// ---------------- derived numbers ----------------
function streaks(days) {
  let longest = 0, run = 0;
  for (const d of days) { run = d.n > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  // current streak: today may still be empty, so allow the last day to be 0
  let cur = 0, i = days.length - 1;
  if (i >= 0 && days[i].n === 0) i--;
  for (; i >= 0 && days[i].n > 0; i--) cur++;
  return { cur, longest };
}

// ---------------- render helpers ----------------
const fmt = (n) => n.toLocaleString("en-US");
const f = (n) => n.toFixed(1);
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

function tile(x, y, w, h, label, value, sub, color, delay, spark) {
  return `<g class="up" style="animation-delay:${delay}s">
  <rect x="${x}" y="${y}" width="${w}" height="${h}" rx="12" fill="${T.panel}" stroke="${T.line}"/>
  <rect x="${x + 16}" y="${y + 18}" width="6" height="6" rx="1.5" fill="${color}"/>
  <text x="${x + 30}" y="${y + 24}" class="cap">${esc(label)}</text>
  <text x="${x + 16}" y="${y + 64}" class="big" fill="${color === T.gold ? T.gold : T.text}">${esc(value)}</text>
  <text x="${x + 16}" y="${y + h - 14}" class="sub">${esc(sub)}</text>
  ${spark || ""}
</g>`;
}

function build(user, d) {
  const { cur, longest } = streaks(d.days);
  const last30 = d.days.slice(-30).reduce((s, x) => s + x.n, 0);
  const activeDays = d.days.filter((x) => x.n > 0).length;

  // ---- KPI tiles ----
  const tw = (W - PAD * 2 - 16 * 3) / 4, th = 100, ty = 62;
  const last14 = d.days.slice(-14).map((x) => x.n);
  const m14 = Math.max(1, ...last14);
  const bars14 = last14
    .map((n, i) => {
      const bh = Math.max(2, (n / m14) * 26);
      return `<rect x="${f(PAD + tw - 16 - (14 - i) * 7)}" y="${f(ty + 74 - bh)}" width="4.5" height="${f(bh)}" rx="1" fill="${n ? T.accent : T.line}" opacity="${n ? 0.35 + 0.65 * (n / m14) : 1}"/>`;
    })
    .join("");
  const tiles = [
    tile(PAD, ty, tw, th, "CONTRIBUTIONS", fmt(d.total), `${fmt(last30)} in the last 30 days`, T.accent, 0.15, bars14),
    tile(PAD + (tw + 16), ty, tw, th, "CURRENT STREAK", `${cur} day${cur === 1 ? "" : "s"}`, `longest: ${longest} days`, T.gold, 0.25),
    tile(PAD + (tw + 16) * 2, ty, tw, th, "PULL REQUESTS", fmt(d.prs), `${activeDays} active days this year`, T.mint, 0.35),
    tile(PAD + (tw + 16) * 3, ty, tw, th, "PUBLIC REPOS", fmt(d.repos), `★ ${fmt(d.stars)} stars · ${fmt(d.followers)} followers`, "#94A3B8", 0.45),
  ].join("");

  // ---- weekly contribution area chart ----
  const cx = PAD, cy = ty + th + 16, cw = 600, ch = H - cy - PAD;
  const weeks = [];
  for (let i = 0; i < d.days.length; i += 7) weeks.push(d.days.slice(i, i + 7));
  if (weeks.length > 1 && weeks[weeks.length - 1].length < 7) weeks.pop(); // drop the unfinished week
  const wsum = weeks.map((w) => w.reduce((s, x) => s + x.n, 0));
  const max = Math.max(4, ...wsum);
  const gx0 = cx + 18, gx1 = cx + cw - 18, gy0 = cy + 52, gy1 = cy + ch - 30;
  const px = (i) => gx0 + (i / Math.max(1, wsum.length - 1)) * (gx1 - gx0);
  const py = (v) => gy1 - (v / max) * (gy1 - gy0);
  // smooth line (Catmull-Rom → Bézier)
  const pts = wsum.map((v, i) => [px(i), py(v)]);
  let line = `M${f(pts[0][0])} ${f(pts[0][1])}`;
  for (let i = 0; i < pts.length - 1; i++) {
    const p0 = pts[Math.max(0, i - 1)], p1 = pts[i], p2 = pts[i + 1], p3 = pts[Math.min(pts.length - 1, i + 2)];
    const c1 = [p1[0] + (p2[0] - p0[0]) / 6, Math.min(gy1, p1[1] + (p2[1] - p0[1]) / 6)];
    const c2 = [p2[0] - (p3[0] - p1[0]) / 6, Math.min(gy1, p2[1] - (p3[1] - p1[1]) / 6)];
    line += ` C${f(c1[0])} ${f(c1[1])} ${f(c2[0])} ${f(c2[1])} ${f(p2[0])} ${f(p2[1])}`;
  }
  const area = `${line} L${f(gx1)} ${f(gy1)} L${f(gx0)} ${f(gy1)} Z`;
  const grid = [0.25, 0.5, 0.75, 1]
    .map((k) => `<line x1="${gx0}" x2="${gx1}" y1="${f(py(max * k))}" y2="${f(py(max * k))}" stroke="${T.line}" stroke-dasharray="2 4"/>`)
    .join("");
  const months = [];
  weeks.forEach((w, i) => {
    const dt = new Date(w[0].date + "T00:00:00Z");
    if (dt.getUTCDate() <= 7)
      months.push(`<text x="${f(px(i))}" y="${gy1 + 18}" class="tick" text-anchor="middle">${dt.toLocaleString("en-US", { month: "short", timeZone: "UTC" })}</text>`);
  });
  const peak = wsum.indexOf(Math.max(...wsum));
  const [lx, ly] = pts[pts.length - 1];
  const chart = `<g class="up" style="animation-delay:.55s">
  <rect x="${cx}" y="${cy}" width="${cw}" height="${ch}" rx="12" fill="${T.panel}" stroke="${T.line}"/>
  <text x="${cx + 18}" y="${cy + 28}" class="cap">CONTRIBUTIONS · LAST 12 MONTHS</text>
  <text x="${cx + cw - 18}" y="${cy + 28}" class="sub" text-anchor="end">peak week: ${wsum[peak]}</text>
  ${grid}
  <path d="${area}" fill="url(#area)" class="fade" style="animation-delay:1.3s"/>
  <path d="${line}" fill="none" stroke="${T.accent}" stroke-width="2" stroke-linecap="round" pathLength="1" class="draw"/>
  <circle cx="${f(lx)}" cy="${f(ly)}" r="9" fill="${T.accent}" opacity=".18" class="ping"/>
  <circle cx="${f(lx)}" cy="${f(ly)}" r="3.5" fill="${T.mint}" class="fade" style="animation-delay:2s"/>
  ${months.join("")}
</g>`;

  // ---- languages ----
  const lx0 = cx + cw + 16, lw = W - PAD - lx0;
  const totalBytes = Object.values(d.langBytes).reduce((a, b) => a + b, 0) || 1;
  const top = Object.entries(d.langBytes).sort((a, b) => b[1] - a[1]).slice(0, 5);
  const rows = top
    .map(([name, bytes], i) => {
      const pct = (bytes / totalBytes) * 100;
      const y = cy + 56 + i * 29;
      const bw = Math.max(4, (lw - 36) * (pct / (top[0][1] / totalBytes * 100)));
      return `<text x="${lx0 + 18}" y="${y}" class="lang">${esc(name)}</text>
  <text x="${lx0 + lw - 18}" y="${y}" class="pct" text-anchor="end">${pct.toFixed(1)}%</text>
  <rect x="${lx0 + 18}" y="${y + 8}" width="${lw - 36}" height="5" rx="2.5" fill="${T.line}"/>
  <rect x="${lx0 + 18}" y="${y + 8}" width="${f(bw)}" height="5" rx="2.5" fill="${T.langs[i]}" class="grow" style="animation-delay:${(0.9 + i * 0.12).toFixed(2)}s"/>`;
    })
    .join("");
  const langs = `<g class="up" style="animation-delay:.65s">
  <rect x="${lx0}" y="${cy}" width="${lw}" height="${ch}" rx="12" fill="${T.panel}" stroke="${T.line}"/>
  <text x="${lx0 + 18}" y="${cy + 28}" class="cap">LANGUAGES</text>
  ${rows}
</g>`;

  const updated = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(user)}: ${d.total} contributions in the last year, ${cur}-day current streak, ${d.prs} pull requests, ${d.repos} public repositories">
<style>
  .cap{font:600 11px ${MONO};letter-spacing:.14em;fill:${T.dim}}
  .big{font:600 32px ${SANS};letter-spacing:-.02em}
  .sub{font:400 12px ${SANS};fill:${T.faint}}
  .tick{font:500 10.5px ${MONO};fill:${T.faint}}
  .lang{font:500 13px ${SANS};fill:${T.text}}
  .pct{font:500 12px ${MONO};fill:${T.dim}}
  .head{font:600 12px ${MONO};fill:${T.accent}}
  .up{opacity:0;animation:up .8s cubic-bezier(.2,.8,.2,1) both}
  .fade{opacity:0;animation:fade .9s ease both}
  .draw{stroke-dasharray:1;stroke-dashoffset:1;animation:draw 1.8s cubic-bezier(.4,0,.2,1) .8s forwards}
  .grow{transform-box:fill-box;transform-origin:left;transform:scaleX(0);animation:grow 1s cubic-bezier(.2,.8,.2,1) forwards}
  .ping{transform-box:fill-box;transform-origin:center;animation:ping 2.4s ease-out 2.2s infinite;opacity:0}
  .live{animation:blink 1.6s ease-in-out infinite}
  @keyframes up{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
  @keyframes fade{to{opacity:1}}
  @keyframes draw{to{stroke-dashoffset:0}}
  @keyframes grow{to{transform:scaleX(1)}}
  @keyframes ping{0%{opacity:.35;transform:scale(.6)}100%{opacity:0;transform:scale(2.2)}}
  @keyframes blink{50%{opacity:.3}}
  @media (prefers-reduced-motion:reduce){.up,.fade{animation:none;opacity:1}.draw{animation:none;stroke-dashoffset:0}.grow{animation:none;transform:none}.ping,.live{animation:none}}
</style>
<defs>
  <radialGradient id="bg" cx="20%" cy="0%" r="110%"><stop offset="0" stop-color="${T.bg}"/><stop offset="1" stop-color="${T.bgEdge}"/></radialGradient>
  <linearGradient id="area" x1="0" y1="0" x2="0" y2="1">
    <stop offset="0" stop-color="${T.accent}" stop-opacity=".32"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/>
  </linearGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <g class="up">
    <text x="${PAD}" y="38" class="head">~/metrics</text>
    <circle cx="${W - PAD - 132}" cy="34" r="3" fill="${T.accent}" class="live"/>
    <text x="${W - PAD}" y="38" class="tick" text-anchor="end">live · ${updated}</text>
  </g>
  ${tiles}
  ${chart}
  ${langs}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${T.border}"/>
</svg>`;
}

const args = process.argv.slice(2);
const sample = args[0] === "--sample";
const user = sample ? "sidd-a03" : args[0] || process.env.GITHUB_REPOSITORY_OWNER;
const out = args[1] || "metrics.svg";
const data = sample ? sampleData() : await fetchData(user, process.env.GITHUB_TOKEN);
writeFileSync(out, build(user, data));
console.log(`metrics: ${data.total} contributions -> ${out}`);
