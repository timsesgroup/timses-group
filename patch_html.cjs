const fs = require('fs');
let html = fs.readFileSync('index.html', 'utf-8');
html = html.replace('\\\\n', '\\n');
fs.writeFileSync('index.html', html);
