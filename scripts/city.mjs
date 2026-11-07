#!/usr/bin/env node
// Contribution city: the last year of contributions as an isometric skyline, animated.
// CI:    GITHUB_TOKEN=... node city.mjs <username> <out.svg>
// Local: node city.mjs --sample <out.svg>
import { writeFileSync } from "node:fs";

const T = {
  bg: "#0A0F0D", bgEdge: "#060908", border: "#16201C",
  text: "#E5E7EB", dim: "#9CA3AF", faint: "#5B6660", accent: "#10B981", gold: "#D4A24C",
  // ground tile, then 4 intensity levels; each is [top, left face, right face]
  ground: ["#121A17", "#0D1311", "#0B100E"],
  levels: [
    ["#14533F", "#0E3B2D", "#0B2F24"],
    ["#0F7A55", "#0B5A3F", "#094A34"],
    ["#10B981", "#0C8A60", "#0A704E"],
    ["#6EE7B7", "#3FBF8C", "#2E9C71"],
  ],
  peak: ["#E9C46A", "#C2953F", "#A47C30"],
};
const W = 960, H = 440;
const SANS = `"Segoe UI",Ubuntu,"Helvetica Neue",Arial,sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace`;

// isometric axes: weeks run down-right, weekdays run up-right
const U = [9.0, 4.7];   // one week
const V = [9.0, -5.2];  // one weekday
const MAXH = 78;

async function fetchDays(login, token) {
  if (!token) throw new Error("GITHUB_TOKEN is required");
  const query = `query($login:String!){ user(login:$login){ contributionsCollection{ contributionCalendar{
    totalContributions weeks{ contributionDays{ date contributionCount weekday } } } } } }`;
  const res = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", "User-Agent": "contribution-city" },
    body: JSON.stringify({ query, variables: { login } }),
  });
  const json = await res.json();
  if (!res.ok || json.errors) throw new Error(JSON.stringify(json.errors || json));
  const cal = json.data.user.contributionsCollection.contributionCalendar;
  return cal.weeks.map((w) => w.contributionDays.map((d) => ({ date: d.date, n: d.contributionCount, wd: d.weekday })));
}

function sampleDays() {
  let seed = 11;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const start = Date.UTC(2025, 10, 9); // a Sunday
  const weeks = [];
  for (let w = 0; w < 53; w++) {
    const week = [];
    for (let d = 0; d < 7; d++) {
      const i = w * 7 + d;
      if (i > 364) break;
      const busy = 0.35 + 0.65 * Math.sin(i / 45) ** 2;
      const n = rnd() < 0.2 + busy * 0.5 ? Math.round(rnd() ** 3 * 30 * busy) + 1 : 0;
      week.push({ date: new Date(start + i * 864e5).toISOString().slice(0, 10), n, wd: d });
    }
    weeks.push(week);
  }
  return weeks;
}

const f = (n) => n.toFixed(1);
const pts = (arr) => arr.map(([x, y]) => `${f(x)},${f(y)}`).join(" ");
const short = (n) => (n >= 1000 ? (n / 1000).toFixed(n >= 10000 ? 0 : 1).replace(/\.0$/, "") + "K" : String(n));

