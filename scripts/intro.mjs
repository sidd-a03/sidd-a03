#!/usr/bin/env node
// Intro: a typing "whoami" strip and link buttons, all in the profile palette.
// Static, so run locally after editing ROLES/LINKS and commit the SVGs:
//   node scripts/intro.mjs assets
// Icons: GitHub Octicons (MIT) and Font Awesome Free linkedin-in (CC BY 4.0, fontawesome.com).
import { writeFileSync } from "node:fs";

const ICONS = {"globe": {"vb": "0 0 16 16", "d": "M8 0a8 8 0 1 1 0 16A8 8 0 0 1 8 0M5.78 8.75a9.64 9.64 0 0 0 1.363 4.177q.383.64.857 1.215c.245-.296.551-.705.857-1.215A9.64 9.64 0 0 0 10.22 8.75Zm4.44-1.5a9.64 9.64 0 0 0-1.363-4.177c-.307-.51-.612-.919-.857-1.215a10 10 0 0 0-.857 1.215A9.64 9.64 0 0 0 5.78 7.25Zm-5.944 1.5H1.543a6.51 6.51 0 0 0 4.666 5.5q-.184-.271-.352-.552c-.715-1.192-1.437-2.874-1.581-4.948m-2.733-1.5h2.733c.144-2.074.866-3.756 1.58-4.948q.18-.295.353-.552a6.51 6.51 0 0 0-4.666 5.5m10.181 1.5c-.144 2.074-.866 3.756-1.58 4.948q-.18.296-.353.552a6.51 6.51 0 0 0 4.666-5.5Zm2.733-1.5a6.51 6.51 0 0 0-4.666-5.5q.184.272.353.552c.714 1.192 1.436 2.874 1.58 4.948Z"}, "mail": {"vb": "0 0 16 16", "d": "M1.75 2h12.5c.966 0 1.75.784 1.75 1.75v8.5A1.75 1.75 0 0 1 14.25 14H1.75A1.75 1.75 0 0 1 0 12.25v-8.5C0 2.784.784 2 1.75 2M1.5 12.251c0 .138.112.25.25.25h12.5a.25.25 0 0 0 .25-.25V5.809L8.38 9.397a.75.75 0 0 1-.76 0L1.5 5.809zm13-8.181v-.32a.25.25 0 0 0-.25-.25H1.75a.25.25 0 0 0-.25.25v.32L8 7.88Z"}, "arrow": {"vb": "0 0 16 16", "d": "M4.53 4.75A.75.75 0 0 1 5.28 4h6.01a.75.75 0 0 1 .75.75v6.01a.75.75 0 0 1-1.5 0v-4.2l-5.26 5.261a.749.749 0 0 1-1.275-.326.75.75 0 0 1 .215-.734L9.48 5.5h-4.2a.75.75 0 0 1-.75-.75"}, "linkedin": {"vb": "0 0 448 512", "d": "M100.3 448H7.4V148.9h92.9zM53.8 108.1C24.1 108.1 0 83.5 0 53.8c0-14.3 5.7-27.9 15.8-38S39.6 0 53.8 0s27.9 5.7 38 15.8 15.8 23.8 15.8 38c0 29.7-24.1 54.3-53.8 54.3M447.9 448h-92.7V302.4c0-34.7-.7-79.2-48.3-79.2-48.3 0-55.7 37.7-55.7 76.7V448h-92.8V148.9h89.1v40.8h1.3c12.4-23.5 42.7-48.3 87.9-48.3 94 0 111.3 61.9 111.3 142.3V448z"}};

// ---------------- edit these ----------------
const ROLES = ["full stack developer", "bridging web & iot", "building things that ship"];
const LINKS = [
  { file: "link-portfolio.svg", icon: "globe", label: "achinta.in", live: true },
  { file: "link-linkedin.svg", icon: "linkedin", label: "LinkedIn" },
  { file: "link-email.svg", icon: "mail", label: "hello@achinta.in" },
];

const T = {
  bg: "#0A0F0D", bgEdge: "#060908", border: "#16201C", chip: "#0D1411", chipLine: "#1F2A26",
  text: "#E5E7EB", dim: "#9CA3AF", faint: "#5B6660", accent: "#10B981", icon: "#D1D5DB",
};
const SANS = `"Segoe UI",Ubuntu,"Helvetica Neue",Arial,sans-serif`;
const MONO = `ui-monospace,SFMono-Regular,"JetBrains Mono",Menlo,Consolas,monospace`;
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const f = (n) => n.toFixed(1);
const icon = (name, x, y, size, fill) => {
  const { vb, d } = ICONS[name];
  const [, , vw, vh] = vb.split(" ").map(Number);
  const s = size / Math.max(vw, vh);
  return `<g transform="translate(${f(x + (size - vw * s) / 2)} ${f(y + (size - vh * s) / 2)}) scale(${s.toFixed(4)})"><path d="${d}" fill="${fill}"/></g>`;
};

