import { readdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { spawn } from 'node:child_process';

const root = process.cwd();
const files = [];
async function walk(dir) {
  for (const entry of await readdir(dir, { withFileTypes: true })) {
    if (entry.name === 'node_modules' || entry.name === '.git') continue;
    const path = join(dir, entry.name);
    if (entry.isDirectory()) await walk(path);
    else if (['.js', '.mjs'].includes(extname(entry.name))) files.push(path);
  }
}
await walk(root);
const results = await Promise.all(files.map(file => new Promise(resolve => {
  const child = spawn(process.execPath, ['--check', file], { stdio: ['ignore', 'pipe', 'pipe'] });
  let stderr = '';
  child.stderr.on('data', chunk => { stderr += chunk; });
  child.on('close', code => resolve({ file, code, stderr }));
})));
const failed = results.filter(result => result.code !== 0);
if (failed.length) {
  for (const result of failed) console.error(`\n${result.file}\n${result.stderr}`);
  process.exit(1);
}
console.log(`JavaScript syntax OK: ${files.length} files checked.`);