function build(user, weeks) {
  const days = weeks.flat();
  const total = days.reduce((s, d) => s + d.n, 0);
  const active = days.filter((d) => d.n > 0).length;
  const peak = days.reduce((a, b) => (b.n > a.n ? b : a), days[0]);
  const max = Math.max(1, peak.n);
  let longest = 0, run = 0;
  for (const d of days) { run = d.n ? run + 1 : 0; longest = Math.max(longest, run); }

  // quartile thresholds among non-zero days, like GitHub's own levels
  const nz = days.filter((d) => d.n > 0).map((d) => d.n).sort((a, b) => a - b);
  const q = (p) => nz[Math.min(nz.length - 1, Math.floor(p * nz.length))] || 1;
  const cuts = [q(0.25), q(0.5), q(0.75)];
  const level = (n) => (n <= cuts[0] ? 0 : n <= cuts[1] ? 1 : n <= cuts[2] ? 2 : 3);

  const nW = weeks.length;
  const cityW = nW * U[0] + 7 * V[0];
  const O = [W - 40 - cityW, 24 + MAXH + 7 * -V[1]];
  const at = (w, d) => [O[0] + w * U[0] + d * V[0], O[1] + w * U[1] + d * V[1]];

  let ground = "", towers = "";
  // painter's order: back (low week, high weekday) to front
  for (let w = 0; w < nW; w++) {
    for (let d = 6; d >= 0; d--) {
      const day = weeks[w].find((x) => x.wd === d);
      const P = at(w, d), Pu = [P[0] + U[0], P[1] + U[1]], Puv = [Pu[0] + V[0], Pu[1] + V[1]], Pv = [P[0] + V[0], P[1] + V[1]];
      const inset = 0.8;
      if (!day || day.n === 0) {
        ground += `<polygon points="${pts([P, Pu, Puv, Pv])}" fill="${T.ground[0]}" stroke="${T.bg}" stroke-width="${inset}"/>`;
        continue;
      }
      const h = 4 + Math.pow(day.n / max, 0.8) * (MAXH - 4);
      const isPeak = day === peak;
      const [top, left, right] = isPeak ? T.peak : T.levels[level(day.n)];
      const up = ([x, y]) => [x, y - h];
      const delay = (0.25 + w * 0.028 + (6 - d) * 0.01).toFixed(2);
      towers += `<g class="${isPeak ? "rise peak" : "rise"}" style="animation-delay:${delay}s">
<polygon points="${pts([P, Pu, up(Pu), up(P)])}" fill="${left}"/>
<polygon points="${pts([Pu, Puv, up(Puv), up(Pu)])}" fill="${right}"/>
<polygon points="${pts([up(P), up(Pu), up(Puv), up(Pv)])}" fill="${top}" stroke="${T.bg}" stroke-width=".5"/>
</g>`;
    }
  }

  const peakDate = new Date(peak.date + "T00:00:00Z").toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
  const stat = (y, label, value, color = T.text) =>
    `<text x="34" y="${y}" class="lbl">${label}</text><text x="34" y="${y + 22}" class="val" fill="${color}">${value}</text>`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${user}: ${total} contributions in the last year, shown as an isometric city">
<style>
  .head{font:600 12px ${MONO};fill:${T.accent}}
  .big{font:700 52px ${SANS};letter-spacing:-.03em;fill:${T.text}}
  .cap{font:500 13px ${SANS};fill:${T.dim}}
  .lbl{font:600 10.5px ${MONO};letter-spacing:.14em;fill:${T.faint}}
  .val{font:600 17px ${SANS}}
  .meta{font:500 10.5px ${MONO};fill:${T.faint}}
  .up{opacity:0;animation:up .8s cubic-bezier(.2,.8,.2,1) both}
  .rise{opacity:0;animation:rise .7s cubic-bezier(.2,.9,.25,1.15) both}
  .peak{animation:rise .7s cubic-bezier(.2,.9,.25,1.15) both,glow 2.6s ease-in-out 3s infinite}
  @keyframes up{from{opacity:0;transform:translateY(12px)}to{opacity:1;transform:none}}
  @keyframes rise{from{opacity:0;transform:translateY(-26px)}to{opacity:1;transform:none}}
  @keyframes glow{50%{filter:brightness(1.35)}}
  @media (prefers-reduced-motion:reduce){.up,.rise,.peak{animation:none;opacity:1}}
</style>
<defs>
  <radialGradient id="bg" cx="65%" cy="55%" r="80%"><stop offset="0" stop-color="#0C1411"/><stop offset="1" stop-color="${T.bgEdge}"/></radialGradient>
  <radialGradient id="pool" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${T.accent}" stop-opacity=".10"/><stop offset="1" stop-color="${T.accent}" stop-opacity="0"/></radialGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <ellipse cx="${f(O[0] + cityW / 2)}" cy="${f(O[1] + (nW * U[1]) / 2)}" rx="${f(cityW * 0.55)}" ry="140" fill="url(#pool)"/>
  <g class="up">
    <text x="34" y="44" class="head">~/contributions</text>
    <text x="34" y="112" class="big">${short(total)}</text>
    <text x="36" y="136" class="cap">contributions in the last year</text>
  </g>
  <g class="up" style="animation-delay:.2s">
    ${stat(186, "ACTIVE DAYS", active)}
    ${stat(238, "LONGEST STREAK", `${longest} days`)}
    ${stat(290, "BUSIEST DAY", `${peak.n} · ${peakDate}`, T.gold)}
  </g>
  <text x="34" y="${H - 30}" class="meta up" style="animation-delay:.4s">@${user}</text>
  ${ground}
  ${towers}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${T.border}"/>
</svg>`;
}

const args = process.argv.slice(2);
const sample = args[0] === "--sample";
const user = sample ? "sidd-a03" : args[0] || process.env.GITHUB_REPOSITORY_OWNER;
const out = args[1] || "city.svg";
const weeks = sample ? sampleDays() : await fetchDays(user, process.env.GITHUB_TOKEN);
writeFileSync(out, build(user, weeks));
console.log(`city -> ${out}`);
