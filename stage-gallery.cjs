const fs = require('node:fs');
const path = require('node:path');
const root = __dirname;
const out = path.join(root, 'public');
fs.rmSync(out, { recursive: true, force: true });
fs.mkdirSync(out, { recursive: true });
for (const file of ['index.html', 'bridge.js', 'gallery.wasm', 'win-chime.wav', 'vendor/gl.js', 'vendor/LICENSE-MIT', 'assets/art-0.jpg', 'assets/art-1.jpg', 'assets/art-2.jpg', 'assets/art-3.jpg']) {
  const dest = path.join(out, file);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.copyFileSync(path.join(root, file), dest);
}
// Stamp the deployed page with the exact source commit used by this build.
const { execFileSync } = require('node:child_process');
let revision = process.env.CF_PAGES_COMMIT_SHA || process.env.CF_COMMIT_SHA;
if (!revision) revision = execFileSync('git', ['rev-parse', 'HEAD'], { cwd: root, encoding: 'utf8' }).trim();
if (!/^[0-9a-f]{7,40}$/i.test(revision)) throw new Error('Invalid gallery build revision');
const htmlPath = path.join(out, 'index.html');
const html = fs.readFileSync(htmlPath, 'utf8');
if (!html.includes('id="build-revision"')) throw new Error('Missing gallery revision label');
fs.writeFileSync(htmlPath, html.replace(/(<p id="build-revision" class="hint">)[^<]*(<\/p>)/, '$1Rev ' + revision.slice(0, 7) + ' · paintings-jpeg-20261003-3$2'));
fs.copyFileSync(htmlPath, path.join(out, 'gallery.html'));
console.log('Packaged Rust gallery runtime into public/');
