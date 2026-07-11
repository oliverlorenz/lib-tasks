import { readFileSync } from 'fs';

const readme = readFileSync('README.md', 'utf8');
const required = ['## Installation', '## Usage'];
const missing = required.filter((section) => !readme.includes(section));

if (missing.length > 0) {
  console.error('README.md is missing required sections:');
  missing.forEach((s) => console.error(`  - ${s}`));
  process.exit(1);
}

console.log('README.md: all required sections present');
