const fs = require('fs');
const path = require('path');

function scan(dir) {
  const list = fs.readdirSync(dir);
  for (const f of list) {
    const full = path.join(dir, f);
    if (fs.statSync(full).isDirectory()) {
      if (f !== 'node_modules') scan(full);
    } else if (f.endsWith('.js') || f.endsWith('.cjs')) {
      const c = fs.readFileSync(full, 'utf8');
      const matches = c.matchAll(/executeProcedure\s*\(\s*['"]([^'"]+)['"]/g);
      for (const m of matches) {
        console.log(`${m[1]} <-- ${path.relative('Web/backend', full)}`);
      }
    }
  }
}

scan('Web/backend');