// ---------------- whoami strip: types each role, holds, then moves on ----------------
function whoami() {
  const W = 960, H = 84, X0 = 136, Y = 50, CW = 11.4; // CW = monospace advance at 19px
  const CYCLE = 3.4 * ROLES.length, TYPE = 0.055;
  let lines = "", keyframes = "";
  ROLES.forEach((role, li) => {
    const start = li * 3.4;
    const chars = [...role]
      .map((c, i) => `<tspan x="${f(X0 + i * CW)}" class="c" style="animation-delay:${(start + i * TYPE).toFixed(3)}s">${esc(c === " " ? " " : c)}</tspan>`)
      .join("");
    const done = start + role.length * TYPE;
    lines += `<g class="ln" style="animation-delay:${start}s">
  <text y="${Y}" class="role">${chars}</text>
  <rect x="${f(X0 + role.length * CW + 3)}" y="${Y - 15}" width="9" height="19" fill="${T.accent}" class="cur" style="animation-delay:${done.toFixed(2)}s"/>
</g>`;
  });
  // a line is shown for the first 3.2s of its slot; each char from its typing moment until well after
  const pct = (s) => ((s / CYCLE) * 100).toFixed(2);
  keyframes = `
  @keyframes ln{0%{opacity:1}${pct(3.2)}%{opacity:0}}
  @keyframes c{0%{opacity:1}${pct(3.3)}%{opacity:0}}
  @keyframes cur{0%{opacity:1}${pct(0.45)}%{opacity:0}${pct(0.9)}%{opacity:1}${pct(1.35)}%{opacity:0}${pct(1.8)}%{opacity:1}${pct(2.6)}%{opacity:0}}`;

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="whoami: ${esc(ROLES.join(", "))}">
<style>
  .head{font:600 13px ${MONO};fill:${T.accent}}
  .prompt{font:500 13px ${MONO};fill:${T.faint}}
  .role{font:500 19px ${MONO};fill:${T.text}}
  .ln,.c,.cur{opacity:0;animation-duration:${CYCLE}s;animation-iteration-count:infinite;animation-timing-function:step-end}
  .ln{animation-name:ln}.c{animation-name:c}.cur{animation-name:cur}
  ${keyframes}
  @media (prefers-reduced-motion:reduce){.ln,.c,.cur{animation:none}.ln:first-of-type,.ln:first-of-type .c{opacity:1}}
</style>
<defs>
  <radialGradient id="bg" cx="20%" cy="50%" r="90%"><stop offset="0" stop-color="${T.bg}"/><stop offset="1" stop-color="${T.bgEdge}"/></radialGradient>
  <pattern id="grid" width="22" height="22" patternUnits="userSpaceOnUse"><path d="M22 0H0V22" fill="none" stroke="${T.accent}" stroke-opacity=".05"/></pattern>
  <clipPath id="card"><rect width="${W}" height="${H}" rx="14"/></clipPath>
</defs>
<g clip-path="url(#card)">
  <rect width="${W}" height="${H}" fill="url(#bg)"/>
  <rect width="${W}" height="${H}" fill="url(#grid)"/>
  <text x="32" y="${Y - 1}" class="head">~/whoami</text>
  <text x="${X0 - 22}" y="${Y - 1}" class="prompt">›</text>
  ${lines}
</g>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="14" fill="none" stroke="${T.border}"/>
</svg>`;
}

// ---------------- link buttons, one SVG each so each can carry its own link ----------------
function button({ icon: ic, label, live }) {
  const textW = [...label].reduce((w, c) => w + (/[ijlt.,'|f!I]/.test(c) ? 0.3 : /[A-Z@]/.test(c) ? 0.74 : /[mw]/.test(c) ? 0.85 : 0.53), 0) * 14;
  const H = 44, textEnd = 44 + textW;
  const dotX = textEnd + 12;
  const arrowX = (live ? dotX + 14 : textEnd + 14);
  const W = Math.round(arrowX + 14 + 16);
  const dot = live
    ? `<circle cx="${f(dotX)}" cy="${H / 2}" r="3" fill="${T.accent}"/><circle cx="${f(dotX)}" cy="${H / 2}" r="3" fill="none" stroke="${T.accent}" class="ping"/>`
    : "";
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" role="img" aria-label="${esc(label)}">
<style>
  .lb{font:500 14px ${SANS};fill:${T.text}}
  .ping{transform-box:fill-box;transform-origin:center;animation:ping 2.2s ease-out infinite}
  @keyframes ping{0%{opacity:.7;transform:scale(1)}100%{opacity:0;transform:scale(3)}}
  @media (prefers-reduced-motion:reduce){.ping{animation:none;opacity:0}}
</style>
<rect x=".5" y=".5" width="${W - 1}" height="${H - 1}" rx="12" fill="${T.chip}" stroke="${T.chipLine}"/>
${icon(ic, 18, (H - 16) / 2, 16, T.icon)}
<text x="44" y="${H / 2 + 5}" class="lb">${esc(label)}</text>
${dot}
${icon("arrow", arrowX, (H - 14) / 2, 14, T.faint)}
</svg>`;
}

const dir = process.argv[2] || "assets";
writeFileSync(`${dir}/whoami.svg`, whoami());
for (const l of LINKS) writeFileSync(`${dir}/${l.file}`, button(l));
console.log(`intro -> ${dir}/whoami.svg + ${LINKS.length} buttons`);
