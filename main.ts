import * as fs from 'node:fs';
import * as path from 'node:path';
import { buildDossier } from './vendor/makefun-game.ts';

const outDir = process.env.MAKEFUN_OUTPUT_DIR || '/output';

// Ensure output directory does not overlap with source directories for safety
const absOut = path.resolve(outDir);
const absGame = path.resolve('game');
const absScreenshots = path.resolve('screenshots');
if (absOut.startsWith(absGame) || absOut.startsWith(absScreenshots)) {
  throw new Error("Output directory cannot be inside game/ or screenshots/.");
}

function copyRecursive(src: string, dest: string): { count: number; totalBytes: number } {
  if (!fs.existsSync(src)) return { count: 0, totalBytes: 0 };
  const stats = fs.statSync(src);
  let count = 0;
  let totalBytes = 0;
  if (stats.isDirectory()) {
    fs.mkdirSync(dest, { recursive: true });
    const entries = fs.readdirSync(src).sort();
    for (const child of entries) {
      const res = copyRecursive(path.join(src, child), path.join(dest, child));
      count += res.count;
      totalBytes += res.totalBytes;
    }
  } else {
    if (stats.size === 0) {
      throw new Error(`Game file '${src}' is empty.`);
    }
    fs.mkdirSync(path.dirname(dest), { recursive: true });
    fs.copyFileSync(src, dest);
    count = 1;
    totalBytes = stats.size;
  }
  return { count, totalBytes };
  }

  console.log(`Building WOK RUSH (Session 2 Robust Build v5 - Verified Deterministic) into ${outDir}...`);

// 1. Verify required directories exist with clear errors
if (!fs.existsSync('game')) {
  throw new Error("Required directory 'game' does not exist.");
}
const indexPath = path.join('game', 'index.html');
if (!fs.existsSync(indexPath) || fs.statSync(indexPath).size === 0) {
  throw new Error("Required file 'game/index.html' does not exist or is empty.");
}
if (!fs.existsSync('screenshots')) {
  throw new Error("Required directory 'screenshots' does not exist.");
}

// 2. Validate screenshots directory contents (3-4 images, max 256 KiB each)
const screenshotEntries = fs.readdirSync('screenshots').filter(f => !f.startsWith('.')).sort();
if (screenshotEntries.length < 3 || screenshotEntries.length > 4) {
  throw new Error(`Invalid number of screenshots: found ${screenshotEntries.length}, expected 3 or 4.`);
}
for (const entry of screenshotEntries) {
  const fullPath = path.join('screenshots', entry);
  const stat = fs.statSync(fullPath);
  if (!stat.isFile()) {
    throw new Error(`Screenshot entry '${entry}' is not a regular file.`);
  }
  if (stat.size > 262144) {
    throw new Error(`Screenshot '${entry}' exceeds 256 KiB limit (size: ${stat.size} bytes).`);
  }
  const ext = path.extname(entry).toLowerCase();
  if (ext !== '.png' && ext !== '.jpg' && ext !== '.jpeg') {
    throw new Error(`Screenshot '${entry}' has invalid extension '${ext}'. Must be PNG or JPEG.`);
  }
}
console.log(`Validated ${screenshotEntries.length} screenshots successfully.`);

// 3. Ensure outDir exists
fs.mkdirSync(outDir, { recursive: true });

// 4. Copy game/ and screenshots/ with sorted deterministic order and total byte tracking
const gameRes = copyRecursive('game', path.join(outDir, 'game'));
const screenRes = copyRecursive('screenshots', path.join(outDir, 'screenshots'));
console.log(`Successfully copied ${gameRes.count} game files (${gameRes.totalBytes} bytes) and ${screenRes.count} screenshots (${screenRes.totalBytes} bytes) with deterministic sorting.`);

// 5. Build dossier
const dossierBytes = buildDossier(outDir, {
  text_max_bytes: 163840,
  screenshots: { max: 4, max_bytes: 262144 },
  game_max_files: 993,
  game_max_bytes: 50331648,
});

const dossierPath = path.join(outDir, 'dossier.json');
fs.writeFileSync(dossierPath, dossierBytes);
const finalDossierSize = fs.statSync(dossierPath).size;
console.log(`Successfully generated dossier.json. Exact byte size: ${finalDossierSize} bytes.`);
