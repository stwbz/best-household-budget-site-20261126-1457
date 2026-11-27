// PosBareng — entrypoint (Node 22, standard library only).
//
// PosBareng is a household budget site for the Santoso family, November
// 2026: one closed loop where the payday allocation locks the daily
// safe-to-spend number and the annual sinking funds. The site itself is
// the app/ folder beside this file — plain static files a browser opens at
// app/index.html, ES modules and CSS, no build step, nothing loaded over
// the network.
//
// This program hands the site in. Before it copies anything it runs a
// pre-flight check, so a broken entry fails here with a plain message
// instead of reaching the scorer: app/index.html must exist, screenshots/
// must hold 3 or 4 real PNG or JPEG renders of the site, each no bigger
// than 256 KiB, and the vendored make.fun library must be present. Then
// it copies app/ and screenshots/ to /output and writes
// /output/dossier.json, the summary the judge reads (the screenshots, the
// first load's files and bytes, and the source), with the vendored library.
//
// Leave vendor/makefun-frontend.ts as it is: the scorer requires
// dossier.json to be byte for byte what its own copy writes.
//
// Serve the site locally with a static server rooted at app/, then open
// it in a browser. Outside the grader's container, MAKEFUN_OUTPUT_DIR
// stands in for /output:
//   mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts

import { cpSync, existsSync, mkdirSync, readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { buildDossier } from './vendor/makefun-frontend.ts';

const here = fileURLToPath(new URL('.', import.meta.url));
const out = process.env.MAKEFUN_OUTPUT_DIR ?? '/output';
const MAX_SHOT_BYTES = 262144;

function fail(message) {
  throw new Error(`PosBareng pre-flight: ${message}`);
}

// A file is a whole PNG or JPEG when its first bytes say so.
function looksLikeImage(bytes) {
  const png = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47;
  const jpeg = bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff;
  return png || jpeg;
}

// --- Pre-flight: refuse a broken entry before anything is copied. ---
const indexPath = join(here, 'app', 'index.html');
if (!existsSync(indexPath)) fail('app/index.html is missing — the site has no entry page.');
if (!existsSync(join(here, 'vendor', 'makefun-frontend.ts'))) {
  fail('vendor/makefun-frontend.ts is missing — the dossier library is gone.');
}
const shotsDir = join(here, 'screenshots');
if (!existsSync(shotsDir)) fail('screenshots/ is missing — the entry needs 3 or 4 screenshots.');
const shots = readdirSync(shotsDir).filter((name) => !name.startsWith('.'));
if (shots.length < 3 || shots.length > 4) {
  fail(`screenshots/ holds ${shots.length} files — the entry needs 3 or 4.`);
}
for (const name of shots) {
  const path = join(shotsDir, name);
  if (!statSync(path).isFile()) fail(`screenshots/${name} is not a regular file.`);
  const bytes = readFileSync(path);
  if (bytes.length > MAX_SHOT_BYTES) {
    fail(`screenshots/${name} is ${bytes.length} bytes — over the 256 KiB cap.`);
  }
  if (!looksLikeImage(bytes)) {
    fail(`screenshots/${name} is not a whole PNG or JPEG.`);
  }
}

// --- Hand-in: copy the site, then write the dossier from it. ---
mkdirSync(out, { recursive: true });
cpSync(join(here, 'app'), join(out, 'app'), { recursive: true });
mkdirSync(join(out, 'screenshots'), { recursive: true });
cpSync(shotsDir, join(out, 'screenshots'), { recursive: true });

// The scorer's own caps (reference/gate.json): only text_max_bytes shapes
// the bytes; the others refuse an entry the scorer would refuse (more than
// 4 screenshots or one over 256 KiB; more than 993 files and directories
// in app/ or 16 MiB of app files: app/ counts beside /output's own
// 1000-entry cap, its screenshots/ and dossier.json).
writeFileSync(
  join(out, 'dossier.json'),
  buildDossier(out, { text_max_bytes: 163840, screenshots: { max: 4, max_bytes: 262144 }, app_max_files: 993, app_max_bytes: 16777216 }),
);

console.log(`PosBareng handed in: ${shots.length} screenshots, dossier written to ${join(out, 'dossier.json')}`);
