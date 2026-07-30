const fs = require('fs');
const pkg = JSON.parse(fs.readFileSync('package.json', 'utf-8'));
if (!pkg.engines) {
  pkg.engines = { node: ">=20.0.0" };
  fs.writeFileSync('package.json', JSON.stringify(pkg, null, 2));
}
