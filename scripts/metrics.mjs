#!/usr/bin/env node
// Metrics card: four headline numbers in the hero's textured slab type, plus a language strip.
// CI:    GITHUB_TOKEN=... node metrics.mjs <username> <out.svg>
// Local: node metrics.mjs --sample <out.svg>
// Digit outlines are from GNU FreeMono Bold (GPL with font exception), embedded below.
import { writeFileSync } from "node:fs";

const DIGITS = {"upm": 1000, "adv": 600, "g": {"0": "M300 638Q406 638 461.5 557.0Q517 476 517 359V264Q517 189 494.5 127.5Q472 66 421.5 25.5Q371 -15 300 -15Q194 -15 138.5 66.0Q83 147 83 264V359Q83 434 105.5 495.5Q128 557 178.5 597.5Q229 638 300 638ZM183 366V257Q183 179 215.0 132.0Q247 85 300.0 85.0Q353 85 385.0 132.0Q417 179 417 257V366Q417 444 385.0 491.0Q353 538 300.0 538.0Q247 538 215.0 491.0Q183 444 183 366Z", "1": "M83 50Q83 79 100.0 89.5Q117 100 149 100H250V528L168 470Q153 457 127 457Q110 457 97.5 468.0Q85 479 85 497Q85 513 92.0 523.5Q99 534 116 546L251 638H350V100H451Q517 100 517.0 50.0Q517 0 451 0H149Q83 0 83 50Z", "2": "M503 444Q503 400 484.5 367.5Q466 335 411.0 281.5Q356 228 207 100H408Q412 154 458 154Q508 154 508 88V0H54V105Q73 121 122.5 161.0Q172 201 194.5 220.0Q217 239 257.0 273.5Q297 308 317.0 328.0Q337 348 360.5 373.0Q384 398 393.5 416.0Q403 434 403 448Q403 486 370.0 512.0Q337 538 288 538Q251 538 226.5 526.0Q202 514 192.0 497.0Q182 480 174.5 463.0Q167 446 155.0 434.0Q143 422 124 422Q104 422 89.0 436.5Q74 451 74 470Q74 528 136.5 583.0Q199 638 290.0 638.0Q381 638 442.0 582.5Q503 527 503 444Z", "3": "M268 85Q429 85 429 183Q429 227 389.0 255.0Q349 283 276 287Q224 290 224 333Q224 355 238.5 369.0Q253 383 276 383H316Q353 383 380.0 406.5Q407 430 407 462Q407 497 377.0 517.5Q347 538 295 538Q256 538 230.0 528.5Q204 519 195.0 507.5Q186 496 173.5 486.5Q161 477 144 477Q124 477 109.5 492.0Q95 507 95 527Q95 570 158.0 604.0Q221 638 301 638Q392 638 449.5 588.0Q507 538 507 464Q507 423 486.0 392.5Q465 362 416 333Q529 278 529 182Q529 146 517.0 114.0Q505 82 478.0 51.5Q451 21 397.5 3.0Q344 -15 271 -15Q179 -15 122.5 8.5Q66 32 66 70Q66 91 80.5 105.5Q95 120 116 120Q126 120 136.5 114.5Q147 109 157.0 102.5Q167 96 196.0 90.5Q225 85 268 85Z", "4": "M309 100H347V138H75V221L316 622H447V238Q508 238 508 188Q508 140 447 138V100Q508 100 508.0 50.0Q508 0 441 0H309Q243 0 243.0 50.0Q243 100 309 100ZM347 238V480L197 238Z", "5": "M487 572Q487 522 421 522H219V407Q275 424 318 424Q409 424 469.0 361.0Q529 298 529 202Q529 174 523.5 147.0Q518 120 501.5 89.5Q485 59 458.5 37.0Q432 15 385.5 0.0Q339 -15 278 -15Q188 -15 127.0 13.5Q66 42 66 84Q66 104 81.0 118.5Q96 133 116 133Q129 133 140.5 125.5Q152 118 162.5 109.0Q173 100 202.5 92.5Q232 85 277 85Q355 85 392.0 113.5Q429 142 429 201Q429 256 398.0 290.0Q367 324 317 324Q276 324 226.0 303.0Q176 282 169 282Q147 282 133.0 298.0Q119 314 119 338V622H421Q453 622 470.0 611.5Q487 601 487 572Z", "6": "M331 -15Q279 -15 238.5 4.5Q198 24 173.5 54.0Q149 84 133.0 125.0Q117 166 111.0 205.0Q105 244 105 285Q105 417 182 514Q283 638 423 638Q476 638 508.0 620.0Q540 602 540 573Q540 552 525.0 537.0Q510 522 489 522Q483 522 460.5 528.5Q438 535 429 535Q350 535 287.5 475.5Q225 416 208 324Q244 362 275.5 378.0Q307 394 345 394Q424 394 479.5 334.0Q535 274 535 189Q535 98 481.0 41.5Q427 -15 331 -15ZM218 209Q229 144 257.0 114.5Q285 85 334 85Q381 85 408.0 113.0Q435 141 435 190Q435 233 407.0 263.5Q379 294 338 294Q306 294 272.0 270.0Q238 246 218 209Z", "7": "M125 468Q75 468 75 534V622H508V523L349 48Q339 21 327.5 10.0Q316 -1 297 -1Q277 -1 261.5 13.5Q246 28 246 47Q246 61 253 81L403 522H175Q170 468 125 468Z", "8": "M420 319Q517 258 517 165Q517 85 456.5 35.0Q396 -15 299 -15Q203 -15 143.0 35.0Q83 85 83 165Q83 258 180 319Q92 378 92.0 455.0Q92 532 152.5 585.0Q213 638 300 638Q386 638 447.0 585.0Q508 532 508 457Q508 378 420 319ZM408 450Q408 489 378.0 513.5Q348 538 300.0 538.0Q252 538 222.0 513.5Q192 489 192.0 451.0Q192 413 222.5 388.5Q253 364 300.0 364.0Q347 364 377.5 388.0Q408 412 408 450ZM300 263Q252 263 217.5 236.5Q183 210 183 173Q183 135 216.0 110.0Q249 85 300.0 85.0Q351 85 384.0 109.5Q417 134 417.0 172.0Q417 210 383.0 236.5Q349 263 300 263Z", "9": "M315 638Q379 638 426.0 610.0Q473 582 496.5 535.0Q520 488 530.5 439.5Q541 391 541 338Q541 206 464 109Q363 -15 223 -15Q170 -15 138.0 3.0Q106 21 106 50Q106 71 121.0 86.0Q136 101 157 101Q163 101 185.5 94.5Q208 88 217 88Q296 88 358.5 147.5Q421 207 438 299Q372 229 302 229Q223 229 167.0 289.0Q111 349 111 434Q111 525 165.0 581.5Q219 638 315 638ZM428 414Q417 479 389.0 508.5Q361 538 312 538Q265 538 238.0 510.0Q211 482 211 433Q211 390 239.0 359.5Q267 329 308 329Q340 329 374.0 353.0Q408 377 428 414Z", ".": "M309 -15H291Q264 -15 244.5 4.5Q225 24 225.0 51.0Q225 78 244.5 97.5Q264 117 291 117H309Q337 117 356.0 98.0Q375 79 375.0 51.0Q375 23 356.0 4.0Q337 -15 309 -15Z", ",": "M219 134H351L210 -134Q198 -158 178 -158Q165 -158 156.0 -149.5Q147 -141 147 -130Q147 -122 150 -111Z", "k": "M504 0H386Q320 0 320 50Q320 70 336 87L233 178L215 164V0H99Q33 0 33 50Q33 79 50.0 89.5Q67 100 99 100H115V523H99Q67 523 50.0 533.5Q33 544 33 573Q33 623 99 623H215V287L294 350Q278 369 278 387Q278 437 345 437H457Q490 437 506.5 426.0Q523 415 523 387Q523 337 457 337H429L311 241L471 100H504Q571 100 571.0 50.0Q571 0 504 0Z"}};

