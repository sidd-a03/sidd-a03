#!/usr/bin/env node
// Repo galaxy: draws a user's public repos as a spiral galaxy SVG.
// Usage in CI:  GITHUB_TOKEN=... node galaxy.mjs <username> <out.svg>
// Local test:   node galaxy.mjs --sample <out.svg>
// No dependencies; needs Node 18+ (global fetch).

import { writeFileSync } from "node:fs";

// ---------- palette (matches the profile: emerald + muted gold) ----------
const THEME = {
  bg: "#0A0F0D",          // near-black with a green cast
  bgEdge: "#060908",
  border: "#16201C",
  core: "#E8FFF5",
  coreGlow: "#10B981",
  text: "#D1D5DB",
  textDim: "#6B7280",
  star: "#D4A24C",
  // one colour per arm, ordered by language share
  arms: ["#10B981", "#D4A24C", "#6EE7B7", "#94A3B8", "#A3B18A"],
};

const W = 880, H = 360, CX = W / 2, CY = H / 2 + 6;
const TILT = 0.5;         // vertical squash for a tilted-disc look
const MAX_LABELS = 6;

// ---------- deterministic randomness, so the picture is stable per user ----------
function seeded(str) {
  let h = 2166136261;
  for (const c of str) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h += 0x6d2b79f5;
    let t = h;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
const gauss = (rnd) => {
  const u = 1 - rnd(), v = rnd();
  return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v);
};

// ---------- data ----------
async function fetchRepos(user, token) {
  const headers = { Accept: "application/vnd.github+json", "User-Agent": "repo-galaxy" };
  if (token) headers.Authorization = `Bearer ${token}`;
  const repos = [];
  for (let page = 1; page <= 10; page++) {
    const res = await fetch(
      `https://api.github.com/users/${user}/repos?per_page=100&type=owner&sort=pushed&page=${page}`,
      { headers }
    );
    if (!res.ok) throw new Error(`GitHub API ${res.status}: ${await res.text()}`);
    const batch = await res.json();
    repos.push(...batch);
    if (batch.length < 100) break;
  }
  return repos
    .filter((r) => !r.fork && !r.archived && r.name.toLowerCase() !== user.toLowerCase())
    .map((r) => ({
      name: r.name,
      stars: r.stargazers_count,
      lang: r.language || "Other",
      pushed: Date.parse(r.pushed_at),
    }));
}

function sampleRepos() {
  const named = [
    ["go-students-api", "TypeScript"], ["leetcode-submissions", "C++"], ["go-lang", "TypeScript"],
    ["resume_analyzer", "TypeScript"], ["backend-from-first-p", "JavaScript"], ["showtime", "TypeScript"],
  ];
  const langs = ["TypeScript", "TypeScript", "TypeScript", "CSS", "JavaScript", "C++"];
  const out = named.map(([name, lang], i) => ({ name, lang, stars: i === 5 ? 3 : 0, pushed: Date.now() - i * 864e5 }));
  for (let i = 0; i < 26; i++)
    out.push({ name: `repo-${i}`, lang: langs[i % langs.length], stars: i % 9 === 0 ? 1 : 0, pushed: Date.now() - (10 + i * 9) * 864e5 });
  return out;
}

// ---------- geometry ----------
const project = (r, theta) => [CX + r * Math.cos(theta), CY + r * Math.sin(theta) * TILT];
const armTheta = (armIndex, armCount, r) => (2 * Math.PI * armIndex) / armCount + r * 0.0165;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const f = (n) => n.toFixed(1);

