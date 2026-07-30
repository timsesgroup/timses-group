const fs = require('fs');

const filepath = 'src/components/DocumentForm.tsx';
let code = fs.readFileSync(filepath, 'utf-8');

if (!code.includes("import { WebsiteLogo }")) {
  code = "import { WebsiteLogo } from './WebsiteLogo';\n" + code;
}

code = code.replace(/<span>🎰 \{web\}<\/span>/g, '<WebsiteLogo website={web} className="h-5 object-contain" />');

fs.writeFileSync(filepath, code);
