import fs from 'node:fs';
import path from 'node:path';

const docsDir = path.resolve('docs');
const failures = [];

for (const name of fs.readdirSync(docsDir)) {
  const full = path.join(docsDir, name);
  if (!fs.statSync(full).isFile()) continue;
  if (name.endsWith('.js')) {
    const source = fs.readFileSync(full, 'utf8');
    try { new Function(source); }
    catch (error) { failures.push(`${name}: ${error.message}`); }
    continue;
  }
  if (!name.endsWith('.html')) continue;
  const html = fs.readFileSync(full, 'utf8');
  const inline = [...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
    .map(match => match[1])
    .filter(source => source.trim());
  inline.forEach((source, index) => {
    try { new Function(source); }
    catch (error) { failures.push(`${name} inline script ${index + 1}: ${error.message}`); }
  });
}

if (failures.length) {
  console.error('MIRA docs validation failed:');
  failures.forEach(item => console.error(' - ' + item));
  process.exit(1);
}
console.log('MIRA docs JavaScript syntax OK');