function build(user, repos) {
  const rnd = seeded(user);

  // arms = top languages by repo count; the rest join the last arm as "Other"
  const counts = {};
  for (const r of repos) counts[r.lang] = (counts[r.lang] || 0) + 1;
  const ranked = Object.entries(counts).sort((a, b) => b[1] - a[1]).map(([l]) => l);
  const armLangs = ranked.slice(0, 4);
  const armOf = (lang) => (armLangs.includes(lang) ? armLangs.indexOf(lang) : armLangs.length - 1);
  const armCount = Math.max(armLangs.length, 2);

  // ----- dust: thousands of faint particles tracing each arm -----
  let dust = "";
  for (let a = 0; a < armCount; a++) {
    const col = THEME.arms[a % THEME.arms.length];
    for (let i = 0; i < 420; i++) {
      const r = 26 + Math.pow(rnd(), 0.85) * 290;
      const spread = 3 + r * 0.045;
      const th = armTheta(a, armCount, r) + gauss(rnd) * (spread / r);
      const rr = r + gauss(rnd) * spread * 0.6;
      const [x, y] = project(rr, th);
      const op = (0.25 + rnd() * 0.55) * (1 - r / 360);
      dust += `<circle cx="${f(x)}" cy="${f(y)}" r="${f(0.5 + rnd() * 0.9)}" fill="${col}" opacity="${op.toFixed(2)}"/>`;
    }
  }
  // background field stars
  let field = "";
  for (let i = 0; i < 90; i++) {
    const op = (0.08 + rnd() * 0.3).toFixed(2);
    const tw = rnd() < 0.25 ? ` class="tw" style="animation-delay:${f(rnd() * 6)}s"` : "";
    field += `<circle cx="${f(rnd() * W)}" cy="${f(rnd() * H)}" r="${f(0.4 + rnd() * 0.7)}" fill="#E5E7EB" opacity="${op}"${tw}/>`;
  }

  // ----- repos: recent ones sit near the core, older ones drift outward -----
  const sorted = [...repos].sort((a, b) => b.pushed - a.pushed);
  const perArmIdx = {}, perArmTotal = {};
  for (const r of sorted) perArmTotal[armOf(r.lang)] = (perArmTotal[armOf(r.lang)] || 0) + 1;
  const nodes = sorted.map((repo, i) => {
    const a = armOf(repo.lang);
    const k = (perArmIdx[a] = (perArmIdx[a] || 0) + 1);
    const r = 48 + (k / perArmTotal[a]) * 240 + (rnd() - 0.5) * 10;
    const th = armTheta(a, armCount, r) + (rnd() - 0.5) * 0.12;
    const [x, y] = project(r, th);
    const size = 2.2 + Math.log2(1 + repo.stars) * 1.6;
    return { ...repo, x, y, size, col: THEME.arms[a % THEME.arms.length], label: i < MAX_LABELS };
  });

  let repoMarks = "";
  for (const n of nodes) {
    const glow = n.label ? `<circle cx="${f(n.x)}" cy="${f(n.y)}" r="${f(n.size * 3.2)}" fill="${n.col}" opacity="0.14"/>` : "";
    repoMarks += `${glow}<circle cx="${f(n.x)}" cy="${f(n.y)}" r="${f(n.size)}" fill="${n.col}"${n.label ? ' class="pulse"' : ""}/>`;
  }

  // ----- labels for the most recently pushed repos, with simple collision nudging -----
  const placed = [];
  let labels = "";
  for (const n of nodes.filter((n) => n.label)) {
    const right = n.x >= CX;
    const name = n.name.length > 22 ? n.name.slice(0, 21) + "…" : n.name;
    const textW = name.length * 6.6 + 30;
    let ly = n.y + 4;
    for (let tries = 0; tries < 12; tries++) {
      const hit = placed.find((p) => Math.abs(p.y - ly) < 15 && p.right === right && Math.abs(p.x - n.x) < textW + 40);
      if (!hit) break;
      ly += ly < CY ? -15 : 15;
    }
    placed.push({ x: n.x, y: ly, right });
    const gap = n.size * 3.2 + 6;
    const tx = right ? n.x + gap : n.x - gap;
    const anchor = right ? "start" : "end";
    labels +=
      `<line x1="${f(n.x + (right ? n.size + 2 : -n.size - 2))}" y1="${f(n.y)}" x2="${f(tx + (right ? -3 : 3))}" y2="${f(ly - 4)}" stroke="${n.col}" stroke-opacity="0.35" stroke-width="0.8"/>` +
      `<text x="${f(tx)}" y="${f(ly)}" text-anchor="${anchor}" class="lbl">${esc(name)}` +
      `<tspan class="st" dx="6">★ ${n.stars}</tspan></text>`;
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(user)}'s repositories drawn as a galaxy">
<style>
  .lbl{font:600 12px ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace;fill:${THEME.text}}
  .st{font-weight:500;fill:${THEME.star}}
  .spin{transform-origin:${CX}px ${CY}px;animation:spin 240s linear infinite}
  .tw{animation:tw 4s ease-in-out infinite}
  .pulse{animation:pulse 3.2s ease-in-out infinite;transform-box:fill-box;transform-origin:center}
  @keyframes spin{to{transform:rotate(360deg)}}
  @keyframes tw{0%,100%{opacity:.1}50%{opacity:.7}}
  @keyframes pulse{0%,100%{transform:scale(1)}50%{transform:scale(1.35)}}
  @media (prefers-reduced-motion:reduce){.spin,.tw,.pulse{animation:none}}
</style>
<defs>
  <radialGradient id="bg" cx="50%" cy="50%" r="70%">
    <stop offset="0" stop-color="${THEME.bg}"/><stop offset="1" stop-color="${THEME.bgEdge}"/>
  </radialGradient>
  <radialGradient id="core" cx="50%" cy="50%" r="50%">
    <stop offset="0" stop-color="${THEME.core}" stop-opacity="0.95"/>
    <stop offset="0.25" stop-color="${THEME.coreGlow}" stop-opacity="0.45"/>
    <stop offset="1" stop-color="${THEME.coreGlow}" stop-opacity="0"/>
  </radialGradient>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  ${field}
  <g transform="translate(${CX} ${CY}) scale(1 ${TILT}) translate(${-CX} ${-CY})">
    <g class="spin"><g transform="translate(${CX} ${CY}) scale(1 ${1 / TILT}) translate(${-CX} ${-CY})">${dust}</g></g>
  </g>
  <ellipse cx="${CX}" cy="${CY}" rx="70" ry="${70 * TILT}" fill="url(#core)"/>
  <circle cx="${CX}" cy="${CY}" r="3" fill="${THEME.core}"/>
  ${repoMarks}
  ${labels}
</g>
<rect x="0.5" y="0.5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${THEME.border}"/>
</svg>`;
}

// ---------- main ----------
const args = process.argv.slice(2);
const sample = args[0] === "--sample";
const user = sample ? "sidd-a03" : args[0] || process.env.GITHUB_REPOSITORY_OWNER;
const out = args[1] || "galaxy.svg";
if (!user) throw new Error("usage: node galaxy.mjs <username> [out.svg]");

const repos = sample ? sampleRepos() : await fetchRepos(user, process.env.GITHUB_TOKEN);
writeFileSync(out, build(user, repos));
console.log(`galaxy: ${repos.length} repos -> ${out}`);