// ---------------- look ----------------
const T = {
  bg: "#0A0F0D", bgEdge: "#060908", border: "#16201C", hair: "#1C2622",
  text: "#E5E7EB", dim: "#9CA3AF", faint: "#5B6660", accent: "#10B981", gold: "#D4A24C",
  tex: "#DCE6E1", texDim: "#5F7069", edge: "#B8C6C0",
  langs: ["#10B981", "#D4A24C", "#6EE7B7", "#94A3B8", "#A3B18A", "#3F4B46"],
};
const W = 960, H = 286, PAD = 32;
const SANS = `"Segoe UI",Ubuntu,"Helvetica Neue",Arial,sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace`;

// ---------------- data ----------------
const QUERY = `query($login:String!){ user(login:$login){
  createdAt
  followers{ totalCount }
  pullRequests{ totalCount }
  repositories(ownerAffiliations:OWNER, privacy:PUBLIC, isFork:false, first:100){
    totalCount
    nodes{ stargazerCount languages(first:8, orderBy:{field:SIZE, direction:DESC}){ edges{ size node{ name } } } }
  }
  contributionsCollection{
    totalCommitContributions
    contributionCalendar{ weeks{ contributionDays{ contributionCount } } }
  }
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
  return {
    commits: u.contributionsCollection.totalCommitContributions,
    prs: u.pullRequests.totalCount,
    repos: u.repositories.totalCount,
    stars: u.repositories.nodes.reduce((s, r) => s + r.stargazerCount, 0),
    followers: u.followers.totalCount,
    since: new Date(u.createdAt).getUTCFullYear(),
    days: u.contributionsCollection.contributionCalendar.weeks.flatMap((w) => w.contributionDays.map((d) => d.contributionCount)),
    langBytes,
  };
}

function sampleData() {
  let seed = 7;
  const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const days = Array.from({ length: 365 }, (_, i) => (i > 352 || rnd() < 0.55 ? 1 + Math.round(rnd() * 6) : 0));
  return {
    commits: 742, prs: 41, repos: 32, stars: 4, followers: 18, since: 2024, days,
    langBytes: { TypeScript: 812000, CSS: 104000, JavaScript: 101000, "C++": 68000, Go: 41000, HTML: 20000 },
  };
}

function streaks(days) {
  let longest = 0, run = 0;
  for (const n of days) { run = n > 0 ? run + 1 : 0; longest = Math.max(longest, run); }
  let cur = 0, i = days.length - 1;
  if (i >= 0 && days[i] === 0) i--; // today may still be empty
  for (; i >= 0 && days[i] > 0; i--) cur++;
  return { cur, longest };
}

// ---------------- textured slab numbers (same grain as the hero) ----------------
function glyphPath(str, x, baseline, size) {
  const s = size / DIGITS.upm;
  let out = "";
  [...str].forEach((ch, k) => {
    const d = DIGITS.g[ch];
    if (!d) return;
    const ox = x + k * DIGITS.adv * s;
    // re-map absolute font coordinates (y up) into SVG space
    // (SVGPathPen output: absolute M/L/Q/C pairs, plus H = x only and V = y only)
    let pair = 0, cmd = "M";
    out += d.replace(/[A-Za-z]|-?\d*\.?\d+(?:e-?\d+)?/g, (tok) => {
      if (/[A-Za-z]/.test(tok)) { cmd = tok; pair = 0; return tok; }
      const v = parseFloat(tok);
      const isX = cmd === "H" ? true : cmd === "V" ? false : pair++ % 2 === 0;
      return " " + (isX ? ox + v * s : baseline - v * s).toFixed(1);
    });
  });
  return out;
}
const compact = (n) => (n >= 10000 ? (n / 1000).toFixed(1).replace(/\.0$/, "") + "k" : n.toLocaleString("en-US"));
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const f = (n) => n.toFixed(1);

function build(user, d) {
  const { cur, longest } = streaks(d.days);
  const cols = [
    { value: compact(d.commits), label: "COMMITS", sub: "in the last 12 months" },
    { value: compact(d.prs), label: "PULL REQUESTS", sub: "opened, all time" },
    { value: compact(d.repos), label: "PUBLIC REPOS", sub: `${d.stars} stars · ${d.followers} followers` },
    { value: String(cur), label: "DAY STREAK", sub: `longest this year: ${longest}`, gold: true },
  ];
  const colW = (W - PAD * 2) / cols.length;
  const SIZE = 74, BASE = 138;

  let body = "";
  cols.forEach((c, i) => {
    const x = PAD + i * colW + (i ? 26 : 0);
    const delay = (0.15 + i * 0.12).toFixed(2);
    if (i) body += `<line x1="${f(PAD + i * colW)}" x2="${f(PAD + i * colW)}" y1="76" y2="196" stroke="${T.hair}" class="fade" style="animation-delay:${delay}s"/>`;
    body += `<g class="up" style="animation-delay:${delay}s">
  <path d="${glyphPath(c.value, x - 4, BASE, SIZE)}" fill="url(#grain)" stroke="${T.edge}" stroke-width="1.2" stroke-opacity=".7" paint-order="stroke"/>
  <text x="${x}" y="${BASE + 34}" class="lbl"${c.gold ? ` style="fill:${T.gold}"` : ""}>${c.label}</text>
  <text x="${x}" y="${BASE + 54}" class="sub">${esc(c.sub)}</text>
