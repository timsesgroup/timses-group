const fs = require('fs');

const filepath = 'src/components/AnalyticsDashboard.tsx';
let code = fs.readFileSync(filepath, 'utf-8');

if (!code.includes("import { WebsiteLogo }")) {
  code = "import { WebsiteLogo } from './WebsiteLogo';\n" + code;
}

code = code.replace(/🎰 \{stat\.website\}/g, '<WebsiteLogo website={stat.website} className="h-4 object-contain" />');

fs.writeFileSync(filepath, code);

const idreff_filepath = 'src/components/IdReffManager.tsx';
let idreff_code = fs.readFileSync(idreff_filepath, 'utf-8');
idreff_code = idreff_code.replace(/<span>🎰 \{web\}<\/span>/g, '<WebsiteLogo website={web} className="h-5 object-contain" />');
fs.writeFileSync(idreff_filepath, idreff_code);

