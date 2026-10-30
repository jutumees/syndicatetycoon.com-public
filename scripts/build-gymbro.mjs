// Build the separate Gymbro project and stage only its browser output for GitHub Pages.
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, readdirSync, renameSync, rmSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
const website = fileURLToPath(new URL('../', import.meta.url));
const source = resolve(process.argv[2] ?? resolve(website, '../../gymbro/code'));
for (const file of ['package.json', 'node_modules/typescript/bin/tsc', 'node_modules/vite/bin/vite.js']) {
  if (!existsSync(resolve(source, file))) throw new Error(`Missing ${file} in ${source}. Install Gymbro dependencies first.`);
}
execFileSync(process.execPath, [resolve(source, 'node_modules/typescript/bin/tsc'), '--noEmit'], { cwd: source, stdio: 'inherit' });
execFileSync(process.execPath, [resolve(source, 'node_modules/vite/bin/vite.js'), 'build', '--base=/gymbro/'], { cwd: source, stdio: 'inherit' });
const destination = resolve(website, 'gymbro');
const staging = resolve(website, '.gymbro-staging');
if (dirname(destination) !== resolve(website) || dirname(staging) !== resolve(website)) throw new Error('Invalid output path');
if (existsSync(staging)) throw new Error('Remove the previous .gymbro-staging folder before rebuilding.');
cpSync(resolve(source, 'dist'), staging, { recursive: true, filter: path => !path.endsWith('.map') });
if (!existsSync(resolve(staging, 'index.html')) || !readdirSync(staging).includes('assets')) throw new Error('Incomplete browser build');
rmSync(destination, { recursive: true, force: true });
renameSync(staging, destination);
console.log('Gymbro staged in website/gymbro/ for https://syndicatetycoon.com/gymbro/');