</g>`;
  });

  // ---- one segmented strip for languages ----
  const total = Object.values(d.langBytes).reduce((a, b) => a + b, 0) || 1;
  let langs = Object.entries(d.langBytes).sort((a, b) => b[1] - a[1]);
  if (langs.length > 5) langs = [...langs.slice(0, 5), ["Other", langs.slice(5).reduce((s, l) => s + l[1], 0)]];
  const sy = 228, sw = W - PAD * 2, gap = 3;
  let sx = PAD, strip = "", legend = "", lx = PAD;
  langs.forEach(([name, bytes], i) => {
    const w = Math.max(2, (bytes / total) * (sw - gap * (langs.length - 1)));
    const col = T.langs[i] || T.langs[T.langs.length - 1];
    strip += `<rect x="${f(sx)}" y="${sy}" width="${f(w)}" height="6" rx="1.5" fill="${col}" class="grow" style="animation-delay:${(0.7 + i * 0.1).toFixed(2)}s"/>`;
    sx += w + gap;
    const pct = ((bytes / total) * 100).toFixed(1);
    const item = `${name} ${pct}%`;
    legend += `<g class="fade" style="animation-delay:${(0.9 + i * 0.1).toFixed(2)}s"><rect x="${f(lx)}" y="${sy + 24}" width="7" height="7" rx="1.5" fill="${col}"/>` +
      `<text x="${f(lx + 13)}" y="${sy + 31}" class="leg">${esc(name)} <tspan fill="${T.faint}">${pct}%</tspan></text></g>`;
    lx += 13 + item.length * 7.0 + 22;
  });

  const synced = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(user)}: ${d.commits} commits in the last year, ${d.prs} pull requests, ${d.repos} public repositories, ${cur}-day streak">
<style>
  .head{font:600 12px ${MONO};fill:${T.accent}}
  .meta{font:500 10.5px ${MONO};fill:${T.faint}}
  .lbl{font:600 11px ${MONO};letter-spacing:.16em;fill:${T.dim}}
  .sub{font:400 12.5px ${SANS};fill:${T.faint}}
  .leg{font:500 11.5px ${MONO};fill:${T.dim}}
  .up{opacity:0;animation:up .9s cubic-bezier(.2,.8,.2,1) both}
  .fade{opacity:0;animation:fade .8s ease both}
  .grow{transform-box:fill-box;transform-origin:left;transform:scaleX(0);animation:grow .7s cubic-bezier(.2,.8,.2,1) forwards}
  @keyframes up{from{opacity:0;transform:translateY(18px)}to{opacity:1;transform:none}}
  @keyframes fade{to{opacity:1}}
  @keyframes grow{to{transform:scaleX(1)}}
  @media (prefers-reduced-motion:reduce){.up,.fade{animation:none;opacity:1}.grow{animation:none;transform:none}}
</style>
<defs>
  <radialGradient id="bg" cx="30%" cy="30%" r="90%"><stop offset="0" stop-color="${T.bg}"/><stop offset="1" stop-color="${T.bgEdge}"/></radialGradient>
  <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="${T.accent}" stroke-opacity=".05"/></pattern>
  <pattern id="grain" width="6" height="6" patternUnits="userSpaceOnUse">
    <rect width="6" height="6" fill="#0B1210"/>
    <path d="M3 .9 5.4 5.3H.6Z" fill="${T.tex}"/><path d="M3 .9 5.4 5.3H3Z" fill="${T.texDim}"/>
  </pattern>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <g class="fade">
    <text x="${PAD}" y="40" class="head">~/metrics</text>
    <text x="${W - PAD}" y="40" class="meta" text-anchor="end">on github since ${d.since} · synced ${synced}</text>
  </g>
  ${body}
  ${strip}
  ${legend}
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
console.log(`metrics: ${data.commits} commits -> ${out}`);
