const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..', 'public', 'parts', 'stl');
const folders = [];
const files = {};

for (const d of fs.readdirSync(root, { withFileTypes: true })) {
  if (!d.isDirectory()) continue;
  folders.push(d.name);
  for (const f of fs.readdirSync(path.join(root, d.name))) {
    if (f.endsWith('.stl')) {
      const key = f.slice(0, -4);
      if (files[key]) console.warn(`Uyarı: ${key} birden fazla klasörde var`);
      files[key] = `${d.name}/${f}`;
    }
  }
}

fs.writeFileSync(path.join(root, 'manifest.json'), JSON.stringify({ folders, files }, null, 2));
console.log(`manifest.json: ${folders.length} klasör, ${Object.keys(files).length} dosya`);